'use server';

import { getSession } from '@/features/auth/utils/session';
import { revalidatePath } from 'next/cache';

export type AccountDetails = {
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
};

export type AccountDetailsState = {
  success: boolean;
  message: string;
  error?: string;
};

function getStoreUrl() {
  return process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL?.replace(/\/$/, '') || 'https://corporate.abbeygate-england.com';
}

export async function getAccountDetails(userId: number): Promise<AccountDetails | null> {
  try {
    const storeUrl = getStoreUrl();
    const response = await fetch(`${storeUrl}/wp-json/headless/v1/account/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always get fresh data for account details
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data as AccountDetails;
  } catch (error) {
    console.error('Failed to fetch account details:', error);
    return null;
  }
}

export async function updateAccountDetails(
  _prevState: AccountDetailsState | null,
  formData: FormData
): Promise<AccountDetailsState> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: 'Not authenticated.' };
    }

    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const display_name = formData.get('display_name') as string;
    const email = formData.get('email') as string;
    const current_password = formData.get('current_password') as string;
    const new_password = formData.get('new_password') as string;
    const confirm_new_password = formData.get('confirm_new_password') as string;

    if (new_password && new_password !== confirm_new_password) {
      return { success: false, message: 'New passwords do not match.' };
    }

    const storeUrl = getStoreUrl();
    const response = await fetch(`${storeUrl}/wp-json/headless/v1/account/${session.userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name,
        last_name,
        display_name,
        email,
        current_password,
        new_password,
      }),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to update account details.');
    }

    revalidatePath('/account/details');

    return {
      success: true,
      message: 'Account details updated successfully.',
    };
  } catch (error: unknown) {
    console.error('Update account details error:', error);
    const err = error as Error;
    return {
      success: false,
      message: err.message || 'An unexpected error occurred while updating details.',
      error: err.message,
    };
  }
}
