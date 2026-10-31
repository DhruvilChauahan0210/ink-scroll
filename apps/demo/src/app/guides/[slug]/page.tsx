import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { seoTitle } from '../../_lib/seo';
import { GuidePage } from '@/components/GuidePage';
import { SiteShell } from '@/components/site/SiteShell';
import { GUIDES, GUIDE_SLUGS } from '@/data/guides';

const SITE_URL = 'https://svg-scroll-draw.vercel.app';

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) return {};
  const url = `${SITE_URL}/guides/${slug}`;
  return {
    title: seoTitle(g.title),
    description: g.description,
    keywords: g.keywords,
    alternates: { canonical: `/guides/${slug}` },
    openGraph: { type: 'article', title: g.title, description: g.description, url },
    twitter: { card: 'summary_large_image', title: g.title, description: g.description },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!GUIDE_SLUGS.includes(slug)) notFound();
  return (
    <SiteShell active="/guides" kicker="guides / your turn">
      <GuidePage slug={slug} />
    </SiteShell>
  );
}
