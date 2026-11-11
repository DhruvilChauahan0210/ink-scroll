import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Parallax Scrolling Generator: Depth Effect for JS & React';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Parallax scrolling generator',
  });
}
