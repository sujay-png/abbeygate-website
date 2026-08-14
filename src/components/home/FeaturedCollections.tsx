"use client";

import Image from "next/image";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { ArrowIcon } from "../ui/ArrowIcon";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";

const testimonials = [
  {
    id: 1,
    quote:
      "Abbeygate provides fantastic custom diaries. The options are great, and the quality is top-notch. Their customer service is helpful, and the process is simple. Highly recommend!",
    author: "Robin Scherbatsky",
    collection: "Dorchester Collection",
    rating: 5,
  },
  {
    id: 2,
    quote:
      "Exceptional quality and fast delivery! The notebooks were high end and perfect for our corporate event. Simple ordering and fast delivery.",
    author: "Richmond Collection",
    collection: "Richmond Collection",
    rating: 5,
  },
  {
    id: 3,
    quote:
      "The customisation options allowed us to perfectly match our brand guidelines. The final product exceeded all of our expectations.",
    author: "Ted Mosby",
    collection: "Bespoke Collection",
    rating: 5,
  },
];

const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-1 text-[#E5A744] mb-4">
      {[...Array(rating)].map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
            clipRule="evenodd"
          />
        </svg>
      ))}
    </div>
  );
};

export const FeaturedCollections = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 5000, stopOnInteraction: true }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  return (
    <section className="py-16 bg-white">
      <Container>
        <div className="relative inline-block mb-20">
          <h2 className="font-josefin text-[26px] font-bold tracking-tight text-black lg:text-[32px]">
            Our Collections
          </h2>
          <ArrowIcon className="absolute -right-22 -top-1 hidden md:block" />
        </div>

        {/* Headings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-0 mb-8">
          {/* Left Heading */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-black mb-2 font-sans">
              Featured Collection
            </p>
            <h3 className="text-xl md:text-2xl font-bold font-sans text-black mb-4">
              Harrogate Collection
            </h3>
            <Button href="/collections/harrogate" variant="primary">
              Shop Collection
            </Button>
          </div>

          {/* Right Heading */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-black mb-2 font-sans">
              Featured Collection
            </p>
            <h3 className="text-xl md:text-2xl font-bold font-sans text-black mb-4">
              Dorchester Collection
            </h3>
            <Button href="/collections/dorchester" variant="primary">
              Shop Collection
            </Button>
          </div>
        </div>

        {/* Flush Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Image */}
          <div className="relative min-h-[350px] md:min-h-[450px] w-full">
            <Image
              src="/images/collections/collectionlanding.png"
              alt="Harrogate Collection"
              fill
              unoptimized={true}
              className="object-cover rounded-t-sm md:rounded-l-sm md:rounded-tr-none"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Right Feedback Box */}
          <div className="bg-[#DFEDED] p-8 lg:p-12 flex flex-col justify-center rounded-b-sm md:rounded-r-sm md:rounded-bl-none text-[#333333] relative">
            <p className="text-sm text-gray-600 mb-1 font-sans">Reviews</p>
            <h3 className="text-3xl font-bold font-josefin mb-2">Customer Feedback</h3>
            <p className="text-xs text-gray-500 mb-6 font-sans">4.8 Out of 5 Stars from Over 325 Reviews</p>
            
            <hr className="border-t border-gray-300/50 mb-6" />

            <div className="overflow-hidden relative group" ref={emblaRef}>
              <div className="flex">
                {testimonials.map((t) => (
                  <div key={t.id} className="flex-[0_0_100%] min-w-0 pr-4">
                    <StarRating rating={t.rating} />
                    <p className="text-[15px] leading-relaxed mb-6 font-josefin font-medium">
                      {t.quote}
                    </p>
                    <p className="text-sm font-sans font-semibold">
                      {t.collection} <span className="font-normal text-gray-600">by {t.author}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === selectedIndex ? "bg-black" : "bg-gray-400/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};