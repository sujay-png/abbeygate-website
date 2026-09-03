import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Container } from "@/components/ui/Container";

export default function BespokeComingSoonPage() {
  return (
    <main className="bg-brand-cream min-h-screen">
      <div className="flex flex-col items-center justify-center pt-20 pb-16 md:pt-28 md:pb-20 text-center">
        <Container>
          <h1 className="font-josefin text-5xl md:text-6xl font-bold text-brand-primary-dark mb-5">
            Coming Soon..!
          </h1>
          <p className="font-didact text-lg md:text-xl text-brand-body max-w-2xl mx-auto">
            We are currently crafting this bespoke service experience. Please check back later for detailed information.
          </p>
        </Container>
      </div>
      <FeaturedProducts title="Explore our bestsellers in the meantime" />
    </main>
  );
}