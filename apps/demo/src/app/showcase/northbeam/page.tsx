import type { Metadata } from 'next';
import { NorthbeamSite } from '@/showcase/northbeam/NorthbeamSite';

export const metadata: Metadata = {
  title: { absolute: 'Northbeam — a demo site built with svg-scroll-draw' },
  description: "A fictional edge cloud, built as a working demo of svg-scroll-draw: a request's path draws through the edge, a function and the database in order.",
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/northbeam' },
};

export default function Page() {
  return <NorthbeamSite />;
}
