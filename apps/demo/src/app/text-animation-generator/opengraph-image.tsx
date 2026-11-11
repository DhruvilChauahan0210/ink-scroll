import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Text Animation Generator: Animated Text for JS & React';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Tool',
    title: 'Text animation generator',
  });
}
