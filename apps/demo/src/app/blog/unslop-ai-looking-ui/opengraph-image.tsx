import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'Unslopping a Site: 13 Signs of AI-Looking UI, Fixed';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'Unslopping a Site: 13 Signs of AI-Looking UI, Fixed',
  });
}
