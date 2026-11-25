import { describe, it, expect } from 'vitest';
import { getRecommendedProducts } from './recommendations';
import type { StoreProduct } from '../types/store-product';

function makeProduct(overrides: Partial<StoreProduct> & { id: number; name: string }): StoreProduct {
  const { id, name, slug, categories, attributes, is_in_stock, is_purchasable, ...rest } = overrides;
  return {
    id,
    name,
    slug: slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    permalink: '',
    sku: `SKU-${id}`,
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
    price_html: '',
    images: [],
    categories: categories ?? [],
    tags: [],
    attributes: attributes ?? [],
    is_purchasable: is_purchasable ?? true,
    is_in_stock: is_in_stock ?? true,
    average_rating: '0',
    review_count: 0,
    ...rest,
  };
}

const cat = (slug: string, id = 1) => ({ id, name: slug, slug, link: '' });
const attr = (taxonomy: string, slug: string) => ({
  id: 1,
  name: taxonomy,
  taxonomy,
  has_variations: false,
  terms: [{ id: 1, name: slug, slug }],
});

describe('getRecommendedProducts ordered waterfall rules', () => {
  it('follows Diary Priority 1 (up to 3 diff-collection diaries) then Priority 2 (up to 2 same-collection notebooks)', () => {
    const current = makeProduct({
      id: 1,
      name: 'Dorchester A5 Desk 2027 Diary, Week to View, Black',
      categories: [cat('diaries'), cat('a5-diaries'), cat('dorchester-collection'), cat('wtv')],
      attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'black')],
    });

    const catalog: StoreProduct[] = [
      current,
      // Pool 1 candidates (Diaries, Black, A5, diff collections — 4 available, cap 3)
      makeProduct({
        id: 2,
        name: 'Richmond A5 Desk 2027 Diary, Week to View, Black',
        categories: [cat('diaries'), cat('a5-diaries'), cat('richmond-collection'), cat('wtv')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'black')],
      }),
      makeProduct({
        id: 3,
        name: 'Chelsea Leather A5 Desk 2027 Diary, Day Per Page, Black',
        categories: [cat('diaries'), cat('a5-diaries'), cat('chelsea-collection'), cat('dpp')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'black')],
      }),
      makeProduct({
        id: 4,
        name: 'Lewes A5 Desk 2027 Diary, Week to View, Black',
        categories: [cat('diaries'), cat('a5-diaries'), cat('lewes-collection'), cat('wtv')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'black')],
      }),
      makeProduct({
        id: 5,
        name: 'Harrogate A5 Desk 2027 Diary, Day Per Page, Black',
        categories: [cat('diaries'), cat('a5-diaries'), cat('harrogate-collection'), cat('dpp')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'black')],
      }),
      // Pool 2 candidates (Notebooks, Black, A5, Dorchester)
      makeProduct({
        id: 6,
        name: 'Dorchester A5 Notebook, Feint Ruled, Black',
        categories: [cat('notebooks'), cat('a5-notebooks'), cat('dorchester-collection')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'black')],
      }),
      // Pool 3 backfill (Dorchester A5 DPP Black Diary)
      makeProduct({
        id: 7,
        name: 'Dorchester Horizon A5 Desk 2027 Diary, Day Per Page, Black',
        categories: [cat('diaries'), cat('a5-diaries'), cat('dorchester-collection'), cat('dpp')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'black')],
      }),
      // Out-of-stock must be excluded
      makeProduct({
        id: 8,
        name: 'Windsor A5 Desk 2027 Diary, Week to View, Black',
        categories: [cat('diaries'), cat('a5-diaries'), cat('windsor-collection'), cat('wtv')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'black')],
        is_in_stock: false,
      }),
    ];

    const result = getRecommendedProducts({ currentProduct: current, catalog });

    expect(result).toHaveLength(5);
    // First 3 come from diff-collection diaries (Chelsea, Dorchester weight < Harrogate/Richmond/Lewes)
    expect(result.slice(0, 3).map((p) => p.id)).toEqual([3, 5, 2]);
    // 4th comes from same-collection notebook (id 6) before Pool 3 backfill (id 7 -> wait: id 4 was 4th diff-collection diary!)
    // Actually Priority 2 takes id 6 (only 1 Dorchester A5 notebook), then Pool 3 prefers diff Diary View -> id 7 OR Harrogate/Lewes!
    expect(result[3].id).toBe(6);
    expect(result.map((p) => p.id)).not.toContain(8);
  });

  it('deduplicates parent products across colour variants and excludes current product', () => {
    const current = makeProduct({
      id: 10,
      name: 'Dorchester A5 Notebook, Feint Ruled, Blue',
      categories: [cat('notebooks'), cat('a5-notebooks'), cat('dorchester-collection')],
      attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'blue')],
    });

    const catalog: StoreProduct[] = [
      current,
      // Another colour of current parent product should not be selected
      makeProduct({
        id: 11,
        name: 'Dorchester A5 Notebook, Feint Ruled, Royal Blue',
        categories: [cat('notebooks'), cat('a5-notebooks'), cat('dorchester-collection')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'royal-blue')],
      }),
      // Two colours of Richmond A5 Notebook (parent must only appear once)
      makeProduct({
        id: 12,
        name: 'Richmond A5 Notebook, Feint Ruled, Blue',
        categories: [cat('notebooks'), cat('a5-notebooks'), cat('richmond-collection')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'blue')],
      }),
      makeProduct({
        id: 13,
        name: 'Richmond A5 Notebook, Feint Ruled, Dark Blue',
        categories: [cat('notebooks'), cat('a5-notebooks'), cat('richmond-collection')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'dark-blue')],
      }),
      makeProduct({
        id: 14,
        name: 'Chelsea Leather A5 Notebook, Feint Ruled, Blue',
        categories: [cat('notebooks'), cat('a5-notebooks'), cat('chelsea-collection')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'blue')],
      }),
    ];

    const result = getRecommendedProducts({ currentProduct: current, catalog });
    const ids = result.map((p) => p.id);

    expect(ids).not.toContain(10);
    expect(ids).not.toContain(11);
    const richmondCount = result.filter((p) => p.name.startsWith('Richmond A5 Notebook')).length;
    expect(richmondCount).toBe(1);
    expect(ids).toContain(14);
  });

  it('follows Custom Gifts priority: same collection + colour first, then other gift styles/segment', () => {
    const current = makeProduct({
      id: 20,
      name: 'Dorchester Multi Purpose Card Holder, Black',
      categories: [cat('custom-gifts'), cat('card-holders'), cat('dorchester-collection'), cat('travel-gifts')],
      attributes: [attr('pa_colour', 'black')],
    });

    const catalog: StoreProduct[] = [
      current,
      makeProduct({
        id: 21,
        name: 'Dorchester Passport Holder, Black',
        categories: [cat('custom-gifts'), cat('passport-holders'), cat('dorchester-collection'), cat('travel-gifts')],
        attributes: [attr('pa_colour', 'black')],
      }),
      makeProduct({
        id: 22,
        name: 'Dorchester Large Luggage Tag, Black',
        categories: [cat('custom-gifts'), cat('luggage-tags'), cat('dorchester-collection'), cat('travel-gifts')],
        attributes: [attr('pa_colour', 'black')],
      }),
      makeProduct({
        id: 23,
        name: 'Chelsea Leather Multi Purpose Card Holder, Black',
        categories: [cat('custom-gifts'), cat('card-holders'), cat('chelsea-collection'), cat('travel-gifts')],
        attributes: [attr('pa_colour', 'black')],
      }),
      makeProduct({
        id: 24,
        name: 'Windsor Collection Leather Luggage Tag, Navy',
        categories: [cat('custom-gifts'), cat('luggage-tags'), cat('windsor-collection'), cat('travel-gifts')],
        attributes: [attr('pa_colour', 'navy')],
      }),
    ];

    const result = getRecommendedProducts({ currentProduct: current, catalog });

    // Same collection + same colour + different product types (21, 22) come first
    expect(result.slice(0, 2).map((p) => p.id)).toEqual([21, 22]);
    // Then same type + same colour + different collection (23) before broader travel segment (24)
    expect(result.slice(2, 4).map((p) => p.id)).toEqual([23, 24]);
  });

  it('places manualOverrideIds first when linked and backfills remaining slots up to 5', () => {
    const current = makeProduct({
      id: 30,
      name: 'Lewes A5 Notebook, Feint Ruled, White',
      categories: [cat('notebooks'), cat('a5-notebooks'), cat('lewes-collection')],
      attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'white')],
    });

    const catalog: StoreProduct[] = [
      current,
      makeProduct({
        id: 31,
        name: 'Chelsea Leather A5 Notebook, Feint Ruled, Blue',
        categories: [cat('notebooks'), cat('a5-notebooks'), cat('chelsea-collection')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'blue')],
      }),
      makeProduct({
        id: 32,
        name: 'Harrogate A5 Notebook, Feint Ruled, Green',
        categories: [cat('notebooks'), cat('a5-notebooks'), cat('harrogate-collection')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'green')],
      }),
      makeProduct({
        id: 33,
        name: 'Richmond A5 Notebook, Feint Ruled, Red',
        categories: [cat('notebooks'), cat('a5-notebooks'), cat('richmond-collection')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'red')],
      }),
      makeProduct({
        id: 34,
        name: 'Dorchester A5 Notebook, Feint Ruled, Grey',
        categories: [cat('notebooks'), cat('a5-notebooks'), cat('dorchester-collection')],
        attributes: [attr('pa_size', 'a5'), attr('pa_colour', 'grey')],
      }),
      makeProduct({
        id: 35,
        name: 'Lewes Pocket 2027 Diary, Week to View, Red',
        categories: [cat('diaries'), cat('pocket-diaries'), cat('lewes-collection'), cat('wtv')],
        attributes: [attr('pa_size', 'pocket'), attr('pa_colour', 'red')],
      }),
    ];

    const result = getRecommendedProducts({
      currentProduct: current,
      catalog,
      manualOverrideIds: [35, 34],
    });

    expect(result).toHaveLength(5);
    expect(result[0].id).toBe(35);
    expect(result[1].id).toBe(34);
  });
});
