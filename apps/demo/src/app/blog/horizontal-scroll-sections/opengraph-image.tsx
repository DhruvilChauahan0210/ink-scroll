import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Horizontal Scroll Sections Without GSAP';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Horizontal Scroll Sections Without GSAP',
  });
}
