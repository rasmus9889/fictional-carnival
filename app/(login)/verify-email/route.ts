import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { setSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/check-email?error=invalid', request.url));
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
      return NextResponse.redirect(new URL('/check-email?error=expired', request.url));
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

    await setSession(user);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch {
    return NextResponse.redirect(new URL('/check-email?error=invalid', request.url));
  }
}
