import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Animate on Scroll with CSS Only (No Library, No JavaScript)';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Animate on Scroll with CSS Only (No Library, No JavaScript)',
  });
}
