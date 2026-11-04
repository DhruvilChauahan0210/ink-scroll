import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Zero-JS SVG Scroll Animations with Native CSS';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Zero-JS SVG Scroll Animations with Native CSS',
  });
}
