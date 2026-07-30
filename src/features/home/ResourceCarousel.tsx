'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../shared/Button';

const SLIDES = [
  {
    id: 1,
    title: 'Artwork Setup',
    description: 'Artwork submission guidelines to ease your diary and notebook specifications. Learn more about our accepted formats, Pantone colours, paper types, trim mark, bleeds and lead times',
    buttonText: 'Learn More',
    bgImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'About Us',
    description: 'Abbeygate develops high-quality stationery that celebrates the joy of note taking and handwriting. As publishers, printers and manufacturers of diaries, notebooks, journals and leather goods we pride ourselves on our time-tested craftsmanship helping our customers tell their stories and plan for the future.',
    buttonText: 'LEARN MORE',
    bgImage: 'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?q=80&w=2000&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Resource Guide',
    description: 'This guide covers key aspects of book production, from terminology and binding types to layout design and printing processes. Understanding these elements is essential for creating high-quality books. For those looking to explore more, we\'ve provided further resources to deepen your knowledge of book production.',
    buttonText: 'Learn More',
    bgImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=2000&auto=format&fit=crop',
  },
];


const EMBLA_OPTIONS = { loop: true, duration: 50 };
const EMBLA_PLUGINS = [Autoplay({ delay: 6000, stopOnInteraction: false })];

export const ResourceCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel(EMBLA_OPTIONS, EMBLA_PLUGINS);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

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
      <div className="overflow-hidden w-full h-full" ref={emblaRef}>
        <div className="flex w-full h-full" style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}>
          {SLIDES.map((slide, index) => (
            <div
              key={slide.id}
              className="relative flex-[0_0_100%] min-w-0 h-full"
              style={{ transform: 'translateZ(0)' }}
            >
              <Image
                src={slide.bgImage}
                alt={slide.title}
                fill
                sizes="100vw"
                quality={80}
                priority={index === 0}
                className="object-cover object-center"
              />

              {/* Dark Gradient Overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />

              {/* Text Content */}
              <div className="absolute top-0 left-0 h-full w-full md:w-[80%] lg:w-[68%] xl:w-[58%] flex flex-col justify-center pt-16 md:pt-24 px-8 md:px-12 lg:px-24 z-20">
                <h2 className="font-josefin text-4xl md:text-5xl font-bold text-white mb-6">
                  {slide.title}
                </h2>
                <p className="font-work text-base md:text-lg text-white leading-relaxed mb-10 max-w-4xl pr-4">
                  {slide.description}
                </p>
                <div>
                  <Button variant="white" className="uppercase tracking-wide min-w-36">
                    {slide.buttonText}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation & Pagination */}
      <div className="absolute bottom-4 right-8 md:bottom-8 md:right-12 z-30 flex items-center gap-12">
        <div className="flex items-center gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`resource-bullet ${index === selectedIndex ? 'resource-bullet-active' : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={scrollPrev} className="text-black hover:text-gray-600 transition-colors" aria-label="Previous slide">
            <ChevronLeft className="w-8 h-8" strokeWidth={2} />
          </button>
          <button onClick={scrollNext} className="text-black hover:text-gray-600 transition-colors" aria-label="Next slide">
            <ChevronRight className="w-8 h-8" strokeWidth={2} />
          </button>
        </div>
      </div>

      <style jsx global>{`
        .resource-bullet {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.4);
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-block;
          padding: 0;
          border: none;
        }
        .resource-bullet-active {
          background-color: #000;
          transform: scale(1.2);
        }
      `}</style>
    </section>
  );
};