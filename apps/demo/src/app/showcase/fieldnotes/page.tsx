import type { Metadata } from 'next';
import { FieldnotesSite } from '@/showcase/fieldnotes/FieldnotesSite';

export const metadata: Metadata = {
  title: { absolute: 'Fieldnotes — a demo site built with svg-scroll-draw' },
  description: 'A fictional nature journal built with Astro, as a working demo of svg-scroll-draw: a botanical plate drawn through data-scroll-draw and initScrollDraw().',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/fieldnotes' },
};

export default function Page() {
  return <FieldnotesSite />;
}
