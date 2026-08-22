import { Breadcrumb } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { termsData } from '@/data/terms';

export default function TermsPage() {
  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Terms & Conditions' }]} />
      
      <Container maxWidthClass="max-w-[1500px]" className="py-12 md:py-16">
        <div className="max-w-4xl">
          
          {/* Header Area */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-brand-primary-dark font-sans tracking-tight mb-4">
              {termsData.title}
            </h1>
            <p className="text-[14px] md:text-[15px] text-brand-body mb-8">
              {termsData.lastUpdated}
            </p>
            
            {/* Intro */}
            <div 
              className="text-[14px] md:text-[15px] font-sans text-brand-primary-dark leading-relaxed [&>p]:mb-4"
              dangerouslySetInnerHTML={{ __html: termsData.intro }}
            />
          </div>

          {/* Sections */}
          <div className="space-y-12">
            {termsData.sections.map((section, index) => (
              <div key={index} className="text-[14px] md:text-[15px] font-sans text-brand-primary-dark leading-relaxed">
                <h2 className="text-xl md:text-2xl font-bold text-brand-primary-dark tracking-tight mb-6">
                  {section.title}
                </h2>
                <div 
                  className="[&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ul>li]:mb-1 [&>ul>li]:pl-1"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </div>
            ))}
          </div>

        </div>
      </Container>
    </main>
  );
}
