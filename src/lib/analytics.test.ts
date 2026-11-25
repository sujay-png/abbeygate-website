import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  trackSearch,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
} from './analytics';
import type { StoreProduct } from '@/features/products/types/store-product';
import type { CartItem } from '@/features/cart/context/CartContext';

const sampleProduct = {
  id: 101,
  name: 'Chelsea A5 Desk Diary, Tan',
  slug: 'chelsea-a5-desk-diary-tan',
  sku: 'CH-TN-A5',
  prices: {
    price: '1440', // £14.40 inc VAT -> £12.00 ex VAT
    currency_minor_unit: 2,
  },
  categories: [{ id: 1, name: 'A5 Diaries', slug: 'a5-diaries', link: '' }],
} as unknown as StoreProduct;

const sampleCartItems: CartItem[] = [
  {
    key: 'item-1',
    productId: '101',
    sku: 'CH-TN-A5',
    name: 'Chelsea A5 Desk Diary, Tan',
    image: '',
    price: 12.0, // already in GBP pounds
    quantity: 4,
  },
];

describe('trackSearch analytics events', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.gtag = vi.fn();
  });

  it('tracks search with results correctly to dataLayer and gtag', () => {
    trackSearch('Colourlux', 4);

    const events = ((window.dataLayer || []) as Record<string, unknown>[]).filter((item) => item.event);

    // Should include standard GA4 'search' event
    const searchEvent = events.find((e) => e.event === 'search');
    expect(searchEvent).toBeDefined();
    expect(searchEvent).toMatchObject({
      event: 'search',
      search_term: 'Colourlux',
      results_count: 4,
      has_results: true,
    });

    // Should include 'view_search_results' for GTM compatibility
    const viewSearchEvent = events.find((e) => e.event === 'view_search_results');
    expect(viewSearchEvent).toBeDefined();
    expect(viewSearchEvent).toMatchObject({
      event: 'view_search_results',
      search_term: 'Colourlux',
      results_count: 4,
      has_results: true,
    });

    // Should NOT trigger zero-results event
    const noResultsEvent = events.find((e) => e.event === 'search_no_results');
    expect(noResultsEvent).toBeUndefined();

    // Verify gtag was called
    expect(window.gtag).toHaveBeenCalledWith('event', 'search', expect.objectContaining({
      search_term: 'Colourlux',
      results_count: 4,
      has_results: true,
    }));
  });

  it('tracks zero-results searches with dedicated search_no_results event', () => {
    trackSearch('nonexistent product xyz', 0);

    const events = ((window.dataLayer || []) as Record<string, unknown>[]).filter((item) => item.event);

    // Standard search event with results_count 0
    const searchEvent = events.find((e) => e.event === 'search');
    expect(searchEvent).toMatchObject({
      event: 'search',
      search_term: 'nonexistent product xyz',
      results_count: 0,
      has_results: false,
    });

    // Dedicated search_no_results event
    const noResultsEvent = events.find((e) => e.event === 'search_no_results');
    expect(noResultsEvent).toBeDefined();
    expect(noResultsEvent).toMatchObject({
      event: 'search_no_results',
      search_term: 'nonexistent product xyz',
      results_count: 0,
    });

    // Verify gtag received search_no_results
    expect(window.gtag).toHaveBeenCalledWith('event', 'search_no_results', expect.objectContaining({
      search_term: 'nonexistent product xyz',
      results_count: 0,
    }));
  });
});

describe('ecommerce GA4 currency units and purchase tracking', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.gtag = vi.fn();
  });

  it('tracks add_to_cart and begin_checkout in GBP pounds without dividing by 100', () => {
    trackAddToCart(sampleProduct, 2, 12.0);
    expect(window.gtag).toHaveBeenCalledWith('event', 'add_to_cart', expect.objectContaining({
      currency: 'GBP',
      value: 24,
      items: [
        expect.objectContaining({
          item_id: 'CH-TN-A5',
          price: 12,
          quantity: 2,
        }),
      ],
    }));

    trackBeginCheckout(sampleCartItems, 57.6);
    expect(window.gtag).toHaveBeenCalledWith('event', 'begin_checkout', expect.objectContaining({
      currency: 'GBP',
      value: 57.6,
      items: [
        expect.objectContaining({
          item_id: 'CH-TN-A5',
          price: 12,
          quantity: 4,
        }),
      ],
    }));
  });

  it('tracks purchase in exact GBP pounds for authoritative order payloads', () => {
    trackPurchase({
      transactionId: '6682',
      value: 59.4,
      shipping: 15.75,
      tax: 9.9,
      items: [
        {
          item_id: 'CH-TN-A5',
          item_name: 'Chelsea A5 Desk Diary, Tan',
          price: 11.25,
          quantity: 3,
        },
      ],
    });

    expect(window.gtag).toHaveBeenCalledWith('event', 'purchase', {
      transaction_id: '6682',
      affiliation: 'Abbeygate England',
      value: 59.4,
      tax: 9.9,
      shipping: 15.75,
      currency: 'GBP',
      items: [
        expect.objectContaining({
          item_id: 'CH-TN-A5',
          item_name: 'Chelsea A5 Desk Diary, Tan',
          price: 11.25,
          quantity: 3,
        }),
      ],
    });
  });

  it('queues gtag command into dataLayer even before gtag.js finishes initializing', () => {
    delete window.gtag;
    window.dataLayer = [];

    trackPurchase({
      transactionId: '6683',
      value: 25.64,
      shipping: 15.75,
      tax: 1.65,
      items: [],
    });

    expect(typeof window.gtag).toBe('function');
    expect((window.dataLayer || []).length).toBeGreaterThanOrEqual(3);
  });
});
