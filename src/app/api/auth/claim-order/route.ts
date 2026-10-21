import { NextRequest, NextResponse } from 'next/server';
import { woocommerceApi } from '@/lib/woocommerce/client';
import { createSession } from '@/features/auth/utils/session';
import { getStripeClient } from '@/lib/stripe/client';
import { updateCheckoutSession } from '@/features/checkout/services/session';
import { invalidateCustomerOrdersCache } from '@/features/account/services/orders';
import { enquiryRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { success } = await enquiryRateLimit.limit(`claim-order:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }

    const { username, password, orderId, orderKey, stripeIntentId } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username/Email and password are required' }, { status: 400 });
    }

    const storeUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL?.replace(/\/$/, '') || 'https://dashboard.abbeygate-england.com';

    // 1. Authenticate with headless login endpoint
    const response = await fetch(`${storeUrl}/wp-json/headless/v1/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': process.env.WP_HEADLESS_SECRET || '',
      },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      return NextResponse.json({ error: data?.message || 'Invalid email or password.' }, { status: 401 });
    }

    const customerId = data.user.id;

    // 2. Log customer in to the Next.js session
    await createSession(customerId, data.user.email, data.user.roles);

    // 3. Link BACS or direct WooCommerce order
    if (orderId) {
      try {
        const order = await woocommerceApi
          .request<{ id: number; order_key: string; customer_id: number }>(
            `orders/${encodeURIComponent(String(orderId))}`,
            { revalidate: false }
          )
          .catch(() => null);

        if (order && order.order_key === orderKey) {
          await woocommerceApi.request(`orders/${order.id}`, {
            method: 'PUT',
            body: { customer_id: customerId }
          });
          await invalidateCustomerOrdersCache(customerId);
        }
      } catch (err) {
        console.error('Failed to link order to logged-in user:', err);
      }
    }

    // 4. Link Stripe order
    if (stripeIntentId) {
      try {
        const stripe = getStripeClient();
        const intent = await stripe.paymentIntents.retrieve(stripeIntentId);
        const checkoutSessionId = intent.metadata?.checkoutSessionId;

        if (checkoutSessionId) {
          await updateCheckoutSession(checkoutSessionId, { customerId });
        }
      } catch (err) {
        console.error('Failed to update Checkout Session on claim-order:', err);
      }

      try {
        const orders = await woocommerceApi.request<any[]>(`orders?search=${encodeURIComponent(username)}`, { revalidate: false });
        const matchingOrder = orders.find(o =>
          o.meta_data?.some((m: any) => m.key === '_stripe_intent_id' && m.value === stripeIntentId)
        );

        if (matchingOrder && matchingOrder.customer_id === 0) {
          await woocommerceApi.request(`orders/${matchingOrder.id}`, {
            method: 'PUT',
            body: { customer_id: customerId }
          });
          await invalidateCustomerOrdersCache(customerId);
        }
      } catch (err) {
        console.error('Failed to link Stripe order to logged-in user:', err);
      }
    }

    return NextResponse.json({ success: true, customerId });
  } catch (error: any) {
    console.error('Claim order error:', error);
    return NextResponse.json({ error: 'Failed to authenticate and link order.' }, { status: 500 });
  }
}
