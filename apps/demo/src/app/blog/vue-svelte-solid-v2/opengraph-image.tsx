import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Scroll Animation in Vue 3, Svelte and Solid.js';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Scroll Animation in Vue 3, Svelte and Solid.js',
  });
}
