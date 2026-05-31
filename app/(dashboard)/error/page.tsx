import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ErrorPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-gray-500 mb-6">
        We couldn&apos;t complete your request. Please try again.
      </p>
      <Button
        asChild
        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
      >
        <Link href="/">Go home</Link>
      </Button>
    </main>
  );
}
