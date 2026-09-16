import { getCategoryRoute, getFilterConfigForPath } from '@/data/category-routes';
import { getAllStoreProductsByCategory, getStoreAttributes, getStoreAttributeTerms, getStoreCategoryById } from '../services/store-products';
import { parseFiltersFromSearchParams } from '../utils/product-helpers';
import type { StoreAttribute, StoreAttributeTerm, StoreProduct } from '../types/store-product';

export async function loadCategoryPageData(path: string, searchParams: Record<string, string | string[] | undefined>) {
  const route = getCategoryRoute(path);

  if (!route) {
    return null;
  }

  let allProducts: StoreProduct[] = [];
  let attributes: StoreAttribute[] = [];
  let wooCategory = null;

  try {
    if (typeof route.categoryId === 'number' || !String(route.categoryId).includes(',')) {
      wooCategory = await getStoreCategoryById(Number(route.categoryId));
    }
  } catch (error) {
    console.warn(`Failed to load WooCommerce category ${route.categoryId}:`, error);
  }

  try {
    const rawProducts = await getAllStoreProductsByCategory(route.categoryId);
    
    // Inject a fake 'pa_product-type' attribute using the product's categories
    // so the frontend filter system can filter by sub-category for Custom Gifts.
    allProducts = rawProducts.map(product => {
      const productTypeTerms = product.categories
        .filter(cat => cat.id !== 126 && !cat.name.toLowerCase().includes('collection')) // Exclude parent and collections
        .map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug }));
        
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
              terms: productTypeTerms
            }
          ]
        };
      }
      return product;
    });
  } catch (error) {
    console.error(`Failed to load products for category ${route.categoryId}:`, error);
    throw error;
  }

  try {
    attributes = await getStoreAttributes();
  } catch (error) {
    // Filters are optional — still show the product grid if attributes 404
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
  allProducts.forEach(product => {
    const ptAttr = product.attributes.find(a => a.taxonomy === 'pa_product-type');
    if (ptAttr) {
      ptAttr.terms.forEach(term => {
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
      count: allProductTypeTermsMap.size
    });
    attributeTerms[999999] = Array.from(allProductTypeTermsMap.values());
  }

  const filters = parseFiltersFromSearchParams(searchParams);
  const filterConfig = route.filterConfig ?? getFilterConfigForPath(path);

  const pathParts = path.split('/').filter(Boolean);
  const breadcrumbItems = pathParts.map((part, index) => {
    const href = '/' + pathParts.slice(0, index + 1).join('/');
    const label = part
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return index === pathParts.length - 1
      ? { label: wooCategory?.name || route.title }
      : { label, href };
  });

  let description = wooCategory?.description || route.description || '';
  if (description && !description.includes('<p>') && !description.includes('<h')) {
    // WordPress often returns raw text with \r\n for category descriptions
    description = description
      .split(/\r?\n\r?\n/)
      .map((p: string) => `<p class="mb-4">${p.trim()}</p>`)
      .join('');
  }

  return {
    title: wooCategory?.name || route.title,
    description,
    breadcrumbItems,
    allProducts,
    filters,
    attributes: filterAttributes,
    attributeTerms,
    filterConfig,
  };
}
