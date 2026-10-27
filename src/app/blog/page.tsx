import type { Metadata } from 'next';
import { getSEOMetadata } from '@/lib/seo';
import { getBlogPosts } from '@/features/blog/services/blog-service';
import { BlogList } from '@/features/blog/components';
import { CustomisationCTA } from '@/components/shared/CustomisationCTA';

export const metadata: Metadata = getSEOMetadata('/blog');

// Revalidate page every 60 seconds
export const revalidate = 60;

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <BlogList posts={posts} />
      <CustomisationCTA />
    </main>
  );
}
