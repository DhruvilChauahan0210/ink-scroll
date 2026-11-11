import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Easing Functions Visualizer: Spring, Bounce & Elastic';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Easing functions visualizer',
  });
}
