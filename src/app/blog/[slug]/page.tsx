import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { Breadcrumb } from '@/components/content/Breadcrumb';
import { CustomisationCTA } from '@/components/shared/CustomisationCTA';
import {
  BlogPostHeader,
  BlogPostContent,
  LatestBlogPosts,
} from '@/features/blog/components';
import {
  getBlogPostBySlug,
  getRecentBlogPosts,
  getBlogPosts,
} from '@/features/blog/services/blog-service';
import { SITE_URL, jsonLd } from '@/lib/seo';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found | Abbeygate England',
    };
  }

  const title = `${post.title} | Abbeygate England`;
  const description = post.excerpt || `Read ${post.title} on Abbeygate England.`;
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const imageUrl = post.featuredImage?.url || `${SITE_URL}/images/banners/hero-banner.png`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'Abbeygate England',
      images: [
        {
          url: imageUrl,
          alt: post.featuredImage?.alt || post.title,
        },
      ],
      locale: 'en_GB',
      type: 'article',
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const recentPosts = await getRecentBlogPosts(3, post.slug);

  // Article JSON-LD schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Organization',
      name: 'Abbeygate England',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Abbeygate England',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/images/logos/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
    image: post.featuredImage?.url ? [post.featuredImage.url] : undefined,
  };

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Our Blog', href: '/blog' },
    { label: post.title },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }}
      />

      <main className="flex flex-col min-h-screen bg-brand-cream">
        {/* Breadcrumb Navigation */}
        <Breadcrumb paths={breadcrumbs} />

        {/* Article Container */}
        <section className="pt-4 pb-12">
          <Container>
            <BlogPostHeader post={post} />
            <BlogPostContent post={post} />
          </Container>
        </section>

        {/* Latest From Our Blog Section with cartoon arrow & View all button */}
        <LatestBlogPosts posts={recentPosts} />

        {/* Customisation CTA Banner */}
        <CustomisationCTA />
      </main>
    </>
  );
}
