import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Scroll-Drawn Vue 3 Components, Installed With shadcn-vue';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Scroll-Drawn Vue 3 Components, Installed With shadcn-vue',
  });
}
