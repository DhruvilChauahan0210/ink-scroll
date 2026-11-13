import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'CSS Scroll-Driven Animations: animation-timeline Explained';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'CSS Scroll-Driven Animations: animation-timeline Explained',
  });
}
