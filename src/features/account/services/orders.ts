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
 * Fetch a customer's orders with Redis cache (~5ms response).
 * Caches for 10 minutes, automatically invalidated on checkout.
 */
export async function getCustomerOrders(userId: number | string): Promise<WooCommerceOrder[]> {
  const redis = getRedisClient();
  const cacheKey = getOrdersCacheKey(userId);

  // 1. Check Redis cache first (~5ms)
  if (redis) {
    try {
      const cached = await redis.get<WooCommerceOrder[]>(cacheKey);
      if (cached && Array.isArray(cached)) {
        return cached;
      }
    } catch (err) {
      console.warn('Redis read error for customer orders:', err);
    }
  }

  // 2. Cache Miss: Fetch from WooCommerce orders API
  try {
    const orders = await woocommerceApi.request<WooCommerceOrder[]>(`/orders?customer=${userId}`, {
      revalidate: 60,
    });

    const safeOrders = Array.isArray(orders) ? orders : [];

    // 3. Populate Redis cache
    if (redis && safeOrders.length > 0) {
      try {
        await redis.set(cacheKey, safeOrders, { ex: 600 }); // 10 minutes TTL
      } catch (err) {
        console.warn('Redis write error for customer orders:', err);
      }
    }

    return safeOrders;
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
