import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'SVG Scroll Animation Playground';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Playground',
    title: 'SVG Scroll Animation Playground',
    sub: 'Change any option and watch the path draw as you scroll.',
  });
}
