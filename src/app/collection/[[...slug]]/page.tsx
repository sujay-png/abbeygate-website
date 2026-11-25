import { CategoryPage } from '@/features/products/components/CategoryPage';
import { getStaticCategoryParams } from '@/data/category-routes';
import { generateCategoryMetadata } from '@/lib/seo';

export const revalidate = 3600;

export function generateStaticParams() {
  return getStaticCategoryParams('/collection');
}

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  return generateCategoryMetadata('/collection', slug);
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const path = slug?.length ? `/collection/${slug.join('/')}` : '/collection';
  return <CategoryPage path={path} />;
}
