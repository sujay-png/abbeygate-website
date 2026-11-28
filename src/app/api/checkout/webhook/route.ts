import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import { createOrderFromSession } from '@/features/checkout/services/order';
import { buildStripeOrderInfo } from '@/features/checkout/utils/stripe-order-metadata';
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

      let paymentMethod: Stripe.PaymentMethod | null = null;
      if (typeof paymentIntent.payment_method === 'string') {
        paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
      } else if (paymentIntent.payment_method) {
        paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod;
      }

      const billingDetails = paymentMethod?.billing_details;
      const customerEmail = billingDetails?.email || paymentIntent.receipt_email || '';
      const shippingName = paymentIntent.shipping?.name || '';
      const chargeId =
        typeof paymentIntent.latest_charge === 'string'
          ? paymentIntent.latest_charge
          : (paymentIntent.latest_charge as { id?: string } | null)?.id || paymentIntent.id;

      try {
        const result = await createOrderFromSession({
          sessionId,
          paymentMethod: 'stripe',
          transactionId: chargeId,
          billingDetails: {
            name: billingDetails?.name || shippingName,
            email: customerEmail,
            address: {
              line1: billingDetails?.address?.line1 || paymentIntent.shipping?.address?.line1 || '',
              line2: billingDetails?.address?.line2 || paymentIntent.shipping?.address?.line2 || '',
              city: billingDetails?.address?.city || paymentIntent.shipping?.address?.city || '',
              postal_code: billingDetails?.address?.postal_code || paymentIntent.shipping?.address?.postal_code || '',
              country: billingDetails?.address?.country || paymentIntent.shipping?.address?.country || '',
            },
          },
          shippingDetails: {
            name: shippingName,
            address: {
              line1: paymentIntent.shipping?.address?.line1 || '',
              line2: paymentIntent.shipping?.address?.line2 || '',
              city: paymentIntent.shipping?.address?.city || '',
              postal_code: paymentIntent.shipping?.address?.postal_code || '',
              country: paymentIntent.shipping?.address?.country || '',
            },
          },
          extraMeta: [
            { key: '_stripe_intent_id', value: paymentIntent.id },
            { key: '_stripe_charge_captured', value: 'yes' },
            { key: '_stripe_currency', value: (paymentIntent.currency || 'GBP').toUpperCase() },
            ...(chargeId ? [{ key: '_transaction_id', value: chargeId }] : []),
            ...(chargeId && chargeId.startsWith('ch_') ? [{ key: '_charge_id', value: chargeId }] : []),
          ],
          awaitCustomerSync: true,
        });

        if (result.status === 'not_found') {
          console.error(`Checkout session not found for ID: ${sessionId}`);
          return NextResponse.json({ received: true });
        }
        if (result.status === 'locked') {
          return NextResponse.json({ error: 'Order creation in progress' }, { status: 409 });
        }
        if (result.status === 'already_exists') {
          console.log(`Order already created for session ${sessionId}: ${result.orderId}`);
          return NextResponse.json({ received: true });
        }

        if (result.status === 'created') {
          console.log('WooCommerce order created successfully:', result.orderId);
          const stripeOrderInfo = buildStripeOrderInfo({
            sessionId,
            orderId: result.orderId,
            orderNumber: result.orderNumber,
            customerName: billingDetails?.name || shippingName,
            customerEmail,
            lines: result.quoteLines,
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
          for (const updateResult of updateResults) {
            if (updateResult.status === 'rejected') {
              console.error('Failed to enrich Stripe payment with order info:', updateResult.reason);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to create WooCommerce order:', err.message);
        return NextResponse.json({ error: 'Order creation failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
