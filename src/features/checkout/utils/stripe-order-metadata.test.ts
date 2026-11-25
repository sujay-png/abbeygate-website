import { describe, it, expect } from 'vitest';
import {
  buildStripeItemsSummary,
  buildStripeOrderInfo,
  buildStripePrePaymentInfo,
} from './stripe-order-metadata';
import type { CheckoutQuoteLine } from '../types/quote';

const sampleLines: CheckoutQuoteLine[] = [
  {
    productId: '101',
    name: 'Richmond A5 Diary, Red',
    quantity: 25,
    unitPrice: 4.5,
    lineTotal: 112.5,
  },
  {
    productId: '202',
    name: 'Dorchester Luggage Tag, Aqua',
    quantity: 1,
    unitPrice: 8.24,
    lineTotal: 8.24,
  },
];

describe('stripe-order-metadata', () => {
  it('formats items summary and enforces Stripe 500-char metadata limit', () => {
    expect(buildStripeItemsSummary(sampleLines)).toBe(
      '25x Richmond A5 Diary, Red, 1x Dorchester Luggage Tag, Aqua',
    );

    const longLines: CheckoutQuoteLine[] = Array.from({ length: 30 }, (_, idx) => ({
      productId: String(idx),
      name: `Chelsea Real Leather Executive Pocket Diary ${idx}`,
      quantity: 10,
      unitPrice: 5,
      lineTotal: 50,
    }));
    const longSummary = buildStripeItemsSummary(longLines);
    expect(longSummary.length).toBeLessThanOrEqual(500);
    expect(longSummary.endsWith('...')).toBe(true);
  });

  it('builds pre-payment info using checkout session and items', () => {
    const info = buildStripePrePaymentInfo('12345678-abcd-efgh-ijkl-1234567890ab', sampleLines);
    expect(info.description).toBe(
      'Abbeygate Checkout - 25x Richmond A5 Diary, Red, 1x Dorchester Luggage Tag, Aqua',
    );
    expect(info.metadata).toEqual({
      checkoutSessionId: '12345678-abcd-efgh-ijkl-1234567890ab',
      items: '25x Richmond A5 Diary, Red, 1x Dorchester Luggage Tag, Aqua',
    });
  });

  it('builds post-order Stripe description and metadata with WooCommerce order number', () => {
    const info = buildStripeOrderInfo({
      sessionId: 'sess-123',
      orderId: 6682,
      orderNumber: '6682',
      customerName: 'Justine Wyness',
      customerEmail: 'justine@wyness.com',
      lines: sampleLines,
    });

    expect(info.description).toBe('Order #6682 - Justine Wyness');
    expect(info.metadata).toEqual({
      checkoutSessionId: 'sess-123',
      order_id: '6682',
      order_number: '6682',
      customer_name: 'Justine Wyness',
      customer_email: 'justine@wyness.com',
      items: '25x Richmond A5 Diary, Red, 1x Dorchester Luggage Tag, Aqua',
    });
  });

  it('falls back to email or order number only when customer name is omitted', () => {
    expect(
      buildStripeOrderInfo({
        sessionId: 'sess-123',
        orderId: 6690,
        customerEmail: 'buyer@example.com',
        lines: [],
      }).description,
    ).toBe('Order #6690 - buyer@example.com');

    expect(
      buildStripeOrderInfo({
        sessionId: 'sess-123',
        orderId: 6691,
        lines: [],
      }).description,
    ).toBe('Order #6691');
  });
});
