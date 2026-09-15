import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { getStoreProducts } from "@/features/products/services/store-products";
import { getProductBaseAmount, stripHtml } from "@/features/products/utils/product-helpers";

export const RelatedProducts = async ({ categoryId }: { categoryId?: number }) => {
  let products: Awaited<ReturnType<typeof getStoreProducts>>["products"] = [];

  try {
    const res = await getStoreProducts({ categoryId, perPage: 8 });
    products = res.products;
  } catch (error) {
    console.error("Failed to fetch related products:", error);
  }

  if (!products.length) return null;

  return (
    <section className="py-16 md:py-24 bg-brand-cream border-t border-[var(--brand-border)]">
      <Container>
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-[28px] md:text-[32px] font-bold text-brand-primary-dark">You May Also Like</h2>
          <div className="hidden md:flex gap-2">
            {/* Optional navigation arrows could go here */}
          </div>
        </div>
        
        <div className="relative -mx-6 px-6 overflow-x-auto pb-8 md:mx-0 md:px-0 md:pb-0 hide-scrollbar">
          <div className="flex md:grid md:grid-cols-4 gap-6 w-[max-content] md:w-auto min-w-full">
            {products.map((product) => (
              <div key={product.id} className="w-[280px] md:w-auto shrink-0">
                <ProductCard
                  title={product.name}
                  description={stripHtml(product.short_description)}
                  baseAmount={getProductBaseAmount(product)}
                  imageUrl={product.images[0]?.thumbnail || product.images[0]?.src}
                  href={`/product/${product.slug}`}
                />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
