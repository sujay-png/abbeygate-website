import { woocommerceFetch } from "@/lib/woocommerce/client";
import type { PriceTier } from "../types/store-product";
import {
  parsePriceTiersFromMeta,
  parseStorePrice,
} from "../utils/pricing";
import { getStoreProductBySlug } from "./store-products";

export type ProductPricingData = {
  productId: number;
  basePrice: number;
  tiers: PriceTier[];
};

export async function getProductPricingData(
  slug: string,
): Promise<ProductPricingData | null> {
  const storeProduct = await getStoreProductBySlug(slug);
  if (!storeProduct) return null;

  const basePrice = parseStorePrice(
    storeProduct.prices.price,
    storeProduct.prices.currency_minor_unit,
  );

  try {
    const restProduct = await woocommerceFetch<{
      id: number;
      meta_data?: { key: string; value: unknown }[];
    }>({
      path: `/products/${storeProduct.id}`,
      revalidate: 300,
    });

    const tiers = parsePriceTiersFromMeta(restProduct.meta_data, basePrice);

    if (tiers.length === 0) {
      return {
        productId: storeProduct.id,
        basePrice,
        tiers: buildDefaultTiers(basePrice),
      };
    }

    return { productId: storeProduct.id, basePrice, tiers };
  } catch {
    return {
      productId: storeProduct.id,
      basePrice,
      tiers: buildDefaultTiers(basePrice),
    };
  }
}

/** Fallback tier structure when B2B King meta is unavailable. */
function buildDefaultTiers(basePrice: number): PriceTier[] {
  return [
    { min: 1, max: 24, price: basePrice },
    { min: 25, max: 49, price: basePrice * 0.8 },
    { min: 50, max: 99, price: basePrice * 0.75 },
    { min: 100, max: null, price: basePrice * 0.65 },
  ];
}
