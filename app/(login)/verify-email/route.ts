import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';

function appUrl(path: string): string {
  const base = process.env.BASE_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}${path}`;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(appUrl('/check-email?error=invalid'));
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.verificationToken, token),
          gt(users.verificationTokenExpiresAt, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.redirect(appUrl('/check-email?error=expired'));
    }

    await db
      .update(users)
      .set({
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Auth.js cannot issue a session from a GET route handler without credentials,
    // so redirect to sign-in with a verified flag to show a success message.
    return NextResponse.redirect(appUrl('/sign-in?verified=true'));
  } catch {
    return NextResponse.redirect(appUrl('/check-email?error=invalid'));
  }
}
