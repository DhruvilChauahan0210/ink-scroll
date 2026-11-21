import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Scroll-Drawn Svelte 5 Components With shadcn-svelte';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Scroll-Drawn Svelte 5 Components With shadcn-svelte',
  });
}
