import { getAllStoreProducts, getRestProductMeta } from './store-products';
import { getProductLowestPriceMap } from './pricing';
import { getRecommendedProducts } from '../utils/recommendations';
import type { StoreProduct } from '../types/store-product';

export type RecommendationQuery = {
  currentProduct?: StoreProduct;
  currentProductId?: number;
  currentProductName?: string;
  currentColor?: string;
  manualOverrideIds?: number[];
};

/**
 * Reads manual PDP recommendation overrides from WooCommerce Linked Products
 * (`upsell_ids` first, then `cross_sell_ids`) via cached REST metadata.
 */
export async function resolveManualOverrideIds(productId: number): Promise<number[]> {
  try {
    const restProduct = await getRestProductMeta(productId);
    if (!restProduct) return [];
    const combined = [
      ...(Array.isArray(restProduct.upsell_ids) ? restProduct.upsell_ids : []),
      ...(Array.isArray(restProduct.cross_sell_ids) ? restProduct.cross_sell_ids : []),
    ];
    return Array.from(new Set(combined.filter((id) => Number.isInteger(id) && id > 0)));
  } catch {
    return [];
  }
}

/**
 * Shared server recommendation pipeline used by both SSR (`RelatedProducts`) and
 * interactive swatch changes (`getRelatedProductsAction`).
 */
export async function getRecommendedProductsForProduct({
  currentProduct,
  currentProductId,
  currentProductName,
  currentColor,
  manualOverrideIds,
}: RecommendationQuery): Promise<StoreProduct[]> {
  const catalog = await getAllStoreProducts();
  const resolvedCurrent =
    currentProduct ||
    (currentProductId !== undefined ? catalog.find((p) => p.id === currentProductId) : undefined) ||
    (currentProductId !== undefined || currentProductName
      ? ({
          id: currentProductId ?? 0,
          name: currentProductName ?? '',
          slug: '',
          categories: [],
          attributes: [],
          is_purchasable: true,
          is_in_stock: true,
        } as unknown as StoreProduct)
      : undefined);

  if (!resolvedCurrent) return [];

  const effectiveOverrides =
    manualOverrideIds ?? (resolvedCurrent.id ? await resolveManualOverrideIds(resolvedCurrent.id) : []);

  const selected = getRecommendedProducts({
    currentProduct: resolvedCurrent,
    catalog,
    explicitColorHint: currentColor,
    manualOverrideIds: effectiveOverrides,
  });

  if (!selected.length) return [];

  const priceMap = await getProductLowestPriceMap(selected.map((p) => p.id));
  return selected.map((p) => ({
    ...p,
    lowest_price: priceMap[p.id] || p.lowest_price,
  }));
}
