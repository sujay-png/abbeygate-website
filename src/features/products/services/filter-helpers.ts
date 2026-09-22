import { getStoreAttributes, getStoreAttributeTerms } from './store-products';
import type { StoreProduct, StoreAttribute, StoreAttributeTerm } from '../types/store-product';

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

  const filterAttributes = attributes.filter((a) =>
    ['pa_collection', 'pa_colour', 'pa_layout', 'pa_size'].includes(a.taxonomy),
  );

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
