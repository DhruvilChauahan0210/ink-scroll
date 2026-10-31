import type { Metadata } from 'next';
import { FerrowSite } from '@/showcase/ferrow/FerrowSite';

export const metadata: Metadata = {
  title: { absolute: 'Ferrow Coffee Roasters — a demo site built with svg-scroll-draw' },
  description:
    'A fictional small-lot coffee roaster, built as a working demo of svg-scroll-draw: an emblem that draws and fills on load, origin drawings, farm-to-roastery routes and a roast profile that plot on scroll.',
  // A demo for a fictional company: useful to visit, not something to index as a real business.
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/ferrow' },
};

export default function Page() {
  return <FerrowSite />;
}
