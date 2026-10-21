import { woocommerceFetch, woocommerceApi } from '@/lib/woocommerce/client';
import { getStripeClient } from '@/lib/stripe/client';
import { getCheckoutSession } from './session';
import { storeFetch } from '@/lib/woocommerce/store-api';
import type { StoreProduct } from '@/features/products/types/store-product';

async function resolveProductImage(productId?: string | number, fallbackCustomPreview?: string): Promise<string> {
  if (fallbackCustomPreview) return fallbackCustomPreview;
  if (!productId) return '';
  try {
    const product = await storeFetch<StoreProduct>(`/products/${productId}`, { revalidate: 3600 });
    return product.images?.[0]?.src || product.images?.[0]?.thumbnail || '';
  } catch {
    return '';
  }
}

export type NormalizedOrderConfirmation = {
  orderNumber: string;
  orderId?: string | number;
  orderKey?: string;
  stripeIntentId?: string;
  orderDate: Date;
  email: string;
  total: number;
  paymentMethod: string;
  lineItems: Array<{
    id: string | number;
    name: string;
    quantity: number;
    total: number;
    image?: string;
    meta?: Array<{ key: string; value: any }>;
  }>;
  subtotal: number;
  shippingTotal: number;
  shippingLabel?: string;
  taxTotal: number;
  billing?: {
    first_name?: string;
    last_name?: string;
    name?: string;
    company?: string;
    address_1?: string;
    line1?: string;
    address_2?: string;
    line2?: string;
    city?: string;
    postcode?: string;
    postal_code?: string;
    country?: string;
    email?: string;
  };
  shipping?: {
    first_name?: string;
    last_name?: string;
    name?: string;
    address_1?: string;
    line1?: string;
    address_2?: string;
    line2?: string;
    city?: string;
    postcode?: string;
    postal_code?: string;
    country?: string;
  };
};

