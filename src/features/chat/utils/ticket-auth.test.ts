import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { signTicketToken, verifyTicketToken } from './ticket-auth';

describe('ticket-auth HMAC helpers', () => {
  const originalSecret = process.env.WP_HEADLESS_SECRET;

  beforeEach(() => {
    process.env.WP_HEADLESS_SECRET = 'test-headless-secret-value';
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.WP_HEADLESS_SECRET;
    else process.env.WP_HEADLESS_SECRET = originalSecret;
  });

  it('signs and verifies matching ticket IDs', () => {
    const token = signTicketToken(12345);
    expect(verifyTicketToken(12345, token)).toBe(true);
    expect(verifyTicketToken('12345', token)).toBe(true);
  });

  it('rejects mismatched ticket IDs or tampered tokens', () => {
    const token = signTicketToken(12345);
    expect(verifyTicketToken(99999, token)).toBe(false);
    expect(verifyTicketToken(12345, 'tampered')).toBe(false);
    expect(verifyTicketToken(12345, '')).toBe(false);
    expect(verifyTicketToken(12345, null)).toBe(false);
  });
});
