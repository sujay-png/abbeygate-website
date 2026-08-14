import { Metadata } from 'next';
import { getStoreCategories } from '@/features/products/services/store-products';

export async function generateCategoryMetadata(basePath: string, slug?: string[]): Promise<Metadata> {
  const formattedBaseName = basePath.charAt(1).toUpperCase() + basePath.slice(2).replace('-', ' ');
  let title = `${formattedBaseName} | Abbeygate England`;
  let description = `Browse our exclusive collection of luxury ${formattedBaseName.toLowerCase()}.`;
  
  const path = slug?.length ? `${basePath}/${slug.join('/')}` : basePath;
  const canonicalUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://corporate.abbeygate-england.com'}${path}`;

  if (slug?.length) {
    const pathSlug = slug[slug.length - 1];
    try {
      const categories = await getStoreCategories();
      const category = categories.find(c => c.slug === pathSlug);
      
      if (category) {
        title = `${category.name} | Abbeygate England`;
        description = category.description || `Explore our high-quality ${category.name.toLowerCase()} for your corporate or personal needs.`;
      }
    } catch (error) {
      console.error('Error fetching categories for metadata:', error);
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}
