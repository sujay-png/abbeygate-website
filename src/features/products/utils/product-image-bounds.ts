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
];

export function getConfiguredImageBounds(imageUrl: string): ProductImageBounds | null {
  const decodedUrl = decodeURIComponent(imageUrl);
  const entry = BACKGROUND_IMAGE_BOUNDS.find(({ imageUrlFragment }) =>
    decodedUrl.includes(imageUrlFragment),
  );

  return entry?.bounds ?? null;
}
