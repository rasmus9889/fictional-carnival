'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleIcon, Loader2 } from 'lucide-react';
import { signIn, signUp } from './actions';
import { ActionState } from '@/lib/auth/middleware';

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function Login({ mode = 'signin' }: { mode?: 'signin' | 'signup' }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const inviteId = searchParams.get('inviteId');
  const resetSuccess = searchParams.get('reset') === 'success';
  const justVerified = searchParams.get('verified') === 'true';

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === 'signin' ? signIn : signUp,
    { error: '' }
  );

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          {mode === 'signin' ? 'Sign in to your account' : 'Create your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {resetSuccess && (
          <p className="mb-4 text-center text-sm text-green-500">
            Password updated. You can now sign in.
          </p>
        )}
        {justVerified && (
          <p className="mb-4 text-center text-sm text-green-500">
            Email verified! You can now sign in.
          </p>
        )}

        {/* Google OAuth */}
        <form action={`/api/auth/signin/google?callbackUrl=/dashboard`} method="POST">
          <input type="hidden" name="csrfToken" />
          <Button
            type="submit"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 border-border text-foreground hover:bg-muted"
          >
            <GoogleIcon />
            Continue with Google
          </Button>
        </form>

        <div className="my-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-background text-muted-foreground">or</span>
          </div>
        </div>

        {/* Credentials form */}
        <form className="space-y-6" action={formAction}>
          <input type="hidden" name="redirect" value={redirect || ''} />
          <input type="hidden" name="priceId" value={priceId || ''} />
          <input type="hidden" name="inviteId" value={inviteId || ''} />

          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </Label>
            <div className="mt-1">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={state.email}
                required
                maxLength={50}
                className="rounded-full border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-orange-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </Label>
              {mode === 'signin' && (
                <Link href="/forgot-password" className="text-sm text-orange-500 hover:text-orange-400">
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="mt-1">
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                defaultValue={state.password}
                required
                minLength={8}
                maxLength={100}
                className="rounded-full border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-orange-500"
                placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password (8+ chars)'}
              />
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm password
              </Label>
              <div className="mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={100}
                  className="rounded-full border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-orange-500"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>
          )}

          {state?.error && (
            <div className="text-red-500 text-sm">{state.error}</div>
          )}

          <Button
            type="submit"
            className="w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Loading…
              </>
            ) : mode === 'signin' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                {mode === 'signin' ? 'New here?' : 'Already have an account?'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`${mode === 'signin' ? '/sign-up' : '/sign-in'}${redirect ? `?redirect=${redirect}` : ''}${priceId ? `&priceId=${priceId}` : ''}`}
              className="w-full flex justify-center py-2 px-4 border border-border rounded-full text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {mode === 'signin' ? 'Create an account' : 'Sign in to existing account'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
