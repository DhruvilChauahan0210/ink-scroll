import { ogImage, ogSize, ogContentType } from '../_lib/og';
import { VERSUS } from '@/data/versus';

const v = VERSUS.find((x) => x.slug === 'vs-motion')!;

export const alt = v.title;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({ kicker: 'Comparison', title: v.title });
}
