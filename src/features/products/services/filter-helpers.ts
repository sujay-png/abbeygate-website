import { getStoreAttributes, getStoreAttributeTerms } from './store-products';
import type { StoreProduct, StoreAttribute, StoreAttributeTerm, StoreProductAttribute } from '../types/store-product';
import { RELATED_COLOUR_MAP } from '../utils/search-helpers';

const FILTER_TAXONOMIES = ['pa_collection', 'pa_colour', 'pa_layout', 'pa_size'];

/**
 * Start fetching filter attributes + terms. Results are cached per request, so calling this
 * alongside the product fetch lets getFilterDataForProducts reuse the in-flight requests.
 */
export function preloadFilterAttributes(): void {
  getStoreAttributes()
    .then((attributes) =>
      attributes
        .filter((a) => FILTER_TAXONOMIES.includes(a.taxonomy))
        .forEach((a) => void getStoreAttributeTerms(a.id).catch(() => {})),
    )
    .catch(() => {});
}

/**
 * Normalize and disambiguate colour terms on a product.
 * If a product is associated with both a specific colour (e.g. 'Burgundy') and a broader search
 * family (e.g. 'Red'), the specific colour is authoritative and the parent search keyword is stripped
 * from the colour filter attributes so products are never double-counted across colours.
 */
export function normalizeColourTerms(product: StoreProduct): StoreProductAttribute['terms'] | null {
  const colourAttr = (product.attributes || []).find(
    (a) => a.taxonomy === 'pa_colour' || a.name?.toLowerCase() === 'colour'
  );
  if (!colourAttr || !colourAttr.terms || colourAttr.terms.length === 0) {
    return null;
  }
  if (colourAttr.terms.length === 1) {
    return colourAttr.terms;
  }

  const nameLower = (product.name || '').toLowerCase();

  // 1. If product name explicitly contains one of the colour names (with word boundaries), that specific colour is authoritative:
  const matchingTermsInName = colourAttr.terms.filter((term) => {
    const termNameLower = term.name.toLowerCase();
    const termSlugLower = term.slug.toLowerCase();
    const regexName = new RegExp(`(^|[^a-z0-9])${termNameLower}([^a-z0-9]|$)`, 'i');
    const regexSlug = new RegExp(`(^|[^a-z0-9])${termSlugLower}([^a-z0-9]|$)`, 'i');
    return regexName.test(nameLower) || regexSlug.test(nameLower);
  });

  if (matchingTermsInName.length === 1) {
    return matchingTermsInName;
  }

  // 2. If one term is a sub-shade/related colour of a broader parent colour (e.g., 'burgundy' is related to 'red'):
  // The broad parent colour was added as a search keyword / category and should not be a duplicate colour attribute.
  const isBroadParentOfOther = (termSlug: string) => {
    const related = RELATED_COLOUR_MAP[termSlug.toLowerCase()];
    if (!related) return false;
    return colourAttr.terms.some(
      (other) =>
        other.slug.toLowerCase() !== termSlug.toLowerCase() &&
        related.includes(other.slug.toLowerCase())
    );
  };

  const specificTerms = colourAttr.terms.filter((term) => !isBroadParentOfOther(term.slug));
  if (specificTerms.length > 0) {
    return specificTerms;
  }

  return colourAttr.terms;
}

/**
 * Strip a Store API product down to what listing pages render, filter and sort on.
 * The raw payload carries every gallery image (with srcsets), long descriptions and
 * HATEOAS links, which bloats the page payload sent to the browser several times over.
 */
