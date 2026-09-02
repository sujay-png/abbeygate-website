import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ProductDetailClient, type ColorVariant } from '@/features/products/components/ProductDetailClient';
import { RelatedProducts } from '@/features/products/components/RelatedProducts';
import { FAQ } from '@/components/home/FAQ';
import { CustomisationCTA } from '@/components/shared/CustomisationCTA';
import { getStoreProductBySlug, getStoreProducts, getProductCustomTabs } from '@/features/products/services/store-products';
import { getProductPricingFromProduct } from '@/features/products/services/pricing';
import { CATEGORY_ROUTES } from '@/data/category-routes';
import type { Metadata } from 'next';

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getStoreProductBySlug(slug);
    return {
      title: product ? `${product.name} | Abbeygate England` : 'Product',
      description: product?.short_description?.replace(/<[^>]*>/g, '').slice(0, 160) || 'Bespoke corporate gifting by Abbeygate England.',
      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dashboard.abbeygate-england.com'}/product/${slug}`,
      }
    };
  } catch {
    return { title: 'Product | Abbeygate England' };
  }
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const amendKey = typeof resolvedSearchParams?.amend === 'string' ? resolvedSearchParams.amend : undefined;

  let product;
  try {
    product = await getStoreProductBySlug(slug);
  } catch (error) {
    console.error(`Failed to load product "${slug}":`, error);
    notFound();
  }

  if (!product) notFound();

  const pricing = await getProductPricingFromProduct(product);

  // Fetch color variants based on the product's tag
  let colorVariants: ColorVariant[] = [];
  if (product.tags && product.tags.length > 0) {
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
        'aqua': '#00FFFF',
        'full-colour': '#fff',
      };

      const tagId = product.tags[0].id; // The grouping tag
      const { products: siblings } = await getStoreProducts({ tagId, perPage: 20 });
      
      colorVariants = siblings.map(sibling => {
        const nameParts = sibling.name.split(', ');
        const specificName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;
        const specificSlug = specificName ? specificName.toLowerCase().replace(/\s+/g, '-') : null;

        const colorAttr = sibling.attributes.find(attr => attr.name === 'Colour' || attr.taxonomy === 'pa_colour');
        const attrName = colorAttr?.terms?.[0]?.name;
        const attrSlug = colorAttr?.terms?.[0]?.slug;

        const colorName = specificName || attrName || 'Selected';
        
        // Prioritize the exact specific color from the title for our hex dictionary,
        // because WooCommerce pa_colour is often a broad filter (e.g. Biscuit is tagged as Brown)
        let colorSlug = 'black';
        if (specificSlug && COLOR_HEX_MAP[specificSlug]) {
          colorSlug = specificSlug;
        } else if (attrSlug) {
          colorSlug = attrSlug;
        } else if (specificSlug) {
          colorSlug = specificSlug;
        }
        
        return {
          productId: String(sibling.id),
          productName: sibling.name,
          name: colorName,
          slug: sibling.slug,
          hex: COLOR_HEX_MAP[colorSlug] || '#cccccc',
          imageSrc: sibling.images?.[0]?.src,
          fullProduct: sibling
        };
      });
    } catch (error) {
      console.error("Error fetching color variants:", error);
    }
  }

  // Build dynamic breadcrumbs based on product categories
  const breadcrumbPaths: { label: string; href?: string }[] = [
    { label: 'Home', href: '/' },
  ];

  if (product.categories && product.categories.length > 0) {
    // 1. Find all predefined routes that match the product's categories
    const matchedRoutes = product.categories
      .map(cat => CATEGORY_ROUTES.find(r => r.categoryId === cat.id))
      .filter((r): r is NonNullable<typeof r> => r !== undefined);

    if (matchedRoutes.length > 0) {
      // 2. Separate standard hierarchical routes from flat collections
      const standardRoutes = matchedRoutes.filter(r => !r.path.startsWith('/collection') && !r.path.startsWith('/category'));
      
      // 3. Find the deepest route to use as our primary path
      const candidateRoutes = standardRoutes.length > 0 ? standardRoutes : matchedRoutes;
      const deepestRoute = candidateRoutes.reduce((prev, curr) => 
        (curr.path.split('/').length > prev.path.split('/').length) ? curr : prev
      );

      // 4. Filter matched routes to only include those that are ancestors of the deepest route
      const breadcrumbRoutes = matchedRoutes
        .filter(r => deepestRoute.path.startsWith(r.path))
        .sort((a, b) => a.path.length - b.path.length); // Sort by depth

      breadcrumbRoutes.forEach((route) => {
        const label = route.title.startsWith('All ') ? route.title.replace('All ', '') : route.title;
        breadcrumbPaths.push({ label, href: route.path });
      });
    } else {
      breadcrumbPaths.push({ label: 'Products', href: '/notebooks' });
    }
  } else {
    // Fallback if no category matches
    breadcrumbPaths.push({ label: 'Products', href: '/notebooks' });
  }

  breadcrumbPaths.push({ label: product.name });

  const customTabs = await getProductCustomTabs(product.id);

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
        />
      </Container>
      <RelatedProducts categoryId={product.categories[0]?.id} />
      <FAQ />
      <CustomisationCTA />
      
      {/* Product JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
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
              "name": "Abbeygate England"
            },
            "offers": {
              "@type": "Offer",
              "url": `https://dashboard.abbeygate-england.com/product/${product.slug}`,
              "priceCurrency": "GBP",
              "price": pricing.basePrice,
              "itemCondition": "https://schema.org/NewCondition",
              "availability": product.is_in_stock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          })
        }}
      />
    </div>
  );
}
