import { woocommerceFetch } from "@/lib/woocommerce/client";
import type { PriceTier } from "../types/store-product";
import type { StoreProduct } from "../types/store-product";
import { parsePriceTiersFromMeta, parseStorePrice } from "../utils/pricing";

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
  const basePrice = parseStorePrice(
    storeProduct.prices.price,
    storeProduct.prices.currency_minor_unit,
  );

  // Skip slow REST round-trip when keys aren't configured
  if (!hasRestCredentials()) {
    return {
      productId: storeProduct.id,
      basePrice,
      tiers: buildDefaultTiers(basePrice),
    };
  }

  try {
    const restProduct = await woocommerceFetch<{
      id: number;
      meta_data?: { key: string; value: unknown }[];
    }>({
      path: `/products/${storeProduct.id}`,
      revalidate: 300,
    });

    const tiers = parsePriceTiersFromMeta(restProduct.meta_data, basePrice);

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
function buildDefaultTiers(basePrice: number): PriceTier[] {
  return [
    { min: 1, max: 24, price: basePrice },
    { min: 25, max: 49, price: Number((basePrice * 0.8).toFixed(2)) },
    { min: 50, max: 99, price: Number((basePrice * 0.75).toFixed(2)) },
    { min: 100, max: null, price: Number((basePrice * 0.65).toFixed(2)) },
  ];
}
