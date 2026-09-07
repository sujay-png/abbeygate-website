'use server';

import { createSession, deleteSession } from '../utils/session';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';

export type LoginState = {
  success: boolean;
  message: string;
  error?: string;
};

async function shareWordPressAuthCookies(response: Response) {
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (!setCookies.length) return;

  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin') || requestHeaders.get('host') || '';
  const shareAcrossSubdomains = origin.includes('abbeygate-england.com');

  for (const rawCookie of setCookies) {
    const parts = rawCookie.split(';').map((part) => part.trim());
    const [nameValue, ...attributes] = parts;
    const separator = nameValue.indexOf('=');
    if (separator === -1) continue;

    const name = nameValue.slice(0, separator);
    let value = nameValue.slice(separator + 1);
    try {
      value = decodeURIComponent(value);
    } catch {
      // Keep the original value if an upstream plugin did not URL-encode it.
    }

    const options: {
      path?: string;
      expires?: Date;
      maxAge?: number;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: 'lax' | 'strict' | 'none';
      domain?: string;
    } = {};

    for (const attribute of attributes) {
      const [rawKey, ...rawValue] = attribute.split('=');
      const key = rawKey.toLowerCase();
      const attributeValue = rawValue.join('=').trim();
      if (key === 'path') options.path = attributeValue;
      if (key === 'expires') options.expires = new Date(attributeValue);
      if (key === 'max-age') options.maxAge = Number.parseInt(attributeValue, 10);
      if (key === 'httponly') options.httpOnly = true;
      if (key === 'secure') options.secure = true;
      if (key === 'samesite' && ['lax', 'strict', 'none'].includes(attributeValue.toLowerCase())) {
        options.sameSite = attributeValue.toLowerCase() as 'lax' | 'strict' | 'none';
      }
    }

    if (shareAcrossSubdomains) options.domain = '.abbeygate-england.com';
    cookieStore.set(name, value, options);
  }
}

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
    const storeUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL?.replace(/\/$/, '') || 'https://dashboard.abbeygate-england.com';
    
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

    // The Next.js session authorises the headless site. A separate WordPress
    // login cookie is required for WooCommerce to recognise this customer at
    // its own checkout. This endpoint is intentionally best-effort so existing
    // Next.js login remains available until the accompanying WP snippet is live.
    const wordpressSessionResponse = await fetch(`${storeUrl}/wp-json/headless/v1/session-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': process.env.WP_HEADLESS_SECRET || '',
      },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    });

    if (wordpressSessionResponse.ok) {
      await shareWordPressAuthCookies(wordpressSessionResponse);
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

  // Clear WooCommerce and WordPress session cookies to ensure full logout
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin') || requestHeaders.get('host') || '';
  const shareAcrossSubdomains = origin.includes('abbeygate-england.com');
  
  for (const cookie of allCookies) {
    const name = cookie.name;
    if (
      name.startsWith('wordpress_') ||
      name.startsWith('wp-') ||
      name.startsWith('woocommerce_')
    ) {
      if (shareAcrossSubdomains) {
        cookieStore.delete({ name, domain: '.abbeygate-england.com' });
      } else {
        cookieStore.delete(name);
      }
    }
  }

  redirect('/account');
}

export async function checkAuthStatus(): Promise<boolean> {
  const { getSession } = await import('../utils/session');
  const session = await getSession();
  return !!session;
}
