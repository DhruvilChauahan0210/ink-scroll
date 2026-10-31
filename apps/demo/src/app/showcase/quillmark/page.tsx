import type { Metadata } from 'next';
import { QuillmarkSite } from '@/showcase/quillmark/QuillmarkSite';

export const metadata: Metadata = {
  title: { absolute: 'Quillmark — a demo site built with svg-scroll-draw' },
  description:
    'A fictional e-signature product, built as a working demo of svg-scroll-draw: a signature that writes itself on the contract as you scroll, step icons drawn in turn, and an audit trail drawn down the page.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/quillmark' },
};

export default function Page() {
  return <QuillmarkSite />;
}
