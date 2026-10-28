import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/features/auth/utils/session';

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

/**
 * POST /api/chat/reply
 * Appends a customer follow-up message to an existing ticket from the chat widget.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getSession();

    const { ticket_id, message } = body;

    if (!ticket_id) {
      return NextResponse.json({ success: false, error: 'Missing ticket ID.' }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Reply message cannot be empty.' }, { status: 400 });
    }

    const userId = session?.userId ? Number(session.userId) : 0;
    const storeUrl = getStoreUrl();

    const res = await fetch(`${storeUrl}/wp-json/headless/v1/tickets/${ticket_id}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': getHeadlessSecret(),
      },
      body: JSON.stringify({
        customer_id: userId,
        message: message.trim(),
      }),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: data?.message || 'Failed to send reply.' },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Chat reply error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