export function toListingProduct(product: StoreProduct): StoreProduct {
  const image = product.images[0];
  const cleanColourTerms = normalizeColourTerms(product);
  const attributes = cleanColourTerms
    ? (product.attributes || []).map((attr) =>
        attr.taxonomy === 'pa_colour' || attr.name?.toLowerCase() === 'colour'
          ? { ...attr, terms: cleanColourTerms }
          : attr
      )
    : product.attributes;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    permalink: product.permalink,
    sku: product.sku,
    short_description: product.short_description,
    description: '',
    on_sale: product.on_sale,
    prices: product.prices,
    price_html: '',
    images: image
      ? [{ id: image.id, src: image.src, thumbnail: image.thumbnail, alt: image.alt, name: image.name }]
      : [],
    categories: product.categories,
    tags: product.tags,
    attributes,
    is_purchasable: product.is_purchasable,
    is_in_stock: product.is_in_stock,
    average_rating: product.average_rating,
    review_count: product.review_count,
  };
}

function extractCollectionTerms(product: StoreProduct): StoreAttributeTerm[] {
  const termsMap = new Map<string, StoreAttributeTerm>();

  // 1. Existing pa_collection attributes on the product
  const existingAttr = (product.attributes || []).find(
    (a) => a.taxonomy === 'pa_collection' || a.name?.toLowerCase() === 'collection'
  );
  if (existingAttr) {
    existingAttr.terms.forEach((term) => {
      const cleanSlug = term.slug.toLowerCase().replace(/-collection$/, '');
      const cleanName = term.name.replace(/\s+Collection$/i, '').trim();
      termsMap.set(cleanSlug, { id: term.id, name: cleanName, slug: cleanSlug, count: 0 });
    });
  }

  // 2. Categories with "collection" in name or slug
  (product.categories || []).forEach((cat) => {
    const nameLower = cat.name.toLowerCase();
    const slugLower = cat.slug.toLowerCase();
    if (nameLower.includes('collection') || slugLower.includes('collection')) {
      const cleanSlug = slugLower.replace(/-collection$/, '');
      let cleanName = cat.name.replace(/\s+Collection$/i, '').trim();
      if (cleanSlug === 'graphic-print' || cleanSlug === 'graphic-prints') {
        cleanName = 'Graphic Print';
      } else if (cleanSlug === 'conscious') {
        cleanName = 'Conscious';
      }

      if (!termsMap.has(cleanSlug)) {
        termsMap.set(cleanSlug, { id: cat.id, name: cleanName, slug: cleanSlug, count: 0 });
      }
    }
  });

  return Array.from(termsMap.values());
}

function extractLayoutTerms(product: StoreProduct): StoreAttributeTerm[] {
  const termsMap = new Map<string, StoreAttributeTerm>();

  const nameLower = (product.name || '').toLowerCase();
  const shortDescLower = (product.short_description || '').toLowerCase();

  // 1. Check title first (authoritative)
  if (nameLower.includes('week to view') || /\bwtv\b/i.test(nameLower)) {
    termsMap.set('week-to-view', { id: 108, name: 'Week To View', slug: 'week-to-view', count: 0 });
  } else if (nameLower.includes('day per page') || nameLower.includes('day a page') || /\bdpp\b/i.test(nameLower)) {
    termsMap.set('day-per-page', { id: 107, name: 'Day Per Page', slug: 'day-per-page', count: 0 });
  }

  // 2. Existing pa_layout attributes on product if not already determined by title
  if (termsMap.size === 0) {
    const existingAttr = (product.attributes || []).find(
      (a) => a.taxonomy === 'pa_layout' || a.name?.toLowerCase() === 'layout'
    );
    if (existingAttr && existingAttr.terms) {
      existingAttr.terms.forEach((t) => {
        const s = t.slug.toLowerCase();
        if (s.includes('day')) {
          termsMap.set('day-per-page', { id: 107, name: 'Day Per Page', slug: 'day-per-page', count: 0 });
        } else if (s.includes('week') || s.includes('wtv')) {
          termsMap.set('week-to-view', { id: 108, name: 'Week To View', slug: 'week-to-view', count: 0 });
        } else if (s.includes('feint') || s.includes('ruled')) {
          termsMap.set('feint-ruled', { id: 162, name: 'Feint Ruled', slug: 'feint-ruled', count: 0 });
        }
      });
    }
  }

  // 3. Fallback to short description if not found in title or attributes
  if (termsMap.size === 0) {
    if (shortDescLower.includes('week to view') || /\bwtv\b/i.test(shortDescLower)) {
      termsMap.set('week-to-view', { id: 108, name: 'Week To View', slug: 'week-to-view', count: 0 });
    } else if (shortDescLower.includes('day per page') || shortDescLower.includes('day a page') || /\bdpp\b/i.test(shortDescLower)) {
      termsMap.set('day-per-page', { id: 107, name: 'Day Per Page', slug: 'day-per-page', count: 0 });
    }
  }

  // 4. Notebooks (Feint Ruled)
  const isNotebook =
    (product.categories || []).some((c) => c.name.toLowerCase().includes('notebook')) ||
    nameLower.includes('notebook');
  if (isNotebook || nameLower.includes('feint ruled') || shortDescLower.includes('feint ruled')) {
    termsMap.set('feint-ruled', { id: 162, name: 'Feint Ruled', slug: 'feint-ruled', count: 0 });
  }

  return Array.from(termsMap.values());
}

