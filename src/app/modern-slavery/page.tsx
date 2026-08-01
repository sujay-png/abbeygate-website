import { Breadcrumb, PageHero } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { modernSlaveryData } from '@/data/modern-slavery';
import Image from 'next/image';

export default function ModernSlaveryPage() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Modern Slavery Statement' }]} />
      
      <PageHero 
        title={modernSlaveryData.hero.title} 
        overline={modernSlaveryData.hero.overline}
        subtitle={modernSlaveryData.hero.subtitle}
        backgroundImage={modernSlaveryData.hero.backgroundImage} 
      />
      
      <Container maxWidthClass="max-w-[1500px]" className="py-16 md:py-24">
        {/* Page Title */}
        <h2 className="text-3xl md:text-[40px] font-bold text-black font-sans tracking-tight mb-12">
          Modern Slavery Statement
        </h2>

        {/* Content Part 1 */}
        <div 
          className="font-sans text-[14px] md:text-[15px] text-black leading-relaxed [&>p]:mb-6 [&>ul]:mb-6 [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mb-1 mb-12"
          dangerouslySetInnerHTML={{ __html: modernSlaveryData.contentPart1 }}
        />

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12">
          {modernSlaveryData.images.map((imgSrc, idx) => (
            <div key={idx} className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-sm">
              <Image 
                src={imgSrc}
                alt="Factory image"
                fill
                unoptimized={imgSrc.includes('unsplash.com')}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>

        {/* Content Part 2 */}
        <div 
          className="font-sans text-[14px] md:text-[15px] text-black leading-relaxed [&>p]:mb-6 [&>ul]:mb-6 [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mb-1"
          dangerouslySetInnerHTML={{ __html: modernSlaveryData.contentPart2 }}
        />
      </Container>
    </main>
  );
}
