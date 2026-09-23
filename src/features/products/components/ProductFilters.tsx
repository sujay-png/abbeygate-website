'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { StoreAttribute, StoreAttributeTerm, StoreProduct } from '../types/store-product';
import { FILTER_TAXONOMY_MAP, type FilterParamKey } from '../types/store-product';
import type { FilterConfig } from '@/data/category-routes';
import { countProductsForTerm, filtersToSearchParams } from '../utils/product-helpers';
import { ChevronDown, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { SortOption } from '../utils/product-helpers';

type ProductFiltersProps = {
  products: StoreProduct[];
  attributes: StoreAttribute[];
  attributeTerms: Record<number, StoreAttributeTerm[]>;
  filterConfig: FilterConfig;
  resultCount?: number;
};

const FILTER_LABELS: Record<FilterParamKey, string> = {
  filter_size: 'Size',
  filter_colour: 'Colour',
  filter_layout: 'Layout',
  filter_collection: 'Collection',
  filter_product_type: 'Product Type',
};

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Bestselling', value: 'bestselling' },
  { label: 'Date Added: New - Old', value: 'date-new' },
  { label: 'Date Added: Old - New', value: 'date-old' },
  { label: 'Price: Low - High', value: 'price-low' },
  { label: 'Price: High - Low', value: 'price-high' },
];

