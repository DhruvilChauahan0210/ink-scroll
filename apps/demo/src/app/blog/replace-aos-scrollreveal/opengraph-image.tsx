import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Replace AOS and ScrollReveal.js with One Call';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Replace AOS and ScrollReveal.js with One Call',
  });
}
