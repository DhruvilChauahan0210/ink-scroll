import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'GSAP DrawSVG Alternative';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'GSAP DrawSVG Alternative',
    sub: 'Draw SVG paths on scroll. MIT, zero dependencies.',
  });
}
