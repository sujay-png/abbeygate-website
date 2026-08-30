'use client';

import { Breadcrumb } from '@/components/content';
import { PageHero } from '@/components/content/PageHero';
import { FAQ } from '@/components/home/FAQ';

export default function FAQsPage() {
  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'FAQs' }]} />
      
      <PageHero 
        title="Frequently Asked Questions"
        backgroundImage="/images/banners/faqbanner.webp"
        maxWidthClass="max-w-6xl"
      />
      
      <div className="pb-16 md:pb-24">
        {/* We use hideTitle=true because PageHero already has the title */}
        <FAQ hideTitle={true} className="bg-white !pt-2 md:!pt-6 !pb-0" />
      </div>
    </main>
  );
}
