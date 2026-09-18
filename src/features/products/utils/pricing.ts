import type { StoreProduct, PriceTier } from "../types/store-product";

export const LOGO_CUSTOMIZATION_FEE = 0.52;
export const BRANDING_SETUP_FEE = 48;
export const CORNER_PAIRS_PER_PRODUCT = 1;
export const CUSTOMIZATION_MIN_QTY = 1;
export const VAT_RATE = 0.20;

export const LOGO_BLOCKING_PRICES: Record<string, number> = {
  "foil blocked": 0.52,
  embossed: 0.52,
  "digital printed": 4,
  "screen printed": 5,
};

export function parseStorePrice(priceString: string, minorUnit = 2): number {
  const raw = parseInt(priceString, 10);
  if (Number.isNaN(raw)) return 0;
  return raw / Math.pow(10, minorUnit);
}

export function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function isGiftsProduct(product: StoreProduct): boolean {
  return product.categories.some((cat) => cat.slug === "gifts");
}

export function isFoilBlockedProduct(product: StoreProduct): boolean {
  return product.categories.some((cat) => cat.slug === "foil-blocked");
}

export type CornerEdgesPricing = {
  size: '18mm × 18mm' | '22mm × 22mm' | '27mm × 27mm' | null;
  pricePerPair: number;
};

/**
 * Mirrors the WooCommerce corner-price rules until the product meta is exposed
 * through the Store API. Product names are the temporary source for the format.
 */
export function getCornerEdgesPricing(product: StoreProduct): CornerEdgesPricing {
  const description = [product.name, product.slug, ...product.attributes.flatMap((attribute) => attribute.terms.map((term) => term.name))]
    .join(' ')
    .toLowerCase();

  if (description.includes('pocket')) {
    return { size: '18mm × 18mm', pricePerPair: 0.42 };
  }
  if (description.includes('a5')) {
    return { size: '22mm × 22mm', pricePerPair: 0.48 };
  }
  if (description.includes('quarto') || description.includes('a4')) {
    return { size: '27mm × 27mm', pricePerPair: 0.48 };
  }

  return { size: null, pricePerPair: 0 };
}

/** 
 * Fallback tier structure when B2B King meta is unavailable. 
 * WooCommerce often stores prices to 2 decimal places (e.g. 8.33), which causes 8.33 * 1.2 = 9.996 (rounds to 10.00).
 * By snapping these back to the exact base price (e.g. 8.325), we get 8.325 * 1.2 = 9.99.
 */
function snapToBasePrice(price: number, basePrice: number): number {
  return Math.abs(price - basePrice) < 0.01 ? basePrice : price;
}

/** Parse B2B King tier pricing from WooCommerce REST API meta_data. */
export function parsePriceTiersFromMeta(
  metaData: { key: string; value: unknown }[] | undefined,
  basePrice: number,
): PriceTier[] {
  if (!metaData?.length) return [];

  // Find any B2BKing pricetiers meta that has an actual value
  const tierMeta = metaData.find(
    (m) =>
      (m.key.includes("b2bking_product_pricetiers") ||
       m.key === "b2bking_tiered_price_rules") &&
      m.value
  );

  if (!tierMeta?.value) return [];

  try {
    const raw = tierMeta.value;
    let tiers: PriceTier[] = [];
    
    // Handle semicolon-separated string format (e.g. "1:25.00;50:3.32;100:2.83;")
    if (typeof raw === "string" && raw.includes(":")) {
      const parts = raw.split(";").map(s => s.trim()).filter(Boolean);
      tiers = parts.map(part => {
        const [qtyStr, priceStr] = part.split(":");
        const parsedPrice = parseFloat(priceStr) || basePrice;
        return {
          min: parseInt(qtyStr, 10) || 1,
          max: null as number | null,
          price: snapToBasePrice(parsedPrice, basePrice)
        };
      }).filter(t => t.price > 0).sort((a, b) => a.min - b.min);
    } else {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) {
        tiers = parsed
          .map((tier: { quantity?: number; price?: string | number; min?: number; max?: number }) => {
            const min = tier.min ?? tier.quantity ?? 1;
            const rawPrice =
              typeof tier.price === "string"
                ? parseFloat(tier.price)
                : (tier.price ?? basePrice);
            const price = snapToBasePrice(rawPrice, basePrice);
            return { min, max: tier.max ?? null, price };
          })
          .filter((t) => t.price > 0)
          .sort((a, b) => a.min - b.min);
      }
    }

    if (tiers.length > 0) {
      for (let i = 0; i < tiers.length - 1; i++) {
        tiers[i].max = tiers[i + 1].min - 1;
      }
      tiers[tiers.length - 1].max = null;
    }

    // Merge UV printing tiered prices if they exist
    const uvTierMeta = metaData.find(m => m.key === "_uv_printing_tiered_price" && m.value);
    if (uvTierMeta?.value && typeof uvTierMeta.value === "string" && uvTierMeta.value.includes(":")) {
      const parsedUvTiers: { min: number, price: number }[] = [];
      const parts = uvTierMeta.value.split(";").map(s => s.trim()).filter(Boolean);
      parts.forEach(part => {
        const [qtyStr, priceStr] = part.split(":");
        const minQty = parseInt(qtyStr, 10);
        const uvPrice = snapToBasePrice(parseFloat(priceStr), basePrice);
        if (!isNaN(minQty) && !isNaN(uvPrice)) {
          parsedUvTiers.push({ min: minQty, price: uvPrice });
        }
      });
      parsedUvTiers.sort((a, b) => a.min - b.min);

      tiers.forEach(tier => {
        let selectedPrice = undefined;
        for (const pt of parsedUvTiers) {
          if (tier.min >= pt.min) selectedPrice = pt.price;
          else break;
        }
        if (selectedPrice !== undefined) tier.uvPrice = selectedPrice;
      });
    }

    // Merge without customisation tiered prices if they exist
    const noCustTierMeta = metaData.find(m => m.key === "_without_customisation_tiered_price" && m.value);
    if (noCustTierMeta?.value && typeof noCustTierMeta.value === "string" && noCustTierMeta.value.includes(":")) {
      const parsedNoCustTiers: { min: number, price: number }[] = [];
      const parts = noCustTierMeta.value.split(";").map(s => s.trim()).filter(Boolean);
      parts.forEach(part => {
        const [qtyStr, priceStr] = part.split(":");
        const minQty = parseInt(qtyStr, 10);
        const noCustPrice = snapToBasePrice(parseFloat(priceStr), basePrice);
        if (!isNaN(minQty) && !isNaN(noCustPrice)) {
          parsedNoCustTiers.push({ min: minQty, price: noCustPrice });
        }
      });
      parsedNoCustTiers.sort((a, b) => a.min - b.min);

      tiers.forEach(tier => {
        let selectedPrice = undefined;
        for (const pt of parsedNoCustTiers) {
          if (tier.min >= pt.min) selectedPrice = pt.price;
          else break;
        }
        if (selectedPrice !== undefined) tier.noCustomisationPrice = selectedPrice;
      });
    }

    return tiers;
  } catch {
    return [];
  }
}

