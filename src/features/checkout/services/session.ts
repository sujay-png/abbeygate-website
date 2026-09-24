import { randomUUID } from 'crypto';
import { getRedisClient } from '@/lib/redis';
import type { CheckoutQuote } from '@/features/checkout/types/quote';

const SESSION_TTL_SECONDS = 10 * 60;
const SESSION_PREFIX = 'checkout:session:';

export type CheckoutSession = {
  id: string;
  status: 'quoted';
  createdAt: string;
  expiresAt: string;
  quote: CheckoutQuote;
  customerId?: number;
};

function key(id: string) {
  return `${SESSION_PREFIX}${id}`;
}

export async function createCheckoutSession(quote: CheckoutQuote, customerId?: number): Promise<CheckoutSession> {
  const redis = getRedisClient();
  if (!redis) throw new Error('Checkout sessions are unavailable. Configure Upstash Redis before enabling checkout.');

  const session: CheckoutSession = {
    id: randomUUID(),
    status: 'quoted',
    createdAt: new Date().toISOString(),
    expiresAt: quote.expiresAt,
    quote,
    customerId,
  };

  await redis.set(key(session.id), session, { ex: SESSION_TTL_SECONDS });
  return session;
}

export async function getCheckoutSession(id: string): Promise<CheckoutSession | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const redis = getRedisClient();
  if (!redis) throw new Error('Checkout sessions are unavailable. Configure Upstash Redis before enabling checkout.');

  return redis.get<CheckoutSession>(key(id));
}
