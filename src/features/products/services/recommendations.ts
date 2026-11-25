import { getAllStoreProducts } from './store-products';
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
 * Pipeline hook reserved for manual PDP recommendation overrides.
 * Currently unlinked (returns `[]`) while Abbeygate Sales signs off; to activate,
 * read `upsell_ids` / `cross_sell_ids` via `getRestProductMeta(productId)` (already
 * cached via React `cache()` and ISR) or merge an editorial override table here.
 */
export async function resolveManualOverrideIds(productId: number): Promise<number[]> {
  void productId;
  return [];
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
