import type { Metadata } from 'next';
import { MintcoSite } from '@/showcase/mintco/MintcoSite';

export const metadata: Metadata = {
  title: { absolute: 'Mint & Co — a demo site built with svg-scroll-draw' },
  description: "A fictional bank's switching page, built as a working demo of svg-scroll-draw: four steps that slide in one after another while their icons ink in.",
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/mintco' },
};

export default function Page() {
  return <MintcoSite />;
}
