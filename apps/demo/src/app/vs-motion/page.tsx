import type { Metadata } from 'next';
import { VersusPage } from '@/components/VersusPage';
import { VERSUS } from '@/data/versus';

const v = VERSUS.find((x) => x.slug === 'vs-motion')!;
const url = `https://svg-scroll-draw.vercel.app/vs-motion`;

export const metadata: Metadata = {
  title: v.title,
  description: v.description,
  keywords: v.keywords,
  alternates: { canonical: '/vs-motion' },
  openGraph: { type: 'article', title: v.title, description: v.description, url },
  twitter: { card: 'summary_large_image', title: v.title, description: v.description },
};

export default function Page() {
  return <VersusPage slug="vs-motion" />;
}
