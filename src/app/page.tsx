import { Hero, FeaturedProducts, Categories, TrustIndicators, FeaturedCollections, ResourceCarousel, FAQ } from "@/components/home";
import { CustomisationCTA } from "@/components/shared/CustomisationCTA";
import { LatestBlog } from "@/components/shared/LatestBlog";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
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
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Abbeygate England",
            "url": "https://dashboard.abbeygate-england.com",
            "logo": "https://dashboard.abbeygate-england.com/favicon.ico",
          }),
        }}
      />
    </div>
  );
}
