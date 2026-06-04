import { CircleIcon } from 'lucide-react';
import Link from 'next/link';
import { ResendForm } from './resend-form';

const ERROR_MESSAGES: Record<string, string> = {
  expired: 'Your verification link has expired. Request a new one below.',
  invalid: 'That verification link is invalid. Request a new one below.',
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <CircleIcon className="h-12 w-12 text-orange-500 mx-auto" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Check your email
        </h2>
        {errorMessage ? (
          <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            We sent a verification link to your email address. Click it to
            activate your account.
          </p>
        )}
        <p className="mt-6 text-sm text-gray-500">
          Already verified?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-orange-600 hover:text-orange-500"
          >
            Sign in
          </Link>
        </p>
        <ResendForm />
      </div>
    </div>
  );
}
