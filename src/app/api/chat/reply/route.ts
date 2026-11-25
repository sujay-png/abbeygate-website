import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/features/auth/utils/session';
import { checkoutRateLimit } from '@/lib/rate-limit';
import {
  getHeadlessStoreUrl,
  getRequiredHeadlessSecret,
  verifyTicketToken,
} from '@/features/chat/utils/ticket-auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/chat/reply
 * Appends a customer follow-up message to an existing ticket from the chat widget.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { success } = await checkoutRateLimit.limit(`chat-reply:${ip}`);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again shortly.' }, { status: 429 });
    }

    const body = await req.json();
    const session = await getSession();

    const { ticket_id, message, ticket_token } = body;

    if (!ticket_id || !/^\d+$/.test(String(ticket_id))) {
      return NextResponse.json({ success: false, error: 'Missing or invalid ticket ID.' }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'Reply message cannot be empty.' }, { status: 400 });
    }

    const userId = session?.userId ? Number(session.userId) : 0;
    const hasValidToken = verifyTicketToken(ticket_id, ticket_token);
    if (!userId && !hasValidToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized ticket access.' }, { status: 401 });
    }

    const storeUrl = getHeadlessStoreUrl();

    const res = await fetch(`${storeUrl}/wp-json/headless/v1/tickets/${ticket_id}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': getRequiredHeadlessSecret(),
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
