import { Ratelimit } from '@upstash/ratelimit';
import { getRedisClient } from '@/lib/redis';

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
