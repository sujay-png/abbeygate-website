import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutQuote } from '@/features/checkout/services/quote';
import { createCheckoutSession, getCheckoutSession } from '@/features/checkout/services/session';
import { checkoutRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const { success } = await checkoutRateLimit.limit(ip);
  if (!success) return NextResponse.json({ error: 'Too many checkout requests. Please try again shortly.' }, { status: 429 });

  try {
    const quote = await createCheckoutQuote(await request.json());
    const session = await createCheckoutSession(quote);
    return NextResponse.json({ id: session.id, quote: session.quote }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start checkout.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'A checkout session id is required.' }, { status: 400 });

  try {
    const session = await getCheckoutSession(id);
    if (!session) return NextResponse.json({ error: 'Checkout session expired or was not found.' }, { status: 404 });
    return NextResponse.json({ id: session.id, quote: session.quote, status: session.status }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load checkout session.';
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
