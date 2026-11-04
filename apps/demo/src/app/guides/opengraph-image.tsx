import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Migration guides: GSAP, AOS, ScrollReveal and vivus';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Guides',
    title: 'Migration guides: GSAP, AOS, ScrollReveal and vivus',
    sub: 'Move each library to svg-scroll-draw in React or Next.js, step by step.',
  });
}
