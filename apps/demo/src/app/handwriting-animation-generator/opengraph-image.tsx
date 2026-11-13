import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Handwriting Animation Generator: Animated Signature SVG';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Handwriting animation generator',
  });
}
