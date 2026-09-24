import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY on the server.');
  }

  stripe ??= new Stripe(secretKey);
  return stripe;
}

export function getStripePublishableKey(): string | null {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null;
}
