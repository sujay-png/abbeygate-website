import { describe, it, expect } from 'vitest';
import { canAccessOrder } from './orders';

describe('canAccessOrder', () => {
  it('allows direct customer_id match even when email is unverified', () => {
    expect(
      canAccessOrder(
        { customer_id: 42, billing: { email: 'victim@example.com' } },
        { userId: 42, email: 'victim@example.com', emailVerified: false },
      ),
    ).toBe(true);
  });

  it('blocks billing email match when session emailVerified is false', () => {
    expect(
      canAccessOrder(
        { customer_id: 0, billing: { email: 'victim@example.com' } },
        { userId: 99, email: 'victim@example.com', emailVerified: false },
      ),
    ).toBe(false);
  });

  it('allows billing email match for verified sessions', () => {
    expect(
      canAccessOrder(
        { customer_id: 0, billing: { email: 'Victim@Example.com' } },
        { userId: 99, email: 'victim@example.com', emailVerified: true },
      ),
    ).toBe(true);
  });

  it('denies access when customer_id differs and email does not match', () => {
    expect(
      canAccessOrder(
        { customer_id: 10, billing: { email: 'other@example.com' } },
        { userId: 99, email: 'victim@example.com', emailVerified: true },
      ),
    ).toBe(false);
  });
});
