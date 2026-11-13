import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Scroll Image Sequence Generator: Apple-Style Frames';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Scroll image sequence generator',
  });
}
