import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import { getCheckoutSession, updateCheckoutSession } from '@/features/checkout/services/session';
import { buildStripePrePaymentInfo } from '@/features/checkout/utils/stripe-order-metadata';
import { checkoutRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { success } = await checkoutRateLimit.limit(`payment-intent:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }

    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    const session = await getCheckoutSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Checkout session expired or was not found.' }, { status: 404 });
    }

    if (session.status === 'completed' || session.orderId) {
      return NextResponse.json({ error: 'Checkout session has already been completed.' }, { status: 409 });
    }

    if (session.quote.total <= 0) {
      return NextResponse.json({ error: 'Order total is zero. Payment is not required.' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const expectedAmount = Math.round(session.quote.total * 100);
    const expectedCurrency = session.quote.currency.toLowerCase();

    // Reuse an existing usable PaymentIntent bound to this checkout session to avoid orphans.
    if (session.paymentIntentId) {
      try {
        const existingIntent = await stripe.paymentIntents.retrieve(session.paymentIntentId);
        const reusableStatuses = new Set([
          'requires_payment_method',
          'requires_confirmation',
          'requires_action',
        ]);
        if (
          reusableStatuses.has(existingIntent.status) &&
          existingIntent.amount === expectedAmount &&
          existingIntent.currency === expectedCurrency &&
          existingIntent.client_secret
        ) {
          return NextResponse.json({ clientSecret: existingIntent.client_secret });
        }
      } catch {
        // If retrieval fails, create a fresh PaymentIntent below.
      }
    }

    const prePaymentInfo = buildStripePrePaymentInfo(session.id, session.quote.lines);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: expectedAmount, // Stripe expects amount in smallest currency unit (pence)
      currency: expectedCurrency,
      description: prePaymentInfo.description,
      metadata: prePaymentInfo.metadata,
    });

    await updateCheckoutSession(session.id, { paymentIntentId: paymentIntent.id });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create payment intent.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
