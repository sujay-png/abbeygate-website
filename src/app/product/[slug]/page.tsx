import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ProductDetailClient } from '@/features/products/components/ProductDetailClient';
import { getStoreProductBySlug } from '@/features/products/services/store-products';
import { getProductPricingFromProduct } from '@/features/products/services/pricing';
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

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Breadcrumb
        paths={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/notebooks' },
          { label: product.name },
        ]}
      />
      <Container className="py-8 md:py-10">
        <ProductDetailClient
          product={product}
          tiers={pricing.tiers}
          basePrice={pricing.basePrice}
        />
      </Container>
    </div>
  );
}
