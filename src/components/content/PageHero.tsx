import Image from 'next/image';
import { Container } from '../ui/Container';

interface PageHeroProps {
  title: string;
  overline?: string;
  subtitle?: string;
  backgroundImage?: string;
  maxWidthClass?: string;
  subtitleAlign?: 'center' | 'left';
}

export function PageHero({ title, overline, subtitle, backgroundImage, maxWidthClass = "max-w-[1500px]", subtitleAlign = 'center' }: PageHeroProps) {
  return (
    <section className="w-full py-6 md:py-10">
      <Container maxWidthClass={maxWidthClass}>
        <div className="relative w-full min-h-[350px] md:min-h-[450px] flex items-center justify-center overflow-hidden bg-neutral-100 rounded-xl md:rounded-2xl py-12 md:py-16">
          {backgroundImage && (
            <Image
              src={backgroundImage}
              alt={title}
              fill
              priority
              quality={75}
              className="object-cover"
              sizes="(max-width: 1400px) 100vw, 1400px"
            />
          )}

          {/* Overlay to ensure text readability */}
          {backgroundImage && (
            <div className="absolute inset-0 bg-black/60" />
          )}

          <div className="relative z-10 text-center px-4 md:px-8 max-w-6xl mx-auto flex flex-col items-center w-full">
            {overline && (
              <span className="text-white/90 tracking-[0.2em] text-[11px] md:text-sm font-sans font-bold uppercase mb-4 block drop-shadow-md">
                {overline}
              </span>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6 drop-shadow-lg">
              {title}
            </h1>
            {subtitle && (
              <p className={`text-[15px] md:text-[17px] font-regular text-white/95 max-w-4xl mx-auto drop-shadow-md leading-[1.8] md:leading-[2] px-2 md:px-6 ${subtitleAlign === 'left' ? 'text-left w-full' : 'text-center'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
