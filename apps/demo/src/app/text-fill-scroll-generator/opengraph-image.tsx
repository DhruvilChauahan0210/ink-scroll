import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Text Fill on Scroll Generator: CSS & JS Text Highlight';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Text fill on scroll generator',
  });
}
