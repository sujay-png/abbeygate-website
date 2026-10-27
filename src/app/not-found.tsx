import Image from 'next/image';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="relative min-h-[calc(100vh-160px)] flex flex-col justify-center items-center bg-brand-cream py-10 sm:py-14 md:py-16">
      <Container maxWidthClass="max-w-[920px]">
        <div className="relative w-full text-left">
          {/* Top Flying Arrow - balanced and centered above headline */}
          <div className="flex justify-center mb-5 sm:mb-6">
            <div className="w-[190px] sm:w-[230px] md:w-[260px] pointer-events-none select-none">
              <Image
                src="/images/404-page/arrow-1.png"
                alt="Crash landing trail"
                width={891}
                height={306}
                priority
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Heading with exact two-line split */}
          <h1 className="font-josefin font-bold text-2xl sm:text-3xl md:text-[36px] lg:text-[38px] text-brand-primary-dark tracking-tight leading-[1.25] mb-4">
            Help! It&apos;s a crash landing! Something has
            <br className="hidden sm:inline" /> gone wrong here.
          </h1>

          {/* Subtext */}
          <p className="font-work text-brand-body/75 text-[14px] sm:text-[15px] md:text-[16px] leading-relaxed max-w-[580px] mb-7">
            We&apos;re sorry, we can&apos;t find the page you&apos;re looking for. Try our search bar, browse the navigation or head back home...
          </p>

          {/* Lower Area: Button on left, Arrow-2 comfortably fitting on right */}
          <div className="relative min-h-[180px] sm:min-h-[210px] pb-6 sm:pb-10">
            <div>
              <Button
                href="/"
                variant="primary"
                className="uppercase text-[11px] sm:text-[12px] tracking-widest px-7 py-3 font-bold font-josefin"
              >
                Home Page
              </Button>
            </div>

            {/* Bottom-right Crash Landed Arrow - well proportioned, fully visible */}
            <div className="absolute right-4 sm:right-10 md:right-16 top-0 w-24 sm:w-28 md:w-32 lg:w-36 pointer-events-none select-none">
              <Image
                src="/images/404-page/arrow-2.webp"
                alt="Crash landed arrow"
                width={402}
                height={522}
                priority
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
