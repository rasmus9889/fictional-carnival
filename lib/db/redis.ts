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
