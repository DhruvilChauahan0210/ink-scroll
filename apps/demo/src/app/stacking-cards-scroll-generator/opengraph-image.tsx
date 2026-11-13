import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Stacking Cards on Scroll Generator: Sticky CSS Card Stack';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Stacking cards on scroll generator',
  });
}
