import { woocommerceApi } from '@/lib/woocommerce/client';
import type { CheckoutQuote } from '../types/quote';

export type WooCommerceOrderPayload = {
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  status: string;
  billing: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    postcode: string;
    country: string;
    email: string;
    phone?: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    product_id: number;
    variation_id?: number;
    quantity: number;
    total: string;
    meta_data?: Array<{ key: string; value: string }>;
  }>;
  shipping_lines: Array<{
    method_id: string;
    method_title: string;
    total: string;
  }>;
  coupon_lines?: Array<{
    code: string;
  }>;
  fee_lines?: Array<{
    name: string;
    total: string;
  }>;
  meta_data: Array<{ key: string; value: string }>;
};

export async function createWooCommerceOrder(
  quote: CheckoutQuote,
  paymentMethod: 'stripe' | 'bacs',
  billingDetails: any,
  shippingDetails: any,
  paymentIntentId?: string
) {
  const line_items = quote.lines.map((line) => {
    const meta_data: Array<{ key: string; value: string }> = [];

    if (line.customization?.enabled) {
      if (line.customization.choice) {
        meta_data.push({ key: 'Blocking', value: line.customization.choice.replace(' blocked', '') });
      }
      if (line.customization.choice === 'Foil blocked' && line.customization.foilColor) {
        meta_data.push({ key: 'Foil Colour', value: line.customization.foilColor });
      }
      if (line.customization.fileName) {
        meta_data.push({ key: 'Logo', value: line.customization.fileName });
      }
      if (line.customization.cornerEdges && line.customization.cornerEdges !== 'None') {
        meta_data.push({ key: 'Corner Edges', value: line.customization.cornerEdges });
      }
      if (line.customization.fullPreviewUrl) {
        meta_data.push({ key: '_proof_url', value: line.customization.fullPreviewUrl }); // Using _ prefix so it's a hidden metadata field or we can make it visible depending on Woo setup
        meta_data.push({ key: 'Proof / Mockup', value: line.customization.fullPreviewUrl }); 
      }
    }

    return {
      product_id: parseInt(line.productId, 10),
      ...(line.variationId ? { variation_id: parseInt(line.variationId, 10) } : {}),
      quantity: line.quantity,
      total: line.lineTotal.toString(),
      meta_data,
    };
  });

  const payload: WooCommerceOrderPayload = {
    payment_method: paymentMethod,
    payment_method_title: paymentMethod === 'stripe' ? 'Credit Card (Stripe)' : 'Direct Bank Transfer',
    set_paid: paymentMethod === 'stripe',
    status: paymentMethod === 'stripe' ? 'processing' : 'on-hold',
    billing: {
      first_name: billingDetails.name?.split(' ')[0] || '',
      last_name: billingDetails.name?.split(' ').slice(1).join(' ') || '',
      address_1: billingDetails.address?.line1 || '',
      address_2: billingDetails.address?.line2 || '',
      city: billingDetails.address?.city || '',
      postcode: billingDetails.address?.postal_code || '',
      country: billingDetails.address?.country || 'GB',
      email: billingDetails.email || '',
      phone: billingDetails.phone || '',
    },
    shipping: {
      first_name: shippingDetails.name?.split(' ')[0] || '',
      last_name: shippingDetails.name?.split(' ').slice(1).join(' ') || '',
      address_1: shippingDetails.address?.line1 || '',
      address_2: shippingDetails.address?.line2 || '',
      city: shippingDetails.address?.city || '',
      postcode: shippingDetails.address?.postal_code || '',
      country: shippingDetails.address?.country || 'GB',
    },
    line_items,
    shipping_lines: [
      {
        method_id: 'flat_rate', // Simplify for now
        method_title: quote.shipping.label,
        total: quote.shipping.cost.toString(),
      }
    ],
    meta_data: [
      { key: '_stripe_intent_id', value: paymentIntentId || '' }
    ]
  };

  if (quote.couponCode) {
    payload.coupon_lines = [
      { code: quote.couponCode }
    ];
  }

  // We explicitly disable revalidation so order requests don't hit Next.js fetch cache
  const order = await woocommerceApi.request<any>('/orders', {
    method: 'POST',
    body: payload,
    revalidate: false 
  });

  return order;
}
