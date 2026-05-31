import Stripe from 'stripe';
import { redirect } from 'next/navigation';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function createTopUpSession({
  user,
  amountCents,
}: {
  user: { id: number; email: string };
  amountCents: number;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Wallet Top-Up',
            description: `Add €${(amountCents / 100).toFixed(2)} to your MCP Bypass wallet`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
    customer_email: user.email,
    client_reference_id: user.id.toString(),
    metadata: { amountCents: amountCents.toString() },
  });

  redirect(session.url!);
}