/** Get unit price from B2B tier table for a given quantity. */
export function getTierUnitPrice(
  quantity: number,
  tiers: PriceTier[],
  basePrice: number,
  useUvPrice: boolean = false,
  useNoCustomisationPrice: boolean = false
): number {
  if (!tiers.length) return basePrice;

  for (const tier of tiers) {
    const max = tier.max ?? Infinity;
    if (quantity >= tier.min && quantity <= max) {
      if (useUvPrice && tier.uvPrice !== undefined) return tier.uvPrice;
      if (useNoCustomisationPrice && tier.noCustomisationPrice !== undefined) return tier.noCustomisationPrice;
      return tier.price;
    }
  }

  const lastTier = tiers[tiers.length - 1];
  if (quantity >= lastTier.min) {
    if (useUvPrice && lastTier.uvPrice !== undefined) return lastTier.uvPrice;
    if (useNoCustomisationPrice && lastTier.noCustomisationPrice !== undefined) return lastTier.noCustomisationPrice;
    return lastTier.price;
  }

  return basePrice;
}

export function getBulkDiscountRate(quantity: number): number {
  if (quantity >= 100) return 0.35;
  if (quantity >= 50) return 0.25;
  if (quantity >= 25) return 0.2;
  return 0;
}

export function getBulkDiscountLabel(rate: number): string {
  if (rate === 0.35) return "🎉 Bulk Discount: 35% OFF";
  if (rate === 0.25) return "🎉 Bulk Discount: 25% OFF";
  if (rate === 0.2) return "🎉 Bulk Discount: 20% OFF";
  return "";
}

export type PriceCalculationInput = {
  quantity: number;
  basePrice: number;
  tiers?: PriceTier[];
  customizationEnabled: boolean;
  blockingType?: string;
  cornerEdges?: string;
  cornerEdgePrice?: number;
  isGifts: boolean;
};

export type PriceCalculationResult = {
  unitPrice: number;
  totalPrice: number;
  discountRate: number;
  discountLabel: string;
  customizationFee: number;
  statusText: string;
  statusColor: string;
};

export function calculateProductPrice(
  input: PriceCalculationInput,
): PriceCalculationResult {
  const {
    quantity,
    basePrice,
    tiers = [],
    customizationEnabled,
    blockingType,
    cornerEdgePrice = 0,
    isGifts,
  } = input;

  const isUvPrint = Boolean(customizationEnabled && blockingType && blockingType.toLowerCase() === 'uv print');
  const isNoCustomization = !isGifts && !customizationEnabled && !isUvPrint;

  let unitPrice = tiers.length
    ? getTierUnitPrice(quantity, tiers, basePrice, isUvPrint, isNoCustomization)
    : basePrice;

  const discountRate = tiers.length ? 0 : getBulkDiscountRate(quantity);
  if (discountRate > 0) {
    unitPrice = basePrice * (1 - discountRate);
  }

  let customizationFee = 0;
  let extraBlockingFee = 0;

  if (isUvPrint) {
    // UV price from the tiers already includes logo customization.
    customizationFee = 0;
    extraBlockingFee = 0;
  } else if (!isGifts && customizationEnabled && blockingType) {
    customizationFee =
      LOGO_BLOCKING_PRICES[blockingType.toLowerCase()] ?? LOGO_CUSTOMIZATION_FEE;
    extraBlockingFee = Math.max(0, customizationFee - LOGO_CUSTOMIZATION_FEE);
    unitPrice += extraBlockingFee;
  }

  unitPrice += cornerEdgePrice;

  const totalPrice = unitPrice * quantity;

  const statusText = isGifts
    ? ""
    : customizationEnabled
    ? "Including logo customisation"
    : "Not including logo customisation";

  const statusColor = isGifts ? "" : customizationEnabled ? "#1b7a1b" : "#7f56b3";

  return {
    unitPrice,
    totalPrice,
    discountRate,
    discountLabel: getBulkDiscountLabel(discountRate),
    customizationFee,
    statusText,
    statusColor,
  };
}
