import { ogImage, ogSize, ogContentType } from '../_lib/og';

export const alt = 'Next.js Scroll Animation for the App Router';
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return ogImage({
    kicker: 'Next.js',
    title: 'Next.js Scroll Animation for the App Router',
    sub: "One 'use client' component, SSR-safe, no hydration errors.",
  });
}
