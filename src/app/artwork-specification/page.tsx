import { Breadcrumb, PageHero, ImageTextSection, FeatureCards } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { CustomisationCTA } from '@/components/shared/CustomisationCTA';
import { artworkData } from '@/data/artwork-specification';

export default function ArtworkSpecificationPage() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Artwork Specification' }]} />
      
      <PageHero 
        title={artworkData.hero.title} 
        overline={artworkData.hero.overline}
        backgroundImage={artworkData.hero.backgroundImage} 
      />
      
      <ImageTextSection 
        title={artworkData.acceptedFormats.title}
        content={artworkData.acceptedFormats.content}
        image={artworkData.acceptedFormats.image}
        imageAlignment={artworkData.acceptedFormats.imageAlignment}
      />
      <Container maxWidthClass="max-w-[1400px]"><div className="border-b border-gray-200" /></Container>
      
      
      <FeatureCards 
        title={artworkData.colourSpecifications.title}
        items={artworkData.colourSpecifications.items}
      />
      
      <ImageTextSection 
        title={artworkData.pageSizes.title}
        content={artworkData.pageSizes.content}
        image={artworkData.pageSizes.image}
        imageAlignment={artworkData.pageSizes.imageAlignment}
      />
      
      <section className="py-12">
        <Container maxWidthClass="max-w-[1400px]">
          <div 
            className="bg-[#ECF5F5] rounded-xl p-8 md:p-12 text-[#1F2124]/90 text-[15px] font-work leading-relaxed"
            dangerouslySetInnerHTML={{ __html: artworkData.guidelinesBox }}
          />
        </Container>
      </section>

      <ImageTextSection 
        title={artworkData.approval.title}
        content={artworkData.approval.content}
        image={artworkData.approval.image}
        imageAlignment={artworkData.approval.imageAlignment}
      />

      <CustomisationCTA />
    </main>
  );
}
