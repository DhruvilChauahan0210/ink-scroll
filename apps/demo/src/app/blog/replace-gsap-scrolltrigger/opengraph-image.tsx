import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Replace GSAP ScrollTrigger with scrollAnimate';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Replace GSAP ScrollTrigger with scrollAnimate',
  });
}
