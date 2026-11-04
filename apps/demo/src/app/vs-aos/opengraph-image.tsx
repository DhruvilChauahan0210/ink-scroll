import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'AOS Alternative: svg-scroll-draw vs AOS vs ScrollReveal';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Comparison',
    title: 'AOS Alternative: svg-scroll-draw vs AOS vs ScrollReveal',
  });
}
