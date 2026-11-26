import { MetadataRoute } from 'next';
import { getSitemapProducts } from '@/features/products/services/store-products';
import { getBlogPosts } from '@/features/blog/services/blog-service';
import { CATEGORY_ROUTES } from '@/data/category-routes';
import { SEO_REDIRECTS } from '@/data/seo-redirects';
import { seoConfig, SITE_URL as BASE_URL } from '@/lib/seo';

/** Revalidate the sitemap once per hour to balance freshness with fast bot responses. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const redirectedSources = new Set(SEO_REDIRECTS.map((r) => r.source));

  // 1. Static pages from centralized SEO config (excluding noindex and redirected routes)
  const sitemap: MetadataRoute.Sitemap = Object.keys(seoConfig)
    .filter((path) => !seoConfig[path].noindex && !redirectedSources.has(path))
    .map((path) => ({
      url: `${BASE_URL}${path === '/' ? '' : path}`,
    }));

  // 2. Canonical category pages from route configuration (exclude 301-redirected legacy paths)
  new Set(CATEGORY_ROUTES.map((route) => route.path))
    .forEach((path) => {
      if (!redirectedSources.has(path)) {
        sitemap.push({
          url: `${BASE_URL}${path}`,
        });
      }
    });

  // 3. Dynamic product pages with real last modified dates from WooCommerce
  try {
    const products = await getSitemapProducts();

    products.forEach((product) => {
      sitemap.push({
        url: `${BASE_URL}/product/${product.slug}`,
        lastModified: product.modified ? new Date(product.modified) : undefined,
      });
    });
  } catch (error) {
    console.error('Error generating product sitemap entries:', error);
  }

  // 4. Dynamic blog posts with real last modified dates from WordPress
  try {
    const blogPosts = await getBlogPosts({ perPage: 100 });

    blogPosts.forEach((post) => {
      sitemap.push({
        url: `${BASE_URL}/blog/${post.slug}`,
        lastModified: post.modified ? new Date(post.modified) : (post.date ? new Date(post.date) : undefined),
      });
    });
  } catch (error) {
    console.error('Error generating blog sitemap entries:', error);
  }

  return sitemap;
}
