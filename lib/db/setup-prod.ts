import postgres from 'postgres';
import 'dotenv/config';

async function main() {
  const client = postgres(process.env.POSTGRES_URL!);

  await client`
    CREATE TABLE IF NOT EXISTS users (
      id serial PRIMARY KEY,
      name varchar(100),
      email varchar(255) NOT NULL UNIQUE,
      password_hash text NOT NULL,
      api_key varchar(255) NOT NULL UNIQUE,
      balance numeric(10,6) NOT NULL DEFAULT '0.000000',
      role varchar(20) NOT NULL DEFAULT 'member',
      email_verified timestamp,
      verification_token varchar(255) UNIQUE,
      verification_token_expires_at timestamp,
      reset_token varchar(255) UNIQUE,
      reset_token_expires_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      deleted_at timestamp
    )
  `;
  console.log('users ok');

  await client`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      preferences jsonb NOT NULL DEFAULT '{}',
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;
  console.log('user_preferences ok');

  await client`
    CREATE TABLE IF NOT EXISTS token_usages (
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
    )
  `;
  console.log('token_usages ok');

  await client`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id serial PRIMARY KEY,
      user_id integer NOT NULL REFERENCES users(id),
      action text NOT NULL,
      timestamp timestamp NOT NULL DEFAULT now(),
      ip_address varchar(45)
    )
  `;
  console.log('activity_logs ok');

  // Patch any columns that may be missing from a partial migration
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS name varchar(100)`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key varchar(255)`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS balance numeric(10,6) NOT NULL DEFAULT '0.000000'`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified timestamp`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token varchar(255)`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamp`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token varchar(255)`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamp`;
  await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamp`;
  console.log('column patch ok');

  await client.end();
  console.log('\nSchema applied.');
}

main();
