import { NextRequest, NextResponse } from 'next/server';
import { woocommerceApi } from '@/lib/woocommerce/client';
import { getSession } from '@/features/auth/utils/session';
import type { WooCommerceOrderDetail } from '@/features/account/services/orders';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/order-lookup?orderId=10452
 * Looks up order details (specifically line items) for chat ticket creation.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawOrderId = searchParams.get('orderId');

    if (!rawOrderId) {
      return NextResponse.json({ success: false, error: 'Missing order ID' }, { status: 400 });
    }

    const cleanId = rawOrderId.replace(/\D/g, '');
    if (!cleanId) {
      return NextResponse.json({ success: false, error: 'Invalid order number format' }, { status: 400 });
    }

    const orderId = parseInt(cleanId, 10);
    const order = await woocommerceApi.request<WooCommerceOrderDetail>(`/orders/${orderId}`);

    if (!order || !order.id) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Return safe public fields for the chat picker
    const safeOrder = {
      id: order.id,
      number: String(order.number || order.id),
      date_created: order.date_created,
      status: order.status,
      total: order.total,
      line_items: (order.line_items || []).map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
      })),
    };

    return NextResponse.json({ success: true, order: safeOrder });
  } catch (error: any) {
    console.warn('Order lookup error:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Could not find order. Please verify your order number.' },
      { status: 404 }
    );
  }
}
