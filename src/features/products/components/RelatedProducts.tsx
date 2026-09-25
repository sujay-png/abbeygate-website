import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/ui/ProductCard";
import { getStoreProducts } from "@/features/products/services/store-products";
import { getProductBaseAmount, stripHtml } from "@/features/products/utils/product-helpers";

export const RelatedProducts = async ({ categoryId, currentProductId, currentProductName, currentColor }: { categoryId?: number, currentProductId?: number, currentProductName?: string, currentColor?: string }) => {
  let products: Awaited<ReturnType<typeof getStoreProducts>>["products"] = [];

  try {
    // Fetch a larger pool to pick from
    const res = await getStoreProducts({ categoryId, perPage: 40 });
    
    // Helper to extract product type (notebook, diary, key fob, etc.)
    const getProductType = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('notebook')) return 'notebook';
      if (lower.includes('diary')) return 'diary';
      if (lower.includes('key fob') || lower.includes('keyring')) return 'keyfob';
      if (lower.includes('luggage tag')) return 'luggagetag';
      if (lower.includes('card holder')) return 'cardholder';
      if (lower.includes('case')) return 'case';
      return '';
    };

    const currentType = currentProductName ? getProductType(currentProductName) : '';
    let currentBaseName = '';
    if (currentProductName) {
      currentBaseName = currentProductName.split(',')[0].trim();
    }

    // Filter out the exact product AND any products of the EXACT same type (e.g. no other notebooks)
    const allProducts = res.products.filter(p => {
      if (p.id === currentProductId) return false;
      if (currentType && getProductType(p.name) === currentType) return false;
      if (currentBaseName) {
        const pBaseName = p.name.split(',')[0].trim();
        if (pBaseName.toLowerCase() === currentBaseName.toLowerCase()) return false;
      }
      return true;
    });
    
    // Helper to extract a broad color family from a string
    const getBroadColor = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('blue') || lower.includes('navy') || lower.includes('teal')) return 'blue';
      if (lower.includes('red') || lower.includes('burgundy') || lower.includes('pink') || lower.includes('rose')) return 'red';
      if (lower.includes('green') || lower.includes('sage')) return 'green';
      if (lower.includes('black') || lower.includes('charcoal')) return 'black';
      if (lower.includes('brown') || lower.includes('tan') || lower.includes('mustard')) return 'brown';
      if (lower.includes('grey') || lower.includes('gray') || lower.includes('silver')) return 'grey';
      return '';
    };

    const targetBroadColor = currentColor ? getBroadColor(currentColor) : '';

    // Filter so ONLY items matching the broad color family are included in this local collection pass
    let colorFilteredProducts = allProducts;
    if (targetBroadColor) {
      colorFilteredProducts = allProducts.filter(p => getBroadColor(p.name) === targetBroadColor);
    }

    const selected: typeof allProducts = [];
    const groupCounts = new Map<string, number>();
    const MAX_PER_GROUP = 1;

    for (const p of colorFilteredProducts) {
      if (selected.length >= 8) break;
      // Group by the base product name (everything before the comma)
      const baseName = p.name.split(',')[0].trim();
      const count = groupCounts.get(baseName) || 0;
      if (count < MAX_PER_GROUP) {
        selected.push(p);
        groupCounts.set(baseName, count + 1);
      }
    }

    // Fallback: If the collection is very small (like Apple Peel), fill the rest with products from other collections!
    if (selected.length < 4) {
      const fallbackRes = await getStoreProducts({ perPage: 60 });
      let fallbackProducts = fallbackRes.products.filter(p => {
        if (p.id === currentProductId) return false;
        if (currentType && getProductType(p.name) === currentType) return false;
        if (currentBaseName) {
          const pBaseName = p.name.split(',')[0].trim();
          if (pBaseName.toLowerCase() === currentBaseName.toLowerCase()) return false;
        }
        return true;
      });

      if (targetBroadColor) {
        fallbackProducts = fallbackProducts.filter(p => getBroadColor(p.name) === targetBroadColor);
      }

      for (const p of fallbackProducts) {
        if (selected.length >= 8) break;
        const baseName = p.name.split(',')[0].trim();
        if (!groupCounts.has(baseName)) {
          selected.push(p);
          groupCounts.set(baseName, 1);
        }
      }
    }

    products = selected;
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
          <div className="flex md:grid md:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6 w-[max-content] md:w-auto min-w-full">
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

