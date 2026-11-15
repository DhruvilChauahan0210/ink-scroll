import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Generative SVG Line Art That Draws Itself on Scroll';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Generative SVG Line Art That Draws Itself on Scroll',
  });
}
