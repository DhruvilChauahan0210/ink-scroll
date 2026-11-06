import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Accessible Split-Text Animation for Screen Readers';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Accessible Split-Text Animation for Screen Readers',
  });
}
