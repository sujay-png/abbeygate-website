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
    bounds: { left: 29.5, right: 69.8, top: 10.0, bottom: 88.8 },
  },
  {
    imageUrlFragment: 'NewHide_Pocket_Desk_Diary',
    bounds: { left: 29.5, right: 69.8, top: 10.0, bottom: 88.8 },
  },
  {
    imageUrlFragment: 'SmoothGrain-Pocket-Desk-Diary',
    bounds: { left: 29.5, right: 69.8, top: 10.0, bottom: 88.8 },
  },
  {
    imageUrlFragment: 'NewHide_Bicolour_Pocket_Diary',
    bounds: { left: 29.5, right: 69.8, top: 10.0, bottom: 88.8 },
  },
  {
    imageUrlFragment: 'applepeel-a5-notebook',
    bounds: { left: 22.5, right: 77.9, top: 7.8, bottom: 92.0 },
  },
];

export function getConfiguredImageBounds(imageUrl: string): ProductImageBounds | null {
  const decodedUrl = decodeURIComponent(imageUrl);
  const entry = BACKGROUND_IMAGE_BOUNDS.find(({ imageUrlFragment }) =>
    decodedUrl.includes(imageUrlFragment),
  );

  return entry?.bounds ?? null;
}
