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
  return stats as WalletStats;
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

export async function transferApiKeyData(oldApiKey: string, newApiKey: string) {
  const balance = await redis.get(`wallet:balance:${oldApiKey}`);
  if (balance !== null) {
    await redis.set(`wallet:balance:${newApiKey}`, balance);
  }

  const stats = await redis.hgetall(`wallet:stats:${oldApiKey}`);
  if (stats && Object.keys(stats).length > 0) {
    await redis.hset(`wallet:stats:${newApiKey}`, stats);
  }

  const calls = await redis.lrange(`wallet:calls:${oldApiKey}`, 0, -1);
  if (calls.length > 0) {
    await redis.rpush(`wallet:calls:${newApiKey}`, ...calls);
    await redis.ltrim(`wallet:calls:${newApiKey}`, 0, 499);
  }

  await redis.del(
    `wallet:balance:${oldApiKey}`,
    `wallet:stats:${oldApiKey}`,
    `wallet:calls:${oldApiKey}`
  );
}
