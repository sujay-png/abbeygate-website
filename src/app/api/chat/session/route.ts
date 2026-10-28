import { NextResponse } from 'next/server';
import { getSession } from '@/features/auth/utils/session';
import { getCustomerOrders } from '@/features/account/services/orders';
import { getAccountDetails } from '@/features/account/services/customer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json({
        isLoggedIn: false,
        user: null,
        orders: [],
      });
    }

    // Fetch account details and orders concurrently
    const [details, orders] = await Promise.all([
      getAccountDetails(Number(session.userId)).catch(() => null),
      getCustomerOrders(session.userId).catch(() => []),
    ]);

    const firstName = details?.first_name || '';
    const lastName = details?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || details?.display_name || session.email.split('@')[0];

    return NextResponse.json({
      isLoggedIn: true,
      user: {
        id: session.userId,
        email: session.email,
        name: fullName,
      },
      orders: orders || [],
    });
  } catch (error: any) {
    console.error('Chat session error:', error);
    return NextResponse.json(
      { isLoggedIn: false, user: null, orders: [] },
      { status: 200 }
    );
  }
}
