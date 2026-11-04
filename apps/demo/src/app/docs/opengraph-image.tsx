import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'SVG Scroll Animation Docs';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Docs',
    title: 'SVG Scroll Animation Docs',
    sub: 'Install, every option, callbacks and methods, for React, Vue, Svelte, Solid and Angular.',
  });
}
