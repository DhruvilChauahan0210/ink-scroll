import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Scroll Video Scrub Generator: Play Video on Scroll';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Scroll video scrub generator',
  });
}
