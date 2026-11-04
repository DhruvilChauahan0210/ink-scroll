import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Scroll Animation Performance — Native CSS vs JavaScript';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Scroll Animation Performance — Native CSS vs JavaScript',
  });
}
