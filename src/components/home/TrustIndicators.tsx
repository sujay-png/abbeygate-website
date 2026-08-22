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

interface TrustIndicatorsProps {
  compact?: boolean;
}

export const TrustIndicators = ({ compact = false }: TrustIndicatorsProps = {}) => {
  const innerContent = (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between divide-y divide-gray-200 md:divide-y-0 gap-0 md:gap-4 lg:gap-8 ${compact ? 'py-6 mt-8 border-t border-b border-gray-200' : ''}`}>
      {features.map((feature, idx) => (
        <div
          key={idx}
          className={`flex items-center gap-3 flex-1 justify-start md:justify-center py-4 md:py-0 ${
            idx !== 0 ? 'md:border-l md:border-gray-200 pl-0 md:pl-4 lg:pl-8' : ''
          }`}
        >
          <div className={`flex-shrink-0 flex items-center justify-center ${compact ? 'w-10 h-10' : 'w-12 h-12 md:w-14 md:h-14'}`}>
            <Image
              src={feature.imageUrl}
              alt={feature.title}
              width={56}
              height={56}
              className="object-contain max-w-full max-h-full w-auto h-auto"
            />
          </div>
          <h3 className={`font-bold tracking-wide text-brand-primary-dark ${compact ? 'text-sm' : 'text-base md:text-lg'}`}>
            {feature.title}
          </h3>
        </div>
      ))}
    </div>
  );

  if (compact) return innerContent;
  return (
    <section className="py-12 bg-brand-cream">
      <Container>
        <div className="border-t border-b border-gray-200 py-2 md:py-12">
          {innerContent}
        </div>
      </Container>
    </section>
  );
};