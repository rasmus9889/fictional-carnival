import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users, activityLogs, ActivityType } from '@/lib/db/schema';
import { comparePasswords } from '@/lib/auth/session';
import { setWalletBalance } from '@/lib/db/redis';
import { randomBytes } from 'crypto';
import { z } from 'zod';

function generateApiKey(): string {
  return 'mcp_' + randomBytes(32).toString('hex');
}

async function logActivity(userId: number, type: ActivityType) {
  await db.insert(activityLogs).values({ userId, action: type, ipAddress: '' });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(8) })
          .safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const [user] = await db
          .select()
          .from(users)
          .where(and(eq(users.email, email), isNull(users.deletedAt)))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const isValid = await comparePasswords(password, user.passwordHash);
        if (!isValid) return null;

        // emailVerified check is done in the signIn action before calling auth
        // so we can return a specific error message to the user

        return { id: String(user.id), email: user.email };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const [existing] = await db
          .select()
          .from(users)
          .where(and(eq(users.email, user.email!), isNull(users.deletedAt)))
          .limit(1);

        if (existing) {
          // Mark email verified if signing in via Google for the first time
          if (!existing.emailVerified) {
            await db
              .update(users)
              .set({ emailVerified: new Date(), updatedAt: new Date() })
              .where(eq(users.id, existing.id));
          }
          user.id = String(existing.id);
        } else {
          const apiKey = generateApiKey();
          const [created] = await db
            .insert(users)
            .values({
              email: user.email!,
              passwordHash: null,
              apiKey,
              emailVerified: new Date(),
              role: 'owner',
            })
            .returning();

          await setWalletBalance(created.apiKey, '0.000000').catch((err) =>
            console.error('[auth] setWalletBalance failed:', err?.message ?? err)
          );
          await logActivity(created.id, ActivityType.SIGN_UP).catch(console.error);
          user.id = String(created.id);
        }
      }
      return true;
    },

    jwt({ token, user }) {
      if (user?.id) token.id = parseInt(user.id, 10);
      return token;
    },

    session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof token.id === 'number') (session.user as any).id = token.id;
      return session;
    },
  },

  events: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials' && user.id) {
        await logActivity(parseInt(user.id, 10), ActivityType.SIGN_IN).catch(console.error);
      }
      if (account?.provider === 'google' && user.id) {
        await logActivity(parseInt(user.id, 10), ActivityType.SIGN_IN).catch(console.error);
      }
    },
  },

  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
});
