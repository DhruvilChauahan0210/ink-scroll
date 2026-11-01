import type { Metadata } from 'next';
import { TesseraSite } from '@/showcase/tessera/TesseraSite';

export const metadata: Metadata = {
  title: { absolute: 'Tessera pricing — a demo site built with svg-scroll-draw' },
  description: "A fictional team wiki's pricing page, built as a working demo of svg-scroll-draw: every part of every plan reveals on its own scrollAnimate.",
  robots: { index: false, follow: true },
  alternates: { canonical: '/showcase/tessera' },
};

export default function Page() {
  return <TesseraSite />;
}
