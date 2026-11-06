import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Reduced Motion for Scroll Animations: What Each Should Do';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Reduced Motion for Scroll Animations: What Each Should Do',
  });
}
