import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'SVG Wave Generator: Dividers, CSS Backgrounds & Animation';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'SVG wave generator',
  });
}
