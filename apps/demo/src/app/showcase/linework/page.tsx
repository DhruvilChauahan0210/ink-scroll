import type { Metadata } from 'next';
import { LineworkSite } from '@/showcase/linework/LineworkSite';

export const metadata: Metadata = {
  title: { absolute: 'Linework — a demo site built with svg-scroll-draw' },
  description: 'A fictional illustration studio, built as a working demo of svg-scroll-draw: five pieces, each drawn with a different preset.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/linework' },
};

export default function Page() {
  return <LineworkSite />;
}
