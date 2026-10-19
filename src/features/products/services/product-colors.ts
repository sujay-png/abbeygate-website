import { woocommerceApi } from "@/lib/woocommerce/client";
import { parseHexValue } from "../utils/color-helpers";

type ProductMetaItem = {
  id: number;
  meta_data?: Array<{ key: string; value: unknown }>;
};

/**
 * Fetches hex values added in WordPress product meta_data (key: 'hex_value')
 * for the specified product IDs.
 *
 * Cached with Next.js ISR revalidation (1 hour) to ensure fast page loads.
 */
export async function getProductHexValues(
  productIds: (number | string)[]
): Promise<Record<string, string>> {
  if (!productIds || productIds.length === 0) return {};

  try {
    const uniqueIds = Array.from(new Set(productIds.map(String))).filter(Boolean);
    if (uniqueIds.length === 0) return {};

    const products = await woocommerceApi.request<ProductMetaItem[]>(
      `/products?include=${uniqueIds.join(',')}&_fields=id,meta_data`,
      { revalidate: 60, tags: ['products', 'colors'] }
    );

    const map: Record<string, string> = {};
    for (const p of products || []) {
      const hexMeta = p.meta_data?.find((m) => m.key === 'hex_value');
      if (hexMeta && typeof hexMeta.value === 'string') {
        const parsed = parseHexValue(hexMeta.value);
        if (parsed) {
          map[String(p.id)] = parsed;
        }
      }
    }
    return map;
  } catch (err) {
    console.warn('Failed to fetch hex values from WooCommerce:', err);
    return {};
  }
}
