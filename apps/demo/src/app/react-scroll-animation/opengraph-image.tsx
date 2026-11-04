import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'React Scroll Animation: Components and Hooks';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'React',
    title: 'React Scroll Animation: Components and Hooks',
  });
}
