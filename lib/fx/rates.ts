import { redis } from '@/lib/db/redis';

const CACHE_KEY = 'fx:eur_usd';
const CACHE_TTL = 3600; // 1 hour

export async function getEurToUsdRate(): Promise<number> {
  // Try live cache first
  const cached = await redis.get(CACHE_KEY);
  if (cached) return parseFloat(cached);

  // Fetch fresh rate
  const res = await fetch('https://open.er-api.com/v6/latest/EUR');
  if (!res.ok) throw new Error(`Exchange rate API returned ${res.status}`);

  const data = await res.json();
  const rate: number = data?.rates?.USD;
  if (!rate || typeof rate !== 'number') {
    throw new Error('USD rate missing from exchange rate response');
  }

  // Cache with TTL; also persist without TTL as stale fallback
  await Promise.all([
    redis.set(CACHE_KEY, rate.toString(), 'EX', CACHE_TTL),
    redis.set(`${CACHE_KEY}:fallback`, rate.toString()),
  ]);

  return rate;
}

// Returns the last known rate (cached or fallback), throws only if never fetched
export async function getEurToUsdRateWithFallback(): Promise<number> {
  try {
    return await getEurToUsdRate();
  } catch {
    const fallback = await redis.get(`${CACHE_KEY}:fallback`);
    if (fallback) return parseFloat(fallback);
    throw new Error('No EUR/USD rate available — exchange rate service unreachable');
  }
}
