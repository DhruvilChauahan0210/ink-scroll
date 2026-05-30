import type { Metadata } from 'next';
import { SvgPlayground } from '@/components/SvgPlayground';

const OG_IMAGE = 'https://svg-scroll-draw.vercel.app/opengraph-image';

export const metadata: Metadata = {
  title: 'SVG Scroll Animation Playground — Try It Live',
  description:
    'Paste any SVG and watch it animate on scroll. Tweak easing, speed, stagger, fade, stroke color, morphTo, and clip mode. Share your result with a URL.',
  alternates: { canonical: '/playground' },
  openGraph: {
    title: 'SVG Scroll Animation Playground — svg-scroll-draw',
    description:
      'Paste any SVG and watch it animate on scroll. Tweak easing, speed, stagger, and more.',
    url: 'https://svg-scroll-draw.vercel.app/playground',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'SVG Scroll Animation Playground' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SVG Scroll Animation Playground — svg-scroll-draw',
    description: 'Paste any SVG and watch it animate on scroll. Share your result with a URL.',
    images: [OG_IMAGE],
  },
};

export default function PlaygroundPage() {
  return <SvgPlayground />;
}
