'use client';

import { useEffect } from 'react';
import { trackSearch, trackViewItemList } from '@/lib/analytics';
import type { StoreProduct } from '@/features/products/types/store-product';

export function SearchTracker({ searchTerm, products }: { searchTerm: string, products: StoreProduct[] }) {
  useEffect(() => {
    if (searchTerm) {
      trackSearch(searchTerm);
    }
    if (products.length > 0) {
      trackViewItemList(`Search Results for ${searchTerm}`, products);
    }
  }, [searchTerm, products]);

  return null;
}
