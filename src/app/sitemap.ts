import { MetadataRoute } from 'next';
import { getStoreProducts, getStoreCategories } from '@/features/products/services/store-products';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://corporate.abbeygate-england.com';

import { seoConfig } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Generate static pages from our centralized SEO config
  const sitemap: MetadataRoute.Sitemap = Object.keys(seoConfig)
    .filter(path => !seoConfig[path].noindex)
    .map(path => ({
      url: `${BASE_URL}${path === '/' ? '' : path}`,
      lastModified: new Date(),
      changeFrequency: path === '/' ? 'daily' : 'weekly',
      priority: path === '/' ? 1 : 0.8,
    }));

  try {
    // Fetch Categories
    const categories = await getStoreCategories();
    categories.forEach((cat) => {
      sitemap.push({
        url: `${BASE_URL}/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      });
    });

    // Fetch Products (Fetch up to 300 products to ensure we get them all)
    const pagePromises = [1, 2, 3].map(page => getStoreProducts({ perPage: 100, page }));
    const results = await Promise.all(pagePromises);
    const allProducts = results.flatMap(res => res.products);
    
    // Deduplicate just in case
    const uniqueProductsMap = new Map();
    allProducts.forEach(p => uniqueProductsMap.set(p.id, p));
    const uniqueProducts = Array.from(uniqueProductsMap.values());

    uniqueProducts.forEach((product) => {
      sitemap.push({
        url: `${BASE_URL}/product/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return sitemap;
}
