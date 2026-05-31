import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json(null);
  }

  const { id, email, apiKey, balance, role, emailVerified, createdAt } = user;
  return Response.json({ id, email, apiKey, balance, role, emailVerified, createdAt });
}
