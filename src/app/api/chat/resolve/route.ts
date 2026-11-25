import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/features/auth/utils/session';
import { checkoutRateLimit } from '@/lib/rate-limit';
import {
  getHeadlessStoreUrl,
  getRequiredHeadlessSecret,
  verifyTicketToken,
} from '@/features/chat/utils/ticket-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { success } = await checkoutRateLimit.limit(`chat-resolve:${ip}`);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 });
    }

    const { ticketId, ticketToken } = await req.json();

    if (!ticketId || !/^\d+$/.test(String(ticketId))) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid ticket ID' },
        { status: 400 }
      );
    }

    const session = await getSession();
    const userId = session?.userId ? Number(session.userId) : 0;
    if (!userId && !verifyTicketToken(ticketId, ticketToken)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const storeUrl = getHeadlessStoreUrl();
    const res = await fetch(`${storeUrl}/wp-json/headless/v1/tickets/${ticketId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-headless-secret': getRequiredHeadlessSecret(),
      },
      body: JSON.stringify({
        customer_id: userId,
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
