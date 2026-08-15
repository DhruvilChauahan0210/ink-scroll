import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ExampleDetail } from '@/components/ExampleDetail';
import { EXAMPLE_SEO, SEO_SLUGS } from '@/data/examples-seo';

const SITE_URL = 'https://svg-scroll-draw.vercel.app';

/**
 * Only slugs with reviewed SEO copy in examples-seo.ts get a page. Examples
 * without an entry stay on the /examples index — a thin auto-generated page is
 * worse than no page.
 */
export function generateStaticParams() {
  return SEO_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const seo = EXAMPLE_SEO[slug];
  if (!seo) return {};

  const url = `${SITE_URL}/examples/${slug}`;
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical: `/examples/${slug}` },
    openGraph: {
      type: 'article',
      title: seo.title,
      description: seo.description,
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const seo = EXAMPLE_SEO[slug];
  if (!seo) notFound();

  const url = `${SITE_URL}/examples/${slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle',
        headline: seo.heading,
        description: seo.description,
        url,
        datePublished: '2026-08-15',
        dateModified: '2026-08-15',
        author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
        publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: SITE_URL },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Examples', item: `${SITE_URL}/examples` },
          { '@type': 'ListItem', position: 3, name: seo.heading, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ExampleDetail slug={slug} />
    </>
  );
}
