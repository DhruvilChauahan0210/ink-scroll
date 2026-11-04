'use client';

import { useEffect, useState } from 'react';

/** One request per page view, shared by every component that shows the count. */
let pending: Promise<number | null> | null = null;

function load(): Promise<number | null> {
  pending ??= fetch('/api/stars')
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { stars?: unknown } | null) => (typeof d?.stars === 'number' ? d.stars : null))
    .catch(() => null);
  return pending;
}

/** The repo's GitHub star count from /api/stars, or null until (or unless) it arrives. */
export function useStars(): number | null {
  const [stars, setStars] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    load().then((n) => {
      if (live) setStars(n);
    });
    return () => {
      live = false;
    };
  }, []);
  return stars;
}

/** 1234 → "1.2k"; under a thousand as is. */
export function shortCount(n: number): string {
  return n < 1000 ? String(n) : `${(n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, '')}k`;
}
