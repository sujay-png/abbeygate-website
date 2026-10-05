'use server';

import { woocommerceApi } from '@/lib/woocommerce/client';
import { getSession } from '@/features/auth/utils/session';
import { revalidatePath } from 'next/cache';
import { StoreProduct } from '@/features/products/types/store-product';

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

  // Sort them by createdAt descending
  allBaskets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return allBaskets;
}

export async function savesavedBasket(name: string, items: savedBasketItem[]): Promise<{ success: boolean; error?: string }> {
  // Skip GET request completely!
  const session = await getSession();
  if (!session) return { success: false, error: 'Not authenticated' };

  const id = crypto.randomUUID();
  const newList: savedBasket = {
    id,
    name,
    items,
    createdAt: new Date().toISOString(),
    user: session.email.split('@')[0], 
  };

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
    console.error('Failed to save Saved Basket', error);
    return { success: false, error: 'Failed to save Saved Basket' };
  }
}

export async function deletesavedBasket(id: string): Promise<{ success: boolean; error?: string }> {
  const data = await getCustomerMeta();
  if (!data) return { success: false, error: 'Not authenticated' };

  const metaUpdates: { key: string; value: string | null }[] = [];

  // Check new keys first
  const newMeta = data.customer.meta_data.find((meta) => meta.key === `saved_basket_${id}`);
  if (newMeta) {
    metaUpdates.push({ key: `saved_basket_${id}`, value: null }); // Null deletes the meta key
  } else {
    // Legacy array fallback
    let currentLists: savedBasket[] = [];
    const listsMeta = data.customer.meta_data.find((meta) => meta.key === 'purchase_lists');
    if (listsMeta && Array.isArray(listsMeta.value)) {
      currentLists = listsMeta.value as savedBasket[];
    } else if (listsMeta && typeof listsMeta.value === 'string') {
      try {
        currentLists = JSON.parse(listsMeta.value) as savedBasket[];
      } catch {}
    }

    const updatedLists = currentLists.filter(list => list.id !== id);
    metaUpdates.push({ key: 'purchase_lists', value: JSON.stringify(updatedLists) });
  }

  if (metaUpdates.length === 0) return { success: true };

  try {
    await woocommerceApi.request(`/customers/${data.session.userId}`, {
      method: 'PUT',
      body: {
        meta_data: metaUpdates
      }
    });
    
    revalidatePath('/account/saved-baskets');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete Saved Basket', error);
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

    if (searchBy === 'sku') {
      params.sku = query;
    } else {
      params.search = query;
    }

    const products = await woocommerceApi.request<Array<{ id: number, name: string, sku: string, price: string, images: Array<{ src: string }> }>>('/products', {
      params
    });

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
