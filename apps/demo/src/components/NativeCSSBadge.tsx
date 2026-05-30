'use client';

import { useEffect, useState } from 'react';

export function NativeCSSBadge() {
  const [native, setNative] = useState<boolean | null>(null);

  useEffect(() => {
    setNative(CSS.supports('animation-timeline', 'view()'));
  }, []);

  if (native === null) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-full border ${
        native
          ? 'border-lime-glow bg-lime-glow/20 text-pitch-black'
          : 'border-subtle-ash bg-marketplace-gray text-graphite-border'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${native ? 'bg-[#6cc070] animate-pulse' : 'bg-graphite-border'}`} />
      {native ? 'running on native CSS' : 'running on JS engine'}
    </span>
  );
}
