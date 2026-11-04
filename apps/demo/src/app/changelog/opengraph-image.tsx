import { ogImage, ogSize, ogContentType } from '../_lib/og';
import { SELF } from '@/data/competitors';

export const alt = 'Changelog';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Changelog',
    title: 'Changelog',
    sub: `Every release of svg-scroll-draw, up to v${SELF.version}.`,
  });
}
