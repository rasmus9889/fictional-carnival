import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, activityLogs, ActivityType } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/payments/stripe';
import { redis, setWalletBalance } from '@/lib/db/redis';
import { sendDepositConfirmationEmail } from '@/lib/email/sendgrid';
import { getEurToUsdRateWithFallback } from '@/lib/fx/rates';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.redirect(new URL('/pricing', request.url));
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(new URL('/pricing', request.url));
    }

    const userId = session.client_reference_id;
    if (!userId) throw new Error('No user ID in session.');

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(userId)))
      .limit(1);

    if (!user) throw new Error('User not found.');

    // Idempotency: only process the balance update once per payment_intent
    const paymentIntentId = session.payment_intent as string;
    const acquired = await redis.set(
      `payment:processed:${paymentIntentId}`,
      '1',
      'NX',
      'EX',
      86400
    );

    if (acquired !== null) {
      const eurAmount = (session.amount_total ?? 0) / 100;
      const eurToUsd = await getEurToUsdRateWithFallback();
      const usdAmount = eurAmount * eurToUsd;

      const [updated] = await db
        .update(users)
        .set({ balance: sql`balance + ${usdAmount.toFixed(6)}::numeric` })
        .where(eq(users.id, user.id))
        .returning({ balance: users.balance });

      await setWalletBalance(user.apiKey, updated.balance.toString());

      await db.insert(activityLogs).values({
        userId: user.id,
        action: ActivityType.ADD_FUNDS,
        ipAddress: request.headers.get('x-forwarded-for') ?? '',
      });

      await sendDepositConfirmationEmail(
        user.email,
        eurAmount,
        usdAmount,
        parseFloat(updated.balance)
      );
    }

    await setSession(user);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error handling checkout success:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}
