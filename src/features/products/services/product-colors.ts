import { getAllRestProducts } from "./store-products";
import { parseHexValue, isBicolorProduct } from "../utils/color-helpers";

/**
 * Fetches hex values added in WordPress product meta_data (key: 'hex_value')
 * for the specified product IDs, reusing the cached catalog REST meta list so
 * product pages and builds never burst individual WooCommerce REST requests.
 */
export async function getProductHexValues(
  productIds: (number | string)[]
): Promise<Record<string, string>> {
  if (!productIds || productIds.length === 0) return {};

  try {
    const uniqueIds = new Set(productIds.map(String).filter(Boolean));
    if (uniqueIds.size === 0) return {};

    const products = await getAllRestProducts();
    const map: Record<string, string> = {};
    for (const p of products) {
      if (!uniqueIds.has(String(p.id))) continue;
      const hexMeta = p.meta_data?.find((m) => m.key === 'hex_value');
      if (hexMeta && typeof hexMeta.value === 'string') {
        const isBicolor = isBicolorProduct(p.name);
        const parsed = parseHexValue(hexMeta.value, isBicolor);
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
