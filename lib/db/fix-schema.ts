import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

const alterations = [
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS name varchar(100)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key varchar(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS balance numeric(10,6) NOT NULL DEFAULT '0.000000'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified timestamp`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token varchar(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamp`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token varchar(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamp`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamp`,
  `CREATE TABLE IF NOT EXISTS user_preferences (
    user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferences jsonb NOT NULL DEFAULT '{}',
    updated_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS token_usages (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id varchar(255) NOT NULL UNIQUE,
    model varchar(255) NOT NULL,
    prompt_tokens integer NOT NULL,
    completion_tokens integer NOT NULL,
    reasoning_tokens integer NOT NULL DEFAULT 0,
    total_tokens integer NOT NULL,
    cost numeric(12,8) NOT NULL,
    claude_cost numeric(12,8) NOT NULL DEFAULT '0',
    savings numeric(12,8) NOT NULL DEFAULT '0',
    opus_cost numeric(12,8) NOT NULL DEFAULT '0',
    opus_savings numeric(12,8) NOT NULL DEFAULT '0',
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS activity_logs (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id),
    action text NOT NULL,
    timestamp timestamp NOT NULL DEFAULT now(),
    ip_address varchar(45)
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_api_key_unique ON users(api_key) WHERE api_key IS NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_verification_token_unique ON users(verification_token) WHERE verification_token IS NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_reset_token_unique ON users(reset_token) WHERE reset_token IS NOT NULL`,
];

async function main() {
  for (const statement of alterations) {
    try {
      await db.execute(sql.raw(statement));
      console.log('OK:', statement.slice(0, 60));
    } catch (e: any) {
      console.error('FAIL:', statement.slice(0, 60), '->', e.message);
    }
  }
  await client.end();
  console.log('\nDone.');
}

main();
