import type { Point, ProductCorners } from './detect-product-bounds';

/** Product bounds as percentages of the image; `corners` present when detected. */
export type ProductImageBounds = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  corners?: ProductCorners;
};

export type CornerClipLayout = {
  /** Clip width (= height, it is square) as a percentage of IMAGE WIDTH. */
  sizePct: number;
  /** Outer vertex of each clip, as percentages of the image (x of width, y of height). */
  topRight: Point;
  bottomRight: Point;
};

/** Used only when the product's physical size or corner size is unknown. */
const FALLBACK_CLIP_TO_COVER_WIDTH = 0.15;

/** '22mm × 22mm' → 22 */
export function parseCornerSizeMm(size: string | null | undefined): number | null {
  const mm = size ? parseFloat(size) : NaN;
  return Number.isFinite(mm) && mm > 0 ? mm : null;
}

/**
 * Where to draw the metal corner clips over a product image.
 *
 * - Position comes from the detected corner vertices (falls back to the
 *   bounding rectangle for bounds saved before corners were detected).
 * - Size is physical: clip mm ÷ cover width mm × cover width on screen, so
 *   the clip covers the same proportion of the cover as the real part does.
 *
 * Shared by the live overlay, the cart preview modal and the proof canvas so
 * they can never disagree.
 */
export function getCornerClipLayout(
  bounds: ProductImageBounds,
  opts: { cornerSizeMm?: number | null; productWidthMm?: number | null } = {},
): CornerClipLayout {
  const topRight = bounds.corners?.topRight ?? { x: bounds.right, y: bounds.top };
  const bottomRight = bounds.corners?.bottomRight ?? { x: bounds.right, y: bounds.bottom };
  const coverWidthPct = bounds.corners
    ? ((bounds.corners.topRight.x + bounds.corners.bottomRight.x) - (bounds.corners.topLeft.x + bounds.corners.bottomLeft.x)) / 2
    : bounds.right - bounds.left;

  const ratio = opts.cornerSizeMm && opts.productWidthMm
    ? opts.cornerSizeMm / opts.productWidthMm
    : FALLBACK_CLIP_TO_COVER_WIDTH;

  return { sizePct: coverWidthPct * ratio, topRight, bottomRight };
}
