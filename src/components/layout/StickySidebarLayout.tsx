'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Container } from '@/components/ui/Container';

interface SectionCard {
  title: string;
  description: string;
}

interface Section {
  id: string;
  title: string;
  content?: string;
  images?: string[];
  cards?: SectionCard[];
  subcontent?: string;
}

interface StickySidebarLayoutProps {
  sections: Section[];
}

export function StickySidebarLayout({ sections }: StickySidebarLayoutProps) {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sections]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      // Adjusted scroll position for fixed headers if any
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 md:py-24 bg-brand-cream">
      <Container maxWidthClass="max-w-[1400px]">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 relative">
          
          {/* Left Sticky Sidebar */}
          <div className="w-full lg:w-1/3 lg:max-w-[320px]">
            <div className="lg:sticky lg:top-32">
              <nav className="flex flex-col gap-4">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`text-left text-[15px] font-work transition-colors ${
                      activeSection === section.id 
                        ? 'text-brand-primary-dark font-bold' 
                        : 'text-brand-body/60 hover:text-brand-primary-dark'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Right Scrollable Content */}
          <div className="w-full lg:w-2/3 flex flex-col gap-20">
            {sections.map((section, idx) => (
              <div key={section.id} id={section.id} className="scroll-mt-32">
                <h3 className="text-2xl md:text-[30px] font-bold text-brand-primary-dark font-sans tracking-tight mb-8">
                  {section.title}
                </h3>
                
                {section.content && (
                  <div 
                    className="mb-8"
                    dangerouslySetInnerHTML={{ __html: section.content }} 
                  />
                )}

                {section.images && section.images.length > 0 && (
                  <div className={`grid grid-cols-1 md:grid-cols-${section.images.length === 1 ? '1' : '2'} gap-4 mb-8`}>
                    {section.images.map((imgSrc, idxImg) => (
                      <div key={idxImg} className={`relative w-full ${section.images!.length === 1 ? 'aspect-[21/9]' : 'aspect-square md:aspect-[4/3]'} rounded-sm overflow-hidden`}>
                        <Image 
                          src={imgSrc} 
                          alt={`${section.title} image ${idxImg + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {section.cards && section.cards.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                    {section.cards.map((card, cardIdx) => (
                      <div key={cardIdx} className="bg-brand-tint p-6 rounded-sm">
                        <h4 className="font-bold text-brand-body text-[15px] mb-3 font-work">
                          {card.title}
                        </h4>
                        <p className="text-brand-body text-[14px] font-work leading-snug">
                          {card.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {section.subcontent && (
                  <div 
                    dangerouslySetInnerHTML={{ __html: section.subcontent }} 
                  />
                )}

                {idx < sections.length - 1 && (
                  <hr className="border-gray-200 mt-16" />
                )}
              </div>
            ))}
          </div>
          
        </div>
      </Container>
    </section>
  );
}
