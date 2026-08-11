import { CategoryPage } from '@/features/products/components/CategoryPage';

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const path = slug?.length ? `/collection/${slug.join('/')}` : '/collection';
  return <CategoryPage path={path} searchParams={searchParams} />;
}
