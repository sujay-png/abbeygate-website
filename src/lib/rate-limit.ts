import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// A placeholder Redis client that fails safely if env variables are missing
const getRedisClient = () => {
  try {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || 'https://placeholder.upstash.io',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || 'placeholder',
    });
  } catch {
    console.error('Failed to initialize Redis. Ensure UPSTASH variables are set.');
    return null;
  }
};

const redis = getRedisClient();

/**
 * Standard checkout rate limiter: 10 requests per 1 minute.
 * If UPSTASH is not configured, it will default to allowing all requests.
 */
export const checkoutRateLimit = redis 
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/checkout',
    })
  : { limit: async () => ({ success: true }) };

/**
 * Standard enquiry rate limiter: 3 requests per 1 minute.
 */
export const enquiryRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit/enquiry',
    })
  : { limit: async () => ({ success: true }) };
