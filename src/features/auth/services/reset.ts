'use server';

export type ResetPasswordState = {
  success: boolean;
  message: string;
  error?: string;
};

export async function resetCustomerPassword(
  prevState: ResetPasswordState | null,
  formData: FormData
): Promise<ResetPasswordState> {
  try {
    const key = formData.get('key') as string;
    const login = formData.get('login') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!key || !login) {
      return { success: false, message: 'Invalid or missing reset token.' };
    }

    if (!password || !confirmPassword) {
      return { success: false, message: 'Please enter a new password.' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match.' };
    }

    if (password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters long.' };
    }

    // Call the custom WP REST API endpoint we created
    // Use the base store URL from our config, removing trailing slash if present
    const storeUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL?.replace(/\/$/, '') || 'https://corporate.abbeygate-england.com';
    
    const response = await fetch(`${storeUrl}/wp-json/headless/v1/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        login,
        password,
      }),
      // Don't cache this request
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to reset password.');
    }

    return {
      success: true,
      message: 'Password successfully updated! You can now log in.',
    };
  } catch (error: unknown) {
    console.error('Password reset error:', error);
    const err = error as Error;
    
    return {
      success: false,
      message: err.message || 'An unexpected error occurred while resetting the password.',
      error: err.message,
    };
  }
}
