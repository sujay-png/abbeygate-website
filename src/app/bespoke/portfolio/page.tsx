import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { CustomisationCTA } from '@/components/shared/CustomisationCTA';
import { getSEOMetadata } from '@/lib/seo';
import { portfolioData, PortfolioShowcase } from '@/features/bespoke';

export const metadata: Metadata = getSEOMetadata('/bespoke/portfolio');

export default function PortfolioPage() {
  const { title, intro } = portfolioData;

  return (
    <main className="bg-brand-cream min-h-screen">
      <Breadcrumb
        paths={[
          { label: 'Home', href: '/' },
          { label: 'Bespoke', href: '/bespoke/personalisation' },
          { label: 'Portfolio' },
        ]}
      />

      {/* Hero Header */}
      <section className="pt-10 pb-6 md:pt-16 md:pb-8 text-center">
        <Container maxWidthClass="max-w-[1024px]">
          <h1 className="text-3xl md:text-5xl lg:text-[54px] font-bold font-josefin tracking-tight text-brand-primary-dark mb-6 leading-tight">
            {title}
          </h1>
          <p className="text-[15px] md:text-base text-brand-body/90 font-work leading-relaxed max-w-3xl mx-auto">
            {intro}
          </p>
        </Container>
      </section>

      {/* Portfolio Showcase Section */}
      <Container maxWidthClass="max-w-[1296px]">
        <PortfolioShowcase />
      </Container>

      {/* Shared Site CTA */}
      <CustomisationCTA />
    </main>
  );
}

