import { SITE_URL } from '@/lib/seo';
import { getAllStoreProductsForFeed, generateGoogleMerchantXml } from '@/features/products/services/google-feed';

export const revalidate = 3600; // Cache feed for 1 hour

export async function GET() {
  try {
    const products = await getAllStoreProductsForFeed();
    const xml = generateGoogleMerchantXml(products, SITE_URL);

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error generating Google Merchant feed:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Error</title><description>Feed generation error</description></channel></rss>`,
      {
        status: 500,
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      }
    );
  }
}
