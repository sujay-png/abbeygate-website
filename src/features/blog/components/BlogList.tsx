import { Container } from '@/components/ui/Container';
import { ArrowIcon } from '@/components/ui/ArrowIcon';
import { BlogCard } from './BlogCard';
import type { BlogPost } from '../types';

interface BlogListProps {
  posts: BlogPost[];
}

export function BlogList({ posts }: BlogListProps) {
  return (
    <section className="py-12 md:py-16 bg-brand-cream min-h-[60vh]">
      <Container>
        {/* Header with Cartoon Arrow */}
        <div className="relative inline-flex items-center gap-1.5 mb-10 md:mb-14">
          <h1 className="font-josefin text-3xl sm:text-4xl md:text-[44px] font-bold text-brand-primary-dark tracking-tight">
            Our Blogs
          </h1>
          <div className="relative -ml-1 translate-y-3 sm:translate-y-4 md:translate-y-5 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 select-none pointer-events-none">
            <ArrowIcon className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Blog Cards Grid */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
            {posts.map((post, index) => (
              <BlogCard key={post.id} post={post} priority={index < 3} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="font-josefin text-xl text-gray-500">
              No blog posts found at the moment. Please check back soon!
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}
