import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/google-merchant-feed.xml'],
      disallow: ['/api/', '/checkout', '/cart', '/account', '/search'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
