import type { Metadata } from 'next';
import { DocsPage } from '@/components/DocsPage';
import { SiteShell } from '@/components/site/SiteShell';
import { seoTitle } from '../_lib/seo';

export const metadata: Metadata = {
  title: seoTitle('SVG Scroll Animation Docs — API, Options and Examples'),
  description:
    'Animate SVG on scroll: install, quick start, every option, callbacks and instance methods, plus copy-paste React, Vue 3, Svelte, Solid and Angular code.',
  keywords: [
    'scroll draw',
    'svg scroll draw',
    'scroll draw api',
    'scroll draw react',
    'scroll draw animation library',
    'animate svg on scroll',
    'svg draw on scroll',
    'svg scroll animation api',
    'stroke-dashoffset scroll animation',
    'scroll-driven svg animation',
    'svg path animation react',
    'animate svg line on scroll react',
    'svg scroll vue svelte',
    'scroll animation javascript api',
  ],
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'SVG Scroll Animation Docs — API, Options and Examples',
    description:
      'Animate SVG on scroll: install, quick start, every option, callbacks and instance methods, plus copy-paste React, Vue 3, Svelte, Solid and Angular code.',
    url: 'https://svg-scroll-draw.vercel.app/docs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SVG Scroll Animation Docs — API, Options and Examples',
    description:
      'Animate SVG on scroll: install, quick start, every option, callbacks and instance methods, plus copy-paste React, Vue 3, Svelte, Solid and Angular code.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'svg-scroll-draw — SVG Scroll Draw API Reference',
  description:
    'Full API reference for the SVG scroll draw library. Covers scroll draw options, stroke-dashoffset animation, React/Vue/Svelte/Nuxt/Astro guides, Group API, and TypeScript types.',
  url: 'https://svg-scroll-draw.vercel.app/docs',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  about: {
    '@type': 'SoftwareApplication',
    name: 'svg-scroll-draw',
    url: 'https://svg-scroll-draw.vercel.app',
  },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteShell active="/docs" kicker="docs / your turn" cta={{ href: '/examples', label: 'See the examples' }}>
        <DocsPage />
      </SiteShell>
    </>
  );
}
