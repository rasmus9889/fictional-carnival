import { verifyEmail } from '@/app/(login)/actions';
import { redirect } from 'next/navigation';
import { CircleIcon } from 'lucide-react';
import Link from 'next/link';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <ErrorMessage message="Invalid verification link." />;
  }

  const result = await verifyEmail(token);

  if (result.success) {
    redirect('/dashboard');
  }

  return <ErrorMessage message={result.error ?? 'Verification failed.'} />;
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <CircleIcon className="h-12 w-12 text-orange-500 mx-auto" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Verification failed
        </h2>
        <p className="mt-4 text-sm text-red-600">{message}</p>
        <p className="mt-6 text-sm text-gray-500">
          <Link
            href="/sign-up"
            className="font-medium text-orange-600 hover:text-orange-500"
          >
            Sign up again
          </Link>
        </p>
      </div>
    </div>
  );
}
