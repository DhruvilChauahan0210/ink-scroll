import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'SVG Blob Generator: Random Organic Shapes, Morph & Draw';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'SVG blob generator',
  });
}
