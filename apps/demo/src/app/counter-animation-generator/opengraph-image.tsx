import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Animated Counter Generator: Count Up on Scroll, JS & React';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Animated counter generator',
  });
}
