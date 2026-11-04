import { ogImage, ogSize, ogContentType } from '../../_lib/og';
import { EXAMPLE_SEO } from '@/data/examples-seo';

export const alt = 'svg-scroll-draw';
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = EXAMPLE_SEO[slug];
  return ogImage({ kicker: 'Example', title: e.title });
}
