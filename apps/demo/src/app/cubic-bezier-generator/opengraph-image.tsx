import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Cubic Bezier Generator: CSS Easing & Custom Easing Function';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Cubic-bezier generator',
  });
}
