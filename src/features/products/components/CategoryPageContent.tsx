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
  description?: string;
  breadcrumbItems: { label: string; href?: string }[];
  allProducts: StoreProduct[];
  filters: ProductFiltersType;
  attributes: StoreAttribute[];
  attributeTerms: Record<number, StoreAttributeTerm[]>;
  filterConfig: FilterConfig;
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
}: CategoryPageContentProps) => {
  const filteredProducts = allProducts.filter((p) => productMatchesFilters(p, filters));

  return (
    <div className="bg-brand-cream min-h-screen">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, ...breadcrumbItems]} />

      <Container className="py-8">
        <ProductFilters
          products={allProducts}
          attributes={attributes}
          attributeTerms={attributeTerms}
          filterConfig={filterConfig}
          resultCount={filteredProducts.length}
        />

        <div className="mt-8">
          <div className="max-w-3xl mb-10 md:mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-primary-dark mb-4">
              {title}
            </h1>

            {description && (
              <div
                className="prose prose-sm md:prose-base text-brand-body"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </div>

          <ProductGrid products={filteredProducts} />
        </div>
      </Container>
    </div>
  );
};
