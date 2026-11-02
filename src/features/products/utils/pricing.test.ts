import { describe, it, expect } from 'vitest';
import { getCornerEdgesPricing } from './pricing';

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

