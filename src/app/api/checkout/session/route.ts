import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutQuote } from '@/features/checkout/services/quote';
import { createCheckoutSession, getCheckoutSession, updateCheckoutSession } from '@/features/checkout/services/session';
import { checkoutRateLimit } from '@/lib/rate-limit';
import { getSession } from '@/features/auth/utils/session';
import { getWooStoreUrl } from '@/lib/woocommerce/config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const { success } = await checkoutRateLimit.limit(ip);
  if (!success) return NextResponse.json({ error: 'Too many checkout requests. Please try again shortly.' }, { status: 429 });

  try {
    const authSession = await getSession();
    const customerId = authSession?.userId || 0;
    
    const quote = await createCheckoutQuote(await request.json());
    const session = await createCheckoutSession(quote, customerId);
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

function isAllowedMediaUrl(value: unknown, allowedHost: string): value is string {
  if (typeof value !== 'string' || !value) return false;
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.hostname === allowedHost;
  } catch {
    return false;
  }
}

export async function PATCH(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const { success } = await checkoutRateLimit.limit(`patch:${ip}`);
  if (!success) return NextResponse.json({ error: 'Too many checkout requests. Please try again shortly.' }, { status: 429 });

  try {
    const body = await request.json();
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : '';
    const files = body?.files && typeof body.files === 'object' ? (body.files as Record<string, unknown>) : null;
    if (!sessionId || !files) {
      return NextResponse.json({ error: 'sessionId and files are required.' }, { status: 400 });
    }

    const session = await getCheckoutSession(sessionId);
    if (!session) return NextResponse.json({ error: 'Checkout session expired or was not found.' }, { status: 404 });
    if (session.status !== 'quoted') {
      return NextResponse.json({ error: 'Checkout session can no longer be updated.' }, { status: 409 });
    }

    const allowedHost = new URL(getWooStoreUrl()).hostname;
    const sanitizedFiles: Record<string, string> = {};
    for (const [key, value] of Object.entries(files)) {
      if (/^(logo|preview)_\d{1,3}$/.test(key) && isAllowedMediaUrl(value, allowedHost)) {
        sanitizedFiles[key] = value;
      }
    }

    const updatedLines = session.quote.lines.map((line, index) => {
      if (!line.customization) return line;
      const logoUrl = sanitizedFiles[`logo_${index}`] || line.customization.logoUrl;
      const previewUrl = sanitizedFiles[`preview_${index}`] || line.customization.previewUrl;
      return {
        ...line,
        customization: {
          ...line.customization,
          logoUrl,
          previewUrl,
        },
      };
    });

    const updated = await updateCheckoutSession(sessionId, {
      quote: { ...session.quote, lines: updatedLines },
    });
    if (!updated) return NextResponse.json({ error: 'Checkout session not found.' }, { status: 404 });

    return NextResponse.json({ id: updated.id, quote: updated.quote }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to attach artwork to checkout session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
