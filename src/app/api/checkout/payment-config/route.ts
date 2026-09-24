import { NextResponse } from 'next/server';
import { getStripePublishableKey } from '@/lib/stripe/client';

export const dynamic = 'force-dynamic';

/** Returns only the browser-safe Stripe key; server secrets never leave this route. */
export async function GET() {
  const publishableKey = getStripePublishableKey();

  return NextResponse.json({
    stripeEnabled: Boolean(publishableKey),
    publishableKey,
  });
}
