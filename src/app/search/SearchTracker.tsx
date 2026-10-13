'use client';

import { useEffect, useRef } from 'react';
import { trackSearch, trackViewItemList } from '@/lib/analytics';
import type { StoreProduct } from '@/features/products/types/store-product';

interface SearchTrackerProps {
  searchTerm: string;
  totalResultsCount: number;
  products: StoreProduct[];
}

export function SearchTracker({ searchTerm, totalResultsCount, products }: SearchTrackerProps) {
  const lastTrackedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const trimmed = (searchTerm || '').trim();
    if (!trimmed) return;

    // Track once per unique query & count combination
    const trackingKey = `${trimmed}::${totalResultsCount}`;
    if (lastTrackedKeyRef.current !== trackingKey) {
      lastTrackedKeyRef.current = trackingKey;
      trackSearch(trimmed, totalResultsCount);

      if (products.length > 0) {
        trackViewItemList(`Search Results for ${trimmed}`, products);
      }
    }
  }, [searchTerm, totalResultsCount, products]);

  return null;
}
