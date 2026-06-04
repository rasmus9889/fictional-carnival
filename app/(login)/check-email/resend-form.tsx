'use client';

import { useActionState } from 'react';
import { resendVerificationEmail } from '@/app/(login)/actions';
import { ActionState } from '@/lib/auth/middleware';

export function ResendForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    resendVerificationEmail,
    {}
  );

  return (
    <div className="mt-6 text-sm text-gray-500">
      <p>Didn&apos;t receive the email?</p>
      <form action={formAction} className="mt-2 flex flex-col items-center gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="your@email.com"
          className="w-full max-w-xs rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-orange-600 hover:text-orange-500 font-medium disabled:opacity-50"
        >
          {pending ? 'Sending…' : 'Resend verification email'}
        </button>
      </form>
      {state.success && <p className="mt-2 text-green-600">{state.success}</p>}
      {state.error && <p className="mt-2 text-red-600">{state.error}</p>}
    </div>
  );
}
