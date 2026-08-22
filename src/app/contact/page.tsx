'use client';

import { Breadcrumb } from '@/components/content';
import { PageHero } from '@/components/content/PageHero';
import { Container } from '@/components/ui/Container';
import { contactData } from '@/data/contact';

// Will be either sent to backend or to an email service provider (yet to confirm)

export default function ContactPage() {
  const inputClass = "w-full h-12 bg-white border border-gray-200 rounded-md px-4 text-brand-primary-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 text-[13px] tracking-wide";
  const textareaClass = "w-full bg-white border border-gray-200 rounded-md p-4 text-brand-primary-dark placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-400 transition-all duration-200 text-[13px] tracking-wide min-h-[150px] resize-y";

  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: contactData.breadcrumb }]} />
      
      <PageHero 
        title={contactData.hero.title}
        overline={contactData.hero.overline}
        backgroundImage={contactData.hero.backgroundImage}
        maxWidthClass="max-w-6xl"
      />
      
      <Container maxWidthClass="max-w-[1500px]" className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          
          {/* Intro Text */}
          <div className="text-center mb-12">
            <p className="text-[14px] md:text-[15px] font-sans text-brand-primary-dark leading-relaxed">
              {contactData.intro}
            </p>
          </div>

          {/* Contact Form */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                type="text" 
                placeholder="FULL NAME" 
                className={inputClass}
                required
              />
              <input 
                type="tel" 
                placeholder="PHONE NUMBER" 
                className={inputClass}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className={inputClass}
                required
              />
              <input 
                type="text" 
                placeholder="ORDER NUMBER" 
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                type="text" 
                placeholder="COMPANY NAME" 
                className={inputClass}
              />
              <input 
                type="text" 
                placeholder="RMA NUMBER" 
                className={inputClass}
              />
            </div>

            <textarea 
              placeholder="COMMENTS / QUESTIONS" 
              className={textareaClass}
              required
            ></textarea>

            <button 
              type="submit"
              className="w-full h-12 bg-brand-primary text-white text-[14px] font-bold tracking-wide rounded-md hover:bg-brand-primary-dark hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 uppercase"
            >
              Submit
            </button>
          </form>

        </div>
      </Container>
    </main>
  );
}
