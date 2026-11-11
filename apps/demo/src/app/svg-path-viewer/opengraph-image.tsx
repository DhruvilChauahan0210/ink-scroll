import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'SVG Path Viewer: Length, Commands & Draw Animation Code';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'SVG path viewer',
  });
}
