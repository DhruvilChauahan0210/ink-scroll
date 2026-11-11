import { ogImage, ogSize, ogContentType } from '../_lib/og';
import { AOS_EFFECT_COUNT } from '@/data/aos-effects';

export const alt = `AOS Animation Examples: All ${AOS_EFFECT_COUNT} data-aos Effects, Live`;
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'AOS animation',
    title: `All ${AOS_EFFECT_COUNT} data-aos effects, live`,
  });
}
