import { ogImage, ogSize, ogContentType } from '../../_lib/og';

export const alt = 'How to Scrub a Video on Scroll (Play Video with Scroll)';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Blog',
    title: 'How to Scrub a Video on Scroll (Play Video with Scroll)',
  });
}
