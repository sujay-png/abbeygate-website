import type { CheckoutQuoteLine } from '../types/quote';

export type WooOrderLineItemPayload = {
  product_id: number;
  variation_id?: number;
  quantity: number;
  subtotal: string;
  total: string;
  meta_data: Array<{ key: string; value: string }>;
};

/**
 * Maps checkout quote lines into WooCommerce REST order `line_items`.
 * Always sets explicit `subtotal` (ex-VAT) alongside `total` so WooCommerce does not
 * fall back to VAT-inclusive catalog prices and misreport VAT as a line discount.
 */
export function buildWooOrderLineItems(
  lines: CheckoutQuoteLine[],
  merchandiseDiscount = 0,
): WooOrderLineItemPayload[] {
  const merchandiseSubtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const clampedDiscount = Math.min(merchandiseSubtotal, Math.max(0, merchandiseDiscount));
  let remainingDiscountCents = Math.round(clampedDiscount * 100);

  return lines.map((line, index) => {
    const lineCents = Math.round(line.lineTotal * 100);
    let lineDiscountCents = 0;

    if (remainingDiscountCents > 0 && merchandiseSubtotal > 0) {
      if (index === lines.length - 1) {
        lineDiscountCents = Math.min(lineCents, remainingDiscountCents);
      } else {
        lineDiscountCents = Math.min(
          lineCents,
          Math.round((line.lineTotal / merchandiseSubtotal) * clampedDiscount * 100),
        );
      }
      remainingDiscountCents = Math.max(0, remainingDiscountCents - lineDiscountCents);
    }

    const netLineCents = Math.max(0, lineCents - lineDiscountCents);

    return {
      product_id: parseInt(line.productId, 10),
      ...(line.variationId ? { variation_id: parseInt(line.variationId, 10) } : {}),
      quantity: line.quantity,
      subtotal: (lineCents / 100).toFixed(2),
      total: (netLineCents / 100).toFixed(2),
      meta_data:
        line.customization && line.customization.enabled
          ? [
              { key: 'Custom Logo Choice', value: line.customization.choice || '' },
              ...(line.customization.foilColor
                ? [{ key: 'Foil Colour', value: line.customization.foilColor }]
                : []),
              ...(line.customization.cornerEdges
                ? [{ key: 'Corner Edges', value: line.customization.cornerEdges }]
                : []),
              ...(line.customization.fileName
                ? [{ key: 'Uploaded File', value: line.customization.fileName }]
                : []),
              ...(line.customization.logoUrl
                ? [{ key: 'View Logo', value: line.customization.logoUrl }]
                : []),
              ...(line.customization.previewUrl
                ? [{ key: 'View Proof', value: line.customization.previewUrl }]
                : []),
            ]
          : [],
    };
  });
}
