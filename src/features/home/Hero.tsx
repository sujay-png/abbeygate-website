'use client';
 
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
 
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
    cta1: (
      <>
        Shop<br />Express
      </>
    ),
    cta2: (
      <>
        Bespoke<br />Orders
      </>
    ),
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
    cta1: (
      <>
        Shop<br />All
      </>
    ),
    cta2: (
      <>
        Request a<br />Sample
      </>
    ),
  },
];
 
// Hoisted to module scope so these aren't recreated (and re-diffed by Embla)
// on every render. Autoplay(...) in particular is a new object identity each
// time if left inline, which can trigger unnecessary plugin reinitialization.
const EMBLA_OPTIONS = { loop: true, duration: 70 };
const EMBLA_PLUGINS = [Autoplay({ delay: 6000, stopOnInteraction: false })];
 
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
 
    // Cleanup avoids stacking duplicate listeners if emblaApi's identity
    // ever changes (e.g. hot reload, plugin option changes).
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);
 
  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#F5F5F3]">
      <div className="overflow-hidden w-full h-full" ref={emblaRef}>
        <div className="flex w-full h-full" style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}>
          {SLIDES.map((slide) => (
            <div
              key={slide.id}
              className="relative flex-[0_0_100%] min-w-0 h-full"
              style={{ transform: 'translateZ(0)' }}
            >
              {/* Both slides marked priority: with only 2 slides and a 6s
                  autoplay interval, lazy-loading slide 2 saves negligible
                  bandwidth but risks a visible flash if it isn't decoded
                  in time for the first auto-advance. */}
              <Image
                src={slide.bgImage}
                alt=""
                fill
                priority
                sizes="100vw"
                quality={70}
                className="object-cover object-center"
              />
 
              {/* Left Overlay Content Column */}
              <div className="absolute top-0 left-0 h-full w-full md:w-[40%] lg:w-[35%] xl:w-[30%] bg-white/85 flex flex-col justify-center px-8 md:px-12 z-10 border-r border-white/20">
                {/* Category eyebrow — not a heading */}
                <p className="text-[21px] font-didact font-normal text-black mb-6">
                  {slide.category}
                </p>
 
                {/* The one real heading per slide */}
                <h2 className="font-josefin text-[40px] font-bold text-black leading-[1.2] mb-6">
                  {slide.title}
                </h2>
 
                {/* Body copy — not a heading */}
                <p className="font-work text-[20px] text-black leading-relaxed mb-10 max-w-md font-normal">
                  {slide.description}
                </p>
 
                <div className="flex gap-4">
                  <button className="cursor-pointer bg-black text-white min-w-36 py-[10px] px-4 text-[16px] font-medium flex flex-col items-center justify-center leading-tight">
                    {slide.cta1}
                  </button>
                  <button className="cursor-pointer bg-transparent border border-[#333333] text-[#333333] min-w-36 py-[10px] px-4 text-[16px] font-medium flex flex-col items-center justify-center leading-tight">
                    {slide.cta2}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
 
      {/* Custom Navigation & Pagination overlaid on the right side */}
      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12 z-20 flex items-center gap-6">
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
        <div className="flex items-center gap-4">
          <button onClick={scrollPrev} className="text-black hover:text-gray-600 transition-colors" aria-label="Previous slide">
            <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
          </button>
          <button onClick={scrollNext} className="text-black hover:text-gray-600 transition-colors" aria-label="Next slide">
            <ChevronRight className="w-8 h-8" strokeWidth={1.5} />
          </button>
        </div>
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