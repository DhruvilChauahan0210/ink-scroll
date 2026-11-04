import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Scroll Pin Without GSAP — Pin Sections While You Scroll';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Scroll Pin Without GSAP — Pin Sections While You Scroll',
  });
}
