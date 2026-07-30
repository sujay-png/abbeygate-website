import { Hero, FeaturedProducts, Categories, TrustIndicators, FeaturedCollections, ResourceCarousel, FAQ, LatestBlog ,CustomisationCTA} from "@/features/home";

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
    </div>
  );
}
