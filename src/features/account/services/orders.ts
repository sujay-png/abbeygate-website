import { woocommerceApi } from '@/lib/woocommerce/client';
import { getRedisClient } from '@/lib/redis';

export type WooCommerceOrder = {
  id: number;
  number: string;
  date_created: string;
  status: string;
  total: string;
  currency: string;
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
  }>;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
  };
};

export type WooCommerceOrderDetail = Omit<WooCommerceOrder, 'line_items' | 'billing'> & {
  discount_total: string;
  customer_note?: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
    email: string;
    phone?: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company?: string;
    address_1: string;
    address_2?: string;
    city: string;
    state?: string;
    postcode: string;
    country: string;
  };
  shipping_total: string;
  payment_method_title: string;
  total_tax?: string;
  shipping_tax?: string;
  shipping_lines?: Array<{
    id: number;
    method_title: string;
    total: string;
    total_tax: string;
  }>;
  fee_lines?: Array<{
    id: number;
    name: string;
    total: string;
    total_tax: string;
  }>;
  coupon_lines?: Array<{
    code: string;
    discount: string;
  }>;
  line_items: Array<{
    id: number;
    product_id?: number;
    name: string;
    quantity: number;
    subtotal: string;
    total: string;
    total_tax?: string;
    sku?: string;
    price?: number;
    meta_data?: Array<{ key: string; value: any }>;
  }>;
};

const getOrdersCacheKey = (userId: number | string) => `user:${userId}:orders`;
const getOrderDetailCacheKey = (orderId: number | string) => `order:${orderId}`;

/**
 * Look up a customer/user ID by email in WooCommerce / WordPress.
 */
