import { portfolioData } from '../data/bespoke-data';

export function PortfolioShowcase() {
  const { kicker, heading, description } = portfolioData;

  return (
    <section id="portfolio-grid" className="py-14 md:py-20 border-t border-b border-brand-grey/25">
      <div className="w-full max-w-[640px] mx-auto text-center px-4">
        <p className="text-xs font-bold tracking-[0.15em] text-brand-grey uppercase mb-3">
          {kicker}
        </p>
        
        <h2 className="text-2xl md:text-[34px] lg:text-[37px] font-bold font-josefin tracking-tight text-brand-primary-dark mb-4 leading-snug">
          {heading}
        </h2>
        
        <p className="text-[15px] md:text-base text-brand-body/90 font-work leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
}

