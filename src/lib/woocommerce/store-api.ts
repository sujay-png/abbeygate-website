/**
 * WooCommerce Store API client (public, no auth required).
 * Used for product listing, categories, and attributes.
 */

import { getWooStoreUrl } from "./config";

type StoreFetchOptions = {
  params?: Record<string, string | number | boolean | undefined>;
  revalidate?: number | false;
};

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

export async function storeFetch<T>(
  path: string,
  options: StoreFetchOptions = {},
): Promise<T> {
  const { params, revalidate = 60 } = options;
  const requestUrl = buildUrl(path, params);

  const response = await fetch(requestUrl, {
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `WooCommerce Store API error (${response.status}) for ${requestUrl}: ${errorText}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function storeFetchWithHeaders<T>(
  path: string,
  options: StoreFetchOptions = {},
): Promise<{ data: T; total: number; totalPages: number }> {
  const { params, revalidate = 60 } = options;
  const requestUrl = buildUrl(path, params);

  const response = await fetch(requestUrl, {
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `WooCommerce Store API error (${response.status}) for ${requestUrl}: ${errorText}`,
    );
  }

  const total = Number(response.headers.get("x-wp-total") ?? 0);
  const totalPages = Number(response.headers.get("x-wp-totalpages") ?? 1);
  const data = (await response.json()) as T;

  return { data, total, totalPages };
}
