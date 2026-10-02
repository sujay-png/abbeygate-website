import { NextRequest, NextResponse } from 'next/server';
import { updateCheckoutSession } from '@/features/checkout/services/session';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, vatNumber } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const session = await updateCheckoutSession(sessionId, { vatNumber });
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
