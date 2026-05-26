import type { Metadata } from 'next';
import { SvgPlayground } from '@/components/SvgPlayground';

export const metadata: Metadata = {
  title: 'SVG Animation Playground',
  description:
    'Paste any SVG and watch it animate as you scroll. Tweak easing, speed, stagger, fade, and direction. Share your result with a URL.',
  alternates: {
    canonical: '/playground',
  },
  openGraph: {
    title: 'SVG Animation Playground — svg-scroll-draw',
    description:
      'Paste any SVG and watch it animate as you scroll. Tweak easing, speed, stagger, and more.',
    url: 'https://svg-scroll-draw.vercel.app/playground',
  },
  twitter: {
    title: 'SVG Animation Playground — svg-scroll-draw',
    description: 'Paste any SVG and watch it animate as you scroll.',
  },
};

export default function PlaygroundPage() {
  return <SvgPlayground />;
}
