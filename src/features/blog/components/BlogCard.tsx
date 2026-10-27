import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost } from '../types';

interface BlogCardProps {
  post: BlogPost;
  priority?: boolean;
  compact?: boolean;
}

export function BlogCard({ post, priority = false, compact = false }: BlogCardProps) {
  return (
    <article className="group flex flex-col h-full">
      <Link
        href={`/blog/${post.slug}`}
        className={`block overflow-hidden relative bg-brand-soft/40 shadow-sm transition-all duration-300 group-hover:shadow-md ${
          compact ? 'rounded-xl aspect-[16/10]' : 'rounded-2xl aspect-[4/3]'
        }`}
      >
        {post.featuredImage?.url ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-brand-tint/60 text-brand-primary-dark/40 font-josefin font-semibold text-lg p-6 text-center">
            Abbeygate Journal
          </div>
        )}
      </Link>

      <div className={`flex flex-col flex-1 ${compact ? 'pt-3.5' : 'pt-5'}`}>
        <h3
          className={`font-josefin font-bold text-brand-primary-dark leading-snug transition-colors duration-200 group-hover:text-brand-primary ${
            compact ? 'text-[16px] sm:text-[17px]' : 'text-[19px] sm:text-[21px]'
          }`}
        >
          <Link href={`/blog/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>

        {post.excerpt && (
          <p
            className={`font-work text-brand-body/75 leading-relaxed mt-2 ${
              compact ? 'text-[13px] sm:text-[13.5px] line-clamp-2' : 'text-[14px] sm:text-[15px] line-clamp-3 mt-2.5'
            }`}
          >
            {post.excerpt}
          </p>
        )}
      </div>
    </article>
  );
}
