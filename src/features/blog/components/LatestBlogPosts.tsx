import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ArrowIcon } from '@/components/ui/ArrowIcon';
import { Button } from '@/components/ui/Button';
import { BlogCard } from './BlogCard';
import type { BlogPost } from '../types';

interface LatestBlogPostsProps {
  posts: BlogPost[];
}

export function LatestBlogPosts({ posts }: LatestBlogPostsProps) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-10 md:py-14 bg-brand-cream">
      <Container>
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
          {/* Title + Arrow */}
          <div className="relative inline-flex items-center gap-1.5">
            <h2 className="font-josefin text-xl sm:text-2xl md:text-[28px] font-bold text-brand-primary-dark tracking-tight">
              Latest From Our Blog
            </h2>
            <div className="relative -ml-1 translate-y-2.5 sm:translate-y-3 w-9 h-9 sm:w-11 sm:h-11 select-none pointer-events-none">
              <ArrowIcon className="w-full h-full object-contain" />
            </div>
          </div>

          {/* View All Button */}
          <div>
            <Button
              href="/blog"
              variant="primary"
              className="uppercase text-[11px] sm:text-[12px] tracking-wider px-5 py-2.5 font-bold"
            >
              View all posts
            </Button>
          </div>
        </div>

        {/* 3 Posts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} compact={true} />
          ))}
        </div>
      </Container>
    </section>
  );
}
