import type { StoreProduct, ProductFilters, FilterParamKey } from "../types/store-product";
import { FILTER_TAXONOMY_MAP } from "../types/store-product";

export function productMatchesFilters(
  product: StoreProduct,
  filters: ProductFilters,
): boolean {
  for (const [param, taxonomy] of Object.entries(FILTER_TAXONOMY_MAP) as [
    FilterParamKey,
    string,
  ][]) {
    const selected = filters[param];
    if (!selected?.length) continue;

    const productSlugs = product.attributes
      .filter((attr) => attr.taxonomy === taxonomy)
      .flatMap((attr) => attr.terms.map((t) => t.slug));

    const hasMatch = selected.some((slug) => productSlugs.includes(slug));
    if (!hasMatch) return false;
  }

  return true;
}

export function countProductsForTerm(
  products: StoreProduct[],
  taxonomy: string,
  termSlug: string,
  filters: ProductFilters,
  currentFilterKey: FilterParamKey,
): number {
  return products.filter((product) => {
    const productSlugs = product.attributes
      .filter((attr) => attr.taxonomy === taxonomy)
      .flatMap((attr) => attr.terms.map((t) => t.slug));

    if (!productSlugs.includes(termSlug)) return false;

    for (const [param, tax] of Object.entries(FILTER_TAXONOMY_MAP) as [
      FilterParamKey,
      string,
    ][]) {
      if (param === currentFilterKey) continue;
      const selected = filters[param];
      if (!selected?.length) continue;

      const slugs = product.attributes
        .filter((attr) => attr.taxonomy === tax)
        .flatMap((attr) => attr.terms.map((t) => t.slug));

      if (!selected.some((s) => slugs.includes(s))) return false;
    }

    return true;
  }).length;
}

export function parseFiltersFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): ProductFilters {
  const filters: ProductFilters = {};

  for (const key of Object.keys(FILTER_TAXONOMY_MAP) as FilterParamKey[]) {
    const value = params[key];
    if (!value) continue;
    const raw = Array.isArray(value) ? value[0] : value;
    filters[key] = raw.split(",").map((s) => s.trim()).filter(Boolean);
  }

  return filters;
}

export function filtersToSearchParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, values] of Object.entries(filters) as [FilterParamKey, string[]][]) {
    if (values?.length) {
      params.set(key, values.join(","));
    }
  }

  return params;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, "&")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function getProductDisplayPrice(product: StoreProduct): string {
  const minorUnit = product.prices.currency_minor_unit ?? 2;
  const price = parseInt(product.prices.price, 10) / Math.pow(10, minorUnit);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(price);
}
