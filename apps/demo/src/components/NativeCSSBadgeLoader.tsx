'use client';

import dynamic from 'next/dynamic';

const NativeCSSBadge = dynamic(
  () => import('./NativeCSSBadge').then((m) => m.NativeCSSBadge),
  { ssr: false },
);

export function NativeCSSBadgeLoader() {
  return <NativeCSSBadge />;
}
