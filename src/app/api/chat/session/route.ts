import { NextResponse } from 'next/server';
import { getSession } from '@/features/auth/utils/session';
import { getCustomerOrders, type WooCommerceOrder } from '@/features/account/services/orders';
import { getAccountDetails } from '@/features/account/services/customer';
import { woocommerceApi } from '@/lib/woocommerce/client';

export const dynamic = 'force-dynamic';

function sanitizeOrder(o: any): WooCommerceOrder {
  return {
    id: o.id,
    number: String(o.number || o.id),
    date_created: o.date_created || '',
    status: o.status || 'processing',
    total: String(o.total || '0'),
    currency: o.currency || 'GBP',
    line_items: Array.isArray(o.line_items)
      ? o.line_items.map((item: any) => ({
          id: item.id,
          name: item.name || 'Product',
          quantity: item.quantity || 1,
        }))
      : [],
    billing: {
      first_name: o.billing?.first_name || '',
      last_name: o.billing?.last_name || '',
      email: o.billing?.email || '',
    },
  };
}

export async function GET() {
  try {
    const session = await getSession();

    // 1. If user is logged in, prioritize their account orders
    if (session && session.userId) {
      const [details, accountOrders] = await Promise.all([
        getAccountDetails(Number(session.userId)).catch(() => null),
        getCustomerOrders(session.userId).catch(() => []),
      ]);

      const firstName = details?.first_name || '';
      const lastName = details?.last_name || '';
      const fullName =
        `${firstName} ${lastName}`.trim() ||
        details?.display_name ||
        session.email.split('@')[0];

      let combinedOrders: WooCommerceOrder[] = Array.isArray(accountOrders)
        ? accountOrders.map(sanitizeOrder)
        : [];

      // Also check if any guest orders were placed with this email
      if (session.email) {
        try {
          const emailOrders = await woocommerceApi.request<any[]>(
            `/orders?search=${encodeURIComponent(session.email)}&per_page=10`,
            { revalidate: 30 }
          );
          if (Array.isArray(emailOrders)) {
            const existingIds = new Set(combinedOrders.map((o) => o.id));
            for (const eo of emailOrders) {
              if (!existingIds.has(eo.id)) {
                combinedOrders.push(sanitizeOrder(eo));
                existingIds.add(eo.id);
              }
            }
          }
        } catch {
          // Ignore search error
        }
      }

      // If user has no previous orders, fetch recent store orders so they can still see options in testing
      if (combinedOrders.length === 0) {
        try {
          const recent = await woocommerceApi.request<any[]>(
            '/orders?per_page=10&orderby=date&order=desc',
            { revalidate: 30 }
          );
          if (Array.isArray(recent)) {
            combinedOrders = recent.map(sanitizeOrder);
          }
        } catch {
          // Ignore
        }
      }

      // Sort with latest at first
      combinedOrders.sort(
        (a, b) =>
          new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
      );

      return NextResponse.json({
        isLoggedIn: true,
        user: {
          id: session.userId,
          email: session.email,
          name: fullName,
        },
        orders: combinedOrders,
      });
    }

    // 2. Guest user (or tester not yet logged in)
    // Fetch recent store orders so they can easily pick their recent order ID with latest first
    let guestOrders: WooCommerceOrder[] = [];
    try {
      const recent = await woocommerceApi.request<any[]>(
        '/orders?per_page=15&orderby=date&order=desc',
        { revalidate: 30 }
      );
      if (Array.isArray(recent)) {
        guestOrders = recent.map(sanitizeOrder);
      }
    } catch (err) {
      console.warn('Failed to fetch recent orders for guest chat:', err);
    }

    guestOrders.sort(
      (a, b) =>
        new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
    );

    return NextResponse.json({
      isLoggedIn: false,
      user: null,
      orders: guestOrders,
    });
  } catch (error: any) {
    console.error('Chat session error:', error);
    return NextResponse.json(
      { isLoggedIn: false, user: null, orders: [] },
      { status: 200 }
    );
  }
}
