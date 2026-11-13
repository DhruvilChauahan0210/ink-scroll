import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'How to Animate Text on Scroll with CSS and JavaScript';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'How to Animate Text on Scroll with CSS and JavaScript',
  });
}
