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
    <div className="bg-white min-h-screen">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, ...breadcrumbItems]} />

      <Container className="py-8">
        <ProductFilters
          products={allProducts}
          attributes={attributes}
          attributeTerms={attributeTerms}
          filterConfig={filterConfig}
          resultCount={filteredProducts.length}
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-8">
          <div className="lg:w-1/3 flex-shrink-0">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1F2124] mb-4">
              {title}
            </h1>
            
            {description && (
              <div 
                className="prose prose-sm md:prose-base text-gray-700" 
                dangerouslySetInnerHTML={{ __html: description }} 
              />
            )}
          </div>
          
          <div className="lg:w-2/3">
            <ProductGrid products={filteredProducts} />
          </div>
        </div>
      </Container>
    </div>
  );
};
