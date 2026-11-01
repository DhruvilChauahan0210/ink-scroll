import type { Metadata } from 'next';
import { AuralSite } from '@/showcase/aural/AuralSite';

export const metadata: Metadata = {
  title: { absolute: 'Aural One — a demo site built with svg-scroll-draw' },
  description: 'A fictional headphone brand’s product page, built as a working demo of svg-scroll-draw: scrollVideo scrubs the product film as you scroll, and onProgress pins a numbered callout to each part as the ear cup comes apart.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/aural' },
};

export default function Page() {
  return <AuralSite />;
}
