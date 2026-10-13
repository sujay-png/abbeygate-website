import { describe, it, expect } from 'vitest';
import { validateEnv } from './env';

describe('validateEnv', () => {
  it('validates a complete environment successfully', () => {
    const valid = {
      WOOCOMMERCE_STORE_URL: 'https://example.com',
      WOOCOMMERCE_CONSUMER_KEY: 'ck_12345',
      WOOCOMMERCE_CONSUMER_SECRET: 'cs_67890',
      STRIPE_SECRET_KEY: 'sk_test_123',
    };

    const result = validateEnv(valid);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.env.WOOCOMMERCE_STORE_URL).toBe('https://example.com');
  });

  it('detects missing critical variables and invalid URLs', () => {
    const invalid = {
      WOOCOMMERCE_STORE_URL: 'not-a-url',
    };

    const result = validateEnv(invalid);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    expect(result.errors.some((e) => e.includes('WOOCOMMERCE_STORE_URL must be a valid HTTP(S) URL'))).toBe(true);
    expect(result.errors.some((e) => e.includes('WOOCOMMERCE_CONSUMER_KEY is missing'))).toBe(true);
    expect(result.errors.some((e) => e.includes('WOOCOMMERCE_CONSUMER_SECRET is missing'))).toBe(true);
  });
});
