import type { StoreProduct, PriceTier } from "../types/store-product";

export const LOGO_CUSTOMIZATION_FEE = 0.52;
export const CUSTOMIZATION_MIN_QTY = 25;
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
    
    // Handle semicolon-separated string format (e.g. "1:25.00;50:3.32;100:2.83;")
    if (typeof raw === "string" && raw.includes(":")) {
      const parts = raw.split(";").map(s => s.trim()).filter(Boolean);
      const tiers: PriceTier[] = parts.map(part => {
        const [qtyStr, priceStr] = part.split(":");
        return {
          min: parseInt(qtyStr, 10) || 1,
          max: null as number | null,
          price: parseFloat(priceStr) || basePrice
        };
      }).filter(t => t.price > 0).sort((a, b) => a.min - b.min);
      
      if (tiers.length > 0) {
        for (let i = 0; i < tiers.length - 1; i++) {
          tiers[i].max = tiers[i + 1].min - 1;
        }
        return tiers;
      }
    }

    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (!Array.isArray(parsed)) return [];

    const tiers: PriceTier[] = parsed
      .map((tier: { quantity?: number; price?: string | number; min?: number; max?: number }) => {
        const min = tier.min ?? tier.quantity ?? 1;
        const price =
          typeof tier.price === "string"
            ? parseFloat(tier.price)
            : (tier.price ?? basePrice);
        return { min, max: tier.max ?? null, price };
      })
      .filter((t) => t.price > 0)
      .sort((a, b) => a.min - b.min);

    if (tiers.length > 0) {
      for (let i = 0; i < tiers.length - 1; i++) {
        tiers[i].max = tiers[i + 1].min - 1;
      }
      tiers[tiers.length - 1].max = null;
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
): number {
  if (!tiers.length) return basePrice;

  for (const tier of tiers) {
    const max = tier.max ?? Infinity;
    if (quantity >= tier.min && quantity <= max) {
      return tier.price;
    }
  }

  const lastTier = tiers[tiers.length - 1];
  if (quantity >= lastTier.min) return lastTier.price;

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
    isGifts,
    cornerEdges,
  } = input;

  let unitPrice = tiers.length
    ? getTierUnitPrice(quantity, tiers, basePrice)
    : basePrice;

  const discountRate = tiers.length ? 0 : getBulkDiscountRate(quantity);
  if (discountRate > 0) {
    unitPrice = basePrice * (1 - discountRate);
  }

  let customizationFee = 0;
  let extraBlockingFee = 0;

  if (!isGifts && customizationEnabled && blockingType) {
    customizationFee =
      LOGO_BLOCKING_PRICES[blockingType.toLowerCase()] ?? LOGO_CUSTOMIZATION_FEE;
    extraBlockingFee = Math.max(0, customizationFee - LOGO_CUSTOMIZATION_FEE);
    unitPrice += extraBlockingFee;
  }

  let cornerEdgesFee = 0;
  // if (!isGifts && customizationEnabled && cornerEdges && (cornerEdges === 'Gold' || cornerEdges === 'Silver')) {
  //   cornerEdgesFee = 0.24;
  //   unitPrice += cornerEdgesFee;
  // }

  if (!isGifts && !customizationEnabled) {
    unitPrice = Math.max(0, unitPrice - LOGO_CUSTOMIZATION_FEE);
  }

  const totalPrice = unitPrice * quantity;

  const statusText = customizationEnabled
    ? "Including logo customisation and excluding VAT"
    : "Not including logo customisation and VAT";

  const statusColor = customizationEnabled ? "#1b7a1b" : "#7f56b3";

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
