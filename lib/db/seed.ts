import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { setWalletBalance, redis } from '@/lib/db/redis';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';

async function seed() {
  if (process.env.TEST_MODE === 'true') {
    await seedTestUser();
  } else {
    await seedDefaultUser();
  }
}

async function seedTestUser() {
  const email = 'rasmus9889@gmail.com';
  const password = 'tinyblueturtle';
  const passwordHash = await hashPassword(password);

  // Check if user already exists so we can preserve their API key
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let apiKey: string;

  if (existing) {
    // Reset balance and verify email, keep existing API key
    await db
      .update(users)
      .set({
        passwordHash,
        balance: '5.000000',
        emailVerified: new Date(),
        deletedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.email, email));

    apiKey = existing.apiKey;
    console.log('Test user reset:', email);
  } else {
    apiKey = 'mcp_' + randomBytes(32).toString('hex');

    await db.insert(users).values({
      email,
      passwordHash,
      apiKey,
      role: 'owner',
      balance: '5.000000',
      emailVerified: new Date(),
    });

    console.log('Test user created:', email);
  }

  await setWalletBalance(apiKey, '5.000000');

  console.log('Email   :', email);
  console.log('Password:', password);
  console.log('Balance : €5 (approx) / $5.00 USD');
  console.log('API key :', apiKey);
}

async function seedDefaultUser() {
  const email = 'test@test.com';
  const password = 'admin123';
  const passwordHash = await hashPassword(password);
  const apiKey = 'mcp_' + randomBytes(32).toString('hex');

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      apiKey,
      role: 'owner',
    })
    .returning();

  console.log('Seed user created:', user.email, '| API key:', user.apiKey);
}

seed()
  .catch((error) => {
    console.error('Seed process failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await redis.disconnect();
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
