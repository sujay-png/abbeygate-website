'use server';

import { woocommerceApi } from '@/lib/woocommerce/client';
import { getSession } from '@/features/auth/utils/session';
import type { CartItem } from '@/features/cart/context/CartContext';

const ACTIVE_CART_META_KEY = 'active_nextjs_cart';

export async function fetchActiveCart(): Promise<CartItem[] | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const customer = await woocommerceApi.request<{ meta_data: Array<{ key: string, value: any }> }>(
      `/customers/${session.userId}`,
      { revalidate: 0 }
    );
    
    const cartMeta = customer.meta_data.find(meta => meta.key === ACTIVE_CART_META_KEY);
    if (cartMeta && cartMeta.value) {
      if (typeof cartMeta.value === 'string') {
        return JSON.parse(cartMeta.value) as CartItem[];
      }
      return cartMeta.value as CartItem[];
    }
  } catch (error) {
    console.error('Error fetching active cart from WP:', error);
  }
  return null;
}

export async function syncActiveCart(items: CartItem[]): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  // We must strip out any non-serializable data before syncing to WP
  // e.g. File objects in customization
  const serializableItems = items.map(item => {
    if (item.customization && item.customization.logoFile) {
      const { logoFile, ...restCustomization } = item.customization;
      return { ...item, customization: restCustomization };
    }
    return item;
  });

  try {
    await woocommerceApi.request(`/customers/${session.userId}`, {
      method: 'PUT',
      body: {
        meta_data: [
          {
            key: ACTIVE_CART_META_KEY,
            value: JSON.stringify(serializableItems)
          }
        ]
      }
    });
    return true;
  } catch (error) {
    console.error('Failed to sync active cart to WP:', error);
    return false;
  }
}
