import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { ProductDetailClient } from '@/features/products/components/ProductDetailClient';
import { getStoreProductBySlug } from '@/features/products/services/store-products';
import { getProductPricingData } from '@/features/products/services/pricing';
import type { Metadata } from 'next';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getStoreProductBySlug(slug);
  return {
    title: product ? `${product.name} | Abbeygate England` : 'Product',
    description: product?.short_description?.replace(/<[^>]*>/g, '').slice(0, 160),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getStoreProductBySlug(slug);

  if (!product) notFound();

  const pricing = await getProductPricingData(slug);

  return (
    <div className="py-10">
      <Container>
        <Breadcrumb
          paths={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/notebooks' },
            { label: product.name },
          ]}
        />
        <div className="mt-8">
          <ProductDetailClient
            product={product}
            tiers={pricing?.tiers ?? []}
            basePrice={pricing?.basePrice ?? 0}
          />
        </div>
      </Container>
    </div>
  );
}
