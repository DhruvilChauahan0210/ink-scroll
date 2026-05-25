import type { Metadata } from 'next';
import { SvgPlayground } from '@/components/SvgPlayground';

export const metadata: Metadata = {
  title: 'SVG Playground — svg-scroll-draw',
  description: 'Paste any SVG and watch it animate. Tweak easing, speed, stagger, and more. Share your result with a URL.',
};

export default function PlaygroundPage() {
  return <SvgPlayground />;
}
