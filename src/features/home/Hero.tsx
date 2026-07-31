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
    category: 'Notebooks',
    title: (
      <>
        Your Brand, Our<br />
        Craftsmanship
      </>
    ),
    description:
      'Elevate your corporate gifting and bespoke and merchandise with our expertly customised leather goods',
    bgImage:
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=2000&auto=format&fit=crop',
    cta1: <>Shop Express</>,
    cta2: <>Bespoke Orders</>,
  },
  {
    id: 2,
    category: 'Diaries',
    title: (
      <>
        Plan Your Year<br />
        In Style
      </>
    ),
    description:
      'Explore our beautifully crafted diaries tailored to keep you organized while making a statement.',
    bgImage:
      'https://images.unsplash.com/photo-1506784365847-bbad939e9335?q=80&w=2000&auto=format&fit=crop',
    cta1: <>Shop All</>,
    cta2: <>Request a Sample</>,
  },
];

const EMBLA_OPTIONS = { loop: true, duration: 35 };
const EMBLA_PLUGINS = [Autoplay({ delay: 6000, stopOnInteraction: false })];


interface NavControlsProps {
  scrollSnaps: number[];
  selectedIndex: number;
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
}

const NavControls = ({ scrollSnaps, selectedIndex, scrollTo, scrollPrev, scrollNext }: NavControlsProps) => (
  <>
    <div className="flex items-center gap-2">
      {scrollSnaps.map((_, index) => (
        <button
          key={index}
          onClick={() => scrollTo(index)}
          className={`hero-bullet ${index === selectedIndex ? 'hero-bullet-active' : ''}`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
    <div className="flex items-center gap-3">
      <button onClick={scrollPrev} className="text-black hover:text-gray-600 transition-colors" aria-label="Previous slide">
        <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={1.5} />
      </button>
      <button onClick={scrollNext} className="text-black hover:text-gray-600 transition-colors" aria-label="Next slide">
        <ChevronRight className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={1.5} />
      </button>
    </div>
  </>
);

export const Hero = () => {
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
    <section className="relative w-full h-screen overflow-hidden bg-[#F5F5F3]">
      {/* willChange lives on the track only — Embla animates this element's
          transform, so this is the only place a GPU layer hint is useful. */}
      <div className="overflow-hidden w-full h-full" ref={emblaRef}>
        <div className="flex w-full h-full" style={{ willChange: 'transform' }}>
          {SLIDES.map((slide, index) => (
            <div key={slide.id} className="relative flex-[0_0_100%] min-w-0 h-full">
              <Image
                src={slide.bgImage}
                alt=""
                fill
                priority={index === 0}
                loading={index === 0 ? undefined : 'lazy'}
                sizes="100vw"
                quality={65}
                className="object-cover object-center"
              />

              {/* Left Overlay Content Column */}
              <div className="absolute top-0 left-0 h-full w-full md:w-[40%] lg:w-[35%] xl:w-[30%] bg-white/85 flex flex-col justify-center px-8 md:px-12 z-10 border-r border-white/20">
                <p className="text-[21px] font-didact font-normal text-black mb-6">
                  {slide.category}
                </p>

                <h2 className="font-josefin text-[40px] font-bold text-black leading-[1.2] mb-6">
                  {slide.title}
                </h2>

                <p className="font-work text-[20px] text-black leading-relaxed mb-10 max-w-md font-normal">
                  {slide.description}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Button variant="primary" className="w-full sm:w-auto sm:min-w-36 text-[16px]">
                    {slide.cta1}
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto sm:min-w-36 text-[16px]">
                    {slide.cta2}
                  </Button>
                </div>

                {/* Mobile-only inline nav */}
                <div className="flex md:hidden items-center justify-between mt-6 w-full">
                  <NavControls
                    scrollSnaps={scrollSnaps}
                    selectedIndex={selectedIndex}
                    scrollTo={scrollTo}
                    scrollPrev={scrollPrev}
                    scrollNext={scrollNext}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop-only nav */}
      <div className="hidden md:flex absolute bottom-12 right-12 z-20 items-center gap-6">
        <NavControls
          scrollSnaps={scrollSnaps}
          selectedIndex={selectedIndex}
          scrollTo={scrollTo}
          scrollPrev={scrollPrev}
          scrollNext={scrollNext}
        />
      </div>

      <style jsx global>{`
        .hero-bullet {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-block;
          padding: 0;
          border: none;
        }
        .hero-bullet-active {
          background-color: #000;
          transform: scale(1.2);
        }
      `}</style>
    </section>
  );
};