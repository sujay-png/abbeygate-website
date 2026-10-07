import { Metadata } from 'next';
import { getStoreCategories } from '@/features/products/services/store-products';

/**
 * Public origin of the storefront. Canonicals, sitemap, robots, OG images and JSON-LD all derive
 * from this, so they can never disagree. dashboard.abbeygate-england.com is the WordPress backend
 * and must never be used here — canonicals pointing at it tell Google to index the wrong host.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'https://corporate.abbeygate-england.com').replace(/\/+$/, '');

/** Serialise JSON-LD safely: escaping `<` stops CMS-supplied text from closing the <script> tag. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

// 1. Centralized SEO Configuration
export const seoConfig: Record<string, { title: string; description: string; noindex?: boolean }> = {
  "/": {
    title: "Abbeygate England | Personalised Corporate Gifting & Diaries",
    description: "Elevate your corporate gifting and bespoke merchandise with our expertly customised leather goods.",
  },
  "/about": {
    title: "About Us | Abbeygate England",
    description: "Learn more about Abbeygate England, our heritage, and our commitment to craftsmanship.",
  },
  "/search": {
    title: "Search Results | Abbeygate England",
    description: "Search our collection of bespoke diaries, notebooks, and corporate gifts.",
    noindex: true,
  },
  "/cart": {
    title: "Your Bag | Abbeygate England",
    description: "Review your selected Abbeygate England items before checkout.",
    noindex: true,
  },
  "/checkout": {
    title: "Checkout | Abbeygate England",
    description: "Complete your Abbeygate England purchase.",
    noindex: true,
  },
  "/contact": {
    title: "Contact Us | Abbeygate England",
    description: "Get in touch with the Abbeygate England team for corporate gifting inquiries and support.",
  },
  "/faqs": {
    title: "Frequently Asked Questions | Abbeygate England",
    description: "Find answers to common questions about our products, customisation, and shipping.",
  },
  "/resource-guide": {
    title: "Resource Guide | Abbeygate England",
    description: "Helpful resources and guides for corporate gifting and bespoke products.",
  },
  "/quote": {
    title: "Request a Quote | Abbeygate England",
    description: "Request a bespoke quote for corporate gifting and custom leather goods.",
  },
  "/heritage": {
    title: "Our Heritage | Abbeygate England",
    description: "Discover the rich history and craftsmanship behind Abbeygate England.",
  },
  "/artwork-specification": {
    title: "Artwork Specification | Abbeygate England",
    description: "How to supply logo artwork for debossing, foil blocking and printing on your Abbeygate England products.",
  },
  "/modern-slavery": {
    title: "Modern Slavery Statement | Abbeygate England",
    description: "Abbeygate England's statement on preventing modern slavery and human trafficking in our business and supply chains.",
  },
  "/privacy": {
    title: "Privacy Policy | Abbeygate England",
    description: "How Abbeygate England collects, uses and protects your personal information.",
  },
  "/terms": {
    title: "Terms & Conditions | Abbeygate England",
    description: "The terms and conditions that apply to orders placed with Abbeygate England.",
  },
  "/cookies": {
    title: "Cookie Policy | Abbeygate England",
    description: "How Abbeygate England uses cookies on this website.",
  },
  "/returns": {
    title: "Returns Policy | Abbeygate England",
    description: "Information on returns and refunds for Abbeygate England orders.",
  },
  "/bespoke": {
    title: "Bespoke Service | Abbeygate England",
    description: "Our bespoke corporate gifting service is coming soon.",
    noindex: true,
  },
  "/internal-page-layouts": {
    title: "Internal Page Layouts | Abbeygate England",
    description: "Internal page layout options for Abbeygate England diaries and notebooks.",
  },
};

// 2. Helper to generate metadata for any page
export function getSEOMetadata(
  path: string, 
  dynamicOverrides?: { title?: string; description?: string; noindex?: boolean; image?: string }
): Metadata {
  const baseData = seoConfig[path] || {
    title: "Abbeygate England | Your Brand, Our Craftsmanship",
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
      siteName: "Abbeygate England",
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
  let title = `${formattedBaseName} | Abbeygate England`;
  let description = `Browse our exclusive collection of luxury ${formattedBaseName.toLowerCase()}.`;
  
  const path = slug?.length ? `${basePath}/${slug.join('/')}` : basePath;

  if (slug?.length) {
    const pathSlug = slug[slug.length - 1];
    try {
      const { getCategoryRoute } = await import('@/data/category-routes');
      const route = getCategoryRoute(path);

      if (route) {
        title = `${route.title} | Abbeygate England`;
        if (route.description) {
           description = route.description;
        }
      } else {
        const categories = await getStoreCategories();
        const category = categories.find(c => c.slug === pathSlug);
        if (category) {
          title = `${category.name} | Abbeygate England`;
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
