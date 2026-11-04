import { ogImage, ogSize, ogContentType } from '../_lib/og';
import { FRAMEWORK_LANDINGS } from '@/data/framework-landings';

export const alt = 'svg-scroll-draw';
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({ params }: { params: Promise<{ framework: string }> }) {
  const { framework } = await params;
  const f = FRAMEWORK_LANDINGS.find((x) => x.slug === framework)!;
  return ogImage({ kicker: f.name, title: f.title });
}
