import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCheckoutQuote } from './quote';

vi.mock('@/lib/woocommerce/store-api', () => ({
  storeFetch: vi.fn(),
}));

vi.mock('@/lib/woocommerce/client', () => ({
  woocommerceFetch: vi.fn(),
}));

vi.mock('@/features/products/services/pricing', () => ({
  getProductPricingFromProduct: vi.fn(),
}));

import { storeFetch } from '@/lib/woocommerce/store-api';
import { woocommerceFetch } from '@/lib/woocommerce/client';
import { getProductPricingFromProduct } from '@/features/products/services/pricing';

describe('createCheckoutQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies percentage coupon to merchandise subtotal rather than shipping', async () => {
    vi.mocked(storeFetch).mockResolvedValue({
      id: 101,
      name: 'Richmond A5 Desk Diary, Week to View, Black',
      slug: 'richmond-a5-black',
      is_purchasable: true,
      is_in_stock: true,
      categories: [{ id: 164, name: 'A5 Diaries', slug: 'a5-diaries', link: '' }],
      attributes: [],
      images: [],
      prices: { price: '1200', regular_price: '1200', sale_price: '1200', currency_minor_unit: 2 },
    } as any);

    vi.mocked(getProductPricingFromProduct).mockResolvedValue({
      productId: 101,
      basePrice: 10,
      tiers: [{ min: 1, max: 24, price: 10 }],
    });

    vi.mocked(woocommerceFetch).mockResolvedValue([
      {
        code: 'SAVE10',
        amount: '10',
        discount_type: 'percent',
        date_expires: null,
        usage_limit: null,
        usage_count: 0,
        minimum_amount: '0',
        maximum_amount: '0',
        free_shipping: false,
      },
    ]);

    const quote = await createCheckoutQuote({
      items: [{ productId: '101', quantity: 10 }],
      couponCode: 'SAVE10',
    });

    // Subtotal = £100.00, 10% discount should be £10.00 (NOT 10% of £115.75 = £11.58)
    expect(quote.subtotal).toBe(100);
    expect(quote.shipping.cost).toBe(15.75);
    expect(quote.discount).toBe(10);
    // Taxable = 100 + 15.75 - 10 = 105.75, VAT = 21.15, Total = 126.90
    expect(quote.vat).toBe(21.15);
    expect(quote.total).toBe(126.9);
  });

  it('treats custom-gifts category products as non-customizable gifts', async () => {
    vi.mocked(storeFetch).mockResolvedValue({
      id: 202,
      name: 'Leather Luggage Tag',
      slug: 'leather-luggage-tag',
      is_purchasable: true,
      is_in_stock: true,
      categories: [{ id: 200, name: 'Custom Gifts', slug: 'custom-gifts', link: '' }],
      attributes: [],
      images: [],
      prices: { price: '1200', regular_price: '1200', sale_price: '1200', currency_minor_unit: 2 },
    } as any);

    vi.mocked(getProductPricingFromProduct).mockResolvedValue({
      productId: 202,
      basePrice: 10,
      tiers: [{ min: 1, max: 24, price: 10 }],
    });

    const quote = await createCheckoutQuote({
      items: [
        {
          productId: '202',
          quantity: 10,
          customization: { enabled: true, choice: 'Foil Blocked' },
        },
      ],
    });

    // Gifts must not incur £48 branding setup fee
    expect(quote.subtotal).toBe(100);
  });

  it('enforces UV Print and strips foilColor for Ocean Clean products', async () => {
    vi.mocked(storeFetch).mockResolvedValue({
      id: 1344,
      name: 'Ocean Clean Eco A5 Notebook, Sage',
      slug: 'ocean-clean-eco-a5-notebook-sage',
      sku: 'OC-SG-U-31',
      is_purchasable: true,
      is_in_stock: true,
      categories: [{ id: 173, name: 'Eco-Friendly Notebooks', slug: 'eco-friendly-notebooks', link: '' }],
      attributes: [],
      images: [],
      prices: { price: '1000', regular_price: '1000', sale_price: '1000', currency_minor_unit: 2 },
    } as any);

    vi.mocked(getProductPricingFromProduct).mockResolvedValue({
      productId: 1344,
      basePrice: 10,
      tiers: [{ min: 25, max: 49, price: 10, uvPrice: 12 }],
    });

    const quote = await createCheckoutQuote({
      items: [
        {
          productId: '1344',
          quantity: 25,
          customization: {
            enabled: true,
            choice: 'Foil blocked',
            foilColor: 'Gold',
          },
        },
      ],
    });

    expect(quote.lines[0].customization?.choice).toBe('UV Print');
    expect(quote.lines[0].customization?.foilColor).toBeUndefined();
    expect(quote.lines[0].unitPrice).toBe(12);
  });

  it('prevents colourGroupId bulk-pricing bypass across unrelated products', async () => {
    vi.mocked(storeFetch).mockImplementation(async (path: string) => {
      if (path === '/products/101') {
        return {
          id: 101,
          name: 'Chelsea Leather A5 Diary, Black',
          slug: 'chelsea-a5-black',
          is_purchasable: true,
          is_in_stock: true,
          categories: [{ id: 164, name: 'A5 Diaries', slug: 'a5-diaries', link: '' }],
          tags: [{ id: 500, name: 'Chelsea-A5-Diary', slug: 'chelsea-a5-diary' }],
          attributes: [],
          images: [],
          prices: { price: '2400', regular_price: '2400', sale_price: '2400', currency_minor_unit: 2 },
        } as any;
      }
      return {
        id: 202,
        name: 'Dorchester Keyring, Black',
        slug: 'dorchester-keyring-black',
        is_purchasable: true,
        is_in_stock: true,
        categories: [{ id: 176, name: 'Custom Gifts', slug: 'custom-gifts', link: '' }],
        tags: [{ id: 600, name: 'Dorchester-Keyring', slug: 'dorchester-keyring' }],
        attributes: [],
        images: [],
        prices: { price: '600', regular_price: '600', sale_price: '600', currency_minor_unit: 2 },
      } as any;
    });

    vi.mocked(getProductPricingFromProduct).mockImplementation(async (product: any) => {
      if (product.id === 101) {
        return {
          productId: 101,
          basePrice: 20,
          tiers: [
            { min: 1, max: 24, price: 20 },
            { min: 100, max: null, price: 10 },
          ],
        };
      }
      return {
        productId: 202,
        basePrice: 5,
        tiers: [
          { min: 1, max: 24, price: 5 },
          { min: 100, max: null, price: 2 },
        ],
      };
    });

    const quote = await createCheckoutQuote({
      items: [
        {
          productId: '101',
          quantity: 1,
          colourGroupId: 'fake-group',
          customization: { enabled: true, choice: 'Foil blocked', foilColor: 'Gold' },
        },
        {
          productId: '202',
          quantity: 99,
          colourGroupId: 'fake-group',
        },
      ],
    });

    // Unrelated items cannot pool quantities: diary stays at qty 1 tier (£20 + £48 setup = £68)
    expect(quote.lines[0].unitPrice).toBe(20);
    expect(quote.lines[0].lineTotal).toBe(68);
    // Keyring stays at qty 99 tier (£5) rather than 100+ tier (£2)
    expect(quote.lines[1].unitPrice).toBe(5);
  });

  it('still groups legitimate colour variants sharing a grouping tag for bulk pricing and single setup fee', async () => {
    vi.mocked(storeFetch).mockImplementation(async (path: string) => {
      const id = path.endsWith('101') ? 101 : 102;
      return {
        id,
        name: id === 101 ? 'Richmond A5 Diary, Black' : 'Richmond A5 Diary, Blue',
        slug: id === 101 ? 'richmond-a5-black' : 'richmond-a5-blue',
        is_purchasable: true,
        is_in_stock: true,
        categories: [{ id: 164, name: 'A5 Diaries', slug: 'a5-diaries', link: '' }],
        tags: [
          { id: 203, name: '2027', slug: '2027' },
          { id: 76, name: 'Richmond-A5-WTV', slug: 'richmond-a5-wtv' },
        ],
        attributes: [],
        images: [],
        prices: { price: '2400', regular_price: '2400', sale_price: '2400', currency_minor_unit: 2 },
      } as any;
    });

    vi.mocked(getProductPricingFromProduct).mockResolvedValue({
      productId: 101,
      basePrice: 20,
      tiers: [
        { min: 1, max: 24, price: 20 },
        { min: 25, max: 49, price: 15 },
      ],
    });

    const quote = await createCheckoutQuote({
      items: [
        {
          productId: '101',
          quantity: 15,
          colourGroupId: 'richmond-group',
          customization: { enabled: true, choice: 'Foil blocked', foilColor: 'Gold' },
        },
        {
          productId: '102',
          quantity: 15,
          colourGroupId: 'richmond-group',
          customization: { enabled: true, choice: 'Foil blocked', foilColor: 'Gold' },
        },
      ],
    });

    // Combined qty = 30 hits the 25-49 tier (£15) and charges £48 setup fee once
    expect(quote.lines[0].unitPrice).toBe(15);
    expect(quote.lines[0].lineTotal).toBe(15 * 15 + 48);
    expect(quote.lines[1].unitPrice).toBe(15);
    expect(quote.lines[1].lineTotal).toBe(15 * 15);
  });
});
