import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'How to Animate an SVG Line Drawing with CSS';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'How to Animate an SVG Line Drawing with CSS',
  });
}
