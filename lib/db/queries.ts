import { desc, and, eq, isNull, sum, count } from 'drizzle-orm';
import { db } from './drizzle';
import { activityLogs, tokenUsages, users, userPreferences } from './schema';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  const sessionCookie = (await cookies()).get('session');
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = await verifyToken(sessionCookie.value);
  if (
    !sessionData ||
    !sessionData.user ||
    typeof sessionData.user.id !== 'number'
  ) {
    return null;
  }

  if (new Date(sessionData.expires) < new Date()) {
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(and(eq(users.id, sessionData.user.id), isNull(users.deletedAt)))
    .limit(1);

  if (user.length === 0) {
    return null;
  }

  return user[0];
}

export async function getActivityLogs() {
  const user = await getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
    })
    .from(activityLogs)
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(20);
}

export async function getTokenUsageSummary(userId: number) {
  const result = await db
    .select({
      totalCost: sum(tokenUsages.cost),
      totalSavings: sum(tokenUsages.savings),
      totalTokens: sum(tokenUsages.totalTokens),
      totalCalls: count(tokenUsages.id),
    })
    .from(tokenUsages)
    .where(eq(tokenUsages.userId, userId));

  return result[0] ?? null;
}

export async function getRecentTokenUsages(userId: number, limit = 20) {
  return await db
    .select()
    .from(tokenUsages)
    .where(eq(tokenUsages.userId, userId))
    .orderBy(desc(tokenUsages.createdAt))
    .limit(limit);
}

export async function getUserPreferences(userId: number): Promise<Record<string, unknown>> {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return (row?.preferences as Record<string, unknown>) ?? {};
}

export async function upsertUserPreferences(
  userId: number,
  preferences: Record<string, unknown>
): Promise<void> {
  await db
    .insert(userPreferences)
    .values({ userId, preferences, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { preferences, updatedAt: new Date() },
    });
}
