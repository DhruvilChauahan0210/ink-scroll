import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Scroll Pin Generator: Sticky Sections Without GSAP';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Scroll pin generator',
  });
}
