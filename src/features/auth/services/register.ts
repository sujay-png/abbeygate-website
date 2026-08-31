'use server';

import { woocommerceApi } from '@/lib/woocommerce/client';

export type RegisterState = {
  success: boolean;
  message: string;
  error?: string;
};

export async function registerCustomer(
  prevState: RegisterState | null,
  formData: FormData
): Promise<RegisterState> {
  try {
    const email = formData.get('email') as string;
    const userRole = formData.get('userRole') as string;

    if (!email) {
      return { success: false, message: 'Email address is required.' };
    }

    if (!userRole) {
      return { success: false, message: 'Please select a user role.' };
    }

    // Call WooCommerce API to create the customer.
    // By NOT sending a password, WooCommerce will generate one and send the welcome email.
    await woocommerceApi.request('customers', {
      method: 'POST',
      body: {
        email,
        meta_data: [
          {
            key: 'user_type',
            value: userRole,
          },
        ],
      },
    });

    return {
      success: true,
      message: 'Registration successful. Please check your email to set your password.',
    };
  } catch (error: unknown) {
    console.error('Error creating customer:', error);
    
    // Attempt to extract a user-friendly error message from the WooCommerce API response
    let errorMessage = 'An unexpected error occurred during registration.';
    const err = error as Error;
    if (err.message.includes('registration-error-email-exists')) {
      errorMessage = 'An account is already registered with your email address. Please log in.';
    } else {
      errorMessage = err.message;
    }

    return {
      success: false,
      message: errorMessage,
      error: errorMessage,
    };
  }
}
