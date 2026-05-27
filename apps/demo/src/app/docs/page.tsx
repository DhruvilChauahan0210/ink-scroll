import type { Metadata } from 'next';
import { DocsPage } from '@/components/DocsPage';

export const metadata: Metadata = {
  title: 'Docs — svg-scroll-draw',
  description:
    'Full API reference for svg-scroll-draw. Options, instance methods, framework guides (React, Vue, Svelte, Solid, Angular, Nuxt, Astro), Group API, hooks, and TypeScript types.',
  keywords: [
    'svg-scroll-draw docs',
    'svg scroll animation api',
    'scrollDraw options',
    'svg path animation react',
    'svg scroll vue svelte',
    'scroll animation javascript api',
  ],
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'Docs — svg-scroll-draw',
    description: 'Full API reference. Options, instance methods, React/Vue/Svelte/Solid/Angular/Nuxt/Astro guides, Group & Sequence APIs, hooks, and TypeScript types.',
    url: 'https://svg-scroll-draw.vercel.app/docs',
  },
  twitter: {
    title: 'Docs — svg-scroll-draw',
    description: 'Full API reference for svg-scroll-draw.',
  },
};

export default function Page() {
  return <DocsPage />;
}
