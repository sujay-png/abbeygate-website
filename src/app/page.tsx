import { Hero, FeaturedProducts, Categories, TrustIndicators, ResourceCarousel, FAQ } from "@/components/home";
import { CustomisationCTA } from "@/components/shared/CustomisationCTA";
import { LatestBlog } from "@/components/shared/LatestBlog";
import type { Metadata } from "next";
import { getSEOMetadata, jsonLd, SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = getSEOMetadata("/");

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="sr-only">Abbeygate Business | Personalised Corporate Gifting & Diaries</h1>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <TrustIndicators/>
      <ResourceCarousel />
      <FAQ />
      <LatestBlog />
      <CustomisationCTA/>
      {/* Other home components will go here */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Abbeygate Business",
            "url": SITE_URL,
            "logo": `${SITE_URL}/images/logo/abbeygate-business-logo.png`,
          }),
        }}
      />
    </div>
  );
}
