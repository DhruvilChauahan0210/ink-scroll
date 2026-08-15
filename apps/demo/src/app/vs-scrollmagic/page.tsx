import type { Metadata } from 'next';
import { VersusPage } from '@/components/VersusPage';
import { VERSUS } from '@/data/versus';

const v = VERSUS.find((x) => x.slug === 'vs-scrollmagic')!;
const url = `https://svg-scroll-draw.vercel.app/vs-scrollmagic`;

export const metadata: Metadata = {
  title: v.title,
  description: v.description,
  keywords: v.keywords,
  alternates: { canonical: '/vs-scrollmagic' },
  openGraph: { type: 'article', title: v.title, description: v.description, url },
  twitter: { card: 'summary_large_image', title: v.title, description: v.description },
};

export default function Page() {
  return <VersusPage slug="vs-scrollmagic" />;
}
