'use server';

import { woocommerceApi } from '@/lib/woocommerce/client';
import { getSession } from '@/features/auth/utils/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getRedisClient } from '@/lib/redis';

const getAddressesCacheKey = (userId: number | string) => `user:${userId}:addresses`;

export type Address = {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string;
  phone: string;
};

export type CustomerAddresses = {
  billing: Address;
  shipping: Address;
};

export type AddressUpdateState = {
  success: boolean;
  message: string;
  error?: string;
};

export async function getAddresses(): Promise<CustomerAddresses | null> {
  const session = await getSession();
  if (!session) return null;

  const redis = getRedisClient();
  const cacheKey = getAddressesCacheKey(session.userId);

  // 1. Check Redis cache first (~5ms)
  if (redis) {
    try {
      const cached = await redis.get<CustomerAddresses>(cacheKey);
      if (cached && typeof cached === 'object' && 'billing' in cached && 'shipping' in cached) {
        return cached;
      }
    } catch (err) {
      console.warn('Redis read error for addresses:', err);
    }
  }

  // 2. Cache Miss: Fetch from WooCommerce customer API
  try {
    const customer = await woocommerceApi.request<{ billing: Address; shipping: Address }>(`/customers/${session.userId}`, {
      revalidate: 3600
    });
    
    const addresses: CustomerAddresses = {
      billing: customer.billing,
      shipping: customer.shipping,
    };

    // 3. Populate Redis cache for instant future loads
    if (redis) {
      try {
        await redis.set(cacheKey, addresses);
      } catch (err) {
        console.warn('Redis write error for addresses:', err);
      }
    }

    return addresses;
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
    return null;
  }
}

export async function updateAddress(
  type: 'billing' | 'shipping',
  _prevState: AddressUpdateState | null,
  formData: FormData
): Promise<AddressUpdateState> {
  const session = await getSession();
  if (!session) return { success: false, message: 'Not authenticated' };

  const addressData: Partial<Address> = {
    first_name: formData.get('first_name') as string || '',
    last_name: formData.get('last_name') as string || '',
    company: formData.get('company') as string || '',
    address_1: formData.get('address_1') as string || '',
    address_2: formData.get('address_2') as string || '',
    city: formData.get('city') as string || '',
    state: formData.get('state') as string || '',
    postcode: formData.get('postcode') as string || '',
    country: formData.get('country') as string || 'GB',
    phone: formData.get('phone') as string || '',
  };

  if (type === 'billing') {
    addressData.email = formData.get('email') as string || '';
  }

  try {
    await woocommerceApi.request(`/customers/${session.userId}`, {
      method: 'PUT',
      body: {
        [type]: addressData,
      },
    });

    // Immediately update Redis cache so the updated address is visible instantly
    const redis = getRedisClient();
    if (redis) {
      try {
        const cached = await redis.get<CustomerAddresses>(getAddressesCacheKey(session.userId));
        if (cached) {
          const updated: CustomerAddresses = {
            ...cached,
            [type]: {
              ...(cached[type] || {}),
              ...addressData,
            } as Address,
          };
          await redis.set(getAddressesCacheKey(session.userId), updated);
        } else {
          await redis.del(getAddressesCacheKey(session.userId));
        }
      } catch (err) {
        console.warn('Redis update error for address:', err);
      }
    }

    revalidatePath('/account/addresses');
  } catch (error: unknown) {
    console.error(`Failed to update ${type} address:`, error);
    const err = error as Error;
    return { success: false, message: err.message || 'An error occurred.', error: err.message };
  }

  redirect('/account/addresses?success=1');
}
