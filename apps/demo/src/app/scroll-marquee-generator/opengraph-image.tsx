import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Scroll Marquee Generator: Text That Moves on Scroll';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Scroll marquee generator',
  });
}
