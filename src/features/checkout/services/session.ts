import { randomUUID } from 'crypto';
import { getRedisClient } from '@/lib/redis';
import type { CheckoutQuote } from '@/features/checkout/types/quote';

const SESSION_TTL_SECONDS = 10 * 60;
const SESSION_PREFIX = 'checkout:session:';
const ORDER_LOCK_PREFIX = 'checkout:order-lock:';
const ORDER_LOCK_TTL_SECONDS = 60;

export type CheckoutSession = {
  id: string;
  status: 'quoted' | 'processing' | 'completed';
  createdAt: string;
  expiresAt: string;
  quote: CheckoutQuote;
  customerId?: number;
  vatNumber?: string;
  paymentIntentId?: string;
  orderId?: number;
  orderKey?: string;
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

export async function updateCheckoutSession(id: string, updates: Partial<CheckoutSession>): Promise<CheckoutSession | null> {
  const session = await getCheckoutSession(id);
  if (!session) return null;
  
  const updatedSession = { ...session, ...updates };
  const redis = getRedisClient();
  if (!redis) throw new Error('Checkout sessions are unavailable.');
  
  await redis.set(key(id), updatedSession, { ex: SESSION_TTL_SECONDS });
  return updatedSession;
}

/**
 * Acquires a short-lived Redis mutex for a checkout session so concurrent requests
 * (double-clicks, Stripe retries) cannot create duplicate WooCommerce orders or
 * redeem a single-use coupon twice.
 */
export async function acquireCheckoutOrderLock(sessionId: string): Promise<boolean> {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return false;
  const redis = getRedisClient();
  if (!redis) return true;
  const result = await redis.set(`${ORDER_LOCK_PREFIX}${sessionId}`, '1', {
    nx: true,
    ex: ORDER_LOCK_TTL_SECONDS,
  });
  return result === 'OK';
}

export async function releaseCheckoutOrderLock(sessionId: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) return;
  const redis = getRedisClient();
  if (!redis) return;
  await redis.del(`${ORDER_LOCK_PREFIX}${sessionId}`).catch(() => {});
}
