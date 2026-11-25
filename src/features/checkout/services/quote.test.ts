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
});
