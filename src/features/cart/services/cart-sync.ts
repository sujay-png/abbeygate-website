'use server';

import { getRedisClient } from '@/lib/redis';
import { getSession } from '@/features/auth/utils/session';
import type { CartItem } from '../context/CartContext';

const getCartCacheKey = (userId: number | string) => `user:${userId}:cart`;

// 30 days expiration in seconds
const CART_TTL_SECONDS = 60 * 60 * 24 * 30;

function sanitizeCartItemsForCloud(items: CartItem[]): CartItem[] {
  return (items || []).map(item => {
    if (item.customization) {
      const { logoFile, logoPreviewUrl, ...rest } = item.customization;
      // Preserve logoPreviewUrl if it's a real URL or a data URI under 1MB
      const safeLogoPreviewUrl =
        logoPreviewUrl && (!logoPreviewUrl.startsWith('data:') || logoPreviewUrl.length < 1000000)
          ? logoPreviewUrl
          : undefined;

      return {
        ...item,
        customization: {
          ...rest,
          ...(safeLogoPreviewUrl ? { logoPreviewUrl: safeLogoPreviewUrl } : {})
        }
      };
    }
    return item;
  });
}

/** Fetches the persisted cloud cart for the currently authenticated user. */
export async function getCloudCart(): Promise<CartItem[] | null> {
  const session = await getSession();
  if (!session) return null;

  const redis = getRedisClient();
  if (!redis) return null;

  const cacheKey = getCartCacheKey(session.userId);

  try {
    const cached = await redis.get<CartItem[]>(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }
    return [];
  } catch (err) {
    console.warn('Redis read error for cloud cart:', err);
    return null;
  }
}

/** Persists the cart to Redis with a 30-day TTL. Sanitizes items to prevent payload bloat. */
export async function saveCloudCart(items: CartItem[]): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Not authenticated' };

  const redis = getRedisClient();
  if (!redis) return { success: false, error: 'Redis not configured' };

  const cacheKey = getCartCacheKey(session.userId);

  try {
    if (!items || items.length === 0) {
      await redis.del(cacheKey);
      return { success: true };
    }

    const sanitized = sanitizeCartItemsForCloud(items);
    await redis.set(cacheKey, sanitized, { ex: CART_TTL_SECONDS });
    return { success: true };
  } catch (err) {
    console.warn('Redis write error for cloud cart:', err);
    return { success: false, error: 'Failed to sync cart' };
  }
}

/** Clears the cloud cart upon successful order completion or manual cart clear. */
export async function clearCloudCart(): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session) return { success: true };

  const redis = getRedisClient();
  if (!redis) return { success: true };

  try {
    await redis.del(getCartCacheKey(session.userId));
    return { success: true };
  } catch (err) {
    console.warn('Redis delete error for cloud cart:', err);
    return { success: false };
  }
}
