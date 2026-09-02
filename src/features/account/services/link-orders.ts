'use server';

import { getSession } from '@/features/auth/utils/session';

export type ActionState = {
  success: boolean;
  message: string;
  error?: string;
};

export async function triggerLinkOrdersEmail(
  _prevState: ActionState | null,
  _formData: FormData
): Promise<ActionState> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: 'You must be logged in.' };
    }

    const storeUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL?.replace(/\/$/, '') || 'https://dashboard.abbeygate-england.com';

    const response = await fetch(`${storeUrl}/wp-json/headless/v1/trigger-guest-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': process.env.WP_HEADLESS_SECRET || '',
      },
      body: JSON.stringify({
        email: session.email,
        user_id: session.userId,
      }),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to trigger verification email.');
    }

    return {
      success: true,
      message: 'A confirmation link has been sent to your email address. Please check your inbox.',
    };
  } catch (error: unknown) {
    console.error('Error triggering link email:', error);
    const err = error as Error;
    return {
      success: false,
      message: err.message || 'An unexpected error occurred.',
      error: err.message,
    };
  }
}

export async function processLinkOrdersToken(token: string): Promise<ActionState> {
  try {
    const storeUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL?.replace(/\/$/, '') || 'https://dashboard.abbeygate-england.com';

    const response = await fetch(`${storeUrl}/wp-json/headless/v1/process-guest-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': process.env.WP_HEADLESS_SECRET || '',
      },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to link orders.');
    }

    return {
      success: true,
      message: data.message, // "Successfully linked X order(s)."
    };
  } catch (error: unknown) {
    console.error('Error processing link token:', error);
    const err = error as Error;
    return {
      success: false,
      message: err.message || 'An unexpected error occurred.',
      error: err.message,
    };
  }
}
