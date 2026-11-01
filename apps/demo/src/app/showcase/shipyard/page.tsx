import type { Metadata } from 'next';
import { ShipyardSite } from '@/showcase/shipyard/ShipyardSite';

export const metadata: Metadata = {
  title: { absolute: 'Shipyard — a demo site built with svg-scroll-draw' },
  description: 'A fictional CI/CD product, built as a working demo of svg-scroll-draw: pipeline stages that draw one after another as each finishes.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/shipyard' },
};

export default function Page() {
  return <ShipyardSite />;
}
