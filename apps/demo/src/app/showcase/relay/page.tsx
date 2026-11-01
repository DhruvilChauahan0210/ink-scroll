import type { Metadata } from 'next';
import { RelaySite } from '@/showcase/relay/RelaySite';

export const metadata: Metadata = {
  title: { absolute: 'Relay — a demo site built with svg-scroll-draw' },
  description: 'A fictional team-messaging product, built as a working demo of svg-scroll-draw: three feature illustrations that draw in sync from one scrollDrawGroup call.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/relay' },
};

export default function Page() {
  return <RelaySite />;
}
