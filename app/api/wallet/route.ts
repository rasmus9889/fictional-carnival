import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { getWalletBalance, getWalletStats, getRecentCalls, type WalletStats, type CallLog } from '@/lib/db/redis';
import { getEurToUsdRateWithFallback } from '@/lib/fx/rates';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let stats: WalletStats | null = null;
  let recentCalls: CallLog[] = [];
  // FX rate is still needed to convert MCP-backend stats (cost/savings) from USD → EUR
  let eurToUsd = 1.1;
  let redisBalance: string | null = null;

  try {
    [stats, recentCalls, eurToUsd, redisBalance] = await Promise.all([
      getWalletStats(user.apiKey),
      getRecentCalls(user.apiKey, 10),
      getEurToUsdRateWithFallback(),
      getWalletBalance(user.apiKey),
    ]);
  } catch {
    // Redis or FX rate unavailable — fall back to Postgres balance
  }

  // Balance is stored in EUR directly; Redis is authoritative, Postgres is fallback
  const balanceEur = redisBalance !== null
    ? parseFloat(redisBalance)
    : parseFloat(user.balance);

  return NextResponse.json({ stats, recentCalls, balanceEur, eurToUsd });
}
