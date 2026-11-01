import type { Metadata } from 'next';
import { TidewaterSite } from '@/showcase/tidewater/TidewaterSite';

export const metadata: Metadata = {
  title: { absolute: 'Tidewater Sailing School — a demo site built with svg-scroll-draw' },
  description: 'A fictional sailing school, built as a working demo of svg-scroll-draw: a sloop that draws itself as the hero scrolls.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/tidewater' },
};

export default function Page() {
  return <TidewaterSite />;
}
