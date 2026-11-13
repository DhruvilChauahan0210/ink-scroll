import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'CSS Scroll Snap: Carousels and Full-Page Sections';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'CSS Scroll Snap: Carousels and Full-Page Sections',
  });
}
