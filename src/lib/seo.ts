import { Metadata } from 'next';
import { getStoreCategories } from '@/features/products/services/store-products';

/**
 * Public origin of the storefront. Canonicals, sitemap, robots, OG images and JSON-LD all derive
 * from this, so they can never disagree. dashboard.abbeygate-business.com is the WordPress backend
 * and must never be used here — canonicals pointing at it tell Google to index the wrong host.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://abbeygate-business.com').replace(/\/+$/, '');

/** Serialise JSON-LD safely: escaping `<` stops CMS-supplied text from closing the <script> tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// 1. Centralized SEO Configuration
export const seoConfig: Record<string, { title: string; description: string; noindex?: boolean }> = {
  "/": {
    title: "Business Diaries & Corporate Gifting | Abbeygate Business | ",
    description: "Elevate your corporate gifting and bespoke merchandise with our expertly customised leather goods. Personalise with your brand logo.",
  },
  "/about": {
    title: "About Us | Abbeygate Business",
    description: "Learn more about Abbeygate Business, our heritage, and our commitment to craftsmanship. Business & Corporate Gifts, Diaries & Notebooks, personalised with your brand logo.",
  },
  "/search": {
    title: "Search Results | Abbeygate Business",
    description: "Search our collection of bespoke diaries, notebooks, and corporate gifts.",
    noindex: true,
  },
  "/cart": {
    title: "Your Bag | Abbeygate Business",
    description: "Review your selected Abbeygate England items before checkout.",
    noindex: true,
  },
  "/account": {
    title: "My Account | Abbeygate Business",
    description: "Manage your Abbeygate Business account, orders, and details.",
    noindex: true,
  },
  "/checkout": {
    title: "Checkout | Abbeygate Business",
    description: "Complete your Abbeygate England purchase.",
    noindex: true,
  },
  "/contact": {
    title: "Contact Us | Abbeygate Business",
    description: "Get in touch with the Abbeygate England team for corporate gifting inquiries and support.",
  },
  "/faqs": {
    title: "Frequently Asked Questions | Abbeygate Business",
    description: "Find answers to common questions about our products, customisation, and shipping.",
  },
  "/blog": {
    title: "Abbeygate Business Blog | Abbeygate Business",
    description: "Insights, guides, and inspiration for corporate gifting, bespoke stationery, and British leather craftsmanship products personalised with your brand logo.",
  },
  "/resource-guide": {
    title: "Resource Guide | Abbeygate Business",
    description: "Helpful resources and guides for corporate gifting and bespoke products.",
  },
  "/quote": {
    title: "Request a Quote | Abbeygate Business",
    description: "Request a bespoke quote for corporate gifting and custom leather goods.",
  },
  "/heritage": {
    title: "Our Heritage | Abbeygate Business",
    description: "Discover the rich history and craftsmanship behind Abbeygate England.",
  },
  "/artwork-specification": {
    title: "Artwork Specification | Abbeygate Business",
    description: "How to supply logo artwork for debossing, foil blocking and printing on your Abbeygate Business products. Personalise with your brand logo.",
  },
  "/bespoke/artwork-specification": {
    title: "Artwork Specification | Abbeygate Business",
    description: "How to supply logo artwork for debossing, foil blocking and printing on your Abbeygate Business products. Personalise with your brand logo.",
  },
  "/modern-slavery": {
    title: "Modern Slavery Statement | Abbeygate Business",
    description: "Abbeygate England's statement on preventing modern slavery and human trafficking in our business and supply chains.",
  },
  "/privacy": {
    title: "Privacy Policy | Abbeygate Business",
    description: "How Abbeygate England collects, uses and protects your personal information.",
  },
  "/terms": {
    title: "Terms & Conditions | Abbeygate Business",
    description: "The terms and conditions that apply to orders placed with Abbeygate England.",
  },
  "/cookies": {
    title: "Cookie Policy | Abbeygate Business",
    description: "How Abbeygate England uses cookies on this website.",
  },
  "/returns": {
    title: "Returns Policy | Abbeygate Business",
    description: "Information on returns and refunds for Abbeygate England orders.",
  },
  "/bespoke": {
    title: "Corporate Gifts, Branded Gifts | Abbeygate Business",
    description: "Elevate your corporate gifting and bespoke merchandise with our expertly customised leather goods. Personalise with your brand logo.",
  },
  "/bespoke/personalisation": {
    title: "Personalisation | Abbeygate Business",
    description: "Blocking and foiling, UV printing, graphic print and special matter pages for corporate diaries, notebooks and leather goods. Personalise with your brand logo.",
  },
  "/bespoke/additional-finishing": {
    title: "Additional Finishing | Abbeygate Business",
    description: "Corporate & Business Diaries with your logo, ribbon markers, pen loops, decorative corner protectors and gilded page edges. Personalise with your brand logo.",
  },
  "/bespoke/portfolio": {
    title: "Bespoke Portfolio | Abbeygate Business",
    description: "Explore our portfolio of bespoke projects, from personalised corporate diaries to fully branded leather goods. Personalise with your brand logo.",
  },
  "/internal-page-layouts": {
    title: "Internal Page Layouts | Abbeygate Business",
    description: "Internal page layout options for Abbeygate England diaries and notebooks.",
  },
};

// 2. Helper to generate metadata for any page
export function getSEOMetadata(
  path: string, 
  dynamicOverrides?: { title?: string; description?: string; noindex?: boolean; image?: string }
): Metadata {
  const baseData = seoConfig[path] || {
    title: "Abbeygate Business | Your Brand, Our Craftsmanship",
    description: "Elevate your corporate gifting and bespoke merchandise with our expertly customised leather goods."
  };

  const finalTitle = dynamicOverrides?.title || baseData.title;
  const finalDescription = dynamicOverrides?.description || baseData.description;
  const finalNoIndex = dynamicOverrides?.noindex ?? baseData.noindex ?? false;
  
  const canonicalUrl = path === '/' ? SITE_URL : `${SITE_URL}${path}`;
  const shareImage = dynamicOverrides?.image
    ? { url: dynamicOverrides.image, alt: finalTitle }
    : { url: "/images/banners/hero-banner.png", width: 1200, height: 630, alt: "Abbeygate England Hero Image" };

  return {
    // absolute: true prevents Next.js from appending the layout template again
    title: { absolute: finalTitle },
    description: finalDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: canonicalUrl,
      siteName: "Abbeygate Business",
      images: [shareImage],
      locale: "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [shareImage.url],
    },
    robots: {
      index: !finalNoIndex,
      follow: true,
    }
  };
}

export async function generateCategoryMetadata(basePath: string, slug?: string[]): Promise<Metadata> {
  const formattedBaseName = basePath.charAt(1).toUpperCase() + basePath.slice(2).replace('-', ' ');
  let title = `${formattedBaseName} | Abbeygate Business`;
  let description = `Browse our exclusive collection of luxury ${formattedBaseName.toLowerCase()}.`;
  
  const path = slug?.length ? `${basePath}/${slug.join('/')}` : basePath;

  if (slug?.length) {
    const pathSlug = slug[slug.length - 1];
    try {
      const { getCategoryRoute } = await import('@/data/category-routes');
      const route = getCategoryRoute(path);

      if (route) {
        title = route.seoTitle || (route.title.includes('Abbeygate') ? route.title : `${route.title} | Abbeygate Business`);
        if (route.description) {
           description = route.description;
        }
      } else {
        const categories = await getStoreCategories();
        const category = categories.find(c => c.slug === pathSlug);
        if (category) {
          title = `${category.name} | Abbeygate Business`;
          description = category.description || description;
        }
      }
    } catch (error) {
      console.error('Error fetching categories for metadata:', error);
    }
  }

  // Use the central helper to ensure canonicals, OG, and robots are properly attached!
  return getSEOMetadata(path, { title, description });
}
