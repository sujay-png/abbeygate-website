import { Breadcrumb, PageHero } from '@/components/content';
import { CustomisationCTA } from '@/components/shared/CustomisationCTA';
import { StickySidebarLayout } from '@/components/layout/StickySidebarLayout';
import { resourceGuideData } from '@/data/resource-guide';

export default function ResourceGuidePage() {
  return (
    <main className="flex flex-col min-h-screen bg-white">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Resource Guide' }]} />
      
      <PageHero 
        title={resourceGuideData.hero.title} 
        overline={resourceGuideData.hero.overline}
        backgroundImage={resourceGuideData.hero.backgroundImage} 
      />
      
      <StickySidebarLayout sections={resourceGuideData.sections} />
      
      <CustomisationCTA />
    </main>
  );
}
