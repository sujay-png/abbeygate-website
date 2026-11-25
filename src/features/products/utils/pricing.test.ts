import { describe, it, expect } from 'vitest';
import { getCornerEdgesPricing, isUvOnlyProduct } from './pricing';

describe('getCornerEdgesPricing', () => {
  it('returns null size and 0 price for A6 notebooks where extras are disabled', () => {
    const lewesA6 = {
      name: 'Lewes Smoothgrain A6 Notebook – Red',
      slug: 'lewes-smoothgrain-a6-notebook-red',
    };
    expect(getCornerEdgesPricing(lewesA6)).toEqual({ size: null, pricePerPair: 0 });

    const chelseaA6 = {
      name: 'Chelsea Softgrain A6 Notebook',
      slug: 'chelsea-softgrain-a6-notebook',
    };
    expect(getCornerEdgesPricing(chelseaA6)).toEqual({ size: null, pricePerPair: 0 });

    // Even if category or attribute mentions "pocket", A6 notebook rule takes precedence
    const a6WithPocketAttribute = {
      name: 'A6 Pocket Notebook',
      slug: 'a6-pocket-notebook',
      attributes: [{ value: 'Pocket size A6 notebook' }],
    };
    expect(getCornerEdgesPricing(a6WithPocketAttribute)).toEqual({ size: null, pricePerPair: 0 });
  });

  it('returns correct corner edge pricing for other supported sizes', () => {
    const pocketDiary = {
      name: 'Dorchester Horizon Pocket Diary',
      slug: 'dorchester-horizon-pocket-diary',
    };
    expect(getCornerEdgesPricing(pocketDiary)).toEqual({ size: '18mm × 18mm', pricePerPair: 0.42 });

    const a5Diary = {
      name: 'Dorchester Horizon A5 Desk Diary',
      slug: 'dorchester-horizon-a5-desk-diary',
    };
    expect(getCornerEdgesPricing(a5Diary)).toEqual({ size: '22mm × 22mm', pricePerPair: 0.48 });

    const quartoDiary = {
      name: 'Dorchester Horizon Quarto Desk Diary',
      slug: 'dorchester-horizon-quarto-desk-diary',
    };
    expect(getCornerEdgesPricing(quartoDiary)).toEqual({ size: '27mm × 27mm', pricePerPair: 0.48 });
  });
});

describe('isUvOnlyProduct', () => {
  it('returns true for Ocean Clean notebooks and false for Apple Peel or classic ranges', () => {
    expect(isUvOnlyProduct({ name: 'Ocean Clean Eco A5 Notebook, Sage', slug: 'ocean-clean-eco-a5-notebook-sage', sku: 'OC-SG-U-31' })).toBe(true);
    expect(isUvOnlyProduct({ name: 'Eco Notebook', slug: 'some-slug', sku: 'OC-BS-U-31' })).toBe(true);
    expect(isUvOnlyProduct({ name: 'Apple Peel Eco A5 Notebook', slug: 'apple-peel-eco-a5-notebook', sku: 'AJ-RD-U-31' })).toBe(false);
    expect(isUvOnlyProduct({ name: 'Dorchester A5 Notebook', slug: 'dorchester-a5-notebook', sku: 'DR-BK-U-31' })).toBe(false);
  });
});

