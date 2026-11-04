import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Framer Motion Alternative for Scroll Animations';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Comparison',
    title: 'Framer Motion Alternative for Scroll Animations',
  });
}
