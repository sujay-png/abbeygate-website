import { Suspense } from 'react';
import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { getStoreProducts } from '@/features/products/services/store-products';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search | Abbeygate England',
  robots: {
    index: false,
    follow: true,
  }
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q as string) || '';

  // Fetch all products (up to 3 pages) for manual filtering
  const pagePromises = [1, 2, 3].map(page => getStoreProducts({ perPage: 100, page }));
  const results = await Promise.all(pagePromises);
  
  const allProducts = results.flatMap(res => res.products);
  
  // Deduplicate just in case
  const productMap = new Map();
  allProducts.forEach(p => productMap.set(p.id, p));
  const uniqueProducts = Array.from(productMap.values());

  // Remove the word "sku" from the search terms so it doesn't fail normal word checks,
  // but keep it in the cleanQuery if we want. Actually, it's safer to just let the text include "sku".
  const searchTerms = query.toLowerCase().replace(/sku:?/g, '').split(/\s+/).filter(Boolean);
  
  // For the clean string match (SKUs), we remove all punctuation and also the letters "sku"
  // so if someone searches "SKU: NH-BK", cleanQuery is "nhbk", which matches the product's clean SKU.
  const cleanQuery = query.toLowerCase().replace(/sku:?/g, '').replace(/[\W_]+/g, '');
  
  const products = uniqueProducts.filter((product) => {
    // Include the word "sku" in the searchable text just in case!
    const searchableText = `${product.name} sku ${product.sku || ''} ${product.description || ''} ${product.short_description || ''}`.toLowerCase();
    const cleanSearchableText = searchableText.replace(/sku/g, '').replace(/[\W_]+/g, '');
    
    // Check if the stripped query matches the stripped text (perfect for SKUs without hyphens)
    if (cleanQuery && cleanSearchableText.includes(cleanQuery)) {
      return true;
    }
    
    return searchTerms.every(term => {
      if (searchableText.includes(term)) return true;
      if (term.endsWith('ies') && searchableText.includes(term.replace(/ies$/, 'y'))) return true;
      if (term.endsWith('s') && searchableText.includes(term.slice(0, -1))) return true;
      if (!term.endsWith('s') && searchableText.includes(term + 's')) return true;
      return false;
    });
  });

  return (
    <div className="bg-brand-cream min-h-screen">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Search Results' }]} />

      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-body mb-4">
            Search Results
          </h1>
          {products.length > 0 && (
            <p className="text-gray-700">
              Found {products.length} product{products.length === 1 ? '' : 's'} for "{query}"
            </p>
          )}
        </div>

        {products.length > 0 ? (
          <Suspense fallback={<div className="py-10 text-center">Loading products...</div>}>
            <ProductGrid products={products} />
          </Suspense>
        ) : (
          <div className="py-16 text-center text-gray-500 abbeygate-search-no-results">
            <p className="mb-4 text-lg">
              Sorry, we can't find any results for "<strong>{query}</strong>", please try again or browse the navigation.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
}
