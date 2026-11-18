import { describe, it, expect } from 'vitest';
import { getProductImageTransform, isBicolourProduct, isHorizonProduct } from './product-helpers';
import type { StoreProduct } from '../types/store-product';

function makeMockProduct(name: string, categories: string[] = []): StoreProduct {
  return {
    id: 1,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    permalink: '',
    sku: 'TEST-SKU',
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
    categories: categories.map((slug, id) => ({ id, name: slug, slug, link: '' })),
    tags: [],
    attributes: [],
    is_purchasable: true,
    is_in_stock: true,
    average_rating: '0',
    review_count: 0,
  };
}

describe('getProductImageTransform', () => {
  it('keeps Chelsea Slim Card Holders in landscape orientation (rotate 0)', () => {
    const black = makeMockProduct('Chelsea Leather Slim Card Holder, Black', ['card-holders', 'chelsea']);
    const blue = makeMockProduct('Chelsea Leather Slim Card Holder, Blue', ['card-holders', 'chelsea']);
    const green = makeMockProduct('Chelsea Leather Slim Card Holder, Green', ['card-holders', 'chelsea']);

    expect(getProductImageTransform(black)).toEqual({ rotate: 0, scaleX: 1, imagePadding: 0 });
    expect(getProductImageTransform(blue)).toEqual({ rotate: 0, scaleX: 1, imagePadding: 0 });
    expect(getProductImageTransform(green)).toEqual({ rotate: 0, scaleX: 1, imagePadding: 0 });
  });

  it('rotates horizontally-shot luggage tags (rotate 90)', () => {
    const chelseaTag = makeMockProduct('Chelsea Leather Luggage Tag', ['luggage-tags', 'chelsea']);
    const windsorTag = makeMockProduct('Windsor Collection Luggage Tag', ['luggage-tags', 'windsor']);

    expect(getProductImageTransform(chelseaTag)).toEqual({ rotate: 90, scaleX: 1, imagePadding: 4 });
    expect(getProductImageTransform(windsorTag)).toEqual({ rotate: 90, scaleX: 1, imagePadding: 4 });
  });

  it('keeps multi-purpose card holders in landscape/natural orientation (rotate 0)', () => {
    const chelseaMulti = makeMockProduct('Chelsea Leather Multi Purpose Card Holder, Black', ['card-holders']);
    expect(getProductImageTransform(chelseaMulti)).toEqual({ rotate: 0, scaleX: 1, imagePadding: 0 });
  });

  it('flips oval key fobs horizontally so split-ring is on left', () => {
    const ovalFob = makeMockProduct('Dorchester Collection Key Fob', ['key-rings']);
    expect(getProductImageTransform(ovalFob)).toEqual({ rotate: 0, scaleX: -1, imagePadding: 0 });
  });
});

describe('product-helpers classification', () => {
  it('correctly identifies bi-colour products', () => {
    expect(isBicolourProduct({ sku: 'NB-BK/AQ-U-096', name: 'Dorchester Bicolor Pocket Diary' })).toBe(true);
    expect(isBicolourProduct({ sku: 'NB-BL/RB-P-084', name: 'Dorchester Bicolour Quarto Desk Diary' })).toBe(true);
    expect(isBicolourProduct({ sku: 'CL-BK-U-31', name: 'Chelsea Leather Notebook' })).toBe(false);
  });

  it('correctly identifies horizon products', () => {
    expect(isHorizonProduct({ sku: 'HZ-BK/RD-P-083', name: 'Dorchester Horizon Quarto Desk Diary' })).toBe(true);
    expect(isHorizonProduct({ sku: 'NB-BK/YE-P-076', name: 'Dorchester Horizon A5 Desk' })).toBe(true);
    expect(isHorizonProduct({ sku: 'NF-BK-U-095', name: 'Dorchester Pocket Diary' })).toBe(false);
  });
});
