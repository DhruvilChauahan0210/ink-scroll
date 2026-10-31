import type { Metadata } from 'next';
import { LedgerlineSite } from '@/showcase/ledgerline/LedgerlineSite';

export const metadata: Metadata = {
  title: { absolute: 'Ledgerline — a demo site built with svg-scroll-draw' },
  description:
    'A fictional subscription-analytics product, built as a working demo of svg-scroll-draw: a dashboard whose MRR lines plot on scroll, cohort curves, a forecast with a widening band, and sparklines.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/ledgerline' },
};

export default function Page() {
  return <LedgerlineSite />;
}
