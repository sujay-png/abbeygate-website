import type { BlogPost } from '../types';
import { SocialShare } from './SocialShare';

interface BlogPostContentProps {
  post: BlogPost;
}

export function BlogPostContent({ post }: BlogPostContentProps) {
  return (
    <article className="max-w-4xl mx-auto pb-16">
      {/* Main Article Body */}
      <div
        className="blog-prose font-work text-[15px] sm:text-[16px] md:text-[17px] text-brand-body leading-[1.8] [&>p]:mb-6 [&>p_strong]:font-josefin [&>p_strong]:font-bold [&>p_strong]:text-brand-primary-dark [&>p_strong]:text-[18px] sm:[&>p_strong]:text-[20px] [&>ul]:list-disc [&>ul]:pl-6 sm:[&>ul]:pl-8 [&>ul]:mb-6 [&>ul]:space-y-2 [&>ul_ul]:list-circle [&>ul_ul]:pl-6 [&>ul_ul]:mt-2 [&>ul_ul]:space-y-1.5 [&>ol]:list-decimal [&>ol]:pl-6 sm:[&>ol]:pl-8 [&>ol]:mb-6 [&>ol]:space-y-2 [&>h2]:font-josefin [&>h2]:font-bold [&>h2]:text-2xl sm:[&>h2]:text-3xl [&>h2]:text-brand-primary-dark [&>h2]:mt-10 [&>h2]:mb-4 [&>h3]:font-josefin [&>h3]:font-bold [&>h3]:text-xl sm:[&>h3]:text-2xl [&>h3]:text-brand-primary-dark [&>h3]:mt-8 [&>h3]:mb-3 [&>blockquote]:border-l-4 [&>blockquote]:border-brand-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-6 [&>blockquote]:text-brand-body/80 [&_img]:rounded-xl [&_img]:my-6 [&_figure]:my-8 [&_figure]:rounded-xl [&_figure]:overflow-hidden [&_a]:text-brand-primary [&_a]:underline hover:[&_a]:text-brand-accent transition-colors"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Bottom Social Share Bar */}
      <div className="mt-12 pt-8 border-t border-brand-border/30 flex items-center justify-between flex-wrap gap-4">
        <span className="font-josefin text-sm font-semibold tracking-wider text-gray-500 uppercase">
          Share this article
        </span>
        <SocialShare title={post.title} />
      </div>
    </article>
  );
}
