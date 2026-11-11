import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Scroll Trigger Start & End Explained: Live Visualizer';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Scroll trigger visualizer',
  });
}
