import { describe, it, expect } from 'vitest';
import { calculateShipping, getShippingRule } from './shipping';
import type { StoreProduct } from '../types/store-product';

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
    ...overrides,
  };
}

describe('shipping calculations', () => {
  it('identifies Eco notebooks and prevents double counting with A5 notebooks category', () => {
    const ecoProduct = createMockProduct({
      id: 1344,
      name: 'Ocean Clean Eco A5 Notebook, Sage Green',
      categories: [
        { id: 19, name: 'A5 Notebooks', slug: 'a5-notebooks', link: '' },
        { id: 173, name: 'Eco Friendly Notebooks', slug: 'eco-friendly-notebooks', link: '' },
      ],
    });

    const rule = getShippingRule(ecoProduct);
    expect(rule).toEqual({ unitsPerBox: 30, boxWeight: 7.46, boxesPerPallet: 84 });

    // 50 notebooks = 2 boxes = 14.92 kg (< 20 kg minimum threshold)
    const res50 = calculateShipping([{ product: ecoProduct, quantity: 50 }]);
    expect(res50).toEqual({ cost: 15.75, label: 'Shipping (Minimum)' });

    // 100 notebooks = 4 boxes = 29.84 kg (> 20 kg threshold -> calculated)
    const res100 = calculateShipping([{ product: ecoProduct, quantity: 100 }]);
    expect(res100.label).toBe('Shipping (Calculated)');
    expect(res100.cost).toBeCloseTo(21.50, 1);
  });

  it('correctly maps A5 Diaries with Day Per Page layout', () => {
    const a5Dpp = createMockProduct({
      id: 957,
      name: 'Richmond A5 Desk Diary, Day Per Page, White Pages, Red',
      categories: [
        { id: 164, name: 'A5 Diaries', slug: 'a5-diaries', link: '' },
      ],
    });

    const rule = getShippingRule(a5Dpp);
    expect(rule).toEqual({ unitsPerBox: 20, boxWeight: 10, boxesPerPallet: 84 });

    // 50 units = 3 boxes = 30 kg
    const res = calculateShipping([{ product: a5Dpp, quantity: 50 }]);
    expect(res.label).toBe('Shipping (Calculated)');
    expect(res.cost).toBeCloseTo(21.60, 1);
  });

  it('correctly maps A5 Diaries with Week to View layout', () => {
    const a5Wtv = createMockProduct({
      id: 984,
      name: 'Richmond A5 Desk Diary, Week to View, Red',
      categories: [
        { id: 164, name: 'A5 Diaries', slug: 'a5-diaries', link: '' },
      ],
    });

    const rule = getShippingRule(a5Wtv);
    expect(rule).toEqual({ unitsPerBox: 20, boxWeight: 11.6, boxesPerPallet: 84 });

    // 50 units = 3 boxes = 34.8 kg
    const res = calculateShipping([{ product: a5Wtv, quantity: 50 }]);
    expect(res.label).toBe('Shipping (Calculated)');
    expect(res.cost).toBeCloseTo(24.40, 1);
  });

  it('correctly maps Quarto Diaries', () => {
    const quartoWtv = createMockProduct({
      id: 1024,
      name: 'Graphic Prints Quarto Diary, Week to View, Full Colour',
      categories: [
        { id: 170, name: 'Quarto Diaries', slug: 'quarto-diaries', link: '' },
      ],
    });

    const rule = getShippingRule(quartoWtv);
    expect(rule).toEqual({ unitsPerBox: 20, boxWeight: 12.7, boxesPerPallet: 54 });

    // 50 units = 3 boxes = 38.1 kg
    const res = calculateShipping([{ product: quartoWtv, quantity: 50 }]);
    expect(res.label).toBe('Shipping (Calculated)');
    expect(res.cost).toBeCloseTo(26.32, 1);
  });

  it('applies free shipping for abbeygate100 coupon', () => {
    const a4Product = createMockProduct({
      id: 1804,
      name: 'Richmond A4 Desk Diary, Day Per Page, Red',
      categories: [{ id: 172, name: 'A4 Diaries', slug: 'a4-diaries', link: '' }],
    });

    const res = calculateShipping([{ product: a4Product, quantity: 100 }], ['abbeygate100']);
    expect(res).toEqual({ cost: 0, label: 'Shipping (Free with Coupon)' });
  });
});
