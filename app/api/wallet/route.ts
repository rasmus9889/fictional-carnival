import { NextResponse } from 'next/server';
import { getUser, getTokenUsageSummary } from '@/lib/db/queries';
import { getWalletBalance, getWalletStats, getRecentCalls, reconcileBalance, type WalletStats, type CallLog } from '@/lib/db/redis';
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
  } catch (err) {
    console.error('[/api/wallet] Redis or FX rate unavailable, falling back to Postgres balance:', (err as Error)?.message ?? err);
  }

  // Periodic reconciliation: if Postgres balance drifted from Redis (e.g. manual DB edit),
  // recalculate the correct balance and update Redis. Rate-limited to once per 5 min per user.
  try {
    const summary = await getTokenUsageSummary(user.id);
    const totalCostUsd = parseFloat(summary?.totalCost ?? '0');
    const synced = await reconcileBalance(
      user.apiKey,
      parseFloat(user.balance),
      totalCostUsd,
      eurToUsd,
    );
    if (synced !== null) redisBalance = synced;
  } catch (err) {
    console.error('[/api/wallet] reconciliation failed:', (err as Error)?.message ?? err);
  }

  // Balance is stored in EUR directly; Redis is authoritative, Postgres is fallback
  const balanceEur = redisBalance !== null
    ? parseFloat(redisBalance)
    : parseFloat(user.balance);

  const mcpUrl = process.env.MCP_URL?.replace(/\/$/, '') ?? null;

  return NextResponse.json({ stats, recentCalls, balanceEur, eurToUsd, mcpUrl });
}
