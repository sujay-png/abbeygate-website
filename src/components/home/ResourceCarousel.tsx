'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

const SLIDES = [
  {
    id: 1,
    title: 'Artwork Setup',
    description: 'Artwork submission guidelines to ease your diary and notebook specifications. Learn more about our accepted formats, Pantone colours, paper types, trim mark, bleeds and lead times',
    buttonText: 'Learn More',
    bgImage: '/images/resources/rs-carousel-1.webp',
    href: '/artwork-specification',
  },
  {
    id: 2,
    title: 'About Us',
    description: 'Abbeygate develops high-quality stationery that celebrates the joy of note taking and handwriting. As publishers, printers and manufacturers of diaries, notebooks, journals and leather goods we pride ourselves on our time-tested craftsmanship helping our customers tell their stories and plan for the future.',
    buttonText: 'LEARN MORE',
    bgImage: '/images/resources/rs-carousel-2.webp',
    href: '/about',
  },
  {
    id: 3,
    title: 'Resource Guide',
    description: "This guide covers key aspects of book production, from terminology and binding types to layout design and printing processes. Understanding these elements is essential for creating high-quality books. For those looking to explore more, we've provided further resources to deepen your knowledge of book production.",
    buttonText: 'Learn More',
    bgImage: '/images/resources/rs-carousel-3.webp',
    href: '/resource-guide',
  },
];

// A duration of 60 matches the smooth transition style used in the Hero carousel.
const EMBLA_OPTIONS = { loop: true, watchDrag: true, duration: 60 };

// A static style object is fine here (module scope, never recreated).
// Only the track needs the GPU-layer hint — hinting every single slide
// forces 3 separate composited layers for no benefit.
const TRACK_STYLE: React.CSSProperties = {
  willChange: 'transform',
  backfaceVisibility: 'hidden',
};

export const ResourceCarousel = () => {
  // IMPORTANT: plugins must be instantiated inside the component (once per
  // mount), not at module scope. Autoplay is stateful — sharing a single
  // instance across mounts (multiple carousels on a page, Strict Mode
  // double-invoke in dev, Fast Refresh) causes exactly the kind of janky,
  // stuttering behavior you were seeing.
  const [plugins] = useState(() => [
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: false })
  ]);
  const [emblaRef, emblaApi] = useEmblaCarousel(EMBLA_OPTIONS, plugins);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-gray-100">
      <div className="overflow-hidden w-full h-full touch-pan-y" ref={emblaRef}>
        <div className="flex w-full h-full" style={TRACK_STYLE}>
          {SLIDES.map((slide, index) => (
            <div key={slide.id} className="relative flex-[0_0_100%] min-w-0 h-full">
              <Image
                src={slide.bgImage}
                alt={slide.title}
                fill
                sizes="100vw"
                quality={75}
                priority
                className="object-cover object-center"
              />

              {/* Dark Gradient Overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />

              {/* Text Content */}
              <div className="absolute top-0 left-0 h-full w-full md:w-[80%] lg:w-[68%] xl:w-[58%] flex flex-col justify-center pt-12 pb-24 md:pt-24 md:pb-0 px-8 md:px-12 lg:px-24 z-20">
                <h2 className="font-josefin text-4xl md:text-5xl font-bold text-white mb-6">
                  {slide.title}
                </h2>
                <p className="font-work text-base md:text-lg text-white leading-relaxed mb-10 max-w-4xl pr-4">
                  {slide.description}
                </p>
                <div>
                  <Button variant="white" className="uppercase tracking-wide min-w-36" href={slide.href}>
                    {slide.buttonText}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation & Pagination */}
      <div className="absolute bottom-6 left-0 right-0 md:left-auto md:right-12 md:bottom-12 z-30 flex flex-col items-center gap-4 md:flex-row md:gap-8 px-6 md:px-0">
        <div className="hidden md:flex items-center gap-3 order-1 md:order-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`inline-block h-2 w-2 rounded-full border-0 p-0 cursor-pointer transition-all duration-300 ${
                index === selectedIndex ? 'bg-brand-primary scale-125' : 'bg-brand-soft/80'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-6 order-2 md:order-1">
          <button onClick={scrollPrev} className="text-brand-primary-dark hover:text-gray-600 transition-colors" aria-label="Previous slide">
            <ChevronLeft className="w-8 h-8" strokeWidth={2} />
          </button>
          <button onClick={scrollNext} className="text-brand-primary-dark hover:text-gray-600 transition-colors" aria-label="Next slide">
            <ChevronRight className="w-8 h-8" strokeWidth={2} />
          </button>
        </div>
      </div>
    </section>
  );
};
