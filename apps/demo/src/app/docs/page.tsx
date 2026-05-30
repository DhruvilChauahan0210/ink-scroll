import type { Metadata } from 'next';
import { DocsPage } from '@/components/DocsPage';

const OG_IMAGE = 'https://svg-scroll-draw.vercel.app/opengraph-image';

export const metadata: Metadata = {
  title: 'Animate SVG on Scroll — API Docs',
  description:
    'Full API reference for animating SVG paths on scroll. Options, React/Vue/Svelte/Nuxt/Astro guides, stroke-dashoffset animation, Group API, and TypeScript types.',
  keywords: [
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
    title: 'Animate SVG on Scroll — API Docs | svg-scroll-draw',
    description:
      'Full API reference for animating SVG paths on scroll. Options, React/Vue/Svelte/Nuxt/Astro guides, stroke-dashoffset animation, Group API, and TypeScript types.',
    url: 'https://svg-scroll-draw.vercel.app/docs',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'svg-scroll-draw API Docs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Animate SVG on Scroll — API Docs | svg-scroll-draw',
    description:
      'Full API reference for animating SVG paths on scroll. Options, React/Vue/Svelte/Nuxt/Astro guides, Group API, and TypeScript types.',
    images: [OG_IMAGE],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'svg-scroll-draw — Animate SVG on Scroll API Reference',
  description:
    'Full API reference for animating SVG paths on scroll using svg-scroll-draw. Covers options, stroke-dashoffset animation, React/Vue/Svelte/Nuxt/Astro guides, Group API, and TypeScript types.',
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
