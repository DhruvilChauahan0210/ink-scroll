import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'SVG Line Drawing Animation Generator: CSS Stroke Animation';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'SVG line drawing generator',
  });
}
