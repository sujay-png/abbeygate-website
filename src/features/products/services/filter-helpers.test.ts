import { describe, it, expect, vi } from 'vitest';
import {
  getFilterDataForProducts,
  normalizeColourTerms,
  extractSizeTerms,
  extractColourTerms,
} from './filter-helpers';
import { countProductsForTerm, productMatchesFilters } from '../utils/product-helpers';
import { searchProducts } from '../utils/search-helpers';
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

  it('keeps related colours searchable (red finds burgundy) while colour filter categorises accurately without double-counting', async () => {
    // Product 1: Burgundy diary which had both Burgundy and Red terms associated
    const burgundyProduct = createMockProduct({
      id: 939,
      name: 'Richmond FineGrain A5 Desk Diary, Day Per Page, Burgundy',
      attributes: [
        {
          id: 2,
          name: 'Size',
          taxonomy: 'pa_size',
          has_variations: false,
          terms: [{ id: 96, name: 'A5', slug: 'a5' }],
        },
        {
          id: 1,
          name: 'Colour',
          taxonomy: 'pa_colour',
          has_variations: false,
          terms: [
            { id: 116, name: 'Burgundy', slug: 'burgundy' },
            { id: 94, name: 'Red', slug: 'red' },
          ],
        },
      ],
    });

    // Product 2: Red diary with only Red term
    const redProduct = createMockProduct({
      id: 962,
      name: 'Richmond FineGrain A5 Desk Diary, Day Per Page, Red',
      attributes: [
        {
          id: 2,
          name: 'Size',
          taxonomy: 'pa_size',
          has_variations: false,
          terms: [{ id: 96, name: 'A5', slug: 'a5' }],
        },
        {
          id: 1,
          name: 'Colour',
          taxonomy: 'pa_colour',
          has_variations: false,
          terms: [{ id: 94, name: 'Red', slug: 'red' }],
        },
      ],
    });

    // 1. Search behavior: Burgundy products MUST appear when customer searches for "Red"
    const searchResultsForRed = searchProducts([burgundyProduct, redProduct], 'red');
    expect(searchResultsForRed).toHaveLength(2);
    expect(searchResultsForRed.map((p) => p.id)).toEqual(expect.arrayContaining([939, 962]));

    // Searching specifically for "Burgundy" should ONLY return the Burgundy product
    const searchResultsForBurgundy = searchProducts([burgundyProduct, redProduct], 'burgundy');
    expect(searchResultsForBurgundy).toHaveLength(1);
    expect(searchResultsForBurgundy[0].id).toBe(939);

    // 2. Filter data: normalizeColourTerms isolates Burgundy and Red
    const { allProducts } = await getFilterDataForProducts(searchResultsForRed);
    expect(allProducts).toHaveLength(2);

    const normBurgundy = allProducts.find((p) => p.id === 939)!;
    const normRed = allProducts.find((p) => p.id === 962)!;

    const burgundyColours = normBurgundy.attributes.find((a) => a.taxonomy === 'pa_colour')!.terms;
    const redColours = normRed.attributes.find((a) => a.taxonomy === 'pa_colour')!.terms;

    // Burgundy product MUST ONLY be categorised under Burgundy, not Red
    expect(burgundyColours.map((t) => t.slug)).toEqual(['burgundy']);
    expect(redColours.map((t) => t.slug)).toEqual(['red']);

    // 3. Filter Counts: accurate reflection of available products without double-counting
    // (Red: 1, Burgundy: 1 across the 2 search results)
    const redCount = countProductsForTerm(allProducts, 'pa_colour', 'red', {}, 'filter_colour');
    const burgundyCount = countProductsForTerm(allProducts, 'pa_colour', 'burgundy', {}, 'filter_colour');

    expect(redCount).toBe(1);
    expect(burgundyCount).toBe(1);
    expect(redCount + burgundyCount).toBe(allProducts.length);

    // 4. Filtering with Size = A5 applied
    const sizeFilteredProducts = allProducts.filter((p) =>
      productMatchesFilters(p, { filter_size: ['a5'] })
    );
    expect(sizeFilteredProducts).toHaveLength(2);

    const redCountWithA5 = countProductsForTerm(
      sizeFilteredProducts,
      'pa_colour',
      'red',
      { filter_size: ['a5'] },
      'filter_colour'
    );
    const burgundyCountWithA5 = countProductsForTerm(
      sizeFilteredProducts,
      'pa_colour',
      'burgundy',
      { filter_size: ['a5'] },
      'filter_colour'
    );

    expect(redCountWithA5).toBe(1);
    expect(burgundyCountWithA5).toBe(1);

    // Product matching filter selection
    expect(productMatchesFilters(normBurgundy, { filter_colour: ['burgundy'] })).toBe(true);
    expect(productMatchesFilters(normBurgundy, { filter_colour: ['red'] })).toBe(false);

    expect(productMatchesFilters(normRed, { filter_colour: ['red'] })).toBe(true);
    expect(productMatchesFilters(normRed, { filter_colour: ['burgundy'] })).toBe(false);
  });

  it('extracts size and colour from product titles and categories when attributes are missing in WooCommerce', async () => {
    const a4Burgundy = createMockProduct({
      id: 301,
      name: 'Richmond FineGrain A4 Desk Diary, Day Per Page, Burgundy',
      categories: [{ id: 172, name: 'A4 Diaries', slug: 'a4-diaries', link: '' }],
      attributes: [], // Missing in Store API
    });

    const quartoNavy = createMockProduct({
      id: 302,
      name: 'Chelsea Quarto Desk Diary, Week to View, Navy',
      categories: [{ id: 170, name: 'Quarto Diaries', slug: 'quarto-diaries', link: '' }],
      attributes: [], // Missing in Store API
    });

    const pocketBlack = createMockProduct({
      id: 303,
      name: 'Dorchester Pocket Diary, Week to View, Black',
      categories: [{ id: 39, name: 'Pocket Diaries', slug: 'pocket-diaries', link: '' }],
      attributes: [], // Missing in Store API
    });

    const walletNoSize = createMockProduct({
      id: 304,
      name: 'Dorchester Faux Leather Card Wallet, Tan',
      categories: [{ id: 48, name: 'Wallets', slug: 'wallets', link: '' }],
      attributes: [], // No size, but has Tan colour
    });

    // 1. Direct extraction test
    expect(extractSizeTerms(a4Burgundy)).toEqual([{ id: 95, name: 'A4', slug: 'a4' }]);
    expect(extractColourTerms(a4Burgundy)).toEqual([{ id: expect.any(Number), name: 'Burgundy', slug: 'burgundy' }]);

    expect(extractSizeTerms(quartoNavy)).toEqual([{ id: 98, name: 'Quarto', slug: 'quarto' }]);
    expect(extractColourTerms(quartoNavy)).toEqual([{ id: expect.any(Number), name: 'Navy', slug: 'navy' }]);

    expect(extractSizeTerms(pocketBlack)).toEqual([{ id: 99, name: 'Pocket', slug: 'pocket' }]);
    expect(extractColourTerms(pocketBlack)).toEqual([{ id: expect.any(Number), name: 'Black', slug: 'black' }]);

    expect(extractSizeTerms(walletNoSize)).toEqual([]);
    expect(extractColourTerms(walletNoSize)).toEqual([{ id: expect.any(Number), name: 'Tan', slug: 'tan' }]);

    // 2. Integration with getFilterDataForProducts
    const { allProducts, filterAttributes, attributeTerms } = await getFilterDataForProducts([
      a4Burgundy,
      quartoNavy,
      pocketBlack,
      walletNoSize,
    ]);

    expect(allProducts).toHaveLength(4);

    // Verify all products were enriched with attributes
    const enrichedA4 = allProducts.find((p) => p.id === 301)!;
    expect(enrichedA4.attributes.find((a) => a.taxonomy === 'pa_size')?.terms[0].slug).toBe('a4');
    expect(enrichedA4.attributes.find((a) => a.taxonomy === 'pa_colour')?.terms[0].slug).toBe('burgundy');

    const enrichedWallet = allProducts.find((p) => p.id === 304)!;
    expect(enrichedWallet.attributes.find((a) => a.taxonomy === 'pa_size')).toBeUndefined();
    expect(enrichedWallet.attributes.find((a) => a.taxonomy === 'pa_colour')?.terms[0].slug).toBe('tan');

    // Verify filterAttributes contains pa_size and pa_colour with sorted terms
    const sizeAttr = filterAttributes.find((a) => a.taxonomy === 'pa_size');
    expect(sizeAttr).toBeDefined();
    const sizeTerms = attributeTerms[sizeAttr!.id];
    // Sorted order: A4, Quarto, Pocket
    expect(sizeTerms.map((t) => t.slug)).toEqual(['a4', 'quarto', 'pocket']);

    const colourAttr = filterAttributes.find((a) => a.taxonomy === 'pa_colour');
    expect(colourAttr).toBeDefined();
    const colourTerms = attributeTerms[colourAttr!.id];
    // Sorted alphabetically: Black, Burgundy, Navy, Tan
    expect(colourTerms.map((t) => t.name)).toEqual(['Black', 'Burgundy', 'Navy', 'Tan']);

    // Verify filtering matches
    expect(productMatchesFilters(enrichedA4, { filter_size: ['a4'] })).toBe(true);
    expect(productMatchesFilters(enrichedA4, { filter_size: ['quarto'] })).toBe(false);
    expect(productMatchesFilters(enrichedA4, { filter_colour: ['burgundy'] })).toBe(true);
    expect(productMatchesFilters(enrichedA4, { filter_colour: ['navy'] })).toBe(false);

    // Verify counts
    expect(countProductsForTerm(allProducts, 'pa_size', 'a4', {}, 'filter_size')).toBe(1);
    expect(countProductsForTerm(allProducts, 'pa_size', 'quarto', {}, 'filter_size')).toBe(1);
    expect(countProductsForTerm(allProducts, 'pa_colour', 'burgundy', {}, 'filter_colour')).toBe(1);
    expect(countProductsForTerm(allProducts, 'pa_colour', 'tan', {}, 'filter_colour')).toBe(1);
  });

  it('splits combo/dual colours into single colours so only clean individual colours appear in filters', async () => {
    const dualColorProd = createMockProduct({
      id: 401,
      name: 'Dorchester Horizon Quarto Desk Diary, Week to View, Black-Green',
      categories: [{ id: 170, name: 'Quarto Diaries', slug: 'quarto-diaries', link: '' }],
      attributes: [],
    });

    const doubleGreenProd = createMockProduct({
      id: 402,
      name: 'Dorchester Horizon A5 Desk Diary, Day Per Page, Green-Green',
      categories: [{ id: 171, name: 'A5 Diaries', slug: 'a5-diaries', link: '' }],
      attributes: [],
    });

    // 1. Direct extraction test
    const dualTerms = extractColourTerms(dualColorProd);
    expect(dualTerms.map((t) => t.name)).toEqual(['Black', 'Green']);
    expect(dualTerms.map((t) => t.slug)).toEqual(['black', 'green']);

    const doubleGreenTerms = extractColourTerms(doubleGreenProd);
    expect(doubleGreenTerms.map((t) => t.name)).toEqual(['Green']);
    expect(doubleGreenTerms.map((t) => t.slug)).toEqual(['green']);

    // 2. Integration with getFilterDataForProducts
    const { allProducts, filterAttributes, attributeTerms } = await getFilterDataForProducts([
      dualColorProd,
      doubleGreenProd,
    ]);

    const colourAttr = filterAttributes.find((a) => a.taxonomy === 'pa_colour');
    expect(colourAttr).toBeDefined();
    const colourTerms = attributeTerms[colourAttr!.id];

    // Filter must ONLY contain single clean colours: Black, Green (NO Black-Green!)
    expect(colourTerms.map((t) => t.name)).toEqual(['Black', 'Green']);

    const enrichedDual = allProducts.find((p) => p.id === 401)!;
    // Dual colour product matches when filtering by 'green'
    expect(productMatchesFilters(enrichedDual, { filter_colour: ['green'] })).toBe(true);
    // Dual colour product also matches when filtering by 'black'
    expect(productMatchesFilters(enrichedDual, { filter_colour: ['black'] })).toBe(true);
    // Does not match unrelated colour
    expect(productMatchesFilters(enrichedDual, { filter_colour: ['red'] })).toBe(false);

    // Filter counts: Green is present on 2 products (both 401 and 402), Black on 1 product
    expect(countProductsForTerm(allProducts, 'pa_colour', 'green', {}, 'filter_colour')).toBe(2);
    expect(countProductsForTerm(allProducts, 'pa_colour', 'black', {}, 'filter_colour')).toBe(1);
  });
});
