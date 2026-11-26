import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import { getCheckoutSession, updateCheckoutSession } from '@/features/checkout/services/session';
import { woocommerceApi } from '@/lib/woocommerce/client';
import { invalidateCustomerOrdersCache, findCustomerIdByEmail } from '@/features/account/services/orders';
import { buildStripeOrderInfo } from '@/features/checkout/utils/stripe-order-metadata';
import { buildWooOrderLineItems } from '@/features/checkout/utils/woo-order-lines';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed.', err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const sessionId = paymentIntent.metadata?.checkoutSessionId;

      if (!sessionId) {
        console.error('PaymentIntent missing checkoutSessionId in metadata');
        return NextResponse.json({ received: true }); // Acknowledge to Stripe, nothing we can do
      }

      const session = await getCheckoutSession(sessionId);
      if (!session) {
        console.error(`Checkout session not found for ID: ${sessionId}`);
        // In a production app, you might queue this or check if it was already created.
        return NextResponse.json({ received: true });
      }

      // Idempotency: Do not duplicate orders if already processed
      if (session.orderId) {
        console.log(`Order already created for session ${sessionId}: ${session.orderId}`);
        return NextResponse.json({ received: true });
      }

      // We have a successful payment and a valid quote. Create the WooCommerce order.
      // Extract names from shipping
      const fullName = paymentIntent.shipping?.name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || '';

      let paymentMethod: Stripe.PaymentMethod | null = null;
      if (typeof paymentIntent.payment_method === 'string') {
        paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
      } else if (paymentIntent.payment_method) {
        paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod;
      }

      const billingDetails = paymentMethod?.billing_details;
      const billingNameParts = (billingDetails?.name || '').split(' ');
      const billingFirstName = billingNameParts[0] || firstName;
      const billingLastName = billingNameParts.slice(1).join(' ') || lastName;

      const customerEmail = billingDetails?.email || paymentIntent.receipt_email || '';
      let resolvedCustomerId = session.customerId || 0;
      if (!resolvedCustomerId && customerEmail) {
        resolvedCustomerId = await findCustomerIdByEmail(customerEmail);
      }

      const chargeId = typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : (paymentIntent.latest_charge as any)?.id || paymentIntent.id;

      const wcOrderPayload = {
        payment_method: 'stripe',
        payment_method_title: 'Credit/Debit Card (Stripe)',
        set_paid: true,
        status: 'processing', // Payment is already succeeded!
        transaction_id: chargeId,
        customer_id: resolvedCustomerId || 0,
        billing: {
          first_name: billingFirstName,
          last_name: billingLastName,
          address_1: billingDetails?.address?.line1 || paymentIntent.shipping?.address?.line1 || '',
          address_2: billingDetails?.address?.line2 || paymentIntent.shipping?.address?.line2 || '',
          city: billingDetails?.address?.city || paymentIntent.shipping?.address?.city || '',
          postcode: billingDetails?.address?.postal_code || paymentIntent.shipping?.address?.postal_code || '',
          country: billingDetails?.address?.country || paymentIntent.shipping?.address?.country || '',
          email: billingDetails?.email || paymentIntent.receipt_email || '', 
        },
        shipping: {
          first_name: firstName,
          last_name: lastName,
          address_1: paymentIntent.shipping?.address?.line1 || '',
          address_2: paymentIntent.shipping?.address?.line2 || '',
          city: paymentIntent.shipping?.address?.city || '',
          postcode: paymentIntent.shipping?.address?.postal_code || '',
          country: paymentIntent.shipping?.address?.country || '',
        },
        line_items: buildWooOrderLineItems(session.quote.lines, session.quote.discount),
        shipping_lines: [
          {
            method_id: 'flat_rate',
            method_title: session.quote.shipping.label,
            total: String(session.quote.shipping.cost)
          }
        ],
        ...(session.quote.couponCode ? {
          coupon_lines: [
            {
              code: session.quote.couponCode,
              discount: String(session.quote.discount)
            }
          ]
        } : {}),
        meta_data: [
          { key: '_wc_order_attribution_source_type', value: 'typein' },
          { key: '_wc_order_attribution_utm_source', value: '(direct)' },
          { key: '_stripe_intent_id', value: paymentIntent.id },
          { key: '_stripe_charge_captured', value: 'yes' },
          { key: '_stripe_currency', value: (paymentIntent.currency || 'GBP').toUpperCase() },
          ...(chargeId ? [{ key: '_transaction_id', value: chargeId }] : []),
          ...(chargeId && chargeId.startsWith('ch_') ? [{ key: '_charge_id', value: chargeId }] : []),
          ...(session.vatNumber ? [{ key: 'VAT Number', value: session.vatNumber }] : []),
        ]
      };

      try {
        const orderRes = await woocommerceApi.request<any>('orders', {
          method: 'POST',
          body: wcOrderPayload,
          timeoutMs: 45000,
        });
        console.log('WooCommerce order created successfully:', (orderRes as any)?.id);

        if ((orderRes as any)?.id && (orderRes as any)?.order_key) {
          await updateCheckoutSession(sessionId, {
            status: 'completed',
            orderId: (orderRes as any).id,
            orderKey: (orderRes as any).order_key,
          }).catch(err => console.error('Failed to update session with order id:', err));
        }

        // Attach the WooCommerce order number and customer details to both the Stripe
        // PaymentIntent and Charge so the Stripe Dashboard shows the order reference.
        if ((orderRes as any)?.id) {
          const stripeOrderInfo = buildStripeOrderInfo({
            sessionId,
            orderId: (orderRes as any).id,
            orderNumber: (orderRes as any).number,
            customerName: billingDetails?.name || paymentIntent.shipping?.name || '',
            customerEmail,
            lines: session.quote.lines,
          });

          const stripeUpdates: Promise<unknown>[] = [
            stripe.paymentIntents.update(paymentIntent.id, {
              description: stripeOrderInfo.description,
              metadata: stripeOrderInfo.metadata,
            }),
          ];

          if (typeof chargeId === 'string' && chargeId.startsWith('ch_')) {
            stripeUpdates.push(
              stripe.charges.update(chargeId, {
                description: stripeOrderInfo.description,
                metadata: stripeOrderInfo.metadata,
              })
            );
          }

          const updateResults = await Promise.allSettled(stripeUpdates);
          for (const result of updateResults) {
            if (result.status === 'rejected') {
              console.error('Failed to enrich Stripe payment with order info:', result.reason);
            }
          }
        }

        if (resolvedCustomerId) {
          try {
            await woocommerceApi.request(`customers/${resolvedCustomerId}`, {
              method: 'PUT',
              body: {
                billing: wcOrderPayload.billing,
                shipping: wcOrderPayload.shipping,
              },
              timeoutMs: 15000,
            });
            await invalidateCustomerOrdersCache(resolvedCustomerId);
          } catch (err) {
            console.error('Failed to update customer addresses from Stripe webhook:', err);
          }
        }
      } catch (err: any) {
        console.error('Failed to create WooCommerce order:', err.message);
        // We still return 200 to Stripe so it doesn't retry infinitely, but we should 
        // have alerting here (Sentry, etc.) since we have money but no order!
        return NextResponse.json({ error: 'Order creation failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
