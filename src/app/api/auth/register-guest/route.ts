import { NextRequest, NextResponse } from 'next/server';
import { woocommerceApi } from '@/lib/woocommerce/client';
import { createSession } from '@/features/auth/utils/session';
import { getStripeClient } from '@/lib/stripe/client';
import { getCheckoutSession, updateCheckoutSession } from '@/features/checkout/services/session';
import { invalidateCustomerOrdersCache } from '@/features/account/services/orders';
import { enquiryRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { success } = await enquiryRateLimit.limit(`register-guest:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }

    const { email, password, orderId, orderKey, stripeIntentId, stripeClientSecret } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Always require verifiable proof of a guest order (orderId + orderKey, or stripeIntentId + client_secret)
    // so callers cannot register an unverified email to read/claim existing guest orders.
    let orderToLink: number | null = null;
    let verifiedCheckoutSessionId: string | null = null;
    let hasOrderProof = false;

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
        Number(order.customer_id) === 0 &&
        order.billing?.email?.trim().toLowerCase() === normalizedEmail;
      if (!ownsOrder) {
        return NextResponse.json({ error: 'This order could not be verified.' }, { status: 403 });
      }
      orderToLink = order.id;
      hasOrderProof = true;
    }

    if (stripeIntentId) {
      if (typeof stripeClientSecret !== 'string' || !stripeClientSecret) {
        return NextResponse.json({ error: 'Payment confirmation proof is required.' }, { status: 403 });
      }
      try {
        const stripe = getStripeClient();
        const intent = await stripe.paymentIntents.retrieve(String(stripeIntentId), {
          expand: ['payment_method'],
        });
        const secretMatches = Boolean(intent.client_secret && intent.client_secret === stripeClientSecret);
        const pmEmail =
          typeof intent.payment_method === 'object' && intent.payment_method !== null
            ? (intent.payment_method as { billing_details?: { email?: string | null } }).billing_details?.email
            : undefined;
        const intentEmail = (intent.receipt_email || pmEmail || '').trim().toLowerCase();
        const checkoutSessionId = intent.metadata?.checkoutSessionId || null;

        let sessionOwnedByOther = false;
        if (checkoutSessionId) {
          const checkoutSession = await getCheckoutSession(checkoutSessionId).catch(() => null);
          if (checkoutSession?.customerId && Number(checkoutSession.customerId) !== 0) {
            sessionOwnedByOther = true;
          }
          if (checkoutSession?.orderId && !orderToLink) {
            const linkedOrder = await woocommerceApi
              .request<{ id: number; customer_id: number; billing?: { email?: string } }>(
                `orders/${checkoutSession.orderId}`,
                { revalidate: false },
              )
              .catch(() => null);
            if (linkedOrder) {
              if (Number(linkedOrder.customer_id) !== 0) {
                sessionOwnedByOther = true;
              } else if (linkedOrder.billing?.email?.trim().toLowerCase() === normalizedEmail) {
                orderToLink = linkedOrder.id;
              }
            }
          }
        }

        if (!secretMatches || sessionOwnedByOther || (intentEmail && intentEmail !== normalizedEmail)) {
          return NextResponse.json({ error: 'This payment could not be verified.' }, { status: 403 });
        }

        verifiedCheckoutSessionId = checkoutSessionId;
        hasOrderProof = true;
      } catch {
        return NextResponse.json({ error: 'This payment could not be verified.' }, { status: 403 });
      }
    }

    if (!hasOrderProof) {
      return NextResponse.json(
        { error: 'Valid order confirmation details are required to create an account here.' },
        { status: 403 },
      );
    }

    // 1. Create the customer in WooCommerce
    let customer;
    try {
      customer = await woocommerceApi.request<any>('customers', {
        method: 'POST',
        body: {
          email: normalizedEmail,
          password,
        },
      });
    } catch (error: any) {
      if (error.message?.includes('registration-error-email-exists')) {
        return NextResponse.json({ error: 'An account already exists for this email. Please sign in instead.' }, { status: 400 });
      }
      throw error;
    }

    // 2. Log them in to the Next.js frontend (emailVerified: false since created directly without email confirmation)
    await createSession(customer.id, customer.email, customer.role || 'customer', {
      emailVerified: false,
    });

    // 3. Link the verified order if we already have its order ID
    if (orderToLink) {
      await woocommerceApi.request(`orders/${orderToLink}`, {
        method: 'PUT',
        body: { customer_id: customer.id }
      }).catch(err => console.error('Failed to link order to new account:', err));
      await invalidateCustomerOrdersCache(customer.id);
    }

    // 4. Link the Stripe checkout session / order if applicable
    if (stripeIntentId) {
      if (verifiedCheckoutSessionId) {
        try {
          const currentSession = await getCheckoutSession(verifiedCheckoutSessionId);
          if (currentSession && (!currentSession.customerId || Number(currentSession.customerId) === 0)) {
            await updateCheckoutSession(verifiedCheckoutSessionId, { customerId: customer.id });
          }
        } catch (err) {
          console.error('Failed to update Checkout Session for guest register:', err);
        }
      }

      if (!orderToLink) {
        try {
          const orders = await woocommerceApi.request<any[]>(
            `orders?search=${encodeURIComponent(normalizedEmail)}`,
            { revalidate: false },
          );
          const matchingOrder = orders.find(
            (o) =>
              Number(o.customer_id) === 0 &&
              o.billing?.email?.trim().toLowerCase() === normalizedEmail &&
              o.meta_data?.some((m: any) => m.key === '_stripe_intent_id' && m.value === stripeIntentId),
          );

          if (matchingOrder) {
            await woocommerceApi.request(`orders/${matchingOrder.id}`, {
              method: 'PUT',
              body: { customer_id: customer.id },
            });
            await invalidateCustomerOrdersCache(customer.id);
          }
        } catch (err) {
          console.error('Failed to link existing Stripe order to new account:', err);
        }
      }
    }

    return NextResponse.json({ success: true, customerId: customer.id });
  } catch (error: any) {
    console.error('Guest registration error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
