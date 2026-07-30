import Image from "next/image";
import { Container } from "../shared/Container";
import { Button } from "../shared/Button";

export const CustomisationCTA = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <Container>
        <div className="bg-brand-light relative flex flex-col md:flex-row items-center justify-between rounded-sm">
          {/* Left Text Content */}
          <div className="p-10 md:p-16 lg:p-20 flex-1 max-w-2xl z-10">
            <h2 className="text-3xl md:text-[40px] font-extrabold text-black font-sans tracking-tight mb-6">
              Tailored to Perfection
            </h2>
            <p className="text-gray-700 text-[15px] font-work leading-relaxed mb-10">
              Experience the luxury of bespoke craftsmanship. Our team of experts will guide you through every step of the custom design process, ensuring your diaries and notebooks exceed expectations.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" className="uppercase text-[13px] tracking-wider px-8 font-bold">
                Customize Yours Today
              </Button>
              <Button variant="outline" className="uppercase text-[13px] tracking-wider px-8 font-bold">
                Request A Sample
              </Button>
            </div>
          </div>

          {/* Right Image Container - overlapping top and bottom */}
          <div className="relative w-full md:w-1/2 h-[350px] md:h-auto self-stretch">
            <div className="absolute inset-0 md:-top-16 md:-bottom-16 md:right-0">
              <Image 
                src="https://corporate.abbeygate-england.com/wp-content/uploads/2025/11/banner-4.webp"
                alt="Customised Leather Goods"
                fill
                className="object-contain object-center md:object-right"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

