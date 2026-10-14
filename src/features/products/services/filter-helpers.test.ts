import { describe, it, expect, vi } from 'vitest';
import { getFilterDataForProducts } from './filter-helpers';
import { countProductsForTerm, productMatchesFilters } from '../utils/product-helpers';
import type { StoreProduct } from '../types/store-product';

// Mock store-products API calls
vi.mock('./store-products', () => ({
  getStoreAttributes: vi.fn().mockResolvedValue([
    { id: 5, name: 'Collection', taxonomy: 'pa_collection', count: 0 },
    { id: 1, name: 'Colour', taxonomy: 'pa_colour', count: 0 },
  ]),
  getStoreAttributeTerms: vi.fn().mockResolvedValue([]),
}));

function createMockProduct(overrides: Partial<StoreProduct>): StoreProduct {
  return {
    id: 1,
    name: 'Sample Product',
    slug: 'sample-product',
    permalink: '',
    sku: '',
    short_description: '',
    description: '',
    on_sale: false,
    prices: {
      price: '10',
      regular_price: '10',
      sale_price: '10',
      currency_code: 'GBP',
      currency_symbol: '£',
      currency_minor_unit: 2,
    },
    price_html: '',
    images: [],
    categories: [],
    tags: [],
    attributes: [],
    is_purchasable: true,
    is_in_stock: true,
    average_rating: '5',
    review_count: 0,
    ...overrides,
  };
}

describe('filter-helpers collection extraction and counting', () => {
  it('extracts collection from categories when pa_collection attribute is absent', async () => {
    const dorchesterProduct = createMockProduct({
      id: 101,
      name: 'Dorchester A5 Diary',
      categories: [{ id: 50, name: 'Dorchester Collection', slug: 'dorchester-collection', link: '' }],
    });

    const richmondProduct = createMockProduct({
      id: 102,
      name: 'Richmond A4 Diary',
      categories: [{ id: 53, name: 'Richmond Collection', slug: 'richmond-collection', link: '' }],
    });

    const chelseaProduct = createMockProduct({
      id: 103,
      name: 'Chelsea Luggage Tag',
      categories: [{ id: 49, name: 'Chelsea Collection', slug: 'chelsea-collection', link: '' }],
      attributes: [
        {
          id: 5,
          name: 'Collection',
          taxonomy: 'pa_collection',
          has_variations: false,
          terms: [{ id: 100, name: 'Chelsea', slug: 'chelsea' }],
        },
      ],
    });

    const { allProducts, filterAttributes, attributeTerms } = await getFilterDataForProducts([
      dorchesterProduct,
      richmondProduct,
      chelseaProduct,
    ]);

    expect(allProducts).toHaveLength(3);

    // Verify pa_collection attribute terms
    const collAttr = filterAttributes.find((a) => a.taxonomy === 'pa_collection');
    expect(collAttr).toBeDefined();
    const terms = attributeTerms[collAttr!.id];
    expect(terms.map((t) => t.name)).toEqual(['Chelsea', 'Dorchester', 'Richmond']);

    // Verify countProductsForTerm
    const dorchesterCount = countProductsForTerm(allProducts, 'pa_collection', 'dorchester', {}, 'filter_collection');
    const richmondCount = countProductsForTerm(allProducts, 'pa_collection', 'richmond', {}, 'filter_collection');
    const chelseaCount = countProductsForTerm(allProducts, 'pa_collection', 'chelsea', {}, 'filter_collection');

    expect(dorchesterCount).toBe(1);
    expect(richmondCount).toBe(1);
    expect(chelseaCount).toBe(1);

    // Verify filter matching
    expect(productMatchesFilters(allProducts[0], { filter_collection: ['dorchester'] })).toBe(true);
    expect(productMatchesFilters(allProducts[0], { filter_collection: ['richmond'] })).toBe(false);
    expect(productMatchesFilters(allProducts[0], { filter_collection: ['dorchester-collection'] })).toBe(true);
  });

  it('extracts layout from titles and categories (WTV, DPP, Feint Ruled) and counts accurately', async () => {
    const wtvDiary = createMockProduct({
      id: 201,
      name: 'Richmond Pocket Diary, Week to View, Dark Blue',
      categories: [{ id: 39, name: 'Pocket Diaries', slug: 'pocket-diaries', link: '' }],
    });

    const dppDiary = createMockProduct({
      id: 202,
      name: 'Richmond A4 Desk Diary, Day Per Page, Red',
      categories: [{ id: 172, name: 'A4 Diaries', slug: 'a4-diaries', link: '' }],
    });

    const notebook = createMockProduct({
      id: 203,
      name: 'Dorchester A5 Soft Cover Notebook, Pink',
      categories: [{ id: 165, name: 'A5 Notebooks', slug: 'a5-notebooks', link: '' }],
    });

    const walletNoLayout = createMockProduct({
      id: 204,
      name: 'Dorchester Collection Faux Leather Travel Wallet, Black',
      categories: [{ id: 48, name: 'Wallets', slug: 'wallets', link: '' }],
    });

    const { allProducts, filterAttributes, attributeTerms } = await getFilterDataForProducts([
      wtvDiary,
      dppDiary,
      notebook,
      walletNoLayout,
    ]);

    expect(allProducts).toHaveLength(4);

    // Verify pa_layout attribute in filterAttributes
    const layoutAttr = filterAttributes.find((a) => a.taxonomy === 'pa_layout');
    expect(layoutAttr).toBeDefined();

    const terms = attributeTerms[layoutAttr!.id];
    expect(terms.map((t) => t.slug)).toEqual(
      expect.arrayContaining(['day-per-page', 'feint-ruled', 'week-to-view'])
    );

    // Verify counts
    const wtvCount = countProductsForTerm(allProducts, 'pa_layout', 'week-to-view', {}, 'filter_layout');
    const dppCount = countProductsForTerm(allProducts, 'pa_layout', 'day-per-page', {}, 'filter_layout');
    const feintCount = countProductsForTerm(allProducts, 'pa_layout', 'feint-ruled', {}, 'filter_layout');

    expect(wtvCount).toBe(1);
    expect(dppCount).toBe(1);
    expect(feintCount).toBe(1);

    // Verify productMatchesFilters
    expect(productMatchesFilters(allProducts[0], { filter_layout: ['week-to-view'] })).toBe(true);
    expect(productMatchesFilters(allProducts[0], { filter_layout: ['day-per-page'] })).toBe(false);

    expect(productMatchesFilters(allProducts[1], { filter_layout: ['day-per-page'] })).toBe(true);
    expect(productMatchesFilters(allProducts[1], { filter_layout: ['week-to-view'] })).toBe(false);

    expect(productMatchesFilters(allProducts[2], { filter_layout: ['feint-ruled'] })).toBe(true);
    expect(productMatchesFilters(allProducts[3], { filter_layout: ['week-to-view'] })).toBe(false);
  });
});
