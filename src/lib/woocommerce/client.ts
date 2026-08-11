/**
 * WooCommerce REST API client.
 *
 * Server-side only — never import this in client components.
 * Credentials are read from environment variables.
 */

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type WooCommerceRequestOptions = {
  path: string;
  method?: HttpMethod;
  params?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Next.js fetch cache revalidation in seconds. Defaults to 60. */
  revalidate?: number | false;
};

type WooCommerceConfig = {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
};

function getConfig(): WooCommerceConfig {
  const storeUrl = process.env.WOOCOMMERCE_STORE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new Error(
      "Missing WooCommerce configuration. Set WOOCOMMERCE_STORE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET in your .env.local file.",
    );
  }

  return {
    storeUrl: storeUrl.replace(/\/$/, ""),
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

export async function woocommerceFetch<T>(
  options: WooCommerceRequestOptions,
): Promise<T> {
  const { storeUrl, consumerKey, consumerSecret } = getConfig();
  const { path, method = "GET", params, body, revalidate = 60 } = options;

  const response = await fetch(buildUrl(storeUrl, path, params), {
    method,
    headers: {
      Authorization: getAuthHeader(consumerKey, consumerSecret),
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    next: revalidate === false ? { revalidate: 0 } : { revalidate },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `WooCommerce API error (${response.status} ${response.statusText}): ${errorText}`,
    );
  }

  return response.json() as Promise<T>;
}
