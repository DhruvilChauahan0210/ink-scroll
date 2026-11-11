import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'SVG Morph Generator: Shape Morphing on Scroll, JS & CSS';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'SVG morph generator',
  });
}