export async function getOrderConfirmationData({
  orderId,
  key,
  payment_intent,
  sessionId,
}: {
  orderId?: string;
  key?: string;
  payment_intent?: string;
  sessionId?: string;
}): Promise<NormalizedOrderConfirmation | null> {
  // Case 1: WooCommerce order id and key (e.g. BACS or Free order)
  if (orderId && key) {
    try {
      const order = await woocommerceFetch<any>({ path: `/orders/${orderId}`, revalidate: false });
      if (order && order.id && order.order_key === key) {
        const lineItems = await Promise.all((order.line_items || []).map(async (item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          total: Number(item.total),
          image: item.image?.src || await resolveProductImage(item.product_id),
          meta: (item.meta_data || []).filter((m: any) => !m.key.startsWith('_')),
        })));

        const subtotal = lineItems.reduce((acc: number, item: any) => acc + item.total, 0);

        return {
          orderNumber: String(order.id),
          orderId: order.id,
          orderKey: key,
          orderDate: new Date(order.date_created),
          email: order.billing?.email || '',
          total: Number(order.total),
          paymentMethod: order.payment_method_title || 'Direct Order',
          lineItems,
          subtotal,
          shippingTotal: Number(order.shipping_total || 0),
          shippingLabel: order.shipping_lines?.[0]?.method_title || 'Standard Shipping',
          taxTotal: Number(order.total_tax || 0),
          billing: order.billing,
          shipping: order.shipping,
        };
      }
    } catch (e) {
      console.error('Failed to retrieve order by ID and key:', e);
    }
  }

  // Case 2: Stripe payment intent or checkout session
  if (payment_intent || sessionId) {
    try {
      let intent: any = null;
      if (payment_intent) {
        try {
          const stripe = getStripeClient();
          intent = await stripe.paymentIntents.retrieve(payment_intent);
        } catch (e) {
          console.error('Failed to retrieve intent', e);
        }
      }

      const resolvedSessionId = sessionId || intent?.metadata?.checkoutSessionId;
      const session = resolvedSessionId ? await getCheckoutSession(resolvedSessionId) : null;
      const email = intent?.receipt_email || '';

      // Check if WooCommerce order was already created by the Stripe webhook
      try {
        const queryEmail = email || session?.quote?.lines?.[0]?.name ? email : '';
        if (queryEmail) {
          const orders = await woocommerceApi.request<any[]>(`orders?search=${encodeURIComponent(queryEmail)}`, { revalidate: false });
          const matchingOrder = orders?.find(o =>
            o.meta_data?.some((m: any) => m.key === '_stripe_intent_id' && m.value === payment_intent)
          );

          if (matchingOrder) {
            const lineItems = await Promise.all((matchingOrder.line_items || []).map(async (item: any) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              total: Number(item.total),
              image: item.image?.src || await resolveProductImage(item.product_id),
              meta: (item.meta_data || []).filter((m: any) => !m.key.startsWith('_')),
            })));

            const subtotal = lineItems.reduce((acc: number, item: any) => acc + item.total, 0);

            return {
              orderNumber: String(matchingOrder.id),
              orderId: matchingOrder.id,
              orderKey: matchingOrder.order_key,
              stripeIntentId: payment_intent,
              orderDate: new Date(matchingOrder.date_created),
              email: matchingOrder.billing?.email || email,
              total: Number(matchingOrder.total),
              paymentMethod: matchingOrder.payment_method_title || 'Credit/Debit Card (Stripe)',
              lineItems,
              subtotal,
              shippingTotal: Number(matchingOrder.shipping_total || 0),
              shippingLabel: matchingOrder.shipping_lines?.[0]?.method_title || 'Standard Shipping',
              taxTotal: Number(matchingOrder.total_tax || 0),
              billing: matchingOrder.billing,
              shipping: matchingOrder.shipping,
            };
          }
        }
      } catch (err) {
        console.error('Failed to find matching WooCommerce order for stripe intent:', err);
      }

      // If WooCommerce order is not yet created, build confirmation from session quote and Stripe intent
      if (session?.quote) {
        const quote = session.quote;
        const lineItems = await Promise.all(quote.lines.map(async (line, idx) => ({
          id: line.productId || idx,
          name: line.name,
          quantity: line.quantity,
          total: line.lineTotal,
          image: line.customization?.fullPreviewUrl || line.image || await resolveProductImage(line.productId),
          meta: line.customization && line.customization.enabled ? [
            ...(line.customization.choice ? [{ key: 'Custom Logo Choice', value: line.customization.choice }] : []),
            ...(line.customization.foilColor ? [{ key: 'Foil Colour', value: line.customization.foilColor }] : []),
            ...(line.customization.cornerEdges ? [{ key: 'Corner Edges', value: line.customization.cornerEdges }] : []),
            ...(line.customization.fileName ? [{ key: 'Uploaded File', value: line.customization.fileName }] : []),
            ...(line.customization.logoUrl ? [{ key: 'Download Logo', value: line.customization.logoUrl }] : []),
            ...(line.customization.previewUrl ? [{ key: 'View Proof', value: line.customization.previewUrl }] : []),
          ] : [],
        })));

        return {
          orderNumber: intent ? intent.id.slice(-8).toUpperCase() : (resolvedSessionId ? resolvedSessionId.slice(-8).toUpperCase() : 'CONFIRMED'),
          stripeIntentId: payment_intent,
          orderDate: intent ? new Date(intent.created * 1000) : new Date(),
          email: email || '',
          total: quote.total,
          paymentMethod: 'Credit/Debit Card (Stripe)',
          lineItems,
          subtotal: quote.subtotal,
          shippingTotal: quote.shipping?.cost || 0,
          shippingLabel: quote.shipping?.label || 'Standard Shipping',
          taxTotal: quote.vat,
          billing: {
            name: intent.shipping?.name || '',
            email: email,
            address_1: intent.shipping?.address?.line1 || '',
            address_2: intent.shipping?.address?.line2 || '',
            city: intent.shipping?.address?.city || '',
            postcode: intent.shipping?.address?.postal_code || '',
            country: intent.shipping?.address?.country || '',
          },
          shipping: {
            name: intent.shipping?.name || '',
            address_1: intent.shipping?.address?.line1 || '',
            address_2: intent.shipping?.address?.line2 || '',
            city: intent.shipping?.address?.city || '',
            postcode: intent.shipping?.address?.postal_code || '',
            country: intent.shipping?.address?.country || '',
          },
        };
      }
    } catch (e) {
      console.error('Failed to retrieve stripe payment intent confirmation data:', e);
    }
  }

  return null;
}
