import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'CSS Scroll Snap Generator: Carousels, Sections & Grids';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'CSS scroll snap generator',
  });
}
