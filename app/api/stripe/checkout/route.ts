import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, activityLogs, ActivityType } from '@/lib/db/schema';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { redis } from '@/lib/db/redis';
import { sendDepositConfirmationEmail } from '@/lib/email/sendgrid';

function appUrl(path: string): string {
  const base = process.env.BASE_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(appUrl('/pricing'));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(appUrl('/pricing'));
    }

    const userId = session.client_reference_id;
    if (!userId) throw new Error('No user ID in session.');

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(userId)))
      .limit(1);

    if (!user) throw new Error('User not found.');

    // Idempotency: only process once per payment_intent (72h covers Stripe's full retry window)
    const paymentIntentId = session.payment_intent as string;
    const acquired = await redis.set(
      `payment:processed:${paymentIntentId}`,
      '1',
      'EX',
      259200,
      'NX'
    );

    if (acquired !== null) {
      const eurAmount = (session.amount_total ?? 0) / 100;

      const [updated] = await db
        .update(users)
        .set({ balance: sql`balance + ${eurAmount.toFixed(6)}::numeric`, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning({ balance: users.balance });

      await redis.incrbyfloat(`wallet:balance:${user.apiKey}`, eurAmount);

      const rawIp = request.headers.get('x-forwarded-for') ?? '';
      const ipAddress = rawIp.split(',')[0].trim().slice(0, 45);

      await db.insert(activityLogs).values({
        userId: user.id,
        action: ActivityType.ADD_FUNDS,
        ipAddress,
      });

      await sendDepositConfirmationEmail(
        user.email,
        eurAmount,
        parseFloat(updated.balance)
      ).catch((err) => {
        console.error('[checkout] sendDepositConfirmationEmail failed:', err?.message ?? err);
      });
    }

    return NextResponse.redirect(appUrl('/dashboard'));
  } catch (error) {
    console.error('Error handling checkout success:', error);
    return NextResponse.redirect(appUrl('/error'));
  }
}
