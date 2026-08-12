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
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getStoreProductBySlug(slug);
    return {
      title: product ? `${product.name} | Abbeygate England` : 'Product',
      description: product?.short_description?.replace(/<[^>]*>/g, '').slice(0, 160),
    };
  } catch {
    return { title: 'Product | Abbeygate England' };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

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
      };

      const tagId = product.tags[0].id; // The grouping tag
      const { products: siblings } = await getStoreProducts({ tagId, perPage: 20 });
      
      colorVariants = siblings.map(sibling => {
        const colorAttr = sibling.attributes.find(attr => attr.name === 'Colour' || attr.taxonomy === 'pa_colour');
        const colorName = colorAttr?.terms[0]?.name || sibling.name;
        const colorSlug = colorAttr?.terms[0]?.slug || 'black';
        
        return {
          name: colorName,
          slug: sibling.slug,
          hex: COLOR_HEX_MAP[colorSlug] || '#cccccc'
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
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Breadcrumb paths={breadcrumbPaths} />
      <Container className="py-8 md:py-10">
        <ProductDetailClient
          product={product}
          tiers={pricing.tiers}
          basePrice={pricing.basePrice}
          colorVariants={colorVariants}
          customTabs={customTabs}
        />
      </Container>
      <RelatedProducts categoryId={product.categories[0]?.id} />
      <FAQ />
      <CustomisationCTA />
    </div>
  );
}
