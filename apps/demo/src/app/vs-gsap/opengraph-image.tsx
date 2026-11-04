import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'GSAP ScrollTrigger Alternative';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Comparison',
    title: 'GSAP ScrollTrigger Alternative',
    sub: 'MIT, zero dependencies, native CSS scroll timelines where the browser has them.',
  });
}
