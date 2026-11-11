import { ogImage, ogSize, ogContentType } from '../_lib/og';
import { TOOLS } from '@/data/tools';

export const alt = 'Free scroll animation tools';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tools',
    title: `${TOOLS.length} free scroll animation tools`,
  });
}
