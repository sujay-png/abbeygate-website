'use client';

import { useState, useEffect } from 'react';
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { getProductBaseAmount, stripHtml } from "@/features/products/utils/product-helpers";
import { getRelatedProductsAction } from '../actions/get-related-products';
import type { StoreProduct } from '../types/store-product';

export const RelatedProductsClient = ({ 
  categoryId, 
  currentProductId, 
  currentProductName, 
  currentColor,
  initialProductsNode
}: { 
  categoryId?: number; 
  currentProductId?: number; 
  currentProductName?: string; 
  currentColor?: string; 
  initialProductsNode?: React.ReactNode;
}) => {
  const [products, setProducts] = useState<StoreProduct[] | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [initialRenderProductId, setInitialRenderProductId] = useState<number | undefined>(currentProductId);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    // If the product changed from the one we first rendered with, fetch new related products
    if (currentProductId !== initialRenderProductId) {
      const fetchProducts = async () => {
        const fetched = await getRelatedProductsAction({
          categoryId,
          currentProductId,
          currentProductName,
          currentColor
        });
        setProducts(fetched);
      };
      fetchProducts();
    }
  }, [currentProductId, currentProductName, currentColor, categoryId, initialRenderProductId]);

  // Use the server-rendered node on first load and for the initial product to avoid layout shift and preserve SEO
  if (!isClient || (currentProductId === initialRenderProductId && !products)) {
    return <>{initialProductsNode}</>;
  }

  if (!products || !products.length) return null;

  return (
    <section className="py-16 md:py-24 bg-brand-cream border-t border-[var(--brand-border)]">
      <Container>
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-[28px] md:text-[32px] font-bold text-brand-primary-dark">You May Also Like</h2>
          <div className="hidden md:flex gap-2">
          </div>
        </div>
        
        <div className="relative -mx-6 px-6 overflow-x-auto pb-8 md:mx-0 md:px-0 md:pb-0 hide-scrollbar">
          <div className="flex md:grid md:grid-cols-5 gap-4 md:gap-6 w-[max-content] md:w-auto min-w-full">
            {products.map((product) => (
              <div key={product.id} className="w-[210px] md:w-auto shrink-0">
                <ProductCard
                  title={product.name}
                  description={stripHtml(product.short_description)}
                  baseAmount={getProductBaseAmount(product)}
                  imageUrl={product.images[0]?.thumbnail || product.images[0]?.src}
                  href={`/product/${product.slug}`}
                  compact={true}
                />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
