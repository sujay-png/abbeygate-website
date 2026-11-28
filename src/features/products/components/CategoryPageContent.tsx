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

import { useEffect, useMemo, useState } from 'react';
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
  // Keep SSR output full & static (for Edge ISR + SEO) and apply URL filters client-side.
  const [searchString, setSearchString] = useState('');

  useEffect(() => {
    const syncFromLocation = () => setSearchString(window.location.search || '');
    const handleFilterChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setSearchString(typeof detail === 'string' ? detail : (window.location.search || ''));
    };

    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('abbeygate:filters-changed', handleFilterChange);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('abbeygate:filters-changed', handleFilterChange);
    };
  }, []);

  useEffect(() => {
    if (allProducts.length > 0) {
      trackViewItemList(title, allProducts);
    }
  }, [title, allProducts]);

  const filteredProducts = useMemo(() => {
    const params = new URLSearchParams(searchString);
    const filters = parseFiltersFromSearchParams(Object.fromEntries(params.entries()));
    const sort = (params.get('sort') || 'bestselling') as SortOption;
    return sortProducts(allProducts.filter((p) => productMatchesFilters(p, filters)), sort);
  }, [allProducts, searchString]);

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
          searchString={searchString}
        />

        <div className="mt-8">
          <ProductGrid products={filteredProducts} hasProductsInCategory={allProducts.length > 0} />
        </div>
      </Container>
    </div>
  );
};
