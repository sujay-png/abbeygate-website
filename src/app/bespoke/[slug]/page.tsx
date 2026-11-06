import { redirect } from 'next/navigation';

const LEGACY_SECTION_MAP: Record<string, string> = {
  'blocking-foiling': '/bespoke/personalisation#blocking-foiling',
  'uv-printing': '/bespoke/personalisation#uv-printing',
  'graphic-print': '/bespoke/personalisation#graphic-print',
  'special-matter-pages': '/bespoke/personalisation#special-matter-pages',
  'ribbon': '/bespoke/additional-finishing#ribbon',
  'pen-loops': '/bespoke/additional-finishing#pen-loops',
  'decorative-corner-protectors': '/bespoke/additional-finishing#decorative-corner-protectors',
  'gilded-page-edges': '/bespoke/additional-finishing#gilded-page-edges',
};

interface BespokeLegacyPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BespokeLegacySlugPage({ params }: BespokeLegacyPageProps) {
  const { slug } = await params;

  if (slug && LEGACY_SECTION_MAP[slug]) {
    redirect(LEGACY_SECTION_MAP[slug]);
  }

  redirect('/bespoke/personalisation');
}

