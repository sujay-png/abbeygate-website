import { cache } from "react";
import type { PriceTier } from "../types/store-product";
import type { StoreProduct } from "../types/store-product";
import { parsePriceTiersFromMeta, parseStorePrice } from "../utils/pricing";
import { getRestProductMeta } from "./store-products";
import { woocommerceApi } from "@/lib/woocommerce/client";

export type ProductPricingData = {
  productId: number;
  basePrice: number;
  tiers: PriceTier[];
};

function hasRestCredentials(): boolean {
  return Boolean(
    process.env.WOOCOMMERCE_CONSUMER_KEY &&
      process.env.WOOCOMMERCE_CONSUMER_SECRET,
  );
}

/** Build pricing from an already-fetched Store product (no extra Store API call). */
export async function getProductPricingFromProduct(
  storeProduct: StoreProduct,
): Promise<ProductPricingData> {
  const priceString = storeProduct?.prices?.price ?? "0";
  const minorUnit = storeProduct?.prices?.currency_minor_unit ?? 2;
  const rawBasePrice = parseStorePrice(priceString, minorUnit);
  const calculatedBase = rawBasePrice / 1.2;
  const basePrice = calculatedBase > 0 ? calculatedBase : 1.0;

  // Skip slow REST round-trip when keys aren't configured
  if (!hasRestCredentials()) {
    return {
      productId: storeProduct.id,
      basePrice,
      tiers: buildDefaultTiers(basePrice),
    };
  }

  try {
    const restProduct = await getRestProductMeta(storeProduct.id);
    const tiers = parsePriceTiersFromMeta(restProduct?.meta_data, basePrice);

    return {
      productId: storeProduct.id,
      basePrice,
      tiers: tiers.length > 0 ? tiers : buildDefaultTiers(basePrice),
    };
  } catch {
    return {
      productId: storeProduct.id,
      basePrice,
      tiers: buildDefaultTiers(basePrice),
    };
  }
}

/** Fallback tier structure when B2B King meta is unavailable. */
export function buildDefaultTiers(basePrice: number): PriceTier[] {
  return [
    { min: 1, max: 24, price: basePrice },
    { min: 25, max: 49, price: Number((basePrice * 0.8).toFixed(2)) },
    { min: 50, max: 99, price: Number((basePrice * 0.75).toFixed(2)) },
    { min: 100, max: null, price: Number((basePrice * 0.65).toFixed(2)) },
  ];
}

/**
 * Fetch and extract the lowest ex-VAT unit price for all products.
 * Uses WooCommerce REST API meta_data (_without_customisation_tiered_price or B2BKing pricetiers)
 * and caches the result with tag 'products' and 24-hour revalidation.
 */
export const getProductLowestPriceMap = cache(async (): Promise<Record<number, number>> => {
  if (!hasRestCredentials()) {
    return {};
  }

  try {
    const pages = [1, 2, 3];
    const results = await Promise.all(
      pages.map((page) =>
        woocommerceApi.request<Array<{ id: number; regular_price?: string; meta_data?: { key: string; value: unknown }[] }>>(
          '/products',
          {
            params: {
              per_page: 100,
              page,
              _fields: 'id,regular_price,meta_data',
            },
            revalidate: 86400,
            tags: ['products'],
          }
        ).catch(() => [])
      )
    );

    const priceMap: Record<number, number> = {};

    for (const productList of results) {
      if (!Array.isArray(productList)) continue;

      for (const p of productList) {
        if (!p || !p.id) continue;
        const metaData = p.meta_data || [];
        const basePrice = parseFloat(p.regular_price || '0') || 0;

        // 1. Check _without_customisation_tiered_price (first priority for No Customisation)
        const noCustMeta = metaData.find(
          (m) => m.key === '_without_customisation_tiered_price' && m.value
        );
        if (noCustMeta && typeof noCustMeta.value === 'string' && noCustMeta.value.includes(':')) {
          const prices = noCustMeta.value
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((part) => parseFloat(part.split(':')[1]))
            .filter((val) => !isNaN(val) && val > 0);
          if (prices.length > 0) {
            priceMap[p.id] = Math.min(...prices);
            continue;
          }
        }

        // 2. Check b2bking tiers
        const b2bMeta = metaData.find(
          (m) =>
            (m.key.includes('b2bking_product_pricetiers') || m.key === 'b2bking_tiered_price_rules') &&
            m.value
        );
        if (b2bMeta && typeof b2bMeta.value === 'string' && b2bMeta.value.includes(':')) {
          const prices = b2bMeta.value
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
            .map((part) => parseFloat(part.split(':')[1]))
            .filter((val) => !isNaN(val) && val > 0);
          if (prices.length > 0) {
            priceMap[p.id] = Math.min(...prices);
            continue;
          }
        }

        if (basePrice > 0) {
          priceMap[p.id] = basePrice;
        }
      }
    }

    return priceMap;
  } catch (err) {
    console.warn('Failed to load product lowest price map:', err);
    return {};
  }
});
