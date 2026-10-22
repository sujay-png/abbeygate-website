import Link from 'next/link';
import Image from 'next/image';
import type { StoreProduct } from '../types/store-product';
import { getProductBaseAmount, sanitizeImageUrl, getProductImageTransform } from '../utils/product-helpers';
import { PriceDisplay } from '@/components/shared/PriceDisplay';

type ProductGridProps = {
  products: StoreProduct[];
  hasProductsInCategory?: boolean;
};

export const ProductGrid = ({ products, hasProductsInCategory = true }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">
          {hasProductsInCategory ? "No products found matching your filters." : "No products found for this category."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
      {products.map((product) => {
        const image = product.images[0];
        const imageSrc = sanitizeImageUrl(image?.thumbnail || image?.src);
        const { rotate, scaleX, imagePadding } = getProductImageTransform(product);

        // Build the CSS transform for the image element only (rotate + optional horizontal flip).
        // Rotation is applied inside a square aspect-ratio container; we also add a scale-down
        // when rotating so that a landscape photo fits neatly inside the square container.
        const parts: string[] = [];
        if (scaleX !== 1) parts.push(`scaleX(${scaleX})`);
        if (rotate !== 0) {
          parts.push(`rotate(${rotate}deg)`);
          // scale(0.75) ≈ short-side / long-side for a ~4:3 landscape canvas (990×754)
          // ensures the rotated-to-vertical image stays fully inside the square card
          parts.push('scale(0.75)');
        }
        const transformStyle: React.CSSProperties = parts.length
          ? { transform: parts.join(' ') }
          : {};

        // imagePadding adjusts the visible area of the container so that products
        // photographed with different amounts of whitespace appear at a normalised
        // relative size on the grid (e.g. Dorchester luggage tags vs Chelsea ones).
        const containerPadding = `${imagePadding}%`;

        return (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group flex flex-col"
          >
            <div
              className="relative aspect-square w-full bg-transparent overflow-hidden mb-4"
              style={{ padding: containerPadding }}
            >
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={image?.alt || product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-105 mix-blend-multiply"
                  style={transformStyle}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
                  No image
                </div>
              )}
            </div>

            <h3 className="text-[15px] font-semibold text-brand-body leading-snug mb-2 group-hover:text-brand-primary transition-colors line-clamp-2">
              {product.name}
            </h3>

            {getProductBaseAmount(product) > 0 && (
              <span className="text-[15px] font-bold text-brand-body mt-auto flex gap-1">
                <PriceDisplay amount={getProductBaseAmount(product)} />
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};
