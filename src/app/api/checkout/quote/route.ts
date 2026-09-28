import { NextRequest, NextResponse } from 'next/server';
import { checkoutRateLimit } from '@/lib/rate-limit';
import { createCheckoutQuote } from '@/features/checkout/services/quote';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const { success } = await checkoutRateLimit.limit(ip);
  if (!success) return NextResponse.json({ error: 'Too many quote requests. Please try again shortly.' }, { status: 429 });

  try {
    const quote = await createCheckoutQuote(await request.json());
    return NextResponse.json(quote, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to prepare checkout.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
