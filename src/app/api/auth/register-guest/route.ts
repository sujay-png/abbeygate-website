import { NextRequest, NextResponse } from 'next/server';
import { woocommerceApi } from '@/lib/woocommerce/client';
import { createSession } from '@/features/auth/utils/session';
import { getStripeClient } from '@/lib/stripe/client';
import { updateCheckoutSession } from '@/features/checkout/services/session';
import { enquiryRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { success } = await enquiryRateLimit.limit(`register-guest:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }

    const { email, password, orderId, orderKey, stripeIntentId } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Only a guest who can prove they placed the order (via its secret order key) may claim it.
    // Without this check any caller could attach someone else's order to a new account.
    let bacsOrderToLink: number | null = null;
    if (orderId) {
      const order = await woocommerceApi
        .request<{ id: number; order_key: string; customer_id: number; billing?: { email?: string } }>(
          `orders/${encodeURIComponent(String(orderId))}`,
          { revalidate: false },
        )
        .catch(() => null);
      const ownsOrder =
        !!order &&
        typeof orderKey === 'string' &&
        order.order_key === orderKey &&
        order.customer_id === 0 &&
        order.billing?.email?.toLowerCase() === String(email).toLowerCase();
      if (!ownsOrder) {
        return NextResponse.json({ error: 'This order could not be verified.' }, { status: 403 });
      }
      bacsOrderToLink = order.id;
    }

    // 1. Create the customer in WooCommerce
    let customer;
    try {
      customer = await woocommerceApi.request<any>('customers', {
        method: 'POST',
        body: {
          email,
          password,
        },
      });
    } catch (error: any) {
      if (error.message?.includes('registration-error-email-exists')) {
        return NextResponse.json({ error: 'An account already exists for this email. Please sign in instead.' }, { status: 400 });
      }
      throw error;
    }

    // 2. Log them in to the Next.js frontend
    await createSession(customer.id, customer.email, customer.role || 'customer');

    // 3. Link the order if it's a BACS order (we have the direct orderId)
    if (bacsOrderToLink) {
      await woocommerceApi.request(`orders/${bacsOrderToLink}`, {
        method: 'PUT',
        body: { customer_id: customer.id }
      }).catch(err => console.error('Failed to link BACS order to new account:', err));
    }

    // 4. Link the order if it's a Stripe order
    if (stripeIntentId) {
      // Step 4a: Update the Checkout Session so if the webhook hasn't run yet, it uses the new ID
      try {
        const stripe = getStripeClient();
        const intent = await stripe.paymentIntents.retrieve(stripeIntentId);
        const checkoutSessionId = intent.metadata?.checkoutSessionId;
        
        if (checkoutSessionId) {
          await updateCheckoutSession(checkoutSessionId, { customerId: customer.id });
        }
      } catch (err) {
        console.error('Failed to update Checkout Session for guest register:', err);
      }

      // Step 4b: Find the order in WooCommerce in case the webhook ALREADY ran
      try {
        // Query recent orders for this email
        const orders = await woocommerceApi.request<any[]>(`orders?search=${encodeURIComponent(email)}`, { revalidate: false });
        
        // Find the order that matches the stripe intent
        const matchingOrder = orders.find(o => 
          o.meta_data?.some((m: any) => m.key === '_stripe_intent_id' && m.value === stripeIntentId)
        );

        if (matchingOrder && matchingOrder.customer_id === 0) {
          await woocommerceApi.request(`orders/${matchingOrder.id}`, {
            method: 'PUT',
            body: { customer_id: customer.id }
          });
        }
      } catch (err) {
        console.error('Failed to link existing Stripe order to new account:', err);
      }
    }

    return NextResponse.json({ success: true, customerId: customer.id });
  } catch (error: any) {
    console.error('Guest registration error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
