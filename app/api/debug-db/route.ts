import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';

export async function GET() {
  const cols = await db.execute(
    sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
  );
  return NextResponse.json({ columns: (cols as any[]).map((r) => r.column_name) });
}
