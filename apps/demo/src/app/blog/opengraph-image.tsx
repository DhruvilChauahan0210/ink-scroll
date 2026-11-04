import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Scroll animation guides and comparisons';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Scroll animation guides and comparisons',
  });
}
