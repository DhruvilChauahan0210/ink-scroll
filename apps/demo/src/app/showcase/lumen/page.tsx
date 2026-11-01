import type { Metadata } from 'next';
import { LumenSite } from '@/showcase/lumen/LumenSite';

export const metadata: Metadata = {
  title: { absolute: 'Lumen X2 — a demo site built with svg-scroll-draw' },
  description: "A fictional compact camera's product page, built as a working demo of svg-scroll-draw: scrollPin holds the camera in place while onProgress walks a feature tour through its sensor, lens, stabilisation and battery.",
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/lumen' },
};

export default function Page() {
  return <LumenSite />;
}
