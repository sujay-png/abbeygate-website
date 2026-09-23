import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ProductGrid } from './ProductGrid';
import { ProductFilters } from './ProductFilters';
import type { StoreProduct, StoreAttribute, StoreAttributeTerm } from '../types/store-product';
import type { FilterConfig } from '@/data/category-routes';
import { productMatchesFilters, sortProducts, type SortOption } from '../utils/product-helpers';
import type { ProductFilters as ProductFiltersType } from '../types/store-product';
import { ExpandableDescription } from './ExpandableDescription';

type CategoryPageContentProps = {
  title: string;
  description?: string;
  breadcrumbItems: { label: string; href?: string }[];
  allProducts: StoreProduct[];
  filters: ProductFiltersType;
  attributes: StoreAttribute[];
  attributeTerms: Record<number, StoreAttributeTerm[]>;
  filterConfig: FilterConfig;
  sort?: string;
};

export const CategoryPageContent = ({
  title,
  description,
  breadcrumbItems,
  allProducts,
  filters,
  attributes,
  attributeTerms,
  filterConfig,
  sort = 'bestselling',
}: CategoryPageContentProps) => {
  const filteredProducts = sortProducts(
    allProducts.filter((p) => productMatchesFilters(p, filters)),
    sort as SortOption
  );

  return (
    <div className="bg-brand-cream min-h-screen">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, ...breadcrumbItems]} />

      <Container className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-primary-dark mb-4 leading-tight tracking-tight">
            {title}
          </h1>
          {description && <ExpandableDescription description={description} />}
        </div>

        <ProductFilters
          products={allProducts}
          attributes={attributes}
          attributeTerms={attributeTerms}
          filterConfig={filterConfig}
          resultCount={filteredProducts.length}
        />

        <div className="mt-8">
          <ProductGrid products={filteredProducts} />
        </div>
      </Container>
    </div>
  );
};
