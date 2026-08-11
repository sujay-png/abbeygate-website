import Link from 'next/link';
import type { StoreProduct } from '../types/store-product';
import { getProductDisplayPrice, stripHtml } from '../utils/product-helpers';

type ProductGridProps = {
  products: StoreProduct[];
};

export const ProductGrid = ({ products }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">No products found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/product/${product.slug}`}
          className="group flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
        >
          <div className="h-[260px] w-full flex items-center justify-center p-6 bg-gray-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
              <span className="text-white border border-white px-6 py-2 text-sm font-bold tracking-wider">
                VIEW DETAILS
              </span>
            </div>
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].src}
                alt={product.images[0].alt || product.name}
                className="w-full h-full object-contain scale-105 transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-[120px] h-[160px] bg-gray-200 rounded-r-md shadow-md" />
            )}
          </div>

          <div className="p-5 flex flex-col flex-grow">
            <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2 group-hover:text-black line-clamp-2">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-grow">
              {stripHtml(product.short_description)}
            </p>
            <span className="text-gray-700 font-semibold">{getProductDisplayPrice(product)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};
