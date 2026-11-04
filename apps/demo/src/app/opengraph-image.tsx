import { ogImage, ogSize, ogContentType } from './_lib/og';

export const alt = 'svg-scroll-draw — the scroll animation library that draws';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'MIT · open source',
    title: 'The scroll animation library that draws.',
    sub: 'Paths, text, pins and video, inked by scroll. React, Next.js, Vue, Svelte or vanilla JS.',
  });
}
