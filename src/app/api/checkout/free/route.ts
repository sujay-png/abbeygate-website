import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/features/auth/utils/session';
import { createOrderFromSession } from '@/features/checkout/services/order';
import { checkoutRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { success } = await checkoutRateLimit.limit(`free:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }

    const body = await req.json();
    const { sessionId, billingDetails, shippingDetails, vatNumber } = body;

    if (!sessionId || !billingDetails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const authSession = await getSession();
    const result = await createOrderFromSession({
      sessionId,
      paymentMethod: 'free',
      billingDetails,
      shippingDetails,
      vatNumber,
      authUserId: authSession?.userId,
    });

    if (result.status === 'not_found') {
      return NextResponse.json({ error: 'Checkout session expired or was not found' }, { status: 404 });
    }
    if (result.status === 'requires_payment') {
      return NextResponse.json({ error: 'Order requires payment. Total is greater than zero.' }, { status: 400 });
    }
    if (result.status === 'locked') {
      if (result.orderId && result.orderKey) {
        return NextResponse.json({ success: true, orderId: result.orderId, orderKey: result.orderKey });
      }
      return NextResponse.json({ error: 'Order submission is already in progress. Please wait.' }, { status: 409 });
    }

    return NextResponse.json({ success: true, orderId: result.orderId, orderKey: result.orderKey });
  } catch (error: any) {
    console.error('Failed to create free order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
