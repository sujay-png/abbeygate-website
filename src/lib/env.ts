/**
 * Application environment configuration and runtime validator.
 * Validates critical environment variables and provides typed access.
 */

export interface AppEnv {
  WOOCOMMERCE_STORE_URL: string;
  WOOCOMMERCE_CONSUMER_KEY: string;
  WOOCOMMERCE_CONSUMER_SECRET: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
}

export function validateEnv(customEnv?: Record<string, string | undefined>): {
  env: AppEnv;
  isValid: boolean;
  errors: string[];
} {
  const source = customEnv ?? process.env;
  const errors: string[] = [];

  const storeUrl = source.WOOCOMMERCE_STORE_URL?.trim();
  if (!storeUrl) {
    errors.push('WOOCOMMERCE_STORE_URL is missing or empty.');
  } else if (!storeUrl.startsWith('http://') && !storeUrl.startsWith('https://')) {
    errors.push(`WOOCOMMERCE_STORE_URL must be a valid HTTP(S) URL, received "${storeUrl}".`);
  }

  const consumerKey = source.WOOCOMMERCE_CONSUMER_KEY?.trim();
  if (!consumerKey) {
    errors.push('WOOCOMMERCE_CONSUMER_KEY is missing or empty.');
  }

  const consumerSecret = source.WOOCOMMERCE_CONSUMER_SECRET?.trim();
  if (!consumerSecret) {
    errors.push('WOOCOMMERCE_CONSUMER_SECRET is missing or empty.');
  }

  const env: AppEnv = {
    WOOCOMMERCE_STORE_URL: storeUrl || 'https://dashboard.abbeygate-england.com',
    WOOCOMMERCE_CONSUMER_KEY: consumerKey || '',
    WOOCOMMERCE_CONSUMER_SECRET: consumerSecret || '',
    STRIPE_SECRET_KEY: source.STRIPE_SECRET_KEY?.trim(),
    STRIPE_WEBHOOK_SECRET: source.STRIPE_WEBHOOK_SECRET?.trim(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: source.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim(),
    UPSTASH_REDIS_REST_URL: source.UPSTASH_REDIS_REST_URL?.trim(),
    UPSTASH_REDIS_REST_TOKEN: source.UPSTASH_REDIS_REST_TOKEN?.trim(),
    NEXT_PUBLIC_SENTRY_DSN: source.NEXT_PUBLIC_SENTRY_DSN?.trim(),
  };

  return {
    env,
    isValid: errors.length === 0,
    errors,
  };
}
