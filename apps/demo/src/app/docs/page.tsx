import type { Metadata } from 'next';
import { DocsPage } from '@/components/DocsPage';

export const metadata: Metadata = {
  title: 'SVG Scroll Draw — API Docs & Reference',
  description:
    'Full API reference for the SVG scroll draw library. Animate paths on scroll with React, Vue, Svelte, Nuxt, and Astro. stroke-dashoffset, Group API, TypeScript types.',
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
    title: 'SVG Scroll Draw — API Docs & Reference | svg-scroll-draw',
    description:
      'Full API reference for the SVG scroll draw library. Animate paths on scroll with React, Vue, Svelte, Nuxt, and Astro. stroke-dashoffset, Group API, TypeScript types.',
    url: 'https://svg-scroll-draw.vercel.app/docs',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SVG Scroll Draw — API Docs & Reference | svg-scroll-draw',
    description:
      'Full API reference for the SVG scroll draw library. React, Vue, Svelte, Nuxt, Astro guides, Group API, TypeScript types.',
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
      <DocsPage />
    </>
  );
}
