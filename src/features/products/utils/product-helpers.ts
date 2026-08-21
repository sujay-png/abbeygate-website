import type { StoreProduct, ProductFilters, FilterParamKey } from "../types/store-product";
import { FILTER_TAXONOMY_MAP } from "../types/store-product";

export function getProductPhysicalDimensionsMm(product: StoreProduct): { width: number; height: number } {
  const sizeAttribute = product.attributes.find((attr) => attr.taxonomy === 'pa_size');
  const sizeTerms = sizeAttribute?.terms.map(t => t.slug.toLowerCase()) || [];
  const nameLower = product.name.toLowerCase();
  
  if (sizeTerms.includes('a4') || nameLower.includes('a4')) {
    return { width: 210, height: 297 };
  }
  if (sizeTerms.includes('quarto') || nameLower.includes('quarto')) {
    return { width: 210, height: 260 };
  }
  if (sizeTerms.includes('pocket') || nameLower.includes('pocket')) {
    return { width: 90, height: 140 };
  }
  if (sizeTerms.includes('slim') || nameLower.includes('slim')) {
    return { width: 80, height: 170 };
  }
  
  // Default fallback (e.g. A5)
  return { width: 148, height: 210 };
}
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

export function getLogoAnchors(product: StoreProduct) {
  const { width, height } = getProductPhysicalDimensionsMm(product);
  const aspectRatio = width / Math.max(height, 1);
  
  // Most product photos seem to have the book fill ~85% of the height
  const visualHeight = 85;
  const visualWidth = visualHeight * aspectRatio;
  
  const whiteSpaceX = (100 - visualWidth) / 2;
  const whiteSpaceY = (100 - visualHeight) / 2;
  
  // Inner margin from the edge of the book (e.g. 6% of container)
  const margin = 6;
  
  return {
    safeLeft: whiteSpaceX + margin,
    safeRight: 100 - (whiteSpaceX + margin),
    safeTop: whiteSpaceY + margin,
    safeBottom: 100 - (whiteSpaceY + margin),
    bookLeft: whiteSpaceX,
    bookRight: 100 - whiteSpaceX,
    bookTop: whiteSpaceY,
    bookBottom: 100 - whiteSpaceY,
  };
}

export async function getImageBoundingBox(imageUrl: string): Promise<{ top: number, bottom: number, left: number, right: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      let imageData;
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch (e) {
        console.error('Canvas CORS error:', e);
        return resolve(null);
      }
      const data = imageData.data;
      
      let minX = canvas.width;
      let maxX = 0;
      let minY = canvas.height;
      let maxY = 0;
      
      const marginX = Math.floor(canvas.width * 0.05);
      const marginY = Math.floor(canvas.height * 0.05);

      const sumX = new Float64Array(canvas.width);
      const sumY = new Float64Array(canvas.height);

      const getBrightness = (x: number, y: number) => {
        const i = (y * canvas.width + x) * 4;
        const a = data[i + 3];
        // Treat transparent pixels as white for gradient purposes
        if (a < 10) return 255; 
        return (data[i] + data[i + 1] + data[i + 2]) / 3;
      };

      // Calculate horizontal gradient sums (finds left/right edges)
      for (let y = marginY; y < canvas.height - marginY; y++) {
        for (let x = marginX + 1; x < canvas.width - marginX; x++) {
          const diff = Math.abs(getBrightness(x, y) - getBrightness(x - 1, y));
          sumX[x] += diff;
        }
      }

      // Calculate vertical gradient sums (finds top/bottom edges)
      for (let x = marginX; x < canvas.width - marginX; x++) {
        for (let y = marginY + 1; y < canvas.height - marginY; y++) {
          const diff = Math.abs(getBrightness(x, y) - getBrightness(x, y - 1));
          sumY[y] += diff;
        }
      }

      // Find the maximum gradient spike in X and Y
      let maxSpikeX = 0;
      for (let x = marginX; x < canvas.width - marginX; x++) {
        if (sumX[x] > maxSpikeX) maxSpikeX = sumX[x];
      }

      let maxSpikeY = 0;
      for (let y = marginY; y < canvas.height - marginY; y++) {
        if (sumY[y] > maxSpikeY) maxSpikeY = sumY[y];
      }

      // A true physical edge is a sharp transition over the whole length of the book.
      // Soft drop shadows have spread-out gradients.
      // 35% of the max spike reliably isolates the sharp edge from the fuzzy shadow.
      const threshX = maxSpikeX * 0.35;
      const threshY = maxSpikeY * 0.35;

      minX = marginX; maxX = canvas.width - marginX;
      minY = marginY; maxY = canvas.height - marginY;

      // Find the first column/row that exceeds the threshold from each side
      for (let x = marginX; x < canvas.width - marginX; x++) {
        if (sumX[x] > threshX) { minX = x; break; }
      }
      for (let x = canvas.width - marginX - 1; x >= marginX; x--) {
        if (sumX[x] > threshX) { maxX = x; break; }
      }

      for (let y = marginY; y < canvas.height - marginY; y++) {
        if (sumY[y] > threshY) { minY = y; break; }
      }
      for (let y = canvas.height - marginY - 1; y >= marginY; y--) {
        if (sumY[y] > threshY) { maxY = y; break; }
      }
      
      if (minX >= maxX || minY >= maxY) {
        return resolve(null); // empty or fully transparent
      }
      
      resolve({
        left: (minX / canvas.width) * 100,
        right: (maxX / canvas.width) * 100,
        top: (minY / canvas.height) * 100,
        bottom: (maxY / canvas.height) * 100
      });
    };
    img.onerror = () => resolve(null);
    // If it's an external URL, route it through Next.js image proxy to avoid CORS issues
    // We use w=1080 as it's a standard Next.js device size and provides enough resolution for edge detection
    if (imageUrl.startsWith('http')) {
      img.src = `/_next/image?url=${encodeURIComponent(imageUrl)}&w=1080&q=75`;
    } else {
      img.src = imageUrl;
    }
  });
}
