/**
 * WooCommerce Store API client (public, no auth required).
 * Used for product listing, categories, and attributes.
 *
 * Includes automatic retries, abort timeout resilience, and an in-memory
 * stale fallback cache so transient WordPress latency or outages never
 * crash the storefront.
 */

import { getWooStoreUrl } from "./config";

type StoreFetchOptions = {
  params?: Record<string, string | number | boolean | undefined>;
  revalidate?: number | false;
  tags?: string[];
  timeoutMs?: number;
};

type CachedResponse<T> = {
  data: T;
  total?: number;
  totalPages?: number;
  timestamp: number;
};

// In-memory stale fallback cache for absorbing transient WordPress 502/504/timeout blips
const fallbackCache = new Map<string, CachedResponse<unknown>>();
const MAX_FALLBACK_CACHE_SIZE = 500;

function saveFallbackCache<T>(key: string, data: T, total?: number, totalPages?: number) {
  if (fallbackCache.size >= MAX_FALLBACK_CACHE_SIZE) {
    const oldestKey = fallbackCache.keys().next().value;
    if (oldestKey) fallbackCache.delete(oldestKey);
  }
  fallbackCache.set(key, { data, total, totalPages, timestamp: Date.now() });
}

function getFallbackCache<T>(key: string): CachedResponse<T> | undefined {
  return fallbackCache.get(key) as CachedResponse<T> | undefined;
}

function buildUrl(path: string, params?: StoreFetchOptions["params"]): string {
  const storeUrl = getWooStoreUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${storeUrl}/wp-json/wc/store/v1${normalizedPath}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

const DEFAULT_TIMEOUT_MS = 12000; // 12 seconds per attempt
const MAX_RETRIES = 2; // Total attempts = 3
const INITIAL_BACKOFF_MS = 350;

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  fetchOptions: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxRetries = MAX_RETRIES,
): Promise<Response> {
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

      if (response.ok || !isRetryableStatus(response.status)) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
      if (attempt < maxRetries) {
        console.warn(`[Store API] ${url} returned ${response.status}. Retrying (${attempt + 1}/${maxRetries})...`);
      }
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      const isTimeout = err?.name === 'AbortError' || err?.name === 'TimeoutError';
      if (attempt < maxRetries) {
        console.warn(`[Store API] ${url} failed (${isTimeout ? `Timeout after ${timeoutMs}ms` : err?.message || 'Network error'}). Retrying (${attempt + 1}/${maxRetries})...`);
      }
    }

    if (attempt < maxRetries) {
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 200;
      await wait(delay);
    }
  }

  throw lastError;
}

function parseJsonSafe<T>(text: string, url: string): T {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
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
      } catch (innerErr) {}
    }
    throw new Error(`WooCommerce Store API returned invalid JSON for ${url}. Response preview: ${text.substring(0, 200)}`);
  }
}

export async function storeFetch<T>(
  path: string,
  options: StoreFetchOptions = {},
): Promise<T> {
  const { params, revalidate = 3600, tags, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const requestUrl = buildUrl(path, params);

  try {
    const response = await fetchWithRetry(
      requestUrl,
      {
        next: {
          revalidate: revalidate === false ? 0 : revalidate,
          ...(tags && tags.length > 0 ? { tags } : {}),
        },
      },
      timeoutMs,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `WooCommerce Store API error (${response.status}) for ${requestUrl}: ${errorText}`,
      );
    }

    const text = await response.text();
    const data = parseJsonSafe<T>(text, requestUrl);
    saveFallbackCache(requestUrl, data);
    return data;
  } catch (error) {
    const cached = getFallbackCache<T>(requestUrl);
    if (cached) {
      console.warn(`[Store API] Serving stale fallback for ${requestUrl} after error:`, error);
      return cached.data;
    }
    throw error;
  }
}

export async function storeFetchWithHeaders<T>(
  path: string,
  options: StoreFetchOptions = {},
): Promise<{ data: T; total: number; totalPages: number }> {
  const { params, revalidate = 3600, tags, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const requestUrl = buildUrl(path, params);

  try {
    const response = await fetchWithRetry(
      requestUrl,
      {
        next: {
          revalidate: revalidate === false ? 0 : revalidate,
          ...(tags && tags.length > 0 ? { tags } : {}),
        },
      },
      timeoutMs,
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `WooCommerce Store API error (${response.status}) for ${requestUrl}: ${errorText}`,
      );
    }

    const total = Number(response.headers.get("x-wp-total") ?? 0);
    const totalPages = Number(response.headers.get("x-wp-totalpages") ?? 1);
    const text = await response.text();
    const data = parseJsonSafe<T>(text, requestUrl);

    saveFallbackCache(requestUrl, data, total, totalPages);
    return { data, total, totalPages };
  } catch (error) {
    const cached = getFallbackCache<T>(requestUrl);
    if (cached) {
      console.warn(`[Store API] Serving stale fallback for ${requestUrl} after error:`, error);
      return {
        data: cached.data,
        total: cached.total ?? 0,
        totalPages: cached.totalPages ?? 1,
      };
    }
    throw error;
  }
}
