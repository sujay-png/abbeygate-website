import Link from 'next/link';
import Image from 'next/image';
import type { StoreProduct } from '../types/store-product';
import { getProductDisplayPrice, stripHtml } from '../utils/product-helpers';

type ProductGridProps = {
  products: StoreProduct[];
};

export const ProductGrid = ({ products }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white">
        <p className="text-gray-500 text-lg">No products found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 bg-white">
      {products.map((product) => {
        const image = product.images[0];
        const imageSrc = image?.thumbnail || image?.src;

        return (
          <Link
            key={product.id}
            href={`/product/${product.slug}`}
            className="group flex flex-col bg-white"
          >
            <div className="relative aspect-square w-full bg-[#f5f5f5] overflow-hidden mb-4">
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
                <span className="text-white border border-white px-5 py-2 text-xs font-bold tracking-wider uppercase">
                  View Details
                </span>
              </div>

              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={image?.alt || product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
                  No image
                </div>
              )}
            </div>

            <h3 className="text-[15px] font-semibold text-[#1F2124] leading-snug mb-2 group-hover:text-[#6F4086] transition-colors line-clamp-2">
              {product.name}
            </h3>

            {product.short_description && (
              <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2 mb-3">
                {stripHtml(product.short_description)}
              </p>
            )}

            <span className="text-[15px] font-bold text-[#1F2124] mt-auto">
              {getProductDisplayPrice(product)}
            </span>
          </Link>
        );
      })}
    </div>
  );
};
