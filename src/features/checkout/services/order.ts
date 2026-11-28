import { woocommerceApi } from '@/lib/woocommerce/client';
import type { CheckoutQuote } from '../types/quote';
import {
  getCheckoutSession,
  updateCheckoutSession,
  acquireCheckoutOrderLock,
  releaseCheckoutOrderLock,
} from './session';
import { invalidateCustomerOrdersCache, findCustomerIdByEmail } from '@/features/account/services/orders';
import { buildWooOrderLineItems } from '@/features/checkout/utils/woo-order-lines';

export type WooCommerceOrderPayload = {
  customer_id?: number;
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  status: string;
  transaction_id?: string;
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
  paymentIntentId?: string,
  customerId?: number
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
    transaction_id: paymentMethod === 'stripe' && paymentIntentId ? paymentIntentId : undefined,
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
      { key: '_stripe_intent_id', value: paymentIntentId || '' },
      { key: '_stripe_charge_captured', value: paymentMethod === 'stripe' ? 'yes' : 'no' },
      { key: '_stripe_currency', value: 'GBP' },
      ...(paymentIntentId ? [{ key: '_transaction_id', value: paymentIntentId }] : [])
    ]
  };

  if (quote.couponCode) {
    payload.coupon_lines = [
      { code: quote.couponCode }
    ];
  }

  if (customerId && customerId > 0) {
    payload.customer_id = customerId;
  }

  // We explicitly disable revalidation so order requests don't hit Next.js fetch cache
  const order = await woocommerceApi.request<any>('/orders', {
    method: 'POST',
    body: payload,
    revalidate: false 
  });

  // Automatically update the customer's saved addresses in their account (Requirement #2)
  if (customerId && customerId > 0) {
    try {
      await woocommerceApi.request(`/customers/${customerId}`, {
        method: 'PUT',
        body: {
          billing: payload.billing,
          shipping: payload.shipping
        },
      });
    } catch (e) {
      console.warn('Failed to auto-populate customer addresses after order creation', e);
    }
  }

  return order;
}

export type SessionOrderAddress = {
  name?: string;
  email?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
};

export type CreateOrderFromSessionInput = {
  sessionId: string;
  paymentMethod: 'free' | 'bacs' | 'stripe';
  billingDetails: SessionOrderAddress;
  shippingDetails?: SessionOrderAddress;
  vatNumber?: string;
  authUserId?: number;
  transactionId?: string;
  extraMeta?: Array<{ key: string; value: string }>;
  awaitCustomerSync?: boolean;
};

export type CreateOrderFromSessionResult =
  | {
      status: 'created';
      orderId: number;
      orderKey: string;
      orderNumber?: string;
      quoteLines: CheckoutQuote['lines'];
    }
  | { status: 'already_exists'; orderId: number; orderKey?: string }
  | { status: 'locked'; orderId?: number; orderKey?: string }
  | { status: 'not_found' }
  | { status: 'requires_payment' };

/**
 * Shared locked order creator for Free, BACS, and Stripe webhook routes.
 * Holds a per-session Redis mutex so concurrent requests cannot create duplicate orders
 * or double-apply single-use coupons.
 */
