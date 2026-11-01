import type { Metadata } from 'next';
import { StatuslineSite } from '@/showcase/statusline/StatuslineSite';

export const metadata: Metadata = {
  title: { absolute: 'Paygrid status — a demo site built with svg-scroll-draw' },
  description: "A fictional API status page, built as a working demo of svg-scroll-draw: each service's latency line draws as it scrolls in.",
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/statusline' },
};

export default function Page() {
  return <StatuslineSite />;
}
