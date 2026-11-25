import { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ProductDetailClient, type ColorVariant } from '@/features/products/components/ProductDetailClient';
import { RelatedProducts } from '@/features/products/components/RelatedProducts';
import { FAQ } from '@/components/home/FAQ';
import { CustomisationCTA } from '@/components/shared/CustomisationCTA';
import { getStoreProductBySlug, getStoreProducts, getProductCustomTabs, getStoreProductById, getSitemapProducts } from '@/features/products/services/store-products';
import { getProductPricingFromProduct } from '@/features/products/services/pricing';
import { getProductHexValues } from '@/features/products/services/product-colors';
import { getProductBreadcrumbs } from '@/features/products/utils/breadcrumb';
import { getProductBaseAmount, sanitizeImageUrl } from '@/features/products/utils/product-helpers';
import { parseStorePrice, VAT_RATE } from '@/features/products/utils/pricing';
import type { Metadata } from 'next';
import { PRODUCT_SEO } from '@/data/product-seo';
import { getSEOMetadata, jsonLd, SITE_URL } from '@/lib/seo';

export const revalidate = 3600; // Cache product page on Vercel Edge CDN for 1 hour (ISR)

export async function generateStaticParams() {
  try {
    const products = await getSitemapProducts();
    return products.slice(0, 30).map((product) => ({
      slug: product.slug,
    }));
  } catch {
    return [];
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    let product = await getStoreProductBySlug(slug);
    if (!product && /^\d+$/.test(slug)) {
      product = await getStoreProductById(Number(slug));
    }
    const resolvedSlug = product?.slug ?? slug;
    const seoOverride = PRODUCT_SEO[resolvedSlug] || PRODUCT_SEO[slug];
    const title = seoOverride?.title || (product ? `${product.name} | Abbeygate Business` : 'Product | Abbeygate Business');
    const description = seoOverride?.description || product?.short_description?.replace(/<[^>]*>/g, '').slice(0, 160) || 'Bespoke corporate gifting by Abbeygate Business.';
    
    return getSEOMetadata(`/product/${resolvedSlug}`, { title, description, image: product?.images?.[0]?.src });
  } catch {
    return getSEOMetadata(`/product/${slug}`, { title: 'Product | Abbeygate Business' });
  }
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const amendKey = typeof resolvedSearchParams?.amend === 'string' ? resolvedSearchParams.amend : undefined;

  let product = null;
  try {
    product = await getStoreProductBySlug(slug);
    if (!product && /^\d+$/.test(slug)) {
      product = await getStoreProductById(Number(slug));
    }
  } catch (error) {
    console.error(`Failed to load product "${slug}":`, error);
  }

  if (!product) notFound();

  // Preload primary product image in the initial HTML head chunk to eliminate LCP discovery delay
  const primaryImageSrc = product.images?.[0]?.src ? sanitizeImageUrl(product.images[0].src) : null;
  if (primaryImageSrc) {
    ReactDOM.preload(primaryImageSrc, { as: 'image', fetchPriority: 'high' });
  }

  // These only depend on the product, so fetch them in parallel rather than back to back.
  const pricingPromise = getProductPricingFromProduct(product);
  const customTabsPromise = getProductCustomTabs(product.id);

  // Fetch color variants based on the product's tag
  const colorVariantsPromise = (async (): Promise<ColorVariant[]> => {
    if (!product.tags || product.tags.length === 0) return [];
    try {
      const COLOR_HEX_MAP: Record<string, string> = {
        red: '#b31b1b',
        purple: '#413554',
        green: '#265443',
        burgundy: '#592e35',
        blue: '#2943a3',
        black: '#212322',
        'dark-blue': '#1a233a',
        'feint-ruled-blue': '#354a65',
        'biscuit': '#e2d3c1',
        'rose-pink': '#dfc3c9',
        'ocean-blue': '#486884',
        'slate-grey': '#72787d',
        'stone-grey': '#b0b2b1',
        'forest-green': '#324a3e',
        'navy': '#2b364a',
        'mustard': '#c39540',
        'teal': '#2b5f63',
        'tan': '#b58b66',
        'brown': '#5c4033',
        'white': '#f8f8f8',
        'cream': '#f4eedd',
        'orange': '#c85a2f',
        'yellow': '#e3b23c',
        'gold': '#bf953f',
        'silver': '#b0b0b0',
        'pink': '#e5b0b9',
        'grey': '#808080',
        'gray': '#808080',
        'light-blue': '#8eb6d6',
        'charcoal': '#36454F',
        'pewter': '#E9EAEC',
        'sage-green': '#B2AC88',
        'royal-blue': '#4169E1',
        'light-pink': '#FFB6C1',
        'violet': '#7F00FF',
        'lime': '#32CD32',
        'aqua': '#0297b7',
        'full-colour': '#fff',
      };

      const isGroupingTag = (t: { id: number; name: string; slug: string }) => {
        const slug = t.slug.toLowerCase().trim();
        const name = t.name.toLowerCase().trim();

        // 1. Exclude 4-digit years (e.g. 2027, 2026, 2028)
        if (/^\d{4}$/.test(slug) || /^\d{4}$/.test(name)) return false;

        // 2. Exclude generic promotional / category tags
        const genericTags = [
          'best seller',
          'best-seller',
          'bestseller',
          'new',
          'featured',
          'popular',
          'sale',
          'diary',
          'diaries',
          'notebook',
          'notebooks',
        ];
        if (genericTags.includes(slug) || genericTags.includes(name)) return false;

        return true;
      };

      const groupingTag = product.tags.find(isGroupingTag);
      if (!groupingTag) return [];

      const { products: siblings } = await getStoreProducts({ tagId: groupingTag.id, perPage: 50 });
      const siblingIds = [product.id, ...siblings.map(s => s.id)];
      const hexMap = await getProductHexValues(siblingIds);
      
      return siblings.map(sibling => {
        const nameParts = sibling.name.split(', ');
        const specificName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;
        const specificSlug = specificName ? specificName.toLowerCase().replace(/\s+/g, '-') : null;

        const colorAttr = sibling.attributes.find(attr => attr.name === 'Colour' || attr.taxonomy === 'pa_colour');
        const attrName = colorAttr?.terms?.[0]?.name;
        const attrSlug = colorAttr?.terms?.[0]?.slug;

        const colorName = specificName || attrName || 'Selected';
        
        const extractHex = (nameStr: string | null | undefined) => {
          if (!nameStr) return null;
          const cleanSlug = nameStr.toLowerCase().replace(/\s+/g, '-');
          if (COLOR_HEX_MAP[cleanSlug]) return COLOR_HEX_MAP[cleanSlug];
          
          // Try splitting by hyphen, '&', or 'and' to detect bicolors (e.g., "Blue- Royal Blue")
          const parts = nameStr.split(/[-&]| and /i).map(p => p.trim()).filter(Boolean);
          if (parts.length > 1) {
            const hexes = parts.map(p => COLOR_HEX_MAP[p.toLowerCase().replace(/\s+/g, '-')]).filter(Boolean);
            if (hexes.length > 1) return hexes.join(',');
            if (hexes.length === 1) return hexes[0];
          }
          return null;
        };

        const apiHex = hexMap[String(sibling.id)];
        const fallbackHex = extractHex(specificName) || extractHex(attrName) || '#cccccc';
        const finalHex = apiHex || fallbackHex;
        
        return {
          productId: String(sibling.id),
          productName: sibling.name,
          sku: sibling.sku,
          name: colorName,
          slug: sibling.slug,
          hex: finalHex,
          imageSrc: sibling.images?.[0]?.src,
          fullProduct: sibling
        };
      });
    } catch (error) {
      console.error("Error fetching color variants:", error);
      return [];
    }
  })();

  const [pricingResult, colorVariantsResult, customTabsResult] = await Promise.allSettled([
    pricingPromise,
    colorVariantsPromise,
    customTabsPromise,
  ]);

  const defaultBasePrice = getProductBaseAmount(product);
  const safeDefaultBase = defaultBasePrice > 0 ? defaultBasePrice : 1.0;

  const pricing = pricingResult.status === 'fulfilled' && pricingResult.value ? pricingResult.value : {
    productId: product.id,
    basePrice: safeDefaultBase,
    tiers: [
      { min: 1, max: 24, price: safeDefaultBase },
      { min: 25, max: 49, price: Number((safeDefaultBase * 0.8).toFixed(2)) },
      { min: 50, max: 99, price: Number((safeDefaultBase * 0.75).toFixed(2)) },
      { min: 100, max: null, price: Number((safeDefaultBase * 0.65).toFixed(2)) },
    ],
  };

  const colorVariants = colorVariantsResult.status === 'fulfilled' && Array.isArray(colorVariantsResult.value) ? colorVariantsResult.value : [];
  const customTabs = customTabsResult.status === 'fulfilled' && Array.isArray(customTabsResult.value) ? customTabsResult.value : [];

  // Build canonical hierarchical breadcrumbs based on product categories
  const breadcrumbPaths = getProductBreadcrumbs(product);

  const collectionNames = ['richmond', 'dorchester', 'harrogate', 'lewes', 'chelsea', 'windsor', 'conscious'];
  const collectionCategory = product.categories?.find((c: { name: string; slug: string }) => 
    collectionNames.some(name => c.name.toLowerCase().includes(name) || c.slug.toLowerCase().includes(name))
  );
  
  const relatedCategoryId = collectionCategory ? collectionCategory.id : (product.categories?.[0]?.id ?? 0);

  let currentColor = '';
  let currentBaseName = '';
  if (product.name.includes(',')) {
    const parts = product.name.split(',');
    currentBaseName = parts[0].trim();
    currentColor = parts.pop()?.trim().toLowerCase() || '';
  } else {
    currentBaseName = product.name;
  }

  const rawIncVatPrice = parseStorePrice(
    product.prices?.price ?? '0',
    product.prices?.currency_minor_unit ?? 2
  );
  const schemaPrice = Number(
    (rawIncVatPrice > 0 ? rawIncVatPrice : pricing.basePrice * (1 + VAT_RATE)).toFixed(2)
  );

  return (
    <div className="min-h-screen bg-brand-cream">
      <Breadcrumb paths={breadcrumbPaths} />
      <Container className="py-8 md:py-10">
        <ProductDetailClient
          product={product}
          tiers={pricing.tiers}
          basePrice={pricing.basePrice}
          colorVariants={colorVariants}
          customTabs={customTabs}
          amendKey={amendKey}
          relatedProducts={
            // Streamed in after the main product so the slow related-products lookup never blocks the page.
            <Suspense fallback={null}>
              <RelatedProducts currentProduct={product} categoryId={relatedCategoryId} currentProductId={product.id} currentProductName={product.name} currentColor={currentColor} />
            </Suspense>
          }
        />
      </Container>
      <FAQ />
      <CustomisationCTA />
      
      {/* Product JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": [
              product.images?.[0]?.src
            ].filter(Boolean),
            "description": product.short_description?.replace(/<[^>]*>/g, '') || product.name,
            "sku": product.sku || undefined,
            "brand": {
              "@type": "Brand",
              "name": "Abbeygate Business"
            },
            "offers": {
              "@type": "Offer",
              "url": `${SITE_URL}/product/${product.slug}`,
              "priceCurrency": "GBP",
              "price": schemaPrice,
              "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": schemaPrice,
                "priceCurrency": "GBP",
                "valueAddedTaxIncluded": true
              },
              "itemCondition": "https://schema.org/NewCondition",
              "availability": product.is_in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              "shippingDetails": {
                "@type": "OfferShippingDetails",
                "shippingRate": {
                  "@type": "MonetaryAmount",
                  "value": "15.75",
                  "currency": "GBP"
                },
                "shippingDestination": {
                  "@type": "DefinedRegion",
                  "addressCountry": "GB"
                },
                "deliveryTime": {
                  "@type": "ShippingDeliveryTime",
                  "handlingTime": {
                    "@type": "QuantitativeValue",
                    "minValue": 1,
                    "maxValue": 3,
                    "unitCode": "DAY"
                  },
                  "transitTime": {
                    "@type": "QuantitativeValue",
                    "minValue": 2,
                    "maxValue": 5,
                    "unitCode": "DAY"
                  }
                }
              },
              "hasMerchantReturnPolicy": {
                "@type": "MerchantReturnPolicy",
                "applicableCountry": "GB",
                "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
                "merchantReturnDays": 14,
                "returnMethod": "https://schema.org/ReturnByMail",
                "returnFees": "https://schema.org/ReturnShippingFees"
              }
            }
          })
        }}
      />
    </div>
  );
}
