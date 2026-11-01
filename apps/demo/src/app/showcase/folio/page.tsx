import type { Metadata } from 'next';
import { FolioSite } from '@/showcase/folio/FolioSite';

export const metadata: Metadata = {
  title: { absolute: 'Folio 4 — a demo site built with svg-scroll-draw' },
  description: "A fictional notes app's “What's new in Folio 4” release page, built as a working demo of svg-scroll-draw: feature cards and release notes reveal on scroll with scrollReveal.",
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/folio' },
};

export default function Page() {
  return <FolioSite />;
}
