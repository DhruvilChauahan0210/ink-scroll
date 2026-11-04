import { ogImage, ogSize, ogContentType } from '../../_lib/og';
import { GUIDES } from '@/data/guides';

export const alt = 'svg-scroll-draw';
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug)!;
  return ogImage({ kicker: `Guide · ${g.framework}`, title: g.title });
}
