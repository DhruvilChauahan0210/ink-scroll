import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'GSAP vs svg-scroll-draw: runtime benchmark';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Benchmark',
    title: 'GSAP vs svg-scroll-draw, measured',
    sub: 'Main-thread time, frame pacing and idle cost, scenario by scenario, in three browsers.',
  });
}
