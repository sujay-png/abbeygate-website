import Image from "next/image";
import { Container } from "../ui/Container";

const features = [
  {
    title: "Fully Customisable",
    imageUrl: "/images/icons/Fully_customisable.avif",
  },
  {
    title: "Secure Payment",
    imageUrl: "/images/icons/icon-wallet.webp",
  },
  {
    title: "UK Craftsmanship",
    imageUrl: "/images/icons/union-jack_1.webp",
  },
  {
    title: "Eco-friendly Products",
    imageUrl: "/images/icons/icon-leaves.webp",
  }
];

export const TrustIndicators = () => {
  return (
    <section className="py-12 bg-white">
      <Container>
        <div className="border-t border-b border-gray-200 py-2 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between divide-y divide-gray-200 md:divide-y-0 gap-0 md:gap-6 lg:gap-12">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-5 flex-1 justify-start md:justify-center py-6 md:py-0 ${
                  idx !== 0 ? 'md:border-l md:border-gray-200' : ''
                }`}
              >
                <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                  <Image
                    src={feature.imageUrl}
                    alt={feature.title}
                    width={56}
                    height={56}
                    className="object-contain max-w-full max-h-full w-auto h-auto"
                  />
                </div>
                <h3 className="font-bold text-base md:text-lg tracking-wide text-black">
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