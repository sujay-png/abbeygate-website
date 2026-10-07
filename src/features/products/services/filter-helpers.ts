import { getStoreAttributes, getStoreAttributeTerms } from './store-products';
import type { StoreProduct, StoreAttribute, StoreAttributeTerm } from '../types/store-product';

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
 * Strip a Store API product down to what listing pages render, filter and sort on.
 * The raw payload carries every gallery image (with srcsets), long descriptions and
 * HATEOAS links, which bloats the page payload sent to the browser several times over.
 */
export function toListingProduct(product: StoreProduct): StoreProduct {
  const image = product.images[0];
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
    attributes: product.attributes,
    is_purchasable: product.is_purchasable,
    is_in_stock: product.is_in_stock,
    average_rating: product.average_rating,
    review_count: product.review_count,
  };
}

export async function getFilterDataForProducts(rawProducts: StoreProduct[]) {
  // Inject a fake 'pa_product-type' attribute using the product's categories
  // so the frontend filter system can filter by sub-category for Custom Gifts and Search.
  const allProducts = rawProducts.map((product) => {
    const productTypeTerms = product.categories
      .filter((cat) => cat.id !== 126 && !cat.name.toLowerCase().includes('collection')) // Exclude parent and collections
      .map((cat) => ({ id: cat.id, name: cat.name, slug: cat.slug }));

    if (productTypeTerms.length > 0) {
      return {
        ...product,
        attributes: [
          ...product.attributes,
          {
            id: 999999,
            name: 'Product Type',
            taxonomy: 'pa_product-type',
            has_variations: false,
            terms: productTypeTerms,
          },
        ],
      };
    }
    return product;
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
