import type { StoreProduct } from '../types/store-product';
import { getStoreProducts } from './store-products';

function cleanCdata(text: string): string {
  if (!text) return '';
  return text.replace(/\]\]>/g, ']]&gt;');
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function formatGmcPrice(priceMinorString?: string, minorUnit: number = 2): string | null {
  if (!priceMinorString) return null;
  const parsed = parseInt(priceMinorString, 10);
  if (isNaN(parsed) || parsed <= 0) return null;
  const val = parsed / Math.pow(10, minorUnit);
  return `${val.toFixed(2)} GBP`;
}

function getGoogleProductCategory(product: StoreProduct): string {
  const catNames = (product.categories || []).map((c) => c.name.toLowerCase()).join(' ');
  const nameLower = (product.name || '').toLowerCase();
  const combined = `${catNames} ${nameLower}`;

  if (combined.includes('diar')) {
    return 'Office Supplies > General Office Supplies > Paper Products > Calendars, Organizers & Planners';
  }
  return 'Office Supplies > General Office Supplies > Paper Products > Notebooks & Notepads';
}

/**
 * Generates an official Google Merchant Center RSS 2.0 XML product feed.
 */
export function generateGoogleMerchantXml(products: StoreProduct[], baseUrl: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  const itemsXml = products
    .filter((product) => {
      // Exclude products without slugs, unpublished, or with no price
      if (!product.slug || !product.name) return false;
      const rawPrice = product.prices?.price || product.prices?.regular_price;
      const parsed = parseInt(rawPrice || '0', 10);
      return parsed > 0;
    })
    .map((product) => {
      const id = String(product.id);
      const title = cleanCdata(stripHtml(product.name).slice(0, 150));
      const descriptionText = stripHtml(product.description || product.short_description || product.name);
      const description = cleanCdata((descriptionText || product.name).slice(0, 5000));
      const link = `${cleanBaseUrl}/product/${product.slug}`;
      const availability = product.is_in_stock ? 'in_stock' : 'out_of_stock';

      // Price calculation
      const minorUnit = product.prices?.currency_minor_unit ?? 2;
      const regularFormatted = formatGmcPrice(product.prices?.regular_price, minorUnit);
      const currentFormatted = formatGmcPrice(product.prices?.price, minorUnit);
      const saleFormatted = formatGmcPrice(product.prices?.sale_price, minorUnit);

      const price = regularFormatted || currentFormatted || '1.00 GBP';
      const hasSale = product.on_sale && saleFormatted && regularFormatted && saleFormatted !== regularFormatted;

      // Primary and additional images
      const images = (product.images || []).map((img) => img.src).filter(Boolean);
      const primaryImage = images[0] ? (images[0].startsWith('//') ? `https:${images[0]}` : images[0]) : '';
      const additionalImages = images.slice(1, 10).map((src) => (src.startsWith('//') ? `https:${src}` : src));

      const googleCategory = getGoogleProductCategory(product);
      const productType = (product.categories || []).map((c) => c.name).filter(Boolean).join(' > ') || 'Office Supplies';

      return `    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title><![CDATA[${title}]]></g:title>
      <g:description><![CDATA[${description}]]></g:description>
      <g:link>${escapeXml(link)}</g:link>
      ${primaryImage ? `<g:image_link>${escapeXml(primaryImage)}</g:image_link>` : ''}
      ${additionalImages.map((img) => `<g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n      ')}
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      ${hasSale ? `<g:sale_price>${saleFormatted}</g:sale_price>` : ''}
      <g:brand>Abbeygate Business</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      ${product.sku ? `<g:mpn>${escapeXml(product.sku)}</g:mpn>` : ''}
      <g:google_product_category><![CDATA[${googleCategory}]]></g:google_product_category>
      <g:product_type><![CDATA[${cleanCdata(productType)}]]></g:product_type>
      <g:shipping>
        <g:country>GB</g:country>
        <g:service>Standard Delivery</g:service>
        <g:price>15.75 GBP</g:price>
      </g:shipping>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Abbeygate Business</title>
    <link>${escapeXml(cleanBaseUrl)}</link>
    <description>Bespoke corporate gifting, personalised diaries, and custom notebooks by Abbeygate Business.</description>
${itemsXml}
  </channel>
</rss>`;
}

/**
 * Fetches all products across paginated WooCommerce Store API endpoints.
 */
export async function getAllStoreProductsForFeed(): Promise<StoreProduct[]> {
  try {
    const first = await getStoreProducts({ perPage: 100, page: 1 });
    const totalPages = Math.max(first.totalPages || 1, 1);

    if (totalPages <= 1) {
      return first.products || [];
    }

    const restPromises = [];
    for (let page = 2; page <= totalPages; page++) {
      restPromises.push(getStoreProducts({ perPage: 100, page }));
    }

    const restResults = await Promise.allSettled(restPromises);
    const restProducts = restResults
      .filter((res): res is PromiseFulfilledResult<Awaited<ReturnType<typeof getStoreProducts>>> => res.status === 'fulfilled')
      .flatMap((res) => res.value.products || []);

    const all = [...(first.products || []), ...restProducts];

    // Deduplicate by product ID
    const unique = new Map<number, StoreProduct>();
    for (const p of all) {
      if (p.id && !unique.has(p.id)) {
        unique.set(p.id, p);
      }
    }
    return Array.from(unique.values());
  } catch (error) {
    console.error('Failed to fetch products for Google Merchant feed:', error);
    return [];
  }
}
