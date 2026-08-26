import type { PricedItem } from '../context/CartContext';
import type { StoreProduct } from '@/features/products/types/store-product';
import type { CustomizationState } from '@/features/products/components/ProductCustomizer';

/** True only when a proof image exists to put in the PDF. */
export function canDownloadProof(item: PricedItem): boolean {
  return Boolean(item.customization?.enabled && item.customization.fullPreviewUrl);
}

/**
 * Generate + download the customer-facing PDF proof for one cart line.
 * Built on demand from the line's CURRENT customization, so amended branding
 * and the correct per-line colour always appear. Client-only — sent nowhere.
 */
export async function downloadCartItemProof(item: PricedItem): Promise<void> {
  const c = item.customization;
  if (!c?.fullPreviewUrl) return; // proof not ready (pending/failed) — nothing to render

  const product = {
    name: item.name,
    slug: item.slug ?? 'item',
    sku: '', // cart lines carry no SKU; generator falls back to 'N/A'
    categories: (item.categorySlugs ?? []).map((slug) => ({ id: 0, name: slug, slug, link: '' })),
  } as StoreProduct;

  const customization = {
    enabled: true,
    blockingType: c.choice,
    foilColor: c.foilColor,
    cornerEdges: (c.cornerEdges as CustomizationState['cornerEdges']) ?? 'None',
    logoPosition: { x: 0, y: 0, label: c.positionLabel ?? c.position },
    fullPreviewUrl: c.fullPreviewUrl,
    logoScale: c.logoScale ?? 1, // required by the type; NOT printed by the PDF
  } as CustomizationState;

  const { generateDigitalProof } = await import('@/features/products/utils/generate-pdf');
  // 5th arg (colourName) is added in Part B — pass the line's real colour:
  const pdfBuffer = await generateDigitalProof(
    product, customization, item.quantity, item.unitPrice, item.colour?.name,
  );

  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `proof-${product.slug}.pdf`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
