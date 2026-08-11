import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ProductGrid } from './ProductGrid';
import { ProductFilters } from './ProductFilters';
import type { StoreProduct, StoreAttribute, StoreAttributeTerm } from '../types/store-product';
import type { FilterConfig } from '@/data/category-routes';
import { productMatchesFilters } from '../utils/product-helpers';
import type { ProductFilters as ProductFiltersType } from '../types/store-product';

type CategoryPageContentProps = {
  title: string;
  breadcrumbItems: { label: string; href?: string }[];
  allProducts: StoreProduct[];
  filters: ProductFiltersType;
  attributes: StoreAttribute[];
  attributeTerms: Record<number, StoreAttributeTerm[]>;
  filterConfig: FilterConfig;
};

export const CategoryPageContent = ({
  title,
  breadcrumbItems,
  allProducts,
  filters,
  attributes,
  attributeTerms,
  filterConfig,
}: CategoryPageContentProps) => {
  const filteredProducts = allProducts.filter((p) => productMatchesFilters(p, filters));

  return (
    <div className="bg-white min-h-screen">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, ...breadcrumbItems]} />

      <Container className="py-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1F2124] mb-2">{title}</h1>
        <p className="text-sm text-gray-500 mb-8">
          Showing {filteredProducts.length} of {allProducts.length} products
        </p>

        <ProductFilters
          products={allProducts}
          attributes={attributes}
          attributeTerms={attributeTerms}
          filterConfig={filterConfig}
          resultCount={filteredProducts.length}
        />

        <ProductGrid products={filteredProducts} />
      </Container>
    </div>
  );
};
