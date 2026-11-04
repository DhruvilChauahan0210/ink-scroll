import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Scroll Animations: The Complete 2026 Guide';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Scroll Animations: The Complete 2026 Guide',
  });
}
