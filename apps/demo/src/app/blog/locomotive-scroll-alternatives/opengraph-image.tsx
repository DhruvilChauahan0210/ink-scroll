import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Locomotive Scroll Alternatives in 2026: Lenis, CSS and More';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Locomotive Scroll Alternatives in 2026: Lenis, CSS and More',
  });
}