export async function findCustomerIdByEmail(email: string): Promise<number> {
  if (!email || !email.includes('@')) return 0;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Try WooCommerce customers API
  try {
    const customers = await woocommerceApi.request<Array<{ id: number; email: string }>>(
      `/customers?email=${encodeURIComponent(cleanEmail)}`,
      { revalidate: false }
    );
    if (Array.isArray(customers) && customers.length > 0 && customers[0].id) {
      return customers[0].id;
    }
  } catch (err) {
    console.warn('Customer lookup error via WC customers API:', err);
  }

  // 2. Try WordPress users API (supports admins, B2B users, etc.)
  try {
    const storeUrl = process.env.WOOCOMMERCE_STORE_URL || 'https://dashboard.abbeygate-england.com';
    const wpUser = process.env.WP_APPLICATION_USERNAME;
    const wpPass = process.env.WP_APPLICATION_PASSWORD;
    if (wpUser && wpPass) {
      const auth = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');
      const res = await fetch(`${storeUrl}/wp-json/wp/v2/users?search=${encodeURIComponent(cleanEmail)}`, {
        headers: { Authorization: `Basic ${auth}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const users = await res.json();
        if (Array.isArray(users) && users.length > 0) {
          const match = users.find((u: any) =>
            u.slug === cleanEmail.split('@')[0] ||
            (u.email && u.email.toLowerCase() === cleanEmail) ||
            true
          );
          if (match?.id) return match.id;
        }
      }
    }
  } catch (err) {
    console.warn('User lookup error via WP users API:', err);
  }

  return 0;
}

/**
 * Fetch a customer's orders with Redis cache.
 * Looks up by customer ID and customer email to ensure all orders (including guest/pre-registration orders)
 * appear immediately in their account. Automatically links any guest orders to their account.
 */
export async function getCustomerOrders(
  userId: number | string,
  email?: string
): Promise<WooCommerceOrder[]> {
  const redis = getRedisClient();
  const cacheKey = getOrdersCacheKey(userId);

  // 1. Check Redis cache first (~5ms)
  if (redis) {
    try {
      const cached = await redis.get<WooCommerceOrder[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
    } catch (err) {
      console.warn('Redis read error for customer orders:', err);
    }
  }

  // 2. Cache Miss: Fetch from WooCommerce orders API
  try {
    const orderMap = new Map<number, WooCommerceOrder>();

    // 2a. Fetch by customer ID (bypass Next.js data cache to get fresh state)
    try {
      const customerOrders = await woocommerceApi.request<WooCommerceOrder[]>(
        `/orders?customer=${userId}&per_page=50`,
        { revalidate: 0 }
      );
      if (Array.isArray(customerOrders)) {
        for (const order of customerOrders) {
          orderMap.set(order.id, order);
        }
      }
    } catch (err) {
      console.warn(`Failed fetching orders for customer ${userId}:`, err);
    }

    // 2b. If email is provided, also search for orders placed with this email (e.g. guest or pre-registration)
    if (email && email.includes('@')) {
      const cleanEmail = email.trim().toLowerCase();
      try {
        const emailOrders = await woocommerceApi.request<any[]>(
          `/orders?search=${encodeURIComponent(cleanEmail)}&per_page=50`,
          { revalidate: 0 }
        );

        if (Array.isArray(emailOrders)) {
          for (const rawOrder of emailOrders) {
            const billingEmail = rawOrder.billing?.email?.toLowerCase();
            if (billingEmail === cleanEmail) {
              if (!orderMap.has(rawOrder.id)) {
                orderMap.set(rawOrder.id, rawOrder);
              }

              // Auto-link guest order to this customer ID in the background if currently unassigned
              if (!rawOrder.customer_id || Number(rawOrder.customer_id) === 0) {
                woocommerceApi
                  .request(`orders/${rawOrder.id}`, {
                    method: 'PUT',
                    body: { customer_id: Number(userId) },
                  })
                  .catch((linkErr) => {
                    console.warn(`Failed to auto-link order ${rawOrder.id} to user ${userId}:`, linkErr);
                  });
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Failed searching orders by email ${email}:`, err);
      }
    }

    // Sort descending by date (latest orders first)
    const allOrders = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
    );

    // 3. Populate Redis cache (short 60s TTL so newly placed orders reflect swiftly)
    if (redis && allOrders.length > 0) {
      try {
        await redis.set(cacheKey, allOrders, { ex: 60 });
      } catch (err) {
        console.warn('Redis write error for customer orders:', err);
      }
    }

    return allOrders;
  } catch (error) {
    console.error('Failed to fetch orders from WooCommerce:', error);
    return [];
  }
}


/**
 * Fetch single order details with Redis cache (~5ms response).
 */
export async function getOrderDetail(orderId: number | string): Promise<WooCommerceOrderDetail | null> {
  const redis = getRedisClient();
  const cacheKey = getOrderDetailCacheKey(orderId);

  // 1. Check Redis cache first
  if (redis) {
    try {
      const cached = await redis.get<WooCommerceOrderDetail>(cacheKey);
      if (cached && typeof cached === 'object' && cached.id) {
        return cached;
      }
    } catch (err) {
      console.warn('Redis read error for order detail:', err);
    }
  }

  // 2. Cache Miss: Fetch from WooCommerce single order API
  try {
    const order = await woocommerceApi.request<WooCommerceOrderDetail>(`/orders/${orderId}`);

    // 3. Populate Redis cache
    if (redis && order && order.id) {
      try {
        await redis.set(cacheKey, order, { ex: 1800 }); // 30 minutes TTL
      } catch (err) {
        console.warn('Redis write error for order detail:', err);
      }
    }

    return order || null;
  } catch (error) {
    console.error(`Failed to fetch order ${orderId} from WooCommerce:`, error);
    return null;
  }
}

/**
 * Invalidate a customer's cached orders list.
 */
export async function invalidateCustomerOrdersCache(userId: number | string): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.del(getOrdersCacheKey(userId));
    } catch (err) {
      console.warn('Redis invalidation error for customer orders:', err);
    }
  }
}
