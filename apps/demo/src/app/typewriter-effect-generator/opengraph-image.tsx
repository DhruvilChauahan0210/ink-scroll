import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Typewriter Effect Generator: CSS & JS Typing Animation';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Typewriter effect generator',
  });
}
