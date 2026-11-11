import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Scroll Progress Bar Generator: Reading Bar in CSS & React';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Scroll progress bar generator',
  });
}
