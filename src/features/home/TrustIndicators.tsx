import Image from "next/image";
import { Container } from "../shared/Container";

const features = [
  {
    title: "Fully Customisable",
    imageUrl: "https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/Fully_customisable.avif",
  },
  {
    title: "Secure Payment",
    imageUrl: "https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/icon-wallet.webp",
  },
  {
    title: "UK Craftsmanship",
    imageUrl: "https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/union-jack_1.webp",
  },
  {
    title: "Eco-friendly Products",
    imageUrl: "https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/icon-leaves.webp",
  }
];

export const TrustIndicators = () => {
  return (
    <section className="py-12 bg-white">
      <Container>
        <div className="border-t border-b border-gray-200 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 md:gap-6 lg:gap-12">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-5 flex-1 justify-center ${
                  idx !== 0 ? 'md:border-l md:border-gray-200' : ''
                }`}
              >
                <div className="flex-shrink-0 flex items-center justify-center">
                  <Image 
                    src={feature.imageUrl} 
                    alt={feature.title} 
                    width={56} 
                    height={56} 
                    className="object-contain" 
                  />
                </div>
                <h3 className="font-bold text-lg tracking-wide text-black">
                  {feature.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
