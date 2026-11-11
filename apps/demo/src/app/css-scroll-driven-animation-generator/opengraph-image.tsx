import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'CSS Scroll-Driven Animation Generator: animation-range';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'CSS scroll-driven animation generator',
  });
}
