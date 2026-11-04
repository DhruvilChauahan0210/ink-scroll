import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Lenis Scroll Animation — Add Animations to Smooth Scroll';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Lenis',
    title: 'Lenis Scroll Animation — Add Animations to Smooth Scroll',
  });
}
