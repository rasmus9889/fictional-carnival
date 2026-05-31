import postgres from 'postgres';
import 'dotenv/config';

async function main() {
  const client = postgres(process.env.POSTGRES_URL!);
  await client`DROP TABLE IF EXISTS debug_logs, activity_logs, token_usages, user_preferences, users CASCADE`;
  await client`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  await client.end();
  console.log('Database flushed.');
}

main();
