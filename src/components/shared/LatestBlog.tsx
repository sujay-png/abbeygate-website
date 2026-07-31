import Image from "next/image";
import Link from "next/link";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { ArrowIcon } from "../ui/ArrowIcon";

const BLOG_POSTS = [
  {
    id: 1,
    title: "What is FSC and Why Does it Matter?",
    date: "November 27, 2025 /// No Comments",
    excerpt: "Home What is FSC and Why Does it Matter? What is FSC and Why Does it Matter? The Forest Stewardship Council (FSC) is a global",
    image: "/images/blog/fsc-diaries.webp",
    link: "#"
  },
  {
    id: 2,
    title: "Abbeygate: A Legacy of Craftsmanship in Walsall",
    date: "November 27, 2025 /// No Comments",
    excerpt: "Home Abbeygate: Leather Craftsmanship Abbeygate: A Legacy of Craftsmanship in Walsall Nestled in the heart of Walsall, a town steeped in the rich heritage of leather",
    image: "/images/blog/walsall-leather.jpg",
    link: "#"
  },
  {
    id: 3,
    title: "Beyond Paper: Choosing the Perfect Cover Material for Your Diary",
    date: "November 27, 2025 /// No Comments",
    excerpt: "Home Abbeygate: Leather Craftsmanship Beyond Paper: Choosing the Perfect Cover Material for Your Diary A diary is more than just a collection of pages; it's",
    image: "/images/blog/beyond-paper.webp",
    link: "#"
  }
];

export const LatestBlog = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <Container>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          <div className="relative inline-block">
            <h2 className="text-3xl font-extrabold text-black font-sans tracking-tight">
              Latest From Our Blog
            </h2>
            <ArrowIcon className="absolute -right-22 -top-1 hidden md:block" />
          </div>
          
          <Button variant="primary" href="/blog">
            View all Posts
          </Button>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post) => (
            <div key={post.id} className="flex flex-col group">
              <Link href={post.link} className="relative w-full aspect-[4/3] mb-5 overflow-hidden block">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  unoptimized={true}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="rounded-md object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
              
              <Link href={post.link} className="hover:text-gray-600 transition-colors">
                <h3 className="font-bold text-[18px] font-sans text-black leading-snug mb-1">
                  {post.title}
                </h3>
              </Link>
              
              <p className="text-[11px] text-gray-400 font-sans mb-3 tracking-wide">
                {post.date}
              </p>
              
              <p className="text-[15px] text-gray-700 font-work leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mt-16 border-b border-neutral-300" />
      </Container>
    </section>
  );
};