export async function createOrderFromSession(
  input: CreateOrderFromSessionInput,
): Promise<CreateOrderFromSessionResult> {
  const {
    sessionId,
    paymentMethod,
    billingDetails,
    shippingDetails,
    vatNumber,
    authUserId,
    transactionId,
    extraMeta = [],
    awaitCustomerSync = false,
  } = input;

  const lockAcquired = await acquireCheckoutOrderLock(sessionId);
  if (!lockAcquired) {
    const existing = await getCheckoutSession(sessionId);
    if (existing?.orderId) {
      return { status: 'locked', orderId: existing.orderId, orderKey: existing.orderKey };
    }
    return { status: 'locked' };
  }

  try {
    const session = await getCheckoutSession(sessionId);
    if (!session) {
      return { status: 'not_found' };
    }

    if (session.orderId) {
      return {
        status: 'already_exists',
        orderId: session.orderId,
        orderKey: session.orderKey,
      };
    }

    if (paymentMethod === 'free' && session.quote.total > 0) {
      return { status: 'requires_payment' };
    }

    let resolvedCustomerId = session.customerId || 0;
    if (!resolvedCustomerId) {
      if (authUserId) {
        resolvedCustomerId = authUserId;
      } else if (billingDetails.email) {
        resolvedCustomerId = await findCustomerIdByEmail(billingDetails.email);
      }
    }

    const nameParts = billingDetails.name?.trim().split(' ').filter(Boolean) || [];
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    const shippingNameParts = shippingDetails?.name?.trim().split(' ').filter(Boolean) || [];
    const shippingFirstName = shippingNameParts[0] || firstName;
    const shippingLastName = shippingNameParts.slice(1).join(' ') || lastName;

    const paymentMetaMap: Record<CreateOrderFromSessionInput['paymentMethod'], {
      methodTitle: string;
      setPaid: boolean;
      orderStatus: string;
    }> = {
      free: { methodTitle: '100% Discount Coupon', setPaid: true, orderStatus: 'processing' },
      bacs: { methodTitle: 'Direct bank transfer', setPaid: false, orderStatus: 'on-hold' },
      stripe: { methodTitle: 'Credit/Debit Card (Stripe)', setPaid: true, orderStatus: 'processing' },
    };
    const meta = paymentMetaMap[paymentMethod];

    const billing = {
      first_name: firstName,
      last_name: lastName,
      address_1: billingDetails.address?.line1 || '',
      address_2: billingDetails.address?.line2 || '',
      city: billingDetails.address?.city || '',
      postcode: billingDetails.address?.postal_code || '',
      country: billingDetails.address?.country || '',
      email: billingDetails.email || '',
    };

    const shipping = {
      first_name: shippingFirstName,
      last_name: shippingLastName,
      address_1: shippingDetails?.address?.line1 || billingDetails.address?.line1 || '',
      address_2: shippingDetails?.address?.line2 || billingDetails.address?.line2 || '',
      city: shippingDetails?.address?.city || billingDetails.address?.city || '',
      postcode: shippingDetails?.address?.postal_code || billingDetails.address?.postal_code || '',
      country: shippingDetails?.address?.country || billingDetails.address?.country || '',
    };

    const effectiveVatNumber = vatNumber ?? session.vatNumber;

    const wcOrderPayload: Record<string, unknown> = {
      payment_method: paymentMethod,
      payment_method_title: meta.methodTitle,
      set_paid: meta.setPaid,
      status: meta.orderStatus,
      ...(transactionId ? { transaction_id: transactionId } : {}),
      customer_id: resolvedCustomerId || 0,
      billing,
      shipping,
      line_items: buildWooOrderLineItems(session.quote.lines, session.quote.discount),
      shipping_lines:
        paymentMethod === 'free'
          ? [
              {
                method_id: 'free_shipping',
                method_title: session.quote.shipping.label || 'Free Shipping',
                total: '0.00',
              },
            ]
          : [
              {
                method_id: 'flat_rate',
                method_title: session.quote.shipping.label,
                total: String(session.quote.shipping.cost),
              },
            ],
      ...(paymentMethod === 'free' ? { total: '0.00' } : {}),
      ...(session.quote.couponCode
        ? {
            coupon_lines: [
              {
                code: session.quote.couponCode,
                discount: String(session.quote.discount),
              },
            ],
          }
        : {}),
      meta_data: [
        { key: '_wc_order_attribution_source_type', value: 'typein' },
        { key: '_wc_order_attribution_utm_source', value: '(direct)' },
        ...extraMeta,
        ...(effectiveVatNumber ? [{ key: 'VAT Number', value: effectiveVatNumber }] : []),
      ],
    };

    const orderRes = await woocommerceApi.request<{
      id?: number;
      order_key?: string;
      number?: string;
    }>('orders', {
      method: 'POST',
      body: wcOrderPayload,
      timeoutMs: 45000,
    });

    const createdOrderId = orderRes?.id;
    const createdOrderKey = orderRes?.order_key;

    if (!createdOrderId || !createdOrderKey) {
      throw new Error('WooCommerce order creation returned incomplete order details.');
    }

    await updateCheckoutSession(sessionId, {
      status: 'completed',
      orderId: createdOrderId,
      orderKey: createdOrderKey,
    }).catch((err) => console.error('Failed to update session with order details:', err));

    if (resolvedCustomerId) {
      const syncCustomer = async () => {
        try {
          await woocommerceApi.request(`customers/${resolvedCustomerId}`, {
            method: 'PUT',
            body: { billing, shipping },
            timeoutMs: 15000,
          });
          await invalidateCustomerOrdersCache(resolvedCustomerId);
        } catch (err) {
          console.error('Failed to update customer addresses:', err);
        }
      };

      if (awaitCustomerSync) {
        await syncCustomer();
      } else {
        syncCustomer().catch((err) => console.error('Background customer address update error:', err));
      }
    }

    return {
      status: 'created',
      orderId: createdOrderId,
      orderKey: createdOrderKey,
      orderNumber: orderRes?.number,
      quoteLines: session.quote.lines,
    };
  } finally {
    await releaseCheckoutOrderLock(sessionId);
  }
}
