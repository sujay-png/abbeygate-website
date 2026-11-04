import { describe, it, expect } from 'vitest';
import { getProductImageTransform } from './product-helpers';
import type { StoreProduct } from '../types/store-product';

function makeMockProduct(name: string, categories: string[] = []): StoreProduct {
  return {
    id: 1,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    parent: 0,
    type: 'simple',
    variation: '',
    permalink: '',
    sku: 'TEST-SKU',
    short_description: '',
    description: '',
    on_sale: false,
    prices: {
      price: '1000',
      regular_price: '1000',
      sale_price: '1000',
      price_range: null,
      currency_code: 'GBP',
      currency_symbol: '£',
      currency_minor_unit: 2,
      currency_decimal_separator: '.',
      currency_thousand_separator: ',',
      currency_prefix: '£',
      currency_suffix: '',
    },
    price_html: '£10.00',
    average_rating: '0',
    review_count: 0,
    images: [],
    categories: categories.map((slug, id) => ({ id, name: slug, slug, link: '' })),
    tags: [],
    attributes: [],
    variations: [],
    has_options: false,
    is_purchasable: true,
    is_in_stock: true,
    is_on_backorder: false,
    low_stock_remaining: null,
    sold_individually: false,
    add_to_cart: {
      text: 'Add to cart',
      description: 'Add to cart',
      url: '',
      minimum: 1,
      maximum: 99,
      multiple_of: 1,
    },
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

