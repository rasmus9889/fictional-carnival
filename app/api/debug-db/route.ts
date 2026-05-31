import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';

export async function GET() {
  const cols = await db.execute(
    sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
  );
  return NextResponse.json({ columns: (cols as any[]).map((r) => r.column_name) });
}

export async function POST() {
  const patches = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role varchar(20) NOT NULL DEFAULT 'member'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified timestamp`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token varchar(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamp`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token varchar(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamp`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now()`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamp`,
    `CREATE TABLE IF NOT EXISTS user_preferences (user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, preferences jsonb NOT NULL DEFAULT '{}', updated_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS token_usages (id serial PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE, request_id varchar(255) NOT NULL UNIQUE, model varchar(255) NOT NULL, prompt_tokens integer NOT NULL, completion_tokens integer NOT NULL, reasoning_tokens integer NOT NULL DEFAULT 0, total_tokens integer NOT NULL, cost numeric(12,8) NOT NULL, claude_cost numeric(12,8) NOT NULL DEFAULT '0', savings numeric(12,8) NOT NULL DEFAULT '0', opus_cost numeric(12,8) NOT NULL DEFAULT '0', opus_savings numeric(12,8) NOT NULL DEFAULT '0', created_at timestamp NOT NULL DEFAULT now())`,
    `CREATE TABLE IF NOT EXISTS activity_logs (id serial PRIMARY KEY, user_id integer NOT NULL REFERENCES users(id), action text NOT NULL, timestamp timestamp NOT NULL DEFAULT now(), ip_address varchar(45))`,
  ];
  const results: string[] = [];
  for (const stmt of patches) {
    await db.execute(sql.raw(stmt));
    results.push(stmt.slice(0, 60));
  }
  return NextResponse.json({ ok: true, applied: results });
}