export const ProductFilters = (props: ProductFiltersProps) => (
  <Suspense fallback={<div className="h-20 bg-brand-cream animate-pulse rounded mb-8 border border-gray-200" />}>
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
  
  const [openDropdown, setOpenDropdown] = useState<FilterParamKey | 'sort' | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentSort = (searchParams.get('sort') as SortOption) || 'bestselling';

  const selectedFilters = useMemo(() => {
    const filters: Record<FilterParamKey, string[]> = {
      filter_collection: [],
      filter_colour: [],
      filter_layout: [],
      filter_size: [],
      filter_product_type: [],
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
    if (key === 'filter_product_type' && filterConfig.disableProductType) return true;
    return false;
  };

  const getAttributeForFilter = (key: FilterParamKey) => {
    const taxonomy = FILTER_TAXONOMY_MAP[key];
    return attributes.find((a) => a.taxonomy === taxonomy);
  };

  const applyFilters = useCallback(
    (filters: Record<FilterParamKey, string[]>, newSort?: string) => {
      const params = filtersToSearchParams(filters);
      const sortToApply = newSort || searchParams.get('sort');
      if (sortToApply && sortToApply !== 'bestselling') {
        params.set('sort', sortToApply);
      }
      
      const query = params.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;

      setIsLoading(true);

      if (filterTimeout.current) clearTimeout(filterTimeout.current);
      filterTimeout.current = setTimeout(() => {
        router.push(newUrl, { scroll: false });
        setIsLoading(false);
      }, 400);
    },
    [pathname, router, searchParams],
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
      filter_product_type: [],
    });
  };

  const handleSortChange = (sort: SortOption) => {
    applyFilters(selectedFilters, sort);
    setOpenDropdown(null);
  };

  const activeCount = Object.values(selectedFilters).flat().length;

  const formatTermName = (name: string): string => {
    if (name.toLowerCase() === 'keychains') return 'Key Fobs';
    return name;
  };

  const getTermName = (key: FilterParamKey, slug: string): string => {
    const attr = getAttributeForFilter(key);
    if (!attr) return formatTermName(slug);
    const terms = attributeTerms[attr.id] ?? [];
    const name = terms.find((t) => t.slug === slug)?.name ?? slug;
    return formatTermName(name);
  };

  useEffect(() => {
    const onDocClick = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', onDocClick);
      return () => document.removeEventListener('click', onDocClick);
    }
  }, [openDropdown]);

  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    return () => {
      if (filterTimeout.current) clearTimeout(filterTimeout.current);
    };
  }, []);
  
  const activeFiltersMarkup = (
    <div className="flex flex-wrap gap-2 flex-1">
      {Object.entries(selectedFilters).flatMap(([key, slugs]) =>
        slugs.map((slug) => (
          <button
            key={`${key}-${slug}`}
            type="button"
            onClick={() => removeFilter(slug)}
            className="flex items-center gap-2 bg-brand-tint hover:bg-brand-soft px-3.5 py-1.5 rounded-full text-[13px] text-brand-body transition-colors"
          >
            {getTermName(key as FilterParamKey, slug)}
            <span className="font-bold text-brand-grey">×</span>
          </button>
        )),
      )}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-[13px] text-brand-primary underline self-center ml-2"
        >
          Clear All
        </button>
      )}
    </div>
  );

  const renderSortDropdown = () => (
    <div className="absolute top-full left-[-1px] w-[calc(100%+2px)] bg-brand-cream border border-brand-border border-t-0 z-40 shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col py-2">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`text-left px-5 py-2.5 text-sm transition-colors ${
              currentSort === opt.value
                ? 'bg-brand-tint text-brand-primary font-bold'
                : 'text-brand-body hover:bg-brand-soft'
            }`}
            onClick={(e) => {
              e.preventDefault();
              handleSortChange(opt.value);
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`mb-10 bg-brand-cream ${isLoading ? 'opacity-60 transition-opacity' : ''}`}>
      
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <h3 className="text-lg font-semibold text-brand-primary-dark m-0">Products</h3>
          <span className="text-sm text-brand-grey font-medium whitespace-nowrap">
            {resultCount ?? products.length} results
          </span>
        </div>
        
        {/* Mobile Action Buttons */}
        <div className="flex border-y border-brand-border bg-brand-cream">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-4 border-r border-brand-border text-brand-body font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters {activeCount > 0 ? `(${activeCount})` : ''}
          </button>
          
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdown(openDropdown === 'sort' ? null : 'sort');
              }}
              className="w-full flex items-center justify-center gap-2 py-4 text-brand-body font-medium"
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort By
            </button>
            {openDropdown === 'sort' && (
              <div className="absolute top-full left-0 right-0 w-full min-w-[200px] bg-brand-cream border-b border-brand-border shadow-md z-40">
                <div className="flex flex-col p-2">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`text-left px-4 py-3 text-[15px] ${
                        currentSort === opt.value
                          ? 'bg-brand-tint text-brand-primary font-bold'
                          : 'text-brand-body hover:bg-brand-soft'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSortChange(opt.value);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Active Filters */}
        <div className="px-4 py-4">
          {activeCount > 0 && activeFiltersMarkup}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
          <h3 className="text-lg font-semibold text-brand-primary-dark m-0">Filters</h3>
          {activeFiltersMarkup}
          <span className="text-sm text-brand-grey font-medium">
            {resultCount ?? products.length} products
          </span>
        </div>

        <div className="flex w-full border-t border-b border-brand-border bg-brand-cream">
          {/* Taxonomy Filters */}
          {(Object.keys(FILTER_TAXONOMY_MAP) as FilterParamKey[]).map((key) => {
            const disabled = isFilterDisabled(key);
            const attr = getAttributeForFilter(key);
            const terms = attr ? (attributeTerms[attr.id] ?? []) : [];
            const taxonomy = FILTER_TAXONOMY_MAP[key];

            return (
              <div
                key={key}
                className={`relative flex-1 border-r border-brand-border bg-brand-cream ${
                  disabled ? 'opacity-40 pointer-events-none bg-brand-tint' : ''
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => !disabled && setOpenDropdown(openDropdown === key ? null : key)}
                  className={`w-full px-5 py-5 flex items-center justify-between text-[15px] font-medium transition-colors ${
                    disabled ? 'bg-brand-cream text-brand-grey' : openDropdown === key ? 'bg-brand-tint text-brand-body' : 'bg-brand-cream text-brand-body hover:bg-brand-tint'
                  }`}
                >
                  {FILTER_LABELS[key]}
                  <ChevronDown
                    className={`ml-2 h-4 w-4 text-brand-grey transition-transform ${
                      openDropdown === key ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {openDropdown === key && !disabled && (
                  <div className="absolute top-full left-[-1px] w-[calc(100%+2px)] bg-brand-cream border border-brand-border border-t-0 z-40 max-h-[300px] overflow-y-auto shadow-[0_4px_10px_rgba(0,0,0,0.08)]" data-lenis-prevent>
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
                            className={`flex items-center gap-2 text-sm text-brand-body cursor-pointer w-full py-1 ${
                              isDisabled ? 'opacity-35 pointer-events-none' : ''
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              if (!isDisabled) toggleFilter(key, term.slug);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isDisabled}
                              readOnly
                              className="cursor-pointer"
                            />
                            <span className="flex-1 pl-2">{formatTermName(term.name)}</span>
                            <span className="bg-brand-tint text-brand-body text-[11px] font-semibold px-2 py-0.5 rounded-xl">
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
          
          {/* Desktop Sort Dropdown */}
          <div className="relative flex-1 bg-brand-cream" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              className={`w-full px-5 py-5 flex items-center justify-between text-[15px] font-medium transition-colors ${
                openDropdown === 'sort' ? 'bg-brand-tint text-brand-body' : 'bg-brand-cream text-brand-body hover:bg-brand-tint'
              }`}
            >
              Sort By
              <ChevronDown
                className={`ml-2 h-4 w-4 text-brand-grey transition-transform ${
                  openDropdown === 'sort' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openDropdown === 'sort' && renderSortDropdown()}
          </div>
        </div>
      </div>

      {/* Mobile Filter Slide-out Panel */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          
          {/* Panel */}
          <div className="relative w-4/5 max-w-sm h-full bg-brand-cream shadow-xl flex flex-col ml-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-5 border-b border-brand-border bg-white">
              <h2 className="text-xl font-bold text-brand-primary-dark m-0">Filters</h2>
              <button 
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 -mr-2 text-brand-grey hover:text-brand-body"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto" data-lenis-prevent>
              <div className="p-5 flex flex-col gap-6">
                {(Object.keys(FILTER_TAXONOMY_MAP) as FilterParamKey[]).map((key) => {
                  const disabled = isFilterDisabled(key);
                  if (disabled) return null;
                  
                  const attr = getAttributeForFilter(key);
                  const terms = attr ? (attributeTerms[attr.id] ?? []) : [];
                  const taxonomy = FILTER_TAXONOMY_MAP[key];

                  return (
                    <div key={key} className="flex flex-col gap-3">
                      <h3 className="font-bold text-[15px] text-brand-body">{FILTER_LABELS[key]}</h3>
                      <div className="flex flex-col gap-2">
                        {terms.map((term) => {
                          const count = countProductsForTerm(products, taxonomy, term.slug, selectedFilters, key);
                          if (count === 0 && !selectedFilters[key].includes(term.slug)) return null;

                          const isChecked = selectedFilters[key].includes(term.slug);
                          const isDisabled = count === 0 && !isChecked;

                          return (
                            <label
                              key={term.slug}
                              className={`flex items-center gap-3 py-1 text-[15px] text-brand-body cursor-pointer ${
                                isDisabled ? 'opacity-40 pointer-events-none' : ''
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                if (!isDisabled) toggleFilter(key, term.slug);
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isDisabled}
                                readOnly
                                className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                              />
                              <span className="flex-1">{formatTermName(term.name)}</span>
                              <span className="text-brand-grey text-sm">({count})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-5 border-t border-brand-border bg-white flex gap-3">
              <button
                type="button"
                onClick={clearAll}
                className="flex-1 py-3 border border-brand-primary text-brand-primary font-bold rounded-md hover:bg-brand-tint transition-colors"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-[2] py-3 bg-brand-primary text-white font-bold rounded-md hover:bg-brand-primary-dark transition-colors"
              >
                Apply Filters {activeCount > 0 && `(${activeCount})`}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};
