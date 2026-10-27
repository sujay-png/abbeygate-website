import { getWooStoreUrl } from '@/lib/woocommerce/config';
import type { BlogPost, WordPressPost } from '../types';
import { decodeHtmlEntities, stripHtml, formatDate } from '../utils/format';

/**
 * Transforms a raw WordPress REST API post into a clean, typed BlogPost.
 */
export function transformWordPressPost(raw: WordPressPost): BlogPost {
  const title = decodeHtmlEntities(raw.title?.rendered || '');
  
  // Clean excerpt
  let excerpt = stripHtml(raw.excerpt?.rendered || '');
  if (!excerpt && raw.content?.rendered) {
    const rawContent = stripHtml(raw.content.rendered);
    excerpt = rawContent.slice(0, 160) + (rawContent.length > 160 ? '...' : '');
  }

  // Extract featured media
  const media = raw._embedded?.['wp:featuredmedia']?.[0];
  let featuredImage: BlogPost['featuredImage'] | undefined;

  if (media?.source_url) {
    featuredImage = {
      url: media.source_url,
      alt: media.alt_text || title,
      width: media.media_details?.width,
      height: media.media_details?.height,
    };
  } else if (raw.content?.rendered) {
    // Fallback: extract first img src from HTML content if available
    const imgMatch = raw.content.rendered.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch?.[1]) {
      featuredImage = {
        url: imgMatch[1],
        alt: title,
      };
    }
  }

  return {
    id: raw.id,
    slug: raw.slug,
    title,
    excerpt,
    content: raw.content?.rendered || '',
    date: raw.date,
    formattedDate: formatDate(raw.date),
    author: raw._embedded?.author?.[0]?.name,
    featuredImage,
  };
}

/**
 * Fetches all published blog posts from WordPress.
 */
export async function getBlogPosts(options?: {
  perPage?: number;
  page?: number;
}): Promise<BlogPost[]> {
  const storeUrl = getWooStoreUrl();
  const perPage = options?.perPage ?? 100;
  const page = options?.page ?? 1;

  const url = `${storeUrl}/wp-json/wp/v2/posts?_embed=1&per_page=${perPage}&page=${page}&status=publish`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60, tags: ['blog-posts'] },
    });

    if (!res.ok) {
      console.error(`Failed to fetch blog posts from WordPress (${res.status}):`, await res.text());
      return [];
    }

    const data: WordPressPost[] = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter((p) => p.slug !== 'hello-world')
      .map(transformWordPressPost);
  } catch (error) {
    console.error('Error fetching blog posts from WordPress:', error);
    return [];
  }
}

/**
 * Fetches a single blog post by its slug from WordPress.
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const storeUrl = getWooStoreUrl();
  const url = `${storeUrl}/wp-json/wp/v2/posts?_embed=1&slug=${encodeURIComponent(slug)}&status=publish`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 60, tags: [`blog-post-${slug}`] },
    });

    if (!res.ok) {
      console.error(`Failed to fetch blog post by slug "${slug}" (${res.status}):`, await res.text());
      return null;
    }

    const data: WordPressPost[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const post = data[0];
    if (post.slug === 'hello-world') return null;

    return transformWordPressPost(post);
  } catch (error) {
    console.error(`Error fetching blog post by slug "${slug}":`, error);
    return null;
  }
}

/**
 * Fetches recent blog posts for "Latest From Our Blog" section.
 */
export async function getRecentBlogPosts(
  limit: number = 3,
  excludeSlug?: string
): Promise<BlogPost[]> {
  const allPosts = await getBlogPosts({ perPage: limit + (excludeSlug ? 2 : 0) });
  return allPosts
    .filter((post) => post.slug !== excludeSlug)
    .slice(0, limit);
}
