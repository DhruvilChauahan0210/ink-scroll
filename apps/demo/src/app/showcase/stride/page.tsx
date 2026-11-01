import type { Metadata } from 'next';
import { StrideSite } from '@/showcase/stride/StrideSite';

export const metadata: Metadata = {
  title: { absolute: 'Stride — a demo site built with svg-scroll-draw' },
  description: "A fictional running app, built as a working demo of svg-scroll-draw: a run's route and elevation profile drawn on scroll.",
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/stride' },
};

export default function Page() {
  return <StrideSite />;
}
