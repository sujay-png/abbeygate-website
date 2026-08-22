'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { StoreAttribute, StoreAttributeTerm, StoreProduct } from '../types/store-product';
import { FILTER_TAXONOMY_MAP, type FilterParamKey } from '../types/store-product';
import type { FilterConfig } from '@/data/category-routes';
import { countProductsForTerm, filtersToSearchParams } from '../utils/product-helpers';
import { X, ChevronRight, ChevronDown } from 'lucide-react';

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
  
  // Mobile Modal States
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [mobileOpenSection, setMobileOpenSection] = useState<FilterParamKey | null>(null);
  
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
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isMobileModalOpen) {
       document.body.style.overflow = 'hidden';
    } else {
       document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMobileModalOpen]);

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

  return (
    <div className={`mb-10 bg-white ${isLoading ? 'opacity-60 transition-opacity' : ''}`}>
      
      {/* Mobile filter bar: matches desktop visually and scrolls instead of squeezing controls. */}
      <div className="md:hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <h3 className="text-lg font-semibold text-brand-primary-dark m-0">Filters</h3>
          <span className="text-sm text-brand-grey font-medium whitespace-nowrap">
            {resultCount ?? products.length} products
          </span>
        </div>
        <div className="overflow-x-auto overscroll-x-contain border-y border-brand-border" aria-label="Product filters">
          <div className="flex min-w-max bg-white">
            {(Object.keys(FILTER_TAXONOMY_MAP) as FilterParamKey[]).map((key) => {
              const disabled = isFilterDisabled(key);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setMobileOpenSection(key);
                    setIsMobileModalOpen(true);
                  }}
                  className={`flex min-w-[152px] items-center justify-between border-r border-brand-border px-5 py-5 text-[15px] font-medium transition-colors last:border-r-0 ${
                    disabled
                      ? 'cursor-not-allowed bg-brand-tint text-brand-grey opacity-60'
                      : 'bg-white text-brand-body hover:bg-brand-tint'
                  }`}
                >
                  {FILTER_LABELS[key]}
                  <ChevronDown className="ml-6 h-4 w-4 text-brand-grey" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile Active Filters */}
      <div className="md:hidden px-4 py-4">
        {activeCount > 0 && activeFiltersMarkup}
      </div>

      {/* Desktop Top Bar */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-4 px-6 py-4">
        <h3 className="text-lg font-semibold text-brand-primary-dark m-0">Filters</h3>
        {activeFiltersMarkup}
        <span className="text-sm text-brand-grey font-medium">
          {resultCount ?? products.length} products
        </span>
      </div>

      {/* Desktop Horizontal Filters */}
      <div className="hidden md:flex w-full border-t border-b border-brand-border bg-white">
        {(Object.keys(FILTER_TAXONOMY_MAP) as FilterParamKey[]).map((key) => {
          const disabled = isFilterDisabled(key);
          const attr = getAttributeForFilter(key);
          const terms = attr ? (attributeTerms[attr.id] ?? []) : [];
          const taxonomy = FILTER_TAXONOMY_MAP[key];

          return (
            <div
              key={key}
              className={`relative flex-1 border-r border-brand-border last:border-r-0 bg-white ${
                disabled ? 'opacity-40 pointer-events-none bg-brand-tint' : ''
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => !disabled && setOpenDropdown(openDropdown === key ? null : key)}
                className={`w-full px-5 py-5 flex items-center justify-between text-[15px] font-medium transition-colors bg-white ${
                  disabled ? 'text-brand-grey' : 'text-brand-body hover:bg-brand-tint'
                }`}
              >
                {FILTER_LABELS[key]}
                <span
                  className={`text-[10px] text-brand-grey transition-transform ${
                    openDropdown === key ? 'rotate-180' : ''
                  }`}
                >
                  ▼
                </span>
              </button>

              {openDropdown === key && !disabled && (
                <div className="absolute top-full left-[-1px] w-[calc(100%+2px)] bg-white border border-brand-border border-t-0 z-50 max-h-[300px] overflow-y-auto shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
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
                          className={`flex items-center gap-2 text-sm text-brand-body cursor-pointer ${
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
      </div>
      
      {/* Mobile Fullscreen Filter Modal */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-white md:hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-brand-border">
            <h3 className="text-xl font-bold text-brand-body m-0">Filters</h3>
            <button onClick={() => setIsMobileModalOpen(false)} className="text-brand-grey hover:text-brand-primary-dark transition-colors p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
             <div className="flex flex-col">
               {(Object.keys(FILTER_TAXONOMY_MAP) as FilterParamKey[]).map((key) => {
                 const disabled = isFilterDisabled(key);
                 if (disabled) return null;
                 
                 const attr = getAttributeForFilter(key);
                 const terms = attr ? (attributeTerms[attr.id] ?? []) : [];
                 const taxonomy = FILTER_TAXONOMY_MAP[key];
                 const isOpen = mobileOpenSection === key;

                 return (
                   <div key={key} className="border-b border-brand-border bg-white">
                      <button 
                        type="button"
                        onClick={() => setMobileOpenSection(isOpen ? null : key)} 
                        className="flex items-center justify-between w-full p-5 text-[16px] font-medium text-brand-body"
                      >
                         {FILTER_LABELS[key]}
                         {isOpen ? <ChevronDown className="w-5 h-5 text-brand-grey" /> : <ChevronRight className="w-5 h-5 text-brand-grey" />}
                      </button>
                      
                      {isOpen && (
                         <div className="px-5 pb-5 flex flex-col gap-4">
                           {terms.map((term) => {
                             const count = countProductsForTerm(products, taxonomy, term.slug, selectedFilters, key);
                             if (count === 0 && !selectedFilters[key].includes(term.slug)) return null;
                             
                             const isChecked = selectedFilters[key].includes(term.slug);
                             const isDisabled = count === 0 && !isChecked;
                             
                             return (
                               <label
                                 key={term.slug}
                                 className={`flex items-center gap-3 text-[15px] text-brand-body cursor-pointer ${
                                   isDisabled ? 'opacity-35 pointer-events-none' : ''
                                 }`}
                               >
                                 <input
                                   type="checkbox"
                                   checked={isChecked}
                                   disabled={isDisabled}
                                   onChange={() => toggleFilter(key, term.slug)}
                                   className="cursor-pointer w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                                 />
                                 <span className="flex-1">{term.name}</span>
                                 <span className="text-brand-grey text-[13px]">
                                   ({count})
                                 </span>
                               </label>
                             );
                           })}
                         </div>
                      )}
                   </div>
                 );
               })}
             </div>
          </div>
          
          <div className="p-5 border-t border-brand-border bg-white flex items-center justify-between gap-4 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <button 
              type="button"
              onClick={clearAll} 
              className="text-brand-body underline text-[15px] font-medium px-2 py-3 hover:text-brand-primary transition-colors"
            >
              Clear all
            </button>
            <button 
              type="button"
              onClick={() => setIsMobileModalOpen(false)} 
              className="flex-1 bg-brand-primary-dark text-white px-6 py-3.5 rounded-lg font-bold text-[15px] hover:bg-brand-primary-dark transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};
