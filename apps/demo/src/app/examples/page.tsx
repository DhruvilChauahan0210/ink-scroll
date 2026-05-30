import type { Metadata } from 'next';
import { ExamplesPage } from '@/components/ExamplesPage';

const OG_IMAGE = 'https://svg-scroll-draw.vercel.app/opengraph-image';

export const metadata: Metadata = {
  title: 'SVG Scroll Animation Examples without GSAP',
  description:
    'Real-world examples: animate SVG paths on scroll in React and Next.js. Logo reveals, line charts, signature animations — no GSAP, no dependencies.',
  keywords: [
    'animate svg on scroll react',
    'svg path drawing animation',
    'stroke-dashoffset scroll animation',
    'svg scroll animation without gsap',
    'logo reveal scroll animation',
    'svg line chart animation',
    'handwriting animation css',
    'svg animation react nextjs',
    'scroll-driven svg animation',
  ],
  alternates: { canonical: '/examples' },
  openGraph: {
    title: 'SVG Scroll Animation Examples — svg-scroll-draw',
    description:
      'Logo reveals, line charts, signatures, flowcharts — all animated on scroll. No GSAP required.',
    url: 'https://svg-scroll-draw.vercel.app/examples',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'SVG Scroll Animation Examples' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SVG Scroll Animation Examples — svg-scroll-draw',
    description: 'Real-world SVG scroll animations. No GSAP. ~4.4 KB.',
    images: [OG_IMAGE],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'SVG Scroll Animation Examples — svg-scroll-draw',
  description:
    'Real-world SVG scroll animation examples: logo reveals, line charts, signature animations, flowcharts, and more. Built with svg-scroll-draw — no GSAP, no dependencies.',
  url: 'https://svg-scroll-draw.vercel.app/examples',
  numberOfItems: 12,
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ExamplesPage />
    </>
  );
}
