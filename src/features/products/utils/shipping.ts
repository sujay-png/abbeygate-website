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
  "a4-diary": { unitsPerBox: 10, boxWeight: 11.9, boxesPerPallet: 84 },
  "a5-notebooks": { unitsPerBox: 30, boxWeight: 7.46, boxesPerPallet: 84 },
  eco: { unitsPerBox: 30, boxWeight: 7.46, boxesPerPallet: 84 },
};

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
    for (const category of product.categories) {
      const rule = CATEGORY_SHIPPING_RULES[category.slug];
      if (!rule) continue;

      const boxes = Math.ceil(quantity / rule.unitsPerBox);
      totalWeight += boxes * rule.boxWeight;
      totalPallets += boxes / rule.boxesPerPallet;
      totalBoxes += boxes;
    }
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
