import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'SVG Shape to Path Converter: Circle, Rect & Ellipse to Path';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'SVG shape to path converter',
  });
}
