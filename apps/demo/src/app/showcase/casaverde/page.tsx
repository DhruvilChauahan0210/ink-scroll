import type { Metadata } from 'next';
import { CasaverdeSite } from '@/showcase/casaverde/CasaverdeSite';

export const metadata: Metadata = {
  title: { absolute: 'Casa Verde — a demo site built with svg-scroll-draw' },
  description: "A fictional holiday-rentals company's site for country houses in Portugal and Spain, built as a working demo of svg-scroll-draw: a horizontal scrollSnap carousel whose onSnap moves the counter, the dots and the house details, and inks each house in as it arrives.",
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/casaverde' },
};

export default function Page() {
  return <CasaverdeSite />;
}
