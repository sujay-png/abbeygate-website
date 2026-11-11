export type ProductImageBounds = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type BoundsEntry = {
  /** A stable fragment of the original WordPress image filename. */
  imageUrlFragment: string;
  bounds: ProductImageBounds;
};

/**
 * Hand-measured product bounds for lifestyle/background images.
 *
 * Edge detection is deliberately not used for these images: details in the
 * scene can be stronger than the product edge. Filename fragments also match
 * WordPress's generated thumbnail sizes (for example `-600x600`).
 */
const BACKGROUND_IMAGE_BOUNDS: BoundsEntry[] = [
  {
    imageUrlFragment: 'UC95_Website',
    bounds: { left: 16.8, right: 84.4, top: 9.8, bottom: 90.8 },
  },
  {
    imageUrlFragment: 'SaharaHide-Pocket-Desk-Diary',
    bounds: { left: 29.4, right: 70.3, top: 10.6, bottom: 89.0 },
  },
  {
    imageUrlFragment: 'NewHide_Pocket_Desk_Diary',
    bounds: { left: 29.4, right: 70.3, top: 10.6, bottom: 89.0 },
  },
  {
    imageUrlFragment: 'SmoothGrain-Pocket-Desk-Diary',
    bounds: { left: 29.4, right: 70.3, top: 10.6, bottom: 89.0 },
  },
  {
    imageUrlFragment: 'NewHide_Bicolour_Pocket_Diary',
    bounds: { left: 29.4, right: 70.3, top: 10.6, bottom: 89.0 },
  },
  {
    imageUrlFragment: 'NewHide-Bicolour-Pocket-Diary',
    bounds: { left: 29.4, right: 70.3, top: 10.6, bottom: 89.0 },
  },
  {
    imageUrlFragment: 'Bicolour-Pocket-Diary',
    bounds: { left: 29.4, right: 70.3, top: 10.6, bottom: 89.0 },
  },
  {
    imageUrlFragment: 'Bicolour_Pocket_Diary',
    bounds: { left: 29.4, right: 70.3, top: 10.6, bottom: 89.0 },
  },
  {
    imageUrlFragment: 'NewHide-Horizon-Pocket-Desk-Diary',
    bounds: { left: 29.4, right: 70.3, top: 10.6, bottom: 89.0 },
  },
  {
    imageUrlFragment: 'NewHide_Horizon_Pocket_Desk_Diary',
    bounds: { left: 29.4, right: 70.3, top: 10.6, bottom: 89.0 },
  },
  {
    imageUrlFragment: 'NewHide-Bicolour-Quarto-Diary',
    bounds: { left: 19.2, right: 80.3, top: 13.1, bottom: 88.4 },
  },
  {
    imageUrlFragment: 'NewHide_Bicolour_Quarto_Diary',
    bounds: { left: 19.2, right: 80.3, top: 13.1, bottom: 88.4 },
  },
  {
    imageUrlFragment: 'Bicolour-Quarto-Diary',
    bounds: { left: 19.2, right: 80.3, top: 13.1, bottom: 88.4 },
  },
  {
    imageUrlFragment: 'NewHide-Horizon-Quarto-Desk-Diary',
    bounds: { left: 19.2, right: 79.1, top: 13.2, bottom: 87.3 },
  },
  {
    imageUrlFragment: 'NewHide_Horizon_Quarto_Desk_Diary',
    bounds: { left: 19.2, right: 79.1, top: 13.2, bottom: 87.3 },
  },
  {
    imageUrlFragment: 'NewHide-Horizon-A5-Desk-Diary',
    bounds: { left: 24.1, right: 76.4, top: 13.6, bottom: 86.1 },
  },
  {
    imageUrlFragment: 'applepeel-a5-notebook',
    bounds: { left: 22.3, right: 77.9, top: 7.9, bottom: 91.9 },
  },
  {
    imageUrlFragment: 'Chelsea-A5-WTV-Deluxe-2026-Notebook',
    bounds: { left: 17.9, right: 82.0, top: 16.6, bottom: 82.5 },
  },
  {
    imageUrlFragment: 'CL_DX_DIARY_BLUE',
    bounds: { left: 14.7, right: 84.3, top: 7.4, bottom: 88.9 },
  },
];

export function getConfiguredImageBounds(imageUrl: string): ProductImageBounds | null {
  const decodedUrl = decodeURIComponent(imageUrl).toLowerCase();
  const entry = BACKGROUND_IMAGE_BOUNDS.find(({ imageUrlFragment }) => {
    const fragLower = imageUrlFragment.toLowerCase();
    const fragHyphen = fragLower.replace(/_/g, '-');
    const fragUnderscore = fragLower.replace(/-/g, '_');
    return decodedUrl.includes(fragLower) || decodedUrl.includes(fragHyphen) || decodedUrl.includes(fragUnderscore);
  });

  return entry?.bounds ?? null;
}
