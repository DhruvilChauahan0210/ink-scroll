import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Scroll Animations in Next.js (App Router): A Practical Guide';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Scroll Animations in Next.js (App Router): A Practical Guide',
  });
}
