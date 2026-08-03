import Image from 'next/image';
import { Container } from '../ui/Container';

interface FeatureCardItem {
  title: string;
  content: string;
  image: string;
}

interface FeatureCardsProps {
  title: string;
  items: FeatureCardItem[];
  className?: string;
}

export function FeatureCards({ title, items, className = '' }: FeatureCardsProps) {
  return (
    <section className={`py-12 md:py-20 ${className}`}>
      <Container maxWidthClass="max-w-[1400px]">
        <h2 className="text-2xl md:text-3xl font-bold text-black font-sans tracking-tight mb-8">
          {title}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col">
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden mb-5 shadow-sm">
                <Image 
                  src={item.image}
                  alt={item.title}
                  fill
                  quality = {95}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <h3 className="font-bold text-lg font-sans text-black mb-2 leading-snug">
                {item.title}
              </h3>
              <p className="text-[13px] text-[#1F2124]/80 font-work leading-relaxed">
                {item.content}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
