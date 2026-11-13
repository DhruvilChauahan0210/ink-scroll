import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Parallax Scrolling with CSS and JavaScript';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Parallax Scrolling with CSS and JavaScript',
  });
}
