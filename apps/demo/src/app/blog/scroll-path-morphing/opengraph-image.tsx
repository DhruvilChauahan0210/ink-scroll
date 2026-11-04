import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Scroll-Driven SVG Path Morphing with morphTo';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Scroll-Driven SVG Path Morphing with morphTo',
  });
}
