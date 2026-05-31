'use server';

import { redirect } from 'next/navigation';
import { createTopUpSession } from './stripe';
import { getUser } from '@/lib/db/queries';

export async function topUpAction(formData: FormData) {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const amountCents = parseInt(formData.get('amountCents') as string, 10);
  if (!amountCents || amountCents < 100) {
    redirect('/pricing');
  }

  await createTopUpSession({ user, amountCents });
}
