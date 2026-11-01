import type { Metadata } from 'next';
import { HalyardSite } from '@/showcase/halyard/HalyardSite';

export const metadata: Metadata = {
  title: { absolute: 'Halyard Capital annual report — a demo site built with svg-scroll-draw' },
  description: "A fictional shipping group's annual report, built as a working demo of svg-scroll-draw: axes, quarterly bars and a trend line each draw inside their own slice of the scroll.",
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/halyard' },
};

export default function Page() {
  return <HalyardSite />;
}
