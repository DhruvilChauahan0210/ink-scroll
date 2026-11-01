import type { Metadata } from 'next';
import { AteliernordSite } from '@/showcase/ateliernord/AteliernordSite';

export const metadata: Metadata = {
  title: { absolute: 'Atelier Nord — a demo site built with svg-scroll-draw' },
  description: 'A fictional architecture studio, built as a working demo of svg-scroll-draw: a statement that rises word by word with scrollText.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/ateliernord' },
};

export default function Page() {
  return <AteliernordSite />;
}
