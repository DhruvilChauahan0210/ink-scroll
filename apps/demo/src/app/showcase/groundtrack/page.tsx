import type { Metadata } from 'next';
import { GroundtrackSite } from '@/showcase/groundtrack/GroundtrackSite';

export const metadata: Metadata = {
  title: { absolute: 'Groundtrack — a demo site built with svg-scroll-draw' },
  description: 'A fictional exhibition’s page for its Landsat 8 exhibit, built as a working demo of svg-scroll-draw: scrollFrames turns 71 stills of NASA’s public-domain Landsat 8 model on a canvas as you scroll, and onProgress lights each part in turn.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/groundtrack' },
};

export default function Page() {
  return <GroundtrackSite />;
}
