'use client';

import { Breadcrumb } from '@/components/content';
import { PageHero } from '@/components/content/PageHero';
import { Container } from '@/components/ui/Container';
import { EnquiryForm } from '@/features/enquiry/components/EnquiryForm';
import { Phone, Mail, Clock } from 'lucide-react';

export default function QuotePage() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Bespoke Order Enquiry Form' }]} />
      
      <PageHero 
        title="Bespoke Order Enquiry Form"
        overline="GET A QUOTE"
        backgroundImage="/images/banners/bespoke-page-banner.webp" 
        maxWidthClass="max-w-6xl"
      />
      
      <Container maxWidthClass="max-w-[1500px]" className="py-12 md:py-16">
        <div className="max-w-[800px] mx-auto">
          
          {/* Main Form Section */}
          <div className="mb-12 text-center">
            <p className="text-[#1F2124] text-[15px] font-work leading-7 mb-4">
              For your made to order enquiry of diaries, notebooks or gifts please complete the below form or contact our team.
            </p>
            <p className="text-[#1F2124] text-[15px] font-work leading-7">
              NB: If you already have a Trade Account, you can add items to your basket and select &apos;Request a Quote&apos; at the Payment section of the Checkout.
            </p>
          </div>
          
          <EnquiryForm />
        </div>
      </Container>
    </main>
  );
}
