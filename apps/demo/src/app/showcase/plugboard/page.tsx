import type { Metadata } from 'next';
import { PlugboardSite } from '@/showcase/plugboard/PlugboardSite';

export const metadata: Metadata = {
  title: { absolute: 'Plugboard — a demo site built with svg-scroll-draw' },
  description: 'A fictional automation product, built as a working demo of svg-scroll-draw: an integrations directory that arrives from one scrollAnimateGroup call.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/plugboard' },
};

export default function Page() {
  return <PlugboardSite />;
}
