'use client';
import { useState, useEffect, useRef } from 'react';
import { searchProductsForBulkOrder, ProductSearchResult } from '@/features/account/services/purchase-lists';

type Props = {
  searchBy: 'name' | 'sku';
  value: string;
  onSelect: (product: ProductSearchResult) => void;
};

export function ProductSearchAutocomplete({ searchBy, value, onSelect }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // Don't search if the query is the same as the selected value (prevents searching again right after selection)
      if (query && query.length >= 2 && query !== value) {
        setIsLoading(true);
        const res = await searchProductsForBulkOrder(query, searchBy);
        setResults(res);
        setIsOpen(true);
        setIsLoading(false);
      } else {
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchBy, value]);

  const handleSelect = (product: ProductSearchResult) => {
    setQuery(searchBy === 'sku' ? product.sku : product.name);
    setIsOpen(false);
    onSelect(product);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <input 
        type="text"
        placeholder={`Search for a product...`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        className="w-full border border-gray-300 rounded px-4 py-2 bg-white focus:outline-none focus:border-brand-primary h-11"
      />
      {isLoading && (
        <div className="absolute right-3 top-3.5">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-brand-primary rounded-full animate-spin" />
        </div>
      )}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.map((product) => (
            <li 
              key={product.id}
              onClick={() => handleSelect(product)}
              className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-100 last:border-0"
            >
              <div className="font-medium text-gray-800">{product.name}</div>
              {product.sku && <div className="text-xs text-gray-500">SKU: {product.sku}</div>}
              <div className="text-xs font-semibold text-brand-primary mt-0.5">£{parseFloat(product.price).toFixed(2)}</div>
            </li>
          ))}
        </ul>
      )}
      {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 text-sm text-gray-500 text-center">
          No products found.
        </div>
      )}
    </div>
  );
}
