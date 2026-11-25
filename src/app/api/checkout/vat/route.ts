import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutSession, updateCheckoutSession } from '@/features/checkout/services/session';
import { checkoutRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { success } = await checkoutRateLimit.limit(`vat:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { sessionId, vatNumber } = await req.json();

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const cleanVat = typeof vatNumber === 'string' ? vatNumber.trim().toUpperCase().replace(/\s+/g, '') : '';
    if (cleanVat && !/^[A-Z0-9-]{5,20}$/.test(cleanVat)) {
      return NextResponse.json({ error: 'Invalid VAT number format' }, { status: 400 });
    }

    const existing = await getCheckoutSession(sessionId);
    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (existing.status === 'completed' || existing.orderId) {
      return NextResponse.json({ error: 'Checkout session is already completed' }, { status: 409 });
    }

    await updateCheckoutSession(sessionId, { vatNumber: cleanVat || undefined });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
