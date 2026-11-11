import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'CSS Animation Generator: Keyframes, Presets & Code';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'CSS keyframes animation generator',
  });
}
