'use server';

import { woocommerceApi } from '@/lib/woocommerce/client';
import { getSession } from '@/features/auth/utils/session';
import { revalidatePath } from 'next/cache';
import { StoreProduct } from '@/features/products/types/store-product';
import { getRedisClient } from '@/lib/redis';

const getBasketCacheKey = (userId: number | string) => `user:${userId}:saved_baskets`;

export type savedBasketItem = {
  productId: number;
  productName: string;
  sku: string;
  qty: number;
  price: number;
  image?: string;
  customization?: any;
  attributes?: any[];
  variationId?: string;
  slug?: string;
};

export type savedBasket = {
  id: string;
  name: string;
  items: savedBasketItem[];
  createdAt: string;
  user: string;
};

function sanitizeBasketItems(items: savedBasketItem[]): savedBasketItem[] {
  return (items || []).map(item => {
    if (item.customization) {
      const { logoFile, logoPreviewUrl, ...rest } = item.customization;
      const safeLogoPreviewUrl =
        logoPreviewUrl && (!logoPreviewUrl.startsWith('data:') || logoPreviewUrl.length < 150000)
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

// Internal helper to get raw customer meta
async function getCustomerMeta() {
  const session = await getSession();
  if (!session) return null;

  try {
    const customer = await woocommerceApi.request<{ meta_data: Array<{ key: string, value: any }>; first_name?: string; last_name?: string; username?: string; }>(
      `/customers/${session.userId}`,
      { revalidate: 3600 } // Cached, busted by revalidatePath
    );
    return { customer, session };
  } catch (error) {
    console.error('Error fetching customer for Saved Baskets', error);
    return null;
  }
}

export async function getsavedBaskets(): Promise<savedBasket[]> {
  const session = await getSession();
  if (!session) return [];

  const redis = getRedisClient();
  const cacheKey = getBasketCacheKey(session.userId);

  // 1. Check Redis cache first (~5ms response)
  if (redis) {
    try {
      const cached = await redis.get<savedBasket[]>(cacheKey);
      if (cached && Array.isArray(cached)) {
        return cached;
      }
    } catch (cacheErr) {
      console.warn('Redis read error for saved baskets, falling back to WordPress:', cacheErr);
    }
  }

  // 2. Cache Miss: Fetch from WordPress customer meta
  const data = await getCustomerMeta();
  if (!data) return [];

  const allBaskets: savedBasket[] = [];

  // Parse legacy 'purchase_lists' array
  const legacyMeta = data.customer.meta_data.find((meta) => meta.key === 'purchase_lists');
  if (legacyMeta) {
    if (Array.isArray(legacyMeta.value)) {
      allBaskets.push(...legacyMeta.value);
    } else if (typeof legacyMeta.value === 'string') {
      try {
        allBaskets.push(...JSON.parse(legacyMeta.value));
      } catch {}
    }
  }

  // Parse new individual 'saved_basket_XYZ' keys
  const newMetas = data.customer.meta_data.filter((meta) => meta.key.startsWith('saved_basket_'));
  for (const meta of newMetas) {
    try {
      const parsed = typeof meta.value === 'string' ? JSON.parse(meta.value) : meta.value;
      if (parsed && parsed.id) {
        allBaskets.push(parsed);
      }
    } catch {}
  }

  // Sanitize all items so massive raw base64 data URLs are stripped
  const sanitizedBaskets = allBaskets.map(basket => ({
    ...basket,
    items: sanitizeBasketItems(basket.items)
  }));

  // Sort them by createdAt descending
  sanitizedBaskets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 3. Populate Redis cache for subsequent visits
  if (redis) {
    try {
      await redis.set(cacheKey, sanitizedBaskets);
    } catch (cacheErr) {
      console.warn('Redis write error for saved baskets:', cacheErr);
    }
  }

  return sanitizedBaskets;
}

export async function savesavedBasket(name: string, items: savedBasketItem[]): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Not authenticated' };

  const sanitizedItems = sanitizeBasketItems(items);
  const id = crypto.randomUUID();
  const newList: savedBasket = {
    id,
    name,
    items: sanitizedItems,
    createdAt: new Date().toISOString(),
    user: session.email.split('@')[0], 
  };

  const redis = getRedisClient();
  const cacheKey = getBasketCacheKey(session.userId);

  // 1. Immediately write to Redis so UI responds instantly
  if (redis) {
    try {
      const currentCached = (await redis.get<savedBasket[]>(cacheKey)) || [];
      const updated = [newList, ...currentCached.filter(b => b.id !== id)];
      await redis.set(cacheKey, updated);
    } catch (cacheErr) {
      console.warn('Redis write error during save:', cacheErr);
    }
  }

  // 2. Persist to WooCommerce customer meta in the background
  try {
    await woocommerceApi.request(`/customers/${session.userId}`, {
      method: 'PUT',
      body: {
        meta_data: [
          {
            key: `saved_basket_${id}`,
            value: JSON.stringify(newList)
          }
        ]
      }
    });
    
    revalidatePath('/account/saved-baskets');
    return { success: true };
  } catch (error) {
    console.error('Failed to save Saved Basket to WooCommerce', error);
    return { success: false, error: 'Failed to save Saved Basket' };
  }
}

export async function deletesavedBasket(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Not authenticated' };

  const redis = getRedisClient();
  const cacheKey = getBasketCacheKey(session.userId);

  // 1. Immediately delete from Redis so subsequent reads are instant
  if (redis) {
    try {
      const currentCached = (await redis.get<savedBasket[]>(cacheKey)) || [];
      const updated = currentCached.filter(b => b.id !== id);
      await redis.set(cacheKey, updated);
    } catch (cacheErr) {
      console.warn('Redis delete error during basket removal:', cacheErr);
    }
  }

  // 2. Persist deletion to WooCommerce customer meta
  // In WooCommerce, sending { key, value: null } removes the individual meta key.
  try {
    await woocommerceApi.request(`/customers/${session.userId}`, {
      method: 'PUT',
      body: {
        meta_data: [
          { key: `saved_basket_${id}`, value: null }
        ]
      }
    });

    // Also check and clean legacy purchase_lists if it exists
    const data = await getCustomerMeta();
    if (data) {
      const listsMeta = data.customer.meta_data.find((meta) => meta.key === 'purchase_lists');
      if (listsMeta) {
        let currentLists: savedBasket[] = [];
        if (Array.isArray(listsMeta.value)) {
          currentLists = listsMeta.value as savedBasket[];
        } else if (typeof listsMeta.value === 'string') {
          try { currentLists = JSON.parse(listsMeta.value); } catch {}
        }
        if (currentLists.some(list => list.id === id)) {
          const updatedLists = currentLists.filter(list => list.id !== id);
          await woocommerceApi.request(`/customers/${session.userId}`, {
            method: 'PUT',
            body: {
              meta_data: [{ key: 'purchase_lists', value: JSON.stringify(updatedLists) }]
            }
          });
        }
      }
    }
    
    revalidatePath('/account/saved-baskets');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete Saved Basket from WooCommerce', error);
    return { success: false, error: 'Failed to delete Saved Basket' };
  }
}

export type ProductSearchResult = {
  id: number;
  name: string;
  sku: string;
  price: string;
  image: string;
};

export async function searchProductsForBulkOrder(query: string, searchBy: 'name' | 'sku'): Promise<ProductSearchResult[]> {
  if (!query || query.length < 2) return [];

  try {
    // The standard WooCommerce REST API allows searching by `search` (which searches name/description) 
    // or by `sku` specifically.
    const params: Record<string, string> = {
      status: 'publish',
      per_page: '10'
    };

    const queriesToSearch = [query];
    if (searchBy === 'name') {
      const lower = query.toLowerCase();
      if (/colourlux|colorlux|coverlux/i.test(lower)) {
        queriesToSearch.push('Graphic Print');
      } else if (/graphic\s*print/i.test(lower)) {
        queriesToSearch.push('Colourlux');
      }
      if (/dorchester/i.test(lower)) {
        queriesToSearch.push('Newhide');
      } else if (/new\s*hide|newhide/i.test(lower)) {
        queriesToSearch.push('Dorchester');
      }
    }

    const responses = await Promise.all(
      queriesToSearch.map((q) =>
        woocommerceApi.request<
          Array<{ id: number; name: string; sku: string; price: string; images: Array<{ src: string }> }>
        >('/products', {
          params: {
            ...params,
            ...(searchBy === 'sku' ? { sku: q } : { search: q }),
          },
        })
      )
    );

    const productMap = new Map<
      number,
      { id: number; name: string; sku: string; price: string; images: Array<{ src: string }> }
    >();
    responses.flat().forEach((p) => productMap.set(p.id, p));
    const products = Array.from(productMap.values());

    return products.map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      price: p.price || '0',
      image: p.images?.[0]?.src || '',
    }));
  } catch (error) {
    console.error('Error searching products', error);
    return [];
  }
}
