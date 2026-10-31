import type { Metadata } from 'next';
import { HearthSite } from '@/showcase/hearth/HearthSite';

export const metadata: Metadata = {
  title: { absolute: 'Hearth & Field checkout — a demo site built with svg-scroll-draw' },
  description:
    'A fictional homeware shop’s checkout, built as a working demo of svg-scroll-draw: a progress stepper that inks in up to the current step and product line drawings in the order summary.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/hearth' },
};

export default function Page() {
  return <HearthSite />;
}
