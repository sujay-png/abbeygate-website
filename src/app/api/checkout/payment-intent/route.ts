import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe/client';
import { getCheckoutSession } from '@/features/checkout/services/session';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required.' }, { status: 400 });
    }

    const session = await getCheckoutSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: 'Checkout session expired or was not found.' }, { status: 404 });
    }

    const stripe = getStripeClient();
    
    // We update or create a PaymentIntent for the session's total
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(session.quote.total * 100), // Stripe expects amount in smallest currency unit (pence)
      currency: session.quote.currency.toLowerCase(),
      metadata: {
        checkoutSessionId: session.id
      }
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create payment intent.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
