import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = '5 SVG Scroll Animation Patterns in Under 10 Lines';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: '5 SVG Scroll Animation Patterns in Under 10 Lines',
  });
}
