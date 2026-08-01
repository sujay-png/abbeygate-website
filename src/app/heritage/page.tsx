import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { CustomisationCTA } from '@/components/shared/CustomisationCTA';
import { LatestBlog } from '@/components/shared/LatestBlog';
import { heritageData } from '@/data/heritage';
import { Facebook, Twitter, Link2 } from 'lucide-react';

const SocialIcons = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center gap-4 text-black ${className}`}>
    <button aria-label="Share on Facebook" className="hover:text-gray-600 transition-colors">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none">
        <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7.5v4H10v12h4v-12z" />
      </svg>
    </button>
    <button aria-label="Share on X" className="hover:text-gray-600 transition-colors">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="none">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
      </svg>
    </button>
    <button aria-label="Copy Link" className="hover:text-gray-600 transition-colors">
      <Link2 size={18} strokeWidth={2.5} />
    </button>
  </div>
);

export default function HeritagePage() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: heritageData.breadcrumb }]} />
      
      <section className="py-12 md:py-20">
        <Container maxWidthClass="max-w-[1400px]">
          <div className="max-w-5xl mx-auto flex flex-col items-center">
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold text-black font-sans tracking-tight text-center mb-8 leading-tight">
              {heritageData.title}
            </h1>
            
            {/* Intro */}
            <p 
              className="text-[15px] text-[#1F2124]/90 font-work text-center mb-10 leading-relaxed max-w-5xl"
              dangerouslySetInnerHTML={{ __html: heritageData.intro }}
            />
            
            {/* Top Social Icons */}
            <SocialIcons className="justify-center mb-16" />
            
            {/* Main Content Area */}
            <div className="w-full text-left">
              <h3 className="font-bold text-[15px] font-sans text-black mb-6">
                {heritageData.copyright}
              </h3>
              
              <div className="flex flex-col gap-6">
                {heritageData.content.map((paragraph, idx) => (
                  <p key={idx} className="text-[15px] text-[#1F2124]/90 font-work leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              {/* Bottom Social Icons */}
              <SocialIcons className="justify-start mt-12" />
            </div>
            
          </div>
        </Container>
      </section>

      <Container maxWidthClass="max-w-[1400px]"><div className="border-b border-gray-200" /></Container>
      
      <LatestBlog />

      <CustomisationCTA />
    </main>
  );
}
