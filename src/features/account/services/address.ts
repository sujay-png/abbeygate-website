'use server';

import { woocommerceApi } from '@/lib/woocommerce/client';
import { getSession } from '@/features/auth/utils/session';
import { revalidatePath } from 'next/cache';

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

  try {
    const customer = await woocommerceApi.request<{ billing: Address; shipping: Address }>(`/customers/${session.userId}`, {
      revalidate: 0 // Don't cache
    });
    return {
      billing: customer.billing,
      shipping: customer.shipping,
    };
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

    revalidatePath('/account/addresses');
    return { success: true, message: 'Address saved successfully.' };
  } catch (error: unknown) {
    console.error(`Failed to update ${type} address:`, error);
    const err = error as Error;
    return { success: false, message: err.message || 'An error occurred.', error: err.message };
  }
}
