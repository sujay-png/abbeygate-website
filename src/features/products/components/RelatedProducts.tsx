import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { ArrowIcon } from "@/components/ui/ArrowIcon";
import { getStoreProducts } from "@/features/products/services/store-products";
import { getProductDisplayPrice, stripHtml } from "@/features/products/utils/product-helpers";

export const RelatedProducts = async ({ categoryId }: { categoryId?: number }) => {
  let products: Awaited<ReturnType<typeof getStoreProducts>>["products"] = [];

  try {
    const result = await getStoreProducts({ categoryId, perPage: 4 });
    products = result.products;
  } catch {
    // Fallback to empty if API unavailable
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="relative inline-block">
            <h2 className="text-3xl font-extrabold text-black tracking-tight">
              You May Also Like
            </h2>
            <ArrowIcon className="absolute -right-22 -top-1 hidden md:block" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2 lg:px-12 xl:px-20">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              title={product.name}
              description={stripHtml(product.short_description)}
              price={getProductDisplayPrice(product)}
              imageUrl={product.images[0]?.thumbnail || product.images[0]?.src}
              href={`/product/${product.slug}`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
};
