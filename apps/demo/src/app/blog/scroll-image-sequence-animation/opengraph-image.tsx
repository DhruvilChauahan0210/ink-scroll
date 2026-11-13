import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'How to Build an Apple-Style Scroll Image Sequence Animation';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'How to Build an Apple-Style Scroll Image Sequence Animation',
  });
}
