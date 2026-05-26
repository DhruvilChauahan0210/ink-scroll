import type { Metadata } from 'next';
import { ExamplesPage } from '@/components/ExamplesPage';

export const metadata: Metadata = {
  title: 'Examples — SVG Scroll Animation without GSAP',
  description:
    'Real-world examples: animate SVG paths on scroll in React, Next.js, and vanilla JS. Logo reveals, line charts, signature animations, and more — no GSAP, no dependencies.',
  keywords: [
    'animate svg on scroll react',
    'svg path drawing animation',
    'stroke-dashoffset scroll animation',
    'svg scroll animation without gsap',
    'logo reveal scroll animation',
    'svg line chart animation',
    'handwriting animation css',
    'svg animation react nextjs',
  ],
  alternates: { canonical: '/examples' },
  openGraph: {
    title: 'SVG Scroll Animation Examples — svg-scroll-draw',
    description:
      'Logo reveals, line charts, signatures, flowcharts — all animated on scroll. No GSAP required.',
    url: 'https://svg-scroll-draw.vercel.app/examples',
  },
  twitter: {
    title: 'SVG Scroll Animation Examples — svg-scroll-draw',
    description: 'Real-world SVG scroll animations. No GSAP. ~3 KB.',
  },
};

export default function Page() {
  return <ExamplesPage />;
}
