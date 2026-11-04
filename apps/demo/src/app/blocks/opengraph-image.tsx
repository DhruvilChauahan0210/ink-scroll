import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Scroll animation blocks for React and shadcn';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blocks',
    title: 'Scroll animation blocks for React and shadcn',
    sub: 'Copy-paste sections you install with the shadcn CLI.',
  });
}
