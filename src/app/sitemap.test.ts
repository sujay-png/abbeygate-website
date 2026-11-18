import { describe, it, expect, vi, beforeEach } from 'vitest';
import sitemap from './sitemap';

vi.mock('@/features/products/services/store-products', () => ({
  getSitemapProducts: vi.fn(),
}));

vi.mock('@/features/blog/services/blog-service', () => ({
  getBlogPosts: vi.fn(),
}));

import { getSitemapProducts } from '@/features/products/services/store-products';
import { getBlogPosts } from '@/features/blog/services/blog-service';

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates sitemap with static pages, categories, products, and dynamic blog posts', async () => {
    vi.mocked(getSitemapProducts).mockResolvedValue([
      { slug: 'chelsea-leather-a5-notebook' } as any,
    ]);

    vi.mocked(getBlogPosts).mockResolvedValue([
      {
        id: 101,
        slug: 'streamlining-success',
        title: 'Streamlining Success',
        date: '2025-01-15T10:00:00',
        modified: '2025-02-01T12:00:00',
      } as any,
      {
        id: 102,
        slug: 'what-is-fsc',
        title: 'What is FSC',
        date: '2025-01-20T10:00:00',
      } as any,
    ]);

    const entries = await sitemap();

    // Verify /blog main route exists
    const blogIndexEntry = entries.find((e) => e.url.endsWith('/blog'));
    expect(blogIndexEntry).toBeDefined();

    // Verify dynamic blog posts are included with proper lastModified
    const blogPost1 = entries.find((e) => e.url.endsWith('/blog/streamlining-success'));
    expect(blogPost1).toBeDefined();
    expect(blogPost1?.lastModified).toEqual(new Date('2025-02-01T12:00:00'));

    const blogPost2 = entries.find((e) => e.url.endsWith('/blog/what-is-fsc'));
    expect(blogPost2).toBeDefined();
    expect(blogPost2?.lastModified).toEqual(new Date('2025-01-20T10:00:00'));

    // Verify product entry
    const productEntry = entries.find((e) => e.url.endsWith('/product/chelsea-leather-a5-notebook'));
    expect(productEntry).toBeDefined();
  });

  it('gracefully handles blog post fetch failures', async () => {
    vi.mocked(getSitemapProducts).mockResolvedValue([]);
    vi.mocked(getBlogPosts).mockRejectedValue(new Error('Network error'));

    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    const blogPostEntry = entries.find((e) => e.url.includes('/blog/'));
    expect(blogPostEntry).toBeUndefined();
  });
});
