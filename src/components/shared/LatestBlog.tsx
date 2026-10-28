import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { ArrowIcon } from "../ui/ArrowIcon";
import { BlogCard } from "@/features/blog/components/BlogCard";
import { getRecentBlogPosts } from "@/features/blog/services/blog-service";

export const LatestBlog = async () => {
  const posts = await getRecentBlogPosts(3);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-brand-cream">
      <Container>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6">
          <div className="relative inline-flex items-center gap-1.5">
            <h2 className="font-josefin text-[26px] font-bold tracking-tight text-brand-primary-dark lg:text-[37px]">
              Latest From Our Blog
            </h2>
            <div className="relative -ml-1 translate-y-3 sm:translate-y-3.5 md:translate-y-4 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 select-none pointer-events-none">
              <ArrowIcon className="w-full h-full object-contain" />
            </div>
          </div>
          
          <Button variant="primary" href="/blog">
            View all Posts
          </Button>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

      </Container>
    </section>
  );
};
