import { db } from './drizzle';
import { users } from './schema';
import { hashPassword } from '@/lib/auth/session';
import { randomBytes } from 'crypto';

async function seed() {
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
  .finally(() => {
    console.log('Seed process finished. Exiting...');
    process.exit(0);
  });
