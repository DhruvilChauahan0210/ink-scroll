import type { Metadata } from 'next';
import { ExamplesPage } from '@/components/ExamplesPage';
import { EXAMPLE_SEO, SEO_SLUGS } from '@/data/examples-seo';
// EXAMPLE_COUNT, not EXAMPLES.length — ExamplesPage is a client module, so a
// server import of EXAMPLES yields a proxy whose .length silently reads 0.
import { EXAMPLE_COUNT } from '@/data/examples-index';

export const metadata: Metadata = {
  title: 'SVG Scroll Animation Examples without GSAP',
  description:
    'Real-world examples: animate SVG paths on scroll in React and Next.js. Logo reveals, line charts, signature animations — no GSAP, no dependencies.',
  keywords: [
    'scroll draw examples',
    'svg scroll draw examples',
    'scroll draw react',
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SVG Scroll Animation Examples — svg-scroll-draw',
    description: 'Real-world SVG scroll animations. No GSAP. ~10 KB.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'SVG Scroll Animation Examples — svg-scroll-draw',
  description:
    'Real-world SVG scroll animation examples: logo reveals, line charts, signature animations, flowcharts, and more. Built with svg-scroll-draw — no GSAP, no dependencies.',
  url: 'https://svg-scroll-draw.vercel.app/examples',
  // Derived, so it cannot drift from the real count the way the hardcoded 13 did.
  numberOfItems: EXAMPLE_COUNT,
  itemListElement: SEO_SLUGS.map((slug, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: EXAMPLE_SEO[slug].heading,
    url: `https://svg-scroll-draw.vercel.app/examples/${slug}`,
  })),
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ExamplesPage />
    </>
  );
}
