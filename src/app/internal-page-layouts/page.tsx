import { Breadcrumb, PageHero } from '@/components/content';
import { CustomisationCTA } from '@/components/shared/CustomisationCTA';
import { PageLayoutViewer } from '@/components/resources/PageLayoutViewer';
import { internalPageLayoutsData } from '@/data/internal-page-layouts';

export default function InternalPageLayoutsPage() {
  return (
    <main className="flex flex-col min-h-screen bg-brand-cream">
      <Breadcrumb paths={[{ label: 'Home', href: '/' }, { label: 'Internal Page Layouts' }]} />
      
      <PageHero 
        title={internalPageLayoutsData.hero.title} 
        overline={internalPageLayoutsData.hero.overline}
        backgroundImage={internalPageLayoutsData.hero.backgroundImage} 
      />
      
      <PageLayoutViewer 
        diaries={internalPageLayoutsData.diaries}
        notebooks={internalPageLayoutsData.notebooks}
      />
      
      <CustomisationCTA />
    </main>
  );
}
