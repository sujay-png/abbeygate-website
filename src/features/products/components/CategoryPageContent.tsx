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
    <div className="py-10">
      <Container>
        <Breadcrumb paths={breadcrumbItems} />
        <h1 className="text-3xl font-extrabold text-black mt-6 mb-8">{title}</h1>

        <ProductFilters
          products={allProducts}
          attributes={attributes}
          attributeTerms={attributeTerms}
          filterConfig={filterConfig}
        />

        <ProductGrid products={filteredProducts} />
      </Container>
    </div>
  );
};
