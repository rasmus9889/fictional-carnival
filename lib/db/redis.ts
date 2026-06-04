import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL!, { lazyConnect: true });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export interface WalletStats {
  prompt_tokens: string;
  completion_tokens: string;
  reasoning_tokens: string;
  total_tokens: string;
  cost: string;
  claude_cost: string;
  savings: string;
  opus_cost: string;
  opus_savings: string;
  call_count: string;
}

export interface CallLog {
  request_id: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  reasoning_tokens: number;
  total_tokens: number;
  cost: number;
  savings: number;
  created_at: string;
}

export async function getWalletBalance(apiKey: string): Promise<string | null> {
  return redis.get(`wallet:balance:${apiKey}`);
}

export async function setWalletBalance(apiKey: string, balance: string) {
  await redis.set(`wallet:balance:${apiKey}`, balance);
}

export async function getWalletStats(apiKey: string): Promise<WalletStats | null> {
  const stats = await redis.hgetall(`wallet:stats:${apiKey}`);
  if (!stats || Object.keys(stats).length === 0) return null;
  return stats as unknown as WalletStats;
}

export async function getRecentCalls(apiKey: string, count = 20): Promise<CallLog[]> {
  const raw = await redis.lrange(`wallet:calls:${apiKey}`, 0, count - 1);
  return raw.map((entry) => {
    try {
      return JSON.parse(entry) as CallLog;
    } catch {
      return null;
    }
  }).filter(Boolean) as CallLog[];
}

export async function deleteWalletData(apiKey: string): Promise<void> {
  await redis.del(
    `wallet:balance:${apiKey}`,
    `wallet:stats:${apiKey}`,
    `wallet:calls:${apiKey}`,
  );
}

const SYNC_INTERVAL_SEC = 300; // re-check at most once every 5 minutes per user

export async function reconcileBalance(
  apiKey: string,
  postgresBalanceEur: number,
  totalCostUsd: number,
  eurToUsd: number,
): Promise<string | null> {
  const syncKey = `wallet:sync_check:${apiKey}`;
  const alreadySynced = await redis.get(syncKey);

  // Always refresh the rate-limit window so the next check is 5 min from now
  await redis.set(syncKey, '1', 'EX', SYNC_INTERVAL_SEC);

  if (alreadySynced) return null; // not due yet

  const expectedEur = postgresBalanceEur - totalCostUsd / eurToUsd;
  const safeBalance = Math.max(0, expectedEur);

  const current = await redis.get(`wallet:balance:${apiKey}`);
  const currentEur = parseFloat(current ?? '0');

  if (Math.abs(safeBalance - currentEur) > 0.01) {
    const newBalance = safeBalance.toFixed(6);
    await redis.set(`wallet:balance:${apiKey}`, newBalance);
    console.log(
      `[reconcileBalance] ${apiKey}: Redis ${currentEur.toFixed(6)} → ${newBalance}` +
      ` (Postgres €${postgresBalanceEur.toFixed(6)}, spent $${totalCostUsd.toFixed(6)})`
    );
    return newBalance;
  }

  return null;
}

export async function transferApiKeyData(oldApiKey: string, newApiKey: string): Promise<void> {
  const script = `
    local balance = redis.call('GET', KEYS[1])
    if balance then redis.call('SET', KEYS[2], balance) end
    local stats = redis.call('HGETALL', KEYS[3])
    if #stats > 0 then redis.call('HMSET', KEYS[4], unpack(stats)) end
    local calls = redis.call('LRANGE', KEYS[5], 0, -1)
    if #calls > 0 then
      redis.call('RPUSH', KEYS[6], unpack(calls))
      redis.call('LTRIM', KEYS[6], 0, 499)
    end
    redis.call('DEL', KEYS[1], KEYS[3], KEYS[5])
  `;
  await redis.eval(
    script, 6,
    `wallet:balance:${oldApiKey}`, `wallet:balance:${newApiKey}`,
    `wallet:stats:${oldApiKey}`,   `wallet:stats:${newApiKey}`,
    `wallet:calls:${oldApiKey}`,   `wallet:calls:${newApiKey}`,
  );
}
