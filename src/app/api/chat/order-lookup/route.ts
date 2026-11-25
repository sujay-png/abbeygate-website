import { NextRequest, NextResponse } from 'next/server';
import { woocommerceApi } from '@/lib/woocommerce/client';
import { getSession } from '@/features/auth/utils/session';
import { enquiryRateLimit } from '@/lib/rate-limit';
import type { WooCommerceOrderDetail } from '@/features/account/services/orders';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/order-lookup?orderId=10452
 * Looks up order details (specifically line items) for chat ticket creation.
 * Requires either an authenticated session owning the order or a matching billing email.
 */
export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { success } = await enquiryRateLimit.limit(`chat-order-lookup:${ip}`);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const rawOrderId = searchParams.get('orderId');
    const providedEmail = searchParams.get('email')?.trim().toLowerCase() || '';

    if (!rawOrderId) {
      return NextResponse.json({ success: false, error: 'Missing order ID' }, { status: 400 });
    }

    const cleanId = rawOrderId.replace(/\D/g, '');
    if (!cleanId) {
      return NextResponse.json({ success: false, error: 'Invalid order number format' }, { status: 400 });
    }

    const session = await getSession();
    if (!session?.userId && !providedEmail) {
      return NextResponse.json(
        { success: false, error: 'Please verify your billing email to look up order items.' },
        { status: 401 }
      );
    }

    const orderId = parseInt(cleanId, 10);
    const order = await woocommerceApi.request<WooCommerceOrderDetail & { customer_id?: number }>(
      `/orders/${orderId}`,
      { revalidate: false }
    );

    if (!order || !order.id) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const orderEmail = order.billing?.email?.trim().toLowerCase() || '';
    const sessionOwnsOrder = Boolean(
      session?.userId &&
      (Number(order.customer_id) === Number(session.userId) ||
        (session.email && orderEmail === session.email.toLowerCase()))
    );
    const guestEmailMatches = Boolean(providedEmail && orderEmail && providedEmail === orderEmail);

    if (!sessionOwnsOrder && !guestEmailMatches) {
      return NextResponse.json(
        { success: false, error: 'Could not verify ownership of this order.' },
        { status: 403 }
      );
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
