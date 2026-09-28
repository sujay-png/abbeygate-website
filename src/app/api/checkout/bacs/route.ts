import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSession } from '@/features/checkout/services/session';
import { woocommerceApi } from '@/lib/woocommerce/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, billingDetails, shippingDetails } = body;

    if (!sessionId || !billingDetails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await getCheckoutSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Checkout session expired or was not found' }, { status: 404 });
    }

    const nameParts = billingDetails.name?.split(' ') || [];
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || '';

    const shippingNameParts = shippingDetails?.name?.split(' ') || [];
    const shippingFirstName = shippingNameParts[0] || firstName;
    const shippingLastName = shippingNameParts.slice(1).join(' ') || lastName;

    const wcOrderPayload = {
      payment_method: 'bacs',
      payment_method_title: 'Direct bank transfer',
      set_paid: false,
      status: 'on-hold', // BACS orders start on-hold awaiting manual bank transfer
      customer_id: session.customerId || 0,
      billing: {
        first_name: firstName,
        last_name: lastName,
        address_1: billingDetails.address?.line1 || '',
        address_2: billingDetails.address?.line2 || '',
        city: billingDetails.address?.city || '',
        postcode: billingDetails.address?.postal_code || '',
        country: billingDetails.address?.country || '',
        email: billingDetails.email || '',
      },
      shipping: {
        first_name: shippingFirstName,
        last_name: shippingLastName,
        address_1: shippingDetails?.address?.line1 || billingDetails.address?.line1 || '',
        address_2: shippingDetails?.address?.line2 || billingDetails.address?.line2 || '',
        city: shippingDetails?.address?.city || billingDetails.address?.city || '',
        postcode: shippingDetails?.address?.postal_code || billingDetails.address?.postal_code || '',
        country: shippingDetails?.address?.country || billingDetails.address?.country || '',
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

    const orderRes = await woocommerceApi.request('orders', {
      method: 'POST',
      body: wcOrderPayload
    });

    if (session.customerId) {
      try {
        await woocommerceApi.request(`customers/${session.customerId}`, {
          method: 'PUT',
          body: {
            billing: wcOrderPayload.billing,
            shipping: wcOrderPayload.shipping,
          }
        });
      } catch (err) {
        console.error('Failed to update customer addresses:', err);
      }
    }

    return NextResponse.json({ success: true, orderId: (orderRes as any).id });
  } catch (error: any) {
    console.error('Failed to create BACS order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
