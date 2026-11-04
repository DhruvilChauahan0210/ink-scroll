import { ogImage, ogSize, ogContentType } from '../_lib/og';
import { EXAMPLE_COUNT } from '@/data/examples-index';

export const alt = `${EXAMPLE_COUNT} SVG scroll animation examples`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Examples',
    title: `${EXAMPLE_COUNT} SVG scroll animation examples`,
    sub: 'Copy-paste demos without GSAP: logo reveals, charts, maps, signatures, pins and text.',
  });
}
