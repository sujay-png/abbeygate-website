import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import { getCheckoutSession } from '@/features/checkout/services/session';
import { woocommerceApi } from '@/lib/woocommerce/client';
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

      // We have a successful payment and a valid quote. Create the WooCommerce order.
      // Extract names from shipping
      const fullName = paymentIntent.shipping?.name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || '';

      const wcOrderPayload = {
        payment_method: 'stripe',
        payment_method_title: 'Credit/Debit Card (Stripe)',
        set_paid: true,
        status: 'processing', // Payment is already succeeded!
        customer_id: session.customerId || 0,
        billing: {
          first_name: firstName,
          last_name: lastName,
          address_1: paymentIntent.shipping?.address?.line1 || '',
          address_2: paymentIntent.shipping?.address?.line2 || '',
          city: paymentIntent.shipping?.address?.city || '',
          postcode: paymentIntent.shipping?.address?.postal_code || '',
          country: paymentIntent.shipping?.address?.country || '',
          email: paymentIntent.receipt_email || '', 
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
        line_items: session.quote.lines.map(line => ({
          product_id: parseInt(line.productId, 10),
          ...(line.variationId ? { variation_id: parseInt(line.variationId, 10) } : {}),
          quantity: line.quantity,
          total: String(line.lineTotal),
          meta_data: line.customization && line.customization.enabled ? [
            { key: 'Custom Logo Choice', value: line.customization.choice || '' },
            ...(line.customization.foilColor ? [{ key: 'Foil Colour', value: line.customization.foilColor }] : []),
            ...(line.customization.cornerEdges ? [{ key: 'Corner Edges', value: line.customization.cornerEdges }] : []),
            ...(line.customization.fileName ? [{ key: 'Uploaded File', value: line.customization.fileName }] : []),
            ...(line.customization.logoUrl ? [{ key: 'Download Logo', value: line.customization.logoUrl }] : []),
            ...(line.customization.previewUrl ? [{ key: 'View Proof', value: line.customization.previewUrl }] : []),
          ] : []
        })),
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
        ]
      };

      try {
        const orderRes = await woocommerceApi.request('orders', {
          method: 'POST',
          body: wcOrderPayload
        });
        console.log('WooCommerce order created successfully:', (orderRes as any).id);
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
