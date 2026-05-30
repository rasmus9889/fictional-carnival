import Stripe from 'stripe';
import { stripe } from '@/lib/payments/stripe';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, activityLogs, ActivityType } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { redis, setWalletBalance } from '@/lib/db/redis';
import { sendDepositConfirmationEmail } from '@/lib/email/sendgrid';
import { getEurToUsdRateWithFallback } from '@/lib/fx/rates';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true });
    }

    // Idempotency: skip if already processed by the checkout redirect handler
    const paymentIntentId = session.payment_intent as string;
    const acquired = await redis.set(
      `payment:processed:${paymentIntentId}`,
      '1',
      'NX',
      'EX',
      86400
    );

    if (acquired === null) {
      return NextResponse.json({ received: true });
    }

    const userId = session.client_reference_id;
    if (!userId) return NextResponse.json({ received: true });

    const eurAmount = (session.amount_total ?? 0) / 100;
    const eurToUsd = await getEurToUsdRateWithFallback();
    const usdAmount = eurAmount * eurToUsd;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(userId)))
      .limit(1);

    if (!user) return NextResponse.json({ received: true });

    const [updated] = await db
      .update(users)
      .set({ balance: sql`balance + ${usdAmount.toFixed(6)}::numeric` })
      .where(eq(users.id, user.id))
      .returning({ balance: users.balance });

    await setWalletBalance(user.apiKey, updated.balance.toString());

    await db.insert(activityLogs).values({
      userId: user.id,
      action: ActivityType.ADD_FUNDS,
    });

    await sendDepositConfirmationEmail(
      user.email,
      eurAmount,
      usdAmount,
      parseFloat(updated.balance)
    );
  }

  return NextResponse.json({ received: true });
}
