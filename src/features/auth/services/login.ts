'use server';

import { createSession, deleteSession } from '../utils/session';
import { redirect } from 'next/navigation';

export type LoginState = {
  success: boolean;
  message: string;
  error?: string;
};

export async function loginCustomer(
  prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  try {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
      return { success: false, message: 'Username and password are required.' };
    }

    // Call the custom WP REST API login endpoint
    const storeUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL?.replace(/\/$/, '') || 'https://corporate.abbeygate-england.com';
    
    const response = await fetch(`${storeUrl}/wp-json/headless/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': process.env.WP_HEADLESS_SECRET || '',
      },
      body: JSON.stringify({
        username,
        password,
      }),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Invalid username or password.');
    }

    // Setup the secure session cookie
    await createSession(data.user.id, data.user.email, data.user.roles);
    
    // We don't return here, we fall through to redirect outside the try-catch
  } catch (error: unknown) {
    console.error('Login error:', error);
    const err = error as Error;
    return {
      success: false,
      message: err.message || 'An unexpected error occurred during login.',
      error: err.message,
    };
  }

  // Redirect throws an error internally, so it must be outside the try-catch block
  redirect('/account/dashboard');
}

export async function logoutCustomer() {
  await deleteSession();
  redirect('/account');
}
