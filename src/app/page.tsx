import { Hero, FeaturedProducts, Categories, TrustIndicators, FeaturedCollections, ResourceCarousel, FAQ } from "@/components/home";
import { CustomisationCTA } from "@/components/shared/CustomisationCTA";
import { LatestBlog } from "@/components/shared/LatestBlog";
import type { Metadata } from "next";
import { getSEOMetadata, jsonLd, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = getSEOMetadata("/");

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="sr-only">Abbeygate England | Personalised Corporate Gifting & Diaries</h1>
      <Hero />
      <Categories />
      <FeaturedProducts />
      <TrustIndicators/>
      <FeaturedCollections />  
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
            "name": "Abbeygate England",
            "url": SITE_URL,
            "logo": `${SITE_URL}/images/logo/abbeygate-logo.png`,
          }),
        }}
      />
    </div>
  );
}
