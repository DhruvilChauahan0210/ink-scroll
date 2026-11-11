import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Horizontal Scroll Section Generator: CSS, JS & React';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Horizontal scroll generator',
  });
}
