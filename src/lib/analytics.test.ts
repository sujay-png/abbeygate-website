import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackSearch } from './analytics';

describe('trackSearch analytics events', () => {
  beforeEach(() => {
    window.dataLayer = [];
    window.gtag = vi.fn();
  });

  it('tracks search with results correctly to dataLayer and gtag', () => {
    trackSearch('Colourlux', 4);

    const events = (window.dataLayer || []).filter((item: any) => item.event);

    // Should include standard GA4 'search' event
    const searchEvent = events.find((e: any) => e.event === 'search');
    expect(searchEvent).toBeDefined();
    expect(searchEvent).toMatchObject({
      event: 'search',
      search_term: 'Colourlux',
      results_count: 4,
      has_results: true,
    });

    // Should include 'view_search_results' for GTM compatibility
    const viewSearchEvent = events.find((e: any) => e.event === 'view_search_results');
    expect(viewSearchEvent).toBeDefined();
    expect(viewSearchEvent).toMatchObject({
      event: 'view_search_results',
      search_term: 'Colourlux',
      results_count: 4,
      has_results: true,
    });

    // Should NOT trigger zero-results event
    const noResultsEvent = events.find((e: any) => e.event === 'search_no_results');
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

    const events = (window.dataLayer || []).filter((item: any) => item.event);

    // Standard search event with results_count 0
    const searchEvent = events.find((e: any) => e.event === 'search');
    expect(searchEvent).toMatchObject({
      event: 'search',
      search_term: 'nonexistent product xyz',
      results_count: 0,
      has_results: false,
    });

    // Dedicated search_no_results event
    const noResultsEvent = events.find((e: any) => e.event === 'search_no_results');
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
