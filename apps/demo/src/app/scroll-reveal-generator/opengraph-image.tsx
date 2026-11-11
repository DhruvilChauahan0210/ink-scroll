import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Scroll Reveal Animation Generator: JS & React Code';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Scroll reveal generator',
  });
}