export async function getFilterDataForProducts(rawProducts: StoreProduct[]) {
  // Inject synthetic 'pa_product-type', enriched 'pa_collection', and enriched 'pa_layout'
  // so the frontend filter system can accurately filter all categories, collections, and layouts.
  const allProducts = rawProducts.map((product) => {
    const productTypeTerms = product.categories
      .filter((cat) => cat.id !== 126 && cat.id !== 176 && !cat.name.toLowerCase().includes('collection')) // Exclude parent and collections
      .map((cat) => ({ id: cat.id, name: cat.name, slug: cat.slug }));

    const collectionTerms = extractCollectionTerms(product);
    const layoutTerms = extractLayoutTerms(product);
    const cleanColourTerms = normalizeColourTerms(product);

    const otherAttributes = (product.attributes || []).filter(
      (a) =>
        a.taxonomy !== 'pa_product-type' &&
        a.taxonomy !== 'pa_collection' &&
        a.name?.toLowerCase() !== 'collection' &&
        a.taxonomy !== 'pa_layout' &&
        a.name?.toLowerCase() !== 'layout' &&
        a.taxonomy !== 'pa_colour' &&
        a.name?.toLowerCase() !== 'colour'
    );

    const extraAttributes = [];
    if (productTypeTerms.length > 0) {
      extraAttributes.push({
        id: 999999,
        name: 'Product Type',
        taxonomy: 'pa_product-type',
        has_variations: false,
        terms: productTypeTerms,
      });
    }

    if (collectionTerms.length > 0) {
      extraAttributes.push({
        id: 5,
        name: 'Collection',
        taxonomy: 'pa_collection',
        has_variations: false,
        terms: collectionTerms,
      });
    }

    if (layoutTerms.length > 0) {
      extraAttributes.push({
        id: 6,
        name: 'Layout',
        taxonomy: 'pa_layout',
        has_variations: false,
        terms: layoutTerms,
      });
    }

    if (cleanColourTerms && cleanColourTerms.length > 0) {
      const origColourAttr = (product.attributes || []).find(
        (a) => a.taxonomy === 'pa_colour' || a.name?.toLowerCase() === 'colour'
      );
      extraAttributes.push({
        id: origColourAttr?.id ?? 1,
        name: origColourAttr?.name ?? 'Colour',
        taxonomy: 'pa_colour',
        has_variations: origColourAttr?.has_variations ?? false,
        terms: cleanColourTerms,
      });
    }

    return {
      ...product,
      attributes: [...otherAttributes, ...extraAttributes],
    };
  });

  let attributes: StoreAttribute[] = [];
  try {
    attributes = await getStoreAttributes();
  } catch (error) {
    console.warn('Failed to load product attributes for filters:', error);
    attributes = [];
  }

  const filterAttributes = attributes.filter((a) => FILTER_TAXONOMIES.includes(a.taxonomy));

  const attributeTerms: Record<number, StoreAttributeTerm[]> = {};
  await Promise.all(
    filterAttributes.map(async (attr) => {
      try {
        attributeTerms[attr.id] = await getStoreAttributeTerms(attr.id);
      } catch (error) {
        console.warn(`Failed to load terms for attribute ${attr.id}:`, error);
        attributeTerms[attr.id] = [];
      }
    }),
  );

  // Extract unique Collection terms across all loaded products
  const allCollectionTermsMap = new Map<string, StoreAttributeTerm>();
  allProducts.forEach((product) => {
    const collAttr = product.attributes.find((a) => a.taxonomy === 'pa_collection');
    if (collAttr) {
      collAttr.terms.forEach((term) => {
        if (!allCollectionTermsMap.has(term.slug)) {
          allCollectionTermsMap.set(term.slug, {
            id: term.id,
            name: term.name,
            slug: term.slug,
            count: 0,
          });
        }
      });
    }
  });

  const sortedCollectionTerms = Array.from(allCollectionTermsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Synchronize pa_collection attribute in filterAttributes and attributeTerms
  const collAttr = filterAttributes.find((a) => a.taxonomy === 'pa_collection');
  if (collAttr) {
    collAttr.count = sortedCollectionTerms.length;
    attributeTerms[collAttr.id] = sortedCollectionTerms;
  } else if (sortedCollectionTerms.length > 0) {
    filterAttributes.unshift({
      id: 5,
      name: 'Collection',
      taxonomy: 'pa_collection',
      count: sortedCollectionTerms.length,
    });
    attributeTerms[5] = sortedCollectionTerms;
  }

  // Extract unique Layout terms across all loaded products
  const allLayoutTermsMap = new Map<string, StoreAttributeTerm>();
  allProducts.forEach((product) => {
    const lAttr = product.attributes.find((a) => a.taxonomy === 'pa_layout');
    if (lAttr) {
      lAttr.terms.forEach((term) => {
        if (!allLayoutTermsMap.has(term.slug)) {
          allLayoutTermsMap.set(term.slug, {
            id: term.id,
            name: term.name,
            slug: term.slug,
            count: 0,
          });
        }
      });
    }
  });

  const sortedLayoutTerms = Array.from(allLayoutTermsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Synchronize pa_layout attribute in filterAttributes and attributeTerms
  const layoutAttr = filterAttributes.find((a) => a.taxonomy === 'pa_layout');
  if (layoutAttr) {
    layoutAttr.count = sortedLayoutTerms.length;
    attributeTerms[layoutAttr.id] = sortedLayoutTerms;
  } else if (sortedLayoutTerms.length > 0) {
    filterAttributes.push({
      id: 6,
      name: 'Layout',
      taxonomy: 'pa_layout',
      count: sortedLayoutTerms.length,
    });
    attributeTerms[6] = sortedLayoutTerms;
  }

  // Extract unique Product Type terms from the injected fake attributes
  const allProductTypeTermsMap = new Map<string, StoreAttributeTerm>();
  allProducts.forEach((product) => {
    const ptAttr = product.attributes.find((a) => a.taxonomy === 'pa_product-type');
    if (ptAttr) {
      ptAttr.terms.forEach((term) => {
        if (!allProductTypeTermsMap.has(term.slug)) {
          allProductTypeTermsMap.set(term.slug, { id: term.id, name: term.name, slug: term.slug, count: 0 });
        }
      });
    }
  });

  if (allProductTypeTermsMap.size > 0) {
    filterAttributes.push({
      id: 999999,
      name: 'Product Type',
      taxonomy: 'pa_product-type',
      count: allProductTypeTermsMap.size,
    });
    attributeTerms[999999] = Array.from(allProductTypeTermsMap.values());
  }

  return {
    allProducts,
    filterAttributes,
    attributeTerms,
  };
}
