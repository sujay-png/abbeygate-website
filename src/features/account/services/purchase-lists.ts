'use server';

import { woocommerceApi } from '@/lib/woocommerce/client';
import { getSession } from '@/features/auth/utils/session';
import { revalidatePath } from 'next/cache';
import { StoreProduct } from '@/features/products/types/store-product';

export type PurchaseListItem = {
  productId: number;
  productName: string;
  sku: string;
  qty: number;
  price: number;
  image?: string;
};

export type PurchaseList = {
  id: string;
  name: string;
  items: PurchaseListItem[];
  createdAt: string;
  user: string;
};

// Internal helper to get raw customer meta
async function getCustomerMeta() {
  const session = await getSession();
  if (!session) return null;

  try {
    const customer = await woocommerceApi.request<{ meta_data: Array<{ key: string, value: any }> }>(
      `/customers/${session.userId}`,
      { revalidate: 0 }
    );
    return { customer, session };
  } catch (error) {
    console.error('Error fetching customer for purchase lists', error);
    return null;
  }
}

export async function getPurchaseLists(): Promise<PurchaseList[]> {
  const data = await getCustomerMeta();
  if (!data) return [];

  const listsMeta = data.customer.meta_data.find((meta) => meta.key === '_purchase_lists');
  if (listsMeta && Array.isArray(listsMeta.value)) {
    return listsMeta.value as PurchaseList[];
  }

  // Handle case where it might be a JSON string
  if (listsMeta && typeof listsMeta.value === 'string') {
    try {
      return JSON.parse(listsMeta.value) as PurchaseList[];
    } catch {
      return [];
    }
  }

  return [];
}

export async function savePurchaseList(name: string, items: PurchaseListItem[]): Promise<{ success: boolean; error?: string }> {
  const data = await getCustomerMeta();
  if (!data) return { success: false, error: 'Not authenticated' };

  const currentLists = await getPurchaseLists();
  
  const newList: PurchaseList = {
    id: crypto.randomUUID(),
    name,
    items,
    createdAt: new Date().toISOString(),
    user: data.session.email.split('@')[0], // Extract username from email
  };

  const updatedLists = [...currentLists, newList];

  try {
    await woocommerceApi.request(`/customers/${data.session.userId}`, {
      method: 'PUT',
      body: {
        meta_data: [
          {
            key: '_purchase_lists',
            value: updatedLists
          }
        ]
      }
    });
    
    revalidatePath('/account/purchase-lists');
    return { success: true };
  } catch (error) {
    console.error('Failed to save purchase list', error);
    return { success: false, error: 'Failed to save purchase list' };
  }
}

export async function deletePurchaseList(id: string): Promise<{ success: boolean; error?: string }> {
  const data = await getCustomerMeta();
  if (!data) return { success: false, error: 'Not authenticated' };

  const currentLists = await getPurchaseLists();
  const updatedLists = currentLists.filter(list => list.id !== id);

  try {
    await woocommerceApi.request(`/customers/${data.session.userId}`, {
      method: 'PUT',
      body: {
        meta_data: [
          {
            key: '_purchase_lists',
            value: updatedLists
          }
        ]
      }
    });
    
    revalidatePath('/account/purchase-lists');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete purchase list', error);
    return { success: false, error: 'Failed to delete purchase list' };
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
