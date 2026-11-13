import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'How to Animate a Number Counter on Scroll (CSS and JS)';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'How to Animate a Number Counter on Scroll (CSS and JS)',
  });
}
