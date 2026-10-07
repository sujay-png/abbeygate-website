'use client';

import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ProductGrid } from './ProductGrid';
import { ProductFilters } from './ProductFilters';
import type { StoreProduct, StoreAttribute, StoreAttributeTerm } from '../types/store-product';
import type { FilterConfig } from '@/data/category-routes';
import { parseFiltersFromSearchParams, productMatchesFilters, sortProducts, type SortOption } from '../utils/product-helpers';
import { ExpandableDescription } from './ExpandableDescription';

type CategoryPageContentProps = {
  title: string;
  description?: string;
  breadcrumbItems: { label: string; href?: string }[];
  allProducts: StoreProduct[];
  attributes: StoreAttribute[];
  attributeTerms: Record<number, StoreAttributeTerm[]>;
  filterConfig: FilterConfig;
};

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackViewItemList } from '@/lib/analytics';

export const CategoryPageContent = ({
  title,
  description,
  breadcrumbItems,
  allProducts,
  attributes,
  attributeTerms,
  filterConfig,
}: CategoryPageContentProps) => {
  // Filters live in the URL but are applied here on the client, so changing them is instant.
  const searchParams = useSearchParams();

  useEffect(() => {
    if (allProducts.length > 0) {
      trackViewItemList(title, allProducts);
    }
  }, [title, allProducts]);

  const filteredProducts = useMemo(() => {
    const filters = parseFiltersFromSearchParams(Object.fromEntries(searchParams.entries()));
    const sort = (searchParams.get('sort') || 'bestselling') as SortOption;
    return sortProducts(allProducts.filter((p) => productMatchesFilters(p, filters)), sort);
  }, [allProducts, searchParams]);

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
          clientSideFiltering
        />

        <div className="mt-8">
          <ProductGrid products={filteredProducts} hasProductsInCategory={allProducts.length > 0} />
        </div>
      </Container>
    </div>
  );
};
