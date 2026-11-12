import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'SVG Path Editor Online: Edit d Visually and as Text';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'SVG path editor',
  });
}
