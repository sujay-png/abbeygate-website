/**
 * WooCommerce REST API client (wc/v3).
 *
 * Server-side only — never import this into client components.
 * Keys come from .env.local (WOOCOMMERCE_*). Do not hardcode secrets.
 */

import { getWooStoreUrl } from "./config";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type WooCommerceRequestOptions = {
  path: string;
  method?: HttpMethod;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Next.js fetch cache revalidation in seconds. Defaults to 60. */
  revalidate?: number | false;
  /** Optional Next.js cache tags for on-demand revalidation. */
  tags?: string[];
  /** Request timeout in ms. Defaults to 12000ms. */
  timeoutMs?: number;
};

type WooCommerceConfig = {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
};

function getConfig(): WooCommerceConfig {
  const storeUrl = getWooStoreUrl();
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      "Missing WooCommerce configuration. Set WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET in your .env.local file.",
    );
  }

  return {
    storeUrl,
    consumerKey,
    consumerSecret,
  };
}

function getAuthHeader(consumerKey: string, consumerSecret: string): string {
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64",
  );
  return `Basic ${credentials}`;
}

function buildUrl(
  storeUrl: string,
  path: string,
  params?: WooCommerceRequestOptions["params"],
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${storeUrl}/wp-json/wc/v3${normalizedPath}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

const restFallbackCache = new Map<string, { data: unknown; timestamp: number }>();
const MAX_REST_CACHE = 200;

function saveRestFallback<T>(key: string, data: T) {
  if (restFallbackCache.size >= MAX_REST_CACHE) {
    const oldestKey = restFallbackCache.keys().next().value;
    if (oldestKey) restFallbackCache.delete(oldestKey);
  }
  restFallbackCache.set(key, { data, timestamp: Date.now() });
}

function getRestFallback<T>(key: string): T | undefined {
  return restFallbackCache.get(key)?.data as T | undefined;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonSafe<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    // WordPress plugins or WP_DEBUG sometimes prepend HTML warnings before the actual JSON response
    // Attempt to extract the JSON payload by finding the first '{' or '['
    const jsonStart = text.indexOf('{');
    const jsonArrayStart = text.indexOf('[');
    
    let startIndex = -1;
    if (jsonStart !== -1 && jsonArrayStart !== -1) {
      startIndex = Math.min(jsonStart, jsonArrayStart);
    } else if (jsonStart !== -1) {
      startIndex = jsonStart;
    } else if (jsonArrayStart !== -1) {
      startIndex = jsonArrayStart;
    }

    if (startIndex !== -1) {
      try {
        const maybeJson = text.slice(startIndex);
        return JSON.parse(maybeJson) as T;
      } catch (innerErr) {
        throw new Error(
          `WooCommerce API returned invalid JSON. Could not recover payload. Response preview: ${text.substring(0, 200)}`
        );
      }
    }

    throw new Error(
      `WooCommerce API returned invalid JSON. Response preview: ${text.substring(0, 200)}`
    );
  }
}

export async function woocommerceFetch<T>(
  options: WooCommerceRequestOptions,
): Promise<T> {
  const { storeUrl, consumerKey, consumerSecret } = getConfig();
  const { path, method = "GET", params, body, revalidate = 60, timeoutMs = 12000, tags } = options;

  const url = buildUrl(storeUrl, path, params);
  const cacheKey = `${method}:${url}`;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      Authorization: getAuthHeader(consumerKey, consumerSecret),
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    next: {
      revalidate: revalidate === false ? 0 : revalidate,
      ...(tags && tags.length > 0 ? { tags } : {}),
    },
  };

  // Only retry idempotent GET requests
  const maxRetries = method === "GET" ? 2 : 0;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        if (attempt < maxRetries && isRetryableStatus(response.status)) {
          lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
          console.warn(`[WooCommerce REST] ${url} returned ${response.status}. Retrying (${attempt + 1}/${maxRetries})...`);
          await wait(350 * Math.pow(2, attempt) + Math.random() * 200);
          continue;
        }

        const errorText = await response.text();
        throw new Error(
          `WooCommerce API error (${response.status} ${response.statusText}): ${errorText}`,
        );
      }

      const text = await response.text();
      const data = parseJsonSafe<T>(text);
      if (method === "GET") {
        saveRestFallback(cacheKey, data);
      }
      return data;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
      if (attempt < maxRetries) {
        console.warn(`[WooCommerce REST] ${url} failed (${isTimeout ? `Timeout after ${timeoutMs}ms` : err?.message || 'Network error'}). Retrying (${attempt + 1}/${maxRetries})...`);
        await wait(350 * Math.pow(2, attempt) + Math.random() * 200);
        continue;
      }
    }
  }

  if (method === "GET") {
    const fallback = getRestFallback<T>(cacheKey);
    if (fallback) {
      console.warn(`[WooCommerce REST] Serving stale fallback for ${url} after error:`, lastError);
      return fallback;
    }
  }

  throw lastError;
}

/** Convenience API matching the usual WooCommerce client shape. */
export const woocommerceApi = {
  request<T>(endpoint: string, options: Omit<WooCommerceRequestOptions, "path"> = {}) {
    return woocommerceFetch<T>({
      path: endpoint,
      ...options,
    });
  },

  getProducts(
    params: Record<string, string | number | boolean | undefined> = {},
  ) {
    return woocommerceFetch<unknown[]>({
      path: "/products",
      params: {
        page: 1,
        per_page: 10,
        status: "publish",
        ...params,
      },
    });
  },

  getProductById(id: number | string) {
    return woocommerceFetch<unknown>({
      path: `/products/${id}`,
    });
  },

  getProductBySlug(slug: string) {
    return woocommerceFetch<unknown[]>({
      path: "/products",
      params: { slug, status: "publish" },
    }).then((products) => products[0] ?? null);
  },
};
