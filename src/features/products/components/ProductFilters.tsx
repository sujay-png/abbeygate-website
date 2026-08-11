'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { StoreAttribute, StoreAttributeTerm, StoreProduct } from '../types/store-product';
import { FILTER_TAXONOMY_MAP, type FilterParamKey } from '../types/store-product';
import type { FilterConfig } from '@/data/category-routes';
import { countProductsForTerm, filtersToSearchParams } from '../utils/product-helpers';

type ProductFiltersProps = {
  products: StoreProduct[];
  attributes: StoreAttribute[];
  attributeTerms: Record<number, StoreAttributeTerm[]>;
  filterConfig: FilterConfig;
  resultCount?: number;
};

const FILTER_LABELS: Record<FilterParamKey, string> = {
  filter_collection: 'Collection',
  filter_colour: 'Colour',
  filter_layout: 'Layout',
  filter_size: 'Size',
};

export const ProductFilters = (props: ProductFiltersProps) => (
  <Suspense fallback={<div className="h-20 bg-white animate-pulse rounded mb-8 border border-gray-200" />}>
    <ProductFiltersInner {...props} />
  </Suspense>
);

const ProductFiltersInner = ({
  products,
  attributes,
  attributeTerms,
  filterConfig,
  resultCount,
}: ProductFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filterTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openDropdown, setOpenDropdown] = useState<FilterParamKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedFilters = useMemo(() => {
    const filters: Record<FilterParamKey, string[]> = {
      filter_collection: [],
      filter_colour: [],
      filter_layout: [],
      filter_size: [],
    };

    for (const key of Object.keys(FILTER_TAXONOMY_MAP) as FilterParamKey[]) {
      const value = searchParams.get(key);
      if (value) filters[key] = value.split(',').filter(Boolean);
    }

    return filters;
  }, [searchParams]);

  const isFilterDisabled = (key: FilterParamKey): boolean => {
    if (key === 'filter_collection' && filterConfig.disableCollection) return true;
    if (key === 'filter_layout' && filterConfig.disableLayout) return true;
    if (key === 'filter_size' && filterConfig.disableSize) return true;
    return false;
  };

  const getAttributeForFilter = (key: FilterParamKey) => {
    const taxonomy = FILTER_TAXONOMY_MAP[key];
    return attributes.find((a) => a.taxonomy === taxonomy);
  };

  const applyFilters = useCallback(
    (filters: Record<FilterParamKey, string[]>) => {
      const params = filtersToSearchParams(filters);
      const query = params.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;

      setIsLoading(true);

      if (filterTimeout.current) clearTimeout(filterTimeout.current);
      filterTimeout.current = setTimeout(() => {
        router.push(newUrl, { scroll: false });
        setIsLoading(false);
      }, 400);
    },
    [pathname, router],
  );

  const toggleFilter = (key: FilterParamKey, slug: string) => {
    const current = [...selectedFilters[key]];
    const index = current.indexOf(slug);

    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(slug);
    }

    applyFilters({ ...selectedFilters, [key]: current });
  };

  const removeFilter = (slug: string) => {
    const updated = { ...selectedFilters };
    for (const key of Object.keys(updated) as FilterParamKey[]) {
      updated[key] = updated[key].filter((s) => s !== slug);
    }
    applyFilters(updated);
  };

  const clearAll = () => {
    applyFilters({
      filter_collection: [],
      filter_colour: [],
      filter_layout: [],
      filter_size: [],
    });
  };

  const activeCount = Object.values(selectedFilters).flat().length;

  const getTermName = (key: FilterParamKey, slug: string): string => {
    const attr = getAttributeForFilter(key);
    if (!attr) return slug;
    const terms = attributeTerms[attr.id] ?? [];
    return terms.find((t) => t.slug === slug)?.name ?? slug;
  };

  useEffect(() => {
    const onDocClick = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', onDocClick);
      return () => document.removeEventListener('click', onDocClick);
    }
  }, [openDropdown]);

  useEffect(() => {
    return () => {
      if (filterTimeout.current) clearTimeout(filterTimeout.current);
    };
  }, []);

  return (
    <div className={`mb-10 bg-white ${isLoading ? 'opacity-60 transition-opacity' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-[#333] m-0">Filters</h3>

        <div className="flex flex-wrap gap-2 flex-1">
          {Object.entries(selectedFilters).flatMap(([key, slugs]) =>
            slugs.map((slug) => (
              <button
                key={`${key}-${slug}`}
                type="button"
                onClick={() => removeFilter(slug)}
                className="flex items-center gap-2 bg-[#f1f1f1] hover:bg-[#e2e2e2] px-3.5 py-1.5 rounded-full text-[13px] text-[#444] transition-colors"
              >
                {getTermName(key as FilterParamKey, slug)}
                <span className="font-bold text-[#888]">×</span>
              </button>
            )),
          )}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-[13px] text-[#6F4086] underline self-center ml-2"
            >
              Clear All
            </button>
          )}
        </div>

        <span className="text-sm text-[#666] font-medium">
          {resultCount ?? products.length} products
        </span>
      </div>

      <div className="flex w-full border-t border-b border-[#ddd] bg-white">
        {(Object.keys(FILTER_TAXONOMY_MAP) as FilterParamKey[]).map((key) => {
          const disabled = isFilterDisabled(key);
          const attr = getAttributeForFilter(key);
          const terms = attr ? (attributeTerms[attr.id] ?? []) : [];
          const taxonomy = FILTER_TAXONOMY_MAP[key];

          return (
            <div
              key={key}
              className={`relative flex-1 border-r border-[#ddd] last:border-r-0 bg-white ${
                disabled ? 'opacity-40 pointer-events-none bg-[#f7f7f7]' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => !disabled && setOpenDropdown(openDropdown === key ? null : key)}
                className={`w-full px-5 py-5 flex items-center justify-between text-[15px] font-medium transition-colors bg-white ${
                  disabled ? 'text-[#999]' : 'text-[#444] hover:bg-[#f9f9f9]'
                }`}
              >
                {FILTER_LABELS[key]}
                <span
                  className={`text-[10px] text-[#888] transition-transform ${
                    openDropdown === key ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>

              {openDropdown === key && !disabled && (
                <div className="absolute top-full left-[-1px] w-[calc(100%+2px)] bg-white border border-[#ddd] border-t-0 z-50 max-h-[300px] overflow-y-auto shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
                  <div className="p-4 flex flex-col gap-2.5">
                    {terms.map((term) => {
                      const count = countProductsForTerm(
                        products,
                        taxonomy,
                        term.slug,
                        selectedFilters,
                        key,
                      );
                      if (count === 0 && !selectedFilters[key].includes(term.slug)) return null;

                      const isChecked = selectedFilters[key].includes(term.slug);
                      const isDisabled = count === 0 && !isChecked;

                      return (
                        <label
                          key={term.slug}
                          className={`flex items-center gap-2 text-sm text-[#444] cursor-pointer ${
                            isDisabled ? 'opacity-35 pointer-events-none' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => toggleFilter(key, term.slug)}
                            className="cursor-pointer"
                          />
                          <span className="flex-1 pl-2">{term.name}</span>
                          <span className="bg-[#f1f1f1] text-[#555] text-[11px] font-semibold px-2 py-0.5 rounded-xl">
                            {count}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
