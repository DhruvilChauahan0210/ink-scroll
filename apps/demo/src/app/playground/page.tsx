import type { Metadata } from 'next';
import { SvgPlayground } from '@/components/SvgPlayground';

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SVG Scroll Animation Playground — svg-scroll-draw',
    description: 'Paste any SVG and watch it animate on scroll. Share your result with a URL.',
  },
};

export default function PlaygroundPage() {
  return <SvgPlayground />;
}
