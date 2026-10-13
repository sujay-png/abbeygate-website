import type { StoreProduct } from "../types/store-product";

type ShippingCartItem = {
  product: StoreProduct;
  quantity: number;
};

type ShippingResult = {
  cost: number;
  label: string;
};

const CATEGORY_SHIPPING_RULES: Record<
  string,
  { unitsPerBox: number; boxWeight: number; boxesPerPallet: number }
> = {
  "pocket-diaries": { unitsPerBox: 100, boxWeight: 11.2, boxesPerPallet: 54 },
  "a6-notebooks": { unitsPerBox: 100, boxWeight: 11.2, boxesPerPallet: 54 },
  dpp: { unitsPerBox: 20, boxWeight: 10, boxesPerPallet: 84 },
  wtv: { unitsPerBox: 20, boxWeight: 11.6, boxesPerPallet: 84 },
  "quarto-wtv": { unitsPerBox: 20, boxWeight: 12.7, boxesPerPallet: 54 },
  "quarto-dpp": { unitsPerBox: 10, boxWeight: 11.4, boxesPerPallet: 84 },
  "a4-diaries": { unitsPerBox: 10, boxWeight: 11.9, boxesPerPallet: 84 },
  "a5-notebooks": { unitsPerBox: 30, boxWeight: 7.46, boxesPerPallet: 84 },
  "eco-friendly-notebooks": { unitsPerBox: 30, boxWeight: 7.46, boxesPerPallet: 84 },
};

export function getShippingRule(product: StoreProduct) {
  const categorySlugs = (product.categories || []).map((c) => c.slug);
  const nameLower = (product.name || "").toLowerCase();

  // 1. Quarto Diaries (differentiate DPP vs WTV from product title)
  if (categorySlugs.includes("quarto-diaries") || categorySlugs.includes("quarto-diary")) {
    if (nameLower.includes("day per page") || nameLower.includes("dpp")) {
      return CATEGORY_SHIPPING_RULES["quarto-dpp"];
    }
    return CATEGORY_SHIPPING_RULES["quarto-wtv"];
  }

  // 2. A5 Diaries (differentiate DPP vs WTV from product title)
  if (categorySlugs.includes("a5-diaries") || categorySlugs.includes("a5-diary")) {
    if (nameLower.includes("day per page") || nameLower.includes("dpp")) {
      return CATEGORY_SHIPPING_RULES["dpp"];
    }
    return CATEGORY_SHIPPING_RULES["wtv"];
  }

  // 3. A4 Diaries
  if (categorySlugs.includes("a4-diaries") || categorySlugs.includes("a4-diary")) {
    return CATEGORY_SHIPPING_RULES["a4-diaries"];
  }

  // 4. Pocket Diaries
  if (categorySlugs.includes("pocket-diaries")) {
    return CATEGORY_SHIPPING_RULES["pocket-diaries"];
  }

  // 5. Eco Friendly Notebooks
  if (categorySlugs.includes("eco-friendly-notebooks") || categorySlugs.includes("eco")) {
    return CATEGORY_SHIPPING_RULES["eco-friendly-notebooks"];
  }

  // 6. A5 Notebooks
  if (categorySlugs.includes("a5-notebooks")) {
    return CATEGORY_SHIPPING_RULES["a5-notebooks"];
  }

  // 7. A6 Notebooks
  if (categorySlugs.includes("a6-notebooks")) {
    return CATEGORY_SHIPPING_RULES["a6-notebooks"];
  }

  // Direct category slug fallback
  for (const slug of categorySlugs) {
    if (CATEGORY_SHIPPING_RULES[slug]) {
      return CATEGORY_SHIPPING_RULES[slug];
    }
  }

  return null;
}

export function calculateShipping(
  items: ShippingCartItem[],
  appliedCoupons: string[] = [],
): ShippingResult {
  if (appliedCoupons.map((c) => c.toLowerCase()).includes("abbeygate100")) {
    return { cost: 0, label: "Shipping (Free with Coupon)" };
  }

  let totalWeight = 0;
  let totalPallets = 0;
  let totalBoxes = 0;

  for (const { product, quantity } of items) {
    const rule = getShippingRule(product);
    if (!rule) continue;

    const boxes = Math.ceil(quantity / rule.unitsPerBox);
    totalWeight += boxes * rule.boxWeight;
    totalPallets += boxes / rule.boxesPerPallet;
    totalBoxes += boxes;
  }

  totalPallets = Math.ceil(totalPallets);

  const baseRate = 7.68 * 1.125;
  const baseCost = baseRate * 1.14;
  const ratePerKg = 0.32;
  const extraWeight = totalWeight - 20;
  const adjustedRate = ratePerKg * 1.14;
  const extraCost = extraWeight > 0 ? extraWeight * adjustedRate : 0;
  const formulaCost = 1.6 * (baseCost + extraCost);

  if (totalWeight < 20) {
    return { cost: 15.75, label: "Shipping (Minimum)" };
  }

  if (totalWeight > 160 || totalBoxes > 16) {
    return {
      cost: totalPallets * 96,
      label: `Shipping (${totalPallets} Pallet${totalPallets !== 1 ? "s" : ""})`,
    };
  }

  return { cost: formulaCost, label: "Shipping (Calculated)" };
}
