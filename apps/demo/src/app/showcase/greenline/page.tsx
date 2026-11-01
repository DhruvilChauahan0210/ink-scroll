import type { Metadata } from 'next';
import { GreenlineSite } from '@/showcase/greenline/GreenlineSite';

export const metadata: Metadata = {
  title: { absolute: 'Greenline impact report — a demo site built with svg-scroll-draw' },
  description: "A fictional reforestation charity's impact report, built as a working demo of svg-scroll-draw: every figure counts up with scrollCounter.",
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/greenline' },
};

export default function Page() {
  return <GreenlineSite />;
}
