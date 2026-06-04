'use server';

import { z } from 'zod';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  activityLogs,
  type NewUser,
  type NewActivityLog,
  ActivityType,
} from '@/lib/db/schema';
import { comparePasswords, hashPassword, setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/db/queries';
import { validatedAction, validatedActionWithUser } from '@/lib/auth/middleware';
import { randomBytes } from 'crypto';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '@/lib/email/sendgrid';
import { transferApiKeyData, setWalletBalance, deleteWalletData } from '@/lib/db/redis';

function generateApiKey(): string {
  return 'mcp_' + randomBytes(32).toString('hex');
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

async function logActivity(
  userId: number,
  type: ActivityType,
  ipAddress?: string
) {
  const newActivity: NewActivityLog = {
    userId,
    action: type,
    ipAddress: ipAddress || '',
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data) => {
  const { email, password } = data;

  const foundUsers = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  if (foundUsers.length === 0) {
    return { error: 'Invalid email or password. Please try again.', email, password };
  }

  const foundUser = foundUsers[0];
  const isPasswordValid = await comparePasswords(password, foundUser.passwordHash);

  if (!isPasswordValid) {
    return { error: 'Invalid email or password. Please try again.', email, password };
  }

  if (!foundUser.emailVerified) {
    return { error: 'Please verify your email before signing in. Check your inbox.', email, password };
  }

  await Promise.all([
    setSession(foundUser),
    logActivity(foundUser.id, ActivityType.SIGN_IN),
  ]);

  redirect('/dashboard');
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const signUp = validatedAction(signUpSchema, async (data) => {
  const { email, password } = data;

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return { error: 'An account with this email already exists.', email, password };
  }

  const passwordHash = await hashPassword(password);
  const apiKey = generateApiKey();
  const verificationToken = generateToken();
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const newUser: NewUser = {
    email,
    passwordHash,
    apiKey,
    role: 'owner',
    verificationToken,
    verificationTokenExpiresAt,
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();

  if (!createdUser) {
    return { error: 'Failed to create user. Please try again.', email, password };
  }

  await Promise.all([
    setWalletBalance(createdUser.apiKey, '0.000000').catch((err) => {
      console.error('[signUp] setWalletBalance failed:', err?.message ?? err);
    }),
    logActivity(createdUser.id, ActivityType.SIGN_UP).catch((err) => {
      console.error('[signUp] logActivity failed:', err?.message ?? err);
    }),
    sendVerificationEmail(email, verificationToken).catch((err) => {
      console.error('[signUp] sendVerificationEmail failed:', err?.message ?? err);
    }),
  ]);

  redirect('/check-email');
});


export async function signOut() {
  const user = (await getUser()) as User;
  try {
    if (user) await logActivity(user.id, ActivityType.SIGN_OUT);
  } catch (err) {
    console.error('[signOut] logActivity failed:', (err as Error)?.message ?? err);
  }
  (await cookies()).delete('session');
}

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const sendPasswordReset = validatedAction(forgotPasswordSchema, async (data) => {
  const { email } = data;

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.deletedAt)))
    .limit(1);

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: 'If that email exists, a reset link has been sent.' };
  }

  const resetToken = generateToken();
  const resetTokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db
    .update(users)
    .set({ resetToken, resetTokenExpiresAt })
    .where(eq(users.id, user.id));

  await sendPasswordResetEmail(email, resetToken).catch((err) => {
    console.error('[sendPasswordResetEmail] failed:', err?.message ?? err);
  });

  return { success: 'If that email exists, a reset link has been sent.' };
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const resetPassword = validatedAction(resetPasswordSchema, async (data) => {
  const { token, password, confirmPassword } = data;

  if (password !== confirmPassword) {
    return { token, error: 'Passwords do not match.' };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.resetToken, token),
        gt(users.resetTokenExpiresAt, new Date())
      )
    )
    .limit(1);

  if (!user) {
    return { token, error: 'Reset link is invalid or has expired.' };
  }

  const passwordHash = await hashPassword(password);

  await db
    .update(users)
    .set({
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  redirect('/sign-in?reset=success');
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return { currentPassword, newPassword, confirmPassword, error: 'Current password is incorrect.' };
    }

    if (currentPassword === newPassword) {
      return { currentPassword, newPassword, confirmPassword, error: 'New password must be different from the current password.' };
    }

    if (confirmPassword !== newPassword) {
      return { currentPassword, newPassword, confirmPassword, error: 'New password and confirmation password do not match.' };
    }

    const newPasswordHash = await hashPassword(newPassword);

    await Promise.all([
      db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, user.id)),
      logActivity(user.id, ActivityType.UPDATE_PASSWORD),
    ]);

    return { success: 'Password updated successfully.' };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return { password, error: 'Incorrect password. Account deletion failed.' };
    }

    await logActivity(user.id, ActivityType.DELETE_ACCOUNT);

    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await deleteWalletData(user.apiKey).catch((err) => {
      console.error('[deleteAccount] Redis cleanup failed:', (err as Error)?.message ?? err);
    });

    (await cookies()).delete('session');
    redirect('/sign-in');
  }
);

const updateAccountSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { email } = data;

    if (email !== user.email) {
      return { email, error: 'Email changes are not supported. Contact support to change your email.' };
    }

    await logActivity(user.id, ActivityType.UPDATE_ACCOUNT);

    return { success: 'Account updated successfully.' };
  }
);

const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export const resendVerificationEmail = validatedAction(resendVerificationSchema, async (data) => {
  const { email } = data;

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), isNull(users.emailVerified), isNull(users.deletedAt)))
    .limit(1);

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: 'If that email is registered and unverified, a new link has been sent.' };
  }

  const verificationToken = generateToken();
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db
    .update(users)
    .set({ verificationToken, verificationTokenExpiresAt, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  await sendVerificationEmail(email, verificationToken).catch((err) => {
    console.error('[resendVerificationEmail] failed:', err?.message ?? err);
  });

  return { success: 'If that email is registered and unverified, a new link has been sent.' };
});

export const rotateApiKey = validatedActionWithUser(
  z.object({}),
  async (_, __, user) => {
    const newApiKey = generateApiKey();

    // Update Postgres first — if this fails, Redis is untouched and we can safely return an error.
    await db.update(users).set({ apiKey: newApiKey, updatedAt: new Date() }).where(eq(users.id, user.id));

    // Transfer Redis data second. If this fails, Postgres has the new key but Redis still has
    // balance under the old key. Log the error; the user's next rotation attempt will fix it.
    await transferApiKeyData(user.apiKey, newApiKey).catch((err) => {
      console.error('[rotateApiKey] Redis transfer failed:', (err as Error)?.message ?? err);
    });

    await logActivity(user.id, ActivityType.ROTATE_API_KEY);

    return { success: 'API key rotated successfully.' };
  }
);
