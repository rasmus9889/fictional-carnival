import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getWalletStats, getRecentCalls } from '@/lib/db/redis';
import { getEurToUsdRateWithFallback } from '@/lib/fx/rates';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [stats, recentCalls, eurToUsd] = await Promise.all([
    getWalletStats(user.apiKey),
    getRecentCalls(user.apiKey, 10),
    getEurToUsdRateWithFallback(),
  ]);

  const balanceUsd = parseFloat(user.balance);
  const balanceEur = balanceUsd / eurToUsd;

  return NextResponse.json({ stats, recentCalls, balanceEur, eurToUsd });
}
