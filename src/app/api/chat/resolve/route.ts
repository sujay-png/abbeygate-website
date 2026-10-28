import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getStoreUrl(): string {
  return (
    process.env.WOOCOMMERCE_STORE_URL ||
    process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL ||
    'https://dashboard.abbeygate-england.com'
  ).replace(/\/$/, '');
}

function getHeadlessSecret(): string {
  return (
    process.env.WP_HEADLESS_SECRET ||
    'a9718d4e0887ce1bc851ad90b0b4a39742623ce5eb94faf28a5bfe8abc584eb3'
  );
}

export async function POST(req: NextRequest) {
  try {
    const { ticketId } = await req.json();

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: 'Missing ticket ID' },
        { status: 400 }
      );
    }

    const storeUrl = getStoreUrl();
    const res = await fetch(`${storeUrl}/wp-json/headless/v1/tickets/${ticketId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': getHeadlessSecret(),
      },
      body: JSON.stringify({
        customer_id: 0,
      }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Failed to resolve chat ticket:', error);
    return NextResponse.json({ success: true });
  }
}
