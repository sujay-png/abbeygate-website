import { describe, it, expect } from 'vitest';
import { buildWooOrderLineItems } from './woo-order-lines';
import type { CheckoutQuoteLine } from '../types/quote';

const sampleLines: CheckoutQuoteLine[] = [
  {
    productId: '1041',
    name: 'Richmond A4 Desk Diary, Red',
    quantity: 1,
    unitPrice: 14.58,
    lineTotal: 14.58,
  },
  {
    productId: '1042',
    name: 'Richmond A4 Desk Diary, Blue',
    quantity: 1,
    unitPrice: 14.58,
    lineTotal: 14.58,
  },
];

describe('buildWooOrderLineItems', () => {
  it('sets explicit ex-VAT subtotal equal to total when no discount is applied', () => {
    const result = buildWooOrderLineItems(sampleLines, 0);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      product_id: 1041,
      quantity: 1,
      subtotal: '14.58',
      total: '14.58',
    });
    expect(result[1]).toMatchObject({
      product_id: 1042,
      quantity: 1,
      subtotal: '14.58',
      total: '14.58',
    });
  });

  it('allocates coupon discounts cleanly without penny drift', () => {
    const result = buildWooOrderLineItems(
      [
        { productId: '1', name: 'Item A', quantity: 1, unitPrice: 10, lineTotal: 10 },
        { productId: '2', name: 'Item B', quantity: 1, unitPrice: 10, lineTotal: 10 },
        { productId: '3', name: 'Item C', quantity: 1, unitPrice: 10, lineTotal: 10 },
      ],
      10,
    );

    expect(result.map((r) => r.subtotal)).toEqual(['10.00', '10.00', '10.00']);
    expect(result.map((r) => r.total)).toEqual(['6.67', '6.67', '6.66']);
    const netSum = result.reduce((s, r) => s + Number(r.total), 0);
    expect(Number(netSum.toFixed(2))).toBe(20);
  });

  it('clamps 100% coupons cleanly to 0.00 total while preserving ex-VAT subtotal', () => {
    const result = buildWooOrderLineItems(sampleLines, 50);
    expect(result.map((r) => r.subtotal)).toEqual(['14.58', '14.58']);
    expect(result.map((r) => r.total)).toEqual(['0.00', '0.00']);
  });
});
