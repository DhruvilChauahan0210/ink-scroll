import type { Metadata } from 'next';
import { seoTitle } from '../_lib/seo';
import { VersusPage } from '@/components/VersusPage';
import { VERSUS } from '@/data/versus';

const v = VERSUS.find((x) => x.slug === 'vs-vivus')!;
const url = `https://svg-scroll-draw.vercel.app/vs-vivus`;

export const metadata: Metadata = {
  title: seoTitle(v.title),
  description: v.description,
  keywords: v.keywords,
  alternates: { canonical: '/vs-vivus' },
  openGraph: { type: 'article', title: v.title, description: v.description, url },
  twitter: { card: 'summary_large_image', title: v.title, description: v.description },
};

export default function Page() {
  return <VersusPage slug="vs-vivus" />;
}
