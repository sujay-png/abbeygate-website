import Image from 'next/image';
import { Container } from '../ui/Container';

interface PageHeroProps {
  title: string;
  overline?: string;
  subtitle?: string;
  backgroundImage?: string;
}

export function PageHero({ title, overline, subtitle, backgroundImage }: PageHeroProps) {
  return (
    <section className="w-full py-6 md:py-10">
      <Container maxWidthClass="max-w-[1500px]">
        <div className="relative w-full h-[400px] md:h-[400px] flex items-center justify-center overflow-hidden bg-neutral-100 rounded-xl md:rounded-2xl">
          {backgroundImage && (
            <Image 
              src={backgroundImage}
              alt={title}
              fill
              priority
              unoptimized={backgroundImage?.includes('unsplash.com')}
              className="object-cover"
              sizes="(max-width: 1400px) 100vw, 1400px"
            />
          )}
          
          {/* Overlay to ensure text readability */}
          {backgroundImage && (
            <div className="absolute inset-0 bg-black/60" />
          )}

          <div className="relative z-10 text-center px-6 max-w-6xl mx-auto flex flex-col items-center">
            {overline && (
              <span className="text-white/90 tracking-[0.2em] text-xs md:text-sm font-sans font-bold uppercase mb-3 block drop-shadow-md">
                {overline}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4 drop-shadow-lg">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm md:text-base font-bold text-white max-w-5xl mx-auto drop-shadow-md leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
