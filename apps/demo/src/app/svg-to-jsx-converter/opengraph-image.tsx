import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'SVG to JSX Converter: SVG to React Component & TSX';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'SVG to JSX converter',
  });
}
