import { Suspense } from 'react';
import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ProductGrid } from '@/features/products/components/ProductGrid';
import { ProductFilters } from '@/features/products/components/ProductFilters';
import { getStoreProducts } from '@/features/products/services/store-products';
import { getFilterDataForProducts, preloadFilterAttributes, toListingProduct } from '@/features/products/services/filter-helpers';
import { parseFiltersFromSearchParams, productMatchesFilters, sortProducts, type SortOption } from '@/features/products/utils/product-helpers';
import { searchProducts } from '@/features/products/utils/search-helpers';
import { Metadata } from 'next';

import { getSEOMetadata } from '@/lib/seo';
export const metadata: Metadata = getSEOMetadata("/search");

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

import { SearchTracker } from './SearchTracker';

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q as string) || '';

  preloadFilterAttributes();

  // Fetch all products (up to 3 pages) for manual filtering
  const pagePromises = [1, 2, 3].map(page => getStoreProducts({ perPage: 100, page }));
  const results = await Promise.all(pagePromises);
  
  const allProducts = results.flatMap(res => res.products);
  
  // Deduplicate just in case
  const productMap = new Map();
  allProducts.forEach(p => productMap.set(p.id, p));
  const uniqueProducts = Array.from(productMap.values());

  // Search products with synonym support (Colourlux = Graphic Print, Dorchester = New Hide = Newhide)
  const searchedProductsRaw = searchProducts(uniqueProducts, query);

  // Get filter terms and inject Product Type based on the found products
  const filterData = await getFilterDataForProducts(searchedProductsRaw);
  const { filterAttributes, attributeTerms } = filterData;
  const searchedProducts = filterData.allProducts.map(toListingProduct);

  const filters = parseFiltersFromSearchParams(params);
  const sort = typeof params?.sort === 'string' ? params.sort : 'bestselling';
  const filteredProducts = sortProducts(
    searchedProducts.filter((p) => productMatchesFilters(p, filters)),
    sort as SortOption
  );

  // Check if any of the matched search results have specific attributes so we can grey out columns
  const hasSize = searchedProducts.some(p => p.attributes.some(a => a.taxonomy === 'pa_size'));
  const hasLayout = searchedProducts.some(p => p.attributes.some(a => a.taxonomy === 'pa_layout'));
  const hasColour = searchedProducts.some(p => p.attributes.some(a => a.taxonomy === 'pa_colour'));
  const hasCollection = searchedProducts.some(p => p.attributes.some(a => a.taxonomy === 'pa_collection'));
  const hasProductType = searchedProducts.some(p => p.attributes.some(a => a.taxonomy === 'pa_product-type'));

  const filterConfig = {
    disableCollection: !hasCollection,
    disableLayout: !hasLayout,
    disableSize: !hasSize,
    disableProductType: !hasProductType,
  };

  return (
    <div className="bg-brand-cream min-h-screen">
      <SearchTracker searchTerm={query} products={filteredProducts} />
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Search Results' }]} />

      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-body mb-4">
            Search Results
          </h1>
          {searchedProducts.length > 0 && (
            <p className="text-gray-700">
              Found {searchedProducts.length} product{searchedProducts.length === 1 ? '' : 's'} for "{query}"
            </p>
          )}
        </div>

        {searchedProducts.length > 0 && (
          <ProductFilters
            products={searchedProducts}
            attributes={filterAttributes}
            attributeTerms={attributeTerms}
            filterConfig={filterConfig}
            resultCount={filteredProducts.length}
          />
        )}

        {filteredProducts.length > 0 ? (
          <div className="mt-8">
            <Suspense fallback={<div className="py-10 text-center">Loading products...</div>}>
              <ProductGrid products={filteredProducts} />
            </Suspense>
          </div>
        ) : (
          searchedProducts.length > 0 ? (
            <div className="py-16 text-center text-gray-500">
              <p className="mb-4 text-lg">No products match your selected filters.</p>
            </div>
          ) : (
            <div className="py-16 text-center text-gray-500 abbeygate-search-no-results">
              <p className="mb-4 text-lg">
                Sorry, we can't find any results for "<strong>{query}</strong>", please try again or browse the navigation.
              </p>
            </div>
          )
        )}
      </Container>
    </div>
  );
}
