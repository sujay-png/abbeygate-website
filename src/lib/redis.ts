import { Redis } from '@upstash/redis';

let redis: Redis | null | undefined;

/** Returns the configured durable Redis client, or null when not configured. */
export function getRedisClient(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url === 'https://placeholder.upstash.io' || token === 'placeholder') {
    redis = null;
    return redis;
  }

  redis = new Redis({ url, token });
  return redis;
}
