import postgres from 'postgres';
import 'dotenv/config';

async function main() {
  const client = postgres(process.env.POSTGRES_URL!);
  await client`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  await client`DROP SCHEMA public CASCADE`;
  await client`CREATE SCHEMA public`;
  await client.end();
  console.log('Database flushed.');
}

main();
