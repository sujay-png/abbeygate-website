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
        className="blog-prose font-work text-[15px] sm:text-[16px] md:text-[17px] text-brand-body leading-[1.8] [&_p]:mb-6 [&_p_strong]:font-josefin [&_p_strong]:font-bold [&_p_strong]:text-brand-primary-dark [&_p_strong]:text-[18px] sm:[&_p_strong]:text-[20px] [&_ul]:list-disc [&_ul]:pl-6 sm:[&_ul]:pl-8 [&_ul]:mb-6 [&_ul]:space-y-2 [&_ul_ul]:list-circle [&_ul_ul]:pl-6 [&_ul_ul]:mt-2 [&_ul_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-6 sm:[&_ol]:pl-8 [&_ol]:mb-6 [&_ol]:space-y-2 [&_h2]:font-josefin [&_h2]:font-bold [&_h2]:text-2xl sm:[&_h2]:text-3xl [&_h2]:text-brand-primary-dark [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-josefin [&_h3]:font-bold [&_h3]:text-xl sm:[&_h3]:text-2xl [&_h3]:text-brand-primary-dark [&_h3]:mt-8 [&_h3]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-brand-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-6 [&_blockquote]:text-brand-body/80 [&_img]:rounded-xl [&_img]:my-6 [&_figure]:my-8 [&_figure]:rounded-xl [&_figure]:overflow-hidden [&_a]:text-brand-primary [&_a]:underline hover:[&_a]:text-brand-accent transition-colors [&_svg]:max-w-[24px] [&_svg]:max-h-[24px] [&_svg]:w-auto [&_svg]:h-auto [&_.elementor-widget-icon-list]:hidden [&_.elementor-widget-posts]:hidden [&_.elementor-widget-share-buttons]:hidden [&_.elementor-widget-social-icons]:hidden"
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
