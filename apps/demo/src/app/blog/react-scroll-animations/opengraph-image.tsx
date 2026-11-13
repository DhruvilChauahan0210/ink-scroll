import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'React Scroll Animations: CSS, Framer Motion or a Hook?';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'React Scroll Animations: CSS, Framer Motion or a Hook?',
  });
}
