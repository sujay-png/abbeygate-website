import { describe, it, expect } from 'vitest';
import { searchProducts } from './search-helpers';
import { StoreProduct } from '../types/store-product';

// Helper to create mock StoreProduct
function createMockProduct(overrides: Partial<StoreProduct>): StoreProduct {
  return {
    id: 1,
    name: 'Sample Product',
    slug: 'sample-product',
    permalink: 'https://example.com/sample',
    sku: 'SP-001',
    short_description: '',
    description: '',
    on_sale: false,
    prices: {
      price: '1000',
      regular_price: '1000',
      sale_price: '1000',
      currency_code: 'GBP',
      currency_symbol: '£',
      currency_minor_unit: 2,
    },
    price_html: '£10.00',
    images: [],
    categories: [],
    tags: [],
    attributes: [],
    is_purchasable: true,
    is_in_stock: true,
    average_rating: '0',
    review_count: 0,
    ...overrides,
  };
}

describe('searchProducts with Synonyms', () => {
  const graphicPrintQuarto = createMockProduct({
    id: 1024,
    name: 'Graphic Prints Quarto Diary, Week to View, Full Colour',
    sku: 'CX-44-P-083',
    description: 'Our Graphic Prints Collection is a high-quality Coverlux Full Colour print...',
    short_description: 'Quarto Week to View diary from our Full Colour printed Graphic Prints Collection...',
    categories: [
      { id: 18, name: 'Diaries', slug: 'diaries', link: '/diaries' },
      { id: 54, name: 'Graphic Print Collection', slug: 'graphic-print-collection', link: '/graphic-print' },
      { id: 170, name: 'Quarto Diaries', slug: 'quarto-diaries', link: '/quarto' },
    ],
  });

  const graphicPrintA5 = createMockProduct({
    id: 990,
    name: 'Graphic Prints A5 Diary, Week to View, Full Colour',
    sku: 'CX-44-P-073',
    description: 'Our Graphic Prints Collection is a high-quality Coverlux Full Colour print...',
    categories: [
      { id: 18, name: 'Diaries', slug: 'diaries', link: '/diaries' },
      { id: 54, name: 'Graphic Print Collection', slug: 'graphic-print-collection', link: '/graphic-print' },
    ],
  });

  const dorchesterWalletBlack = createMockProduct({
    id: 5073,
    name: 'Dorchester Collection Faux Leather Travel Wallet, Black',
    sku: 'NH-BK-U-034',
    description: 'The Dorchester Travel Wallet in Black is crafted from premium-quality vegan leather.',
    categories: [
      { id: 50, name: 'Dorchester Collection', slug: 'dorchester-collection', link: '/dorchester' },
      { id: 153, name: 'Wallets', slug: 'wallets', link: '/wallets' },
    ],
    attributes: [
      {
        id: 1,
        name: 'Colour',
        taxonomy: 'pa_colour',
        has_variations: false,
        terms: [{ id: 10, name: 'Black', slug: 'black' }],
      },
    ],
  });

  const dorchesterWalletTan = createMockProduct({
    id: 5050,
    name: 'Dorchester Collection Faux Leather Travel Wallet, Tan',
    sku: 'NH-TN-U-034',
    description: 'The Dorchester Travel Wallet in Tan.',
    categories: [
      { id: 50, name: 'Dorchester Collection', slug: 'dorchester-collection', link: '/dorchester' },
      { id: 153, name: 'Wallets', slug: 'wallets', link: '/wallets' },
    ],
    attributes: [
      {
        id: 1,
        name: 'Colour',
        taxonomy: 'pa_colour',
        has_variations: false,
        terms: [{ id: 11, name: 'Tan', slug: 'tan' }],
      },
    ],
  });

  const dorchesterKeyFobBlack = createMockProduct({
    id: 4987,
    name: 'Dorchester Collection Key Fob, Black',
    sku: 'NH-BK-U-320',
    description: 'Black Dorchester Key Ring. Previously known as: NewHide.',
    categories: [
      { id: 50, name: 'Dorchester Collection', slug: 'dorchester-collection', link: '/dorchester' },
      { id: 149, name: 'Keyrings', slug: 'keyrings', link: '/keyrings' },
    ],
    attributes: [
      {
        id: 1,
        name: 'Colour',
        taxonomy: 'pa_colour',
        has_variations: false,
        terms: [{ id: 10, name: 'Black', slug: 'black' }],
      },
    ],
  });

  const chelseaNotebook = createMockProduct({
    id: 2001,
    name: 'Chelsea A5 Hardback Notebook',
    sku: 'CH-BK-A5',
    description: 'Classic Chelsea notebook.',
    categories: [
      { id: 49, name: 'Chelsea Collection', slug: 'chelsea-collection', link: '/chelsea' },
    ],
  });

  const mockCatalog = [
    graphicPrintQuarto,
    graphicPrintA5,
    dorchesterWalletBlack,
    dorchesterWalletTan,
    dorchesterKeyFobBlack,
    chelseaNotebook,
  ];

  describe('Colourlux = Graphic Print', () => {
    it('finds Graphic Print products when searching "Colourlux"', () => {
      const results = searchProducts(mockCatalog, 'Colourlux');
      expect(results.map((p) => p.id)).toEqual([1024, 990]);
    });

    it('finds Graphic Print products when searching "Colorlux"', () => {
      const results = searchProducts(mockCatalog, 'Colorlux');
      expect(results.map((p) => p.id)).toEqual([1024, 990]);
    });

    it('finds Graphic Print products when searching "colour lux"', () => {
      const results = searchProducts(mockCatalog, 'colour lux');
      expect(results.map((p) => p.id)).toEqual([1024, 990]);
    });

    it('finds Graphic Print products when searching "Graphic Print"', () => {
      const results = searchProducts(mockCatalog, 'Graphic Print');
      expect(results.map((p) => p.id)).toEqual([1024, 990]);
    });

    it('finds Graphic Print products when searching "Graphic Prints"', () => {
      const results = searchProducts(mockCatalog, 'Graphic Prints');
      expect(results.map((p) => p.id)).toEqual([1024, 990]);
    });

    it('finds specific item when searching "Colourlux Quarto"', () => {
      const results = searchProducts(mockCatalog, 'Colourlux Quarto');
      expect(results.map((p) => p.id)).toEqual([1024]);
    });

    it('finds specific item when searching "Graphic Print Quarto"', () => {
      const results = searchProducts(mockCatalog, 'Graphic Print Quarto');
      expect(results.map((p) => p.id)).toEqual([1024]);
    });

    it('handles "Colourlux = Graphic Print" equality query', () => {
      const results = searchProducts(mockCatalog, 'Colourlux = Graphic Print');
      expect(results.map((p) => p.id)).toEqual([1024, 990]);
    });
  });

  describe('Dorchester = New Hide = Newhide', () => {
    it('finds all Dorchester/Newhide items when searching "Dorchester"', () => {
      const results = searchProducts(mockCatalog, 'Dorchester');
      expect(results.map((p) => p.id)).toEqual([5073, 5050, 4987]);
    });

    it('finds all Dorchester/Newhide items when searching "Newhide"', () => {
      const results = searchProducts(mockCatalog, 'Newhide');
      expect(results.map((p) => p.id)).toEqual([5073, 5050, 4987]);
    });

    it('finds all Dorchester/Newhide items when searching "New Hide"', () => {
      const results = searchProducts(mockCatalog, 'New Hide');
      expect(results.map((p) => p.id)).toEqual([5073, 5050, 4987]);
    });

    it('finds all Dorchester/Newhide items when searching "new-hide"', () => {
      const results = searchProducts(mockCatalog, 'new-hide');
      expect(results.map((p) => p.id)).toEqual([5073, 5050, 4987]);
    });

    it('filters by category/item type with synonym: "Dorchester Wallet"', () => {
      const results = searchProducts(mockCatalog, 'Dorchester Wallet');
      expect(results.map((p) => p.id)).toEqual([5073, 5050]);
    });

    it('filters identically with "Newhide Wallet"', () => {
      const results = searchProducts(mockCatalog, 'Newhide Wallet');
      expect(results.map((p) => p.id)).toEqual([5073, 5050]);
    });

    it('filters identically with "New Hide Wallet"', () => {
      const results = searchProducts(mockCatalog, 'New Hide Wallet');
      expect(results.map((p) => p.id)).toEqual([5073, 5050]);
    });

    it('filters by color: "Dorchester Black"', () => {
      const results = searchProducts(mockCatalog, 'Dorchester Black');
      expect(results.map((p) => p.id)).toEqual([5073, 4987]);
    });

    it('filters identically by color: "Newhide Black"', () => {
      const results = searchProducts(mockCatalog, 'Newhide Black');
      expect(results.map((p) => p.id)).toEqual([5073, 4987]);
    });

    it('filters by color: "Dorchester Tan"', () => {
      const results = searchProducts(mockCatalog, 'Dorchester Tan');
      expect(results.map((p) => p.id)).toEqual([5050]);
    });

    it('filters identically by color: "Newhide Tan"', () => {
      const results = searchProducts(mockCatalog, 'Newhide Tan');
      expect(results.map((p) => p.id)).toEqual([5050]);
    });

    it('handles "Dorchester = New Hide = Newhide" equality query', () => {
      const results = searchProducts(mockCatalog, 'Dorchester = New Hide = Newhide');
      expect(results.map((p) => p.id)).toEqual([5073, 5050, 4987]);
    });
  });

  describe('Non-synonym queries and edge cases', () => {
    it('returns Chelsea products when searching "Chelsea"', () => {
      const results = searchProducts(mockCatalog, 'Chelsea');
      expect(results.map((p) => p.id)).toEqual([2001]);
    });

    it('matches exact SKU search "NH-BK-U-034"', () => {
      const results = searchProducts(mockCatalog, 'NH-BK-U-034');
      expect(results.map((p) => p.id)).toEqual([5073]);
    });

    it('matches SKU prefix search "SKU: CX-44"', () => {
      const results = searchProducts(mockCatalog, 'SKU: CX-44');
      expect(results.map((p) => p.id)).toEqual([1024, 990]);
    });

    it('returns all products on empty query', () => {
      const results = searchProducts(mockCatalog, '');
      expect(results).toHaveLength(mockCatalog.length);
    });
  });
});
