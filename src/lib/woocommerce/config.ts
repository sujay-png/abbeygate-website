/**
 * Shared WooCommerce base URL helpers.
 * WOOCOMMERCE_STORE_URL must be the site origin only, e.g.
 * https://dashboard.abbeygate-england.com
 *
 * If someone pastes a full REST path we strip it so Store API + REST API
 * both resolve correctly.
 */

const DEFAULT_STORE_URL = "https://dashboard.abbeygate-england.com";

export function normalizeWooStoreUrl(raw?: string | null): string {
  let url = (raw ?? DEFAULT_STORE_URL).trim();

  // Remove trailing slash
  url = url.replace(/\/+$/, "");

  // Strip accidental API path suffixes people often paste into .env
  url = url
    .replace(/\/wp-json\/wc\/v3$/i, "")
    .replace(/\/wp-json\/wc\/store\/v1$/i, "")
    .replace(/\/wp-json$/i, "")
    .replace(/\/+$/, "");

  return url || DEFAULT_STORE_URL;
}

export function getWooStoreUrl(): string {
  return normalizeWooStoreUrl(process.env.WOOCOMMERCE_STORE_URL);
}
