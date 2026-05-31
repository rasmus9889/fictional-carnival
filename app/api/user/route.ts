import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json(null);
  }

  const { id, name, email, apiKey, balance, role, emailVerified, createdAt } = user;
  return Response.json({ id, name, email, apiKey, balance, role, emailVerified, createdAt });
}
