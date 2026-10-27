import type { BlogPost } from '../types';
import { SocialShare } from './SocialShare';

interface BlogPostHeaderProps {
  post: BlogPost;
}

export function BlogPostHeader({ post }: BlogPostHeaderProps) {
  return (
    <header className="pt-8 pb-6 text-center max-w-4xl mx-auto">
      {/* Title */}
      <h1 className="font-josefin font-bold text-3xl sm:text-4xl md:text-[46px] text-brand-primary-dark tracking-tight leading-[1.2] mb-6">
        {post.title}
      </h1>

      {/* Intro Subtitle / Excerpt */}
      {post.excerpt && (
        <p className="font-work text-brand-body/80 text-base sm:text-[17px] md:text-[18px] leading-relaxed max-w-3xl mx-auto mb-8">
          {post.excerpt}
        </p>
      )}

      {/* Social Share Bar */}
      <div className="flex justify-center mb-8">
        <SocialShare title={post.title} />
      </div>
    </header>
  );
}
