import type { Metadata } from 'next';
import { ParcelrySite } from '@/showcase/parcelry/ParcelrySite';

export const metadata: Metadata = {
  title: { absolute: 'Parcelry — a demo site built with svg-scroll-draw' },
  description: 'A fictional same-day courier, built as a working demo of svg-scroll-draw: the delivery route traces across a city map as it scrolls into view.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/parcelry' },
};

export default function Page() {
  return <ParcelrySite />;
}
