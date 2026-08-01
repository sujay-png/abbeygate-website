import { Breadcrumb, PageHero, ImageTextSection, TextWithImageGrid, FeatureCallout } from '@/components/content';
import { Container } from '@/components/ui/Container';
import { CustomisationCTA } from '@/components/shared/CustomisationCTA';
import { aboutData } from '@/data/about';

export default function AboutPage() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'About Abbeygate' }]} />
      
      <PageHero 
        title={aboutData.hero.title} 
        overline={aboutData.hero.overline}
        subtitle={aboutData.hero.subtitle}
        backgroundImage={aboutData.hero.backgroundImage} 
      />
      
      <TextWithImageGrid 
        title={aboutData.madeInEngland.title}
        content={aboutData.madeInEngland.content}
        images={aboutData.madeInEngland.images}
      />

      <Container maxWidthClass="max-w-[1400px]"><div className="border-b border-gray-200" /></Container>
      
      <ImageTextSection 
        title={aboutData.leatherGoods.title}
        content={aboutData.leatherGoods.content}
        image={aboutData.leatherGoods.image}
        imageAlignment={aboutData.leatherGoods.imageAlignment}
      />
      
      <FeatureCallout 
        title={aboutData.coreValues.title}
        content={aboutData.coreValues.content}
      />
      
      <ImageTextSection 
        title={aboutData.newEra.title}
        content={aboutData.newEra.content}
        image={aboutData.newEra.image}
        imageAlignment={aboutData.newEra.imageAlignment}
      />

      <Container maxWidthClass="max-w-[1400px]"><div className="border-b border-gray-200" /></Container>
      
      <TextWithImageGrid 
        title={aboutData.future.title}
        content={aboutData.future.content}
        images={aboutData.future.images}
      />
      
      <CustomisationCTA />
    </main>
  );
}
