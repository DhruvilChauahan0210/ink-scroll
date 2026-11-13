import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'CSS cubic-bezier() Easing Explained, with Curves to Copy';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'CSS cubic-bezier() Easing Explained, with Curves to Copy',
  });
}
