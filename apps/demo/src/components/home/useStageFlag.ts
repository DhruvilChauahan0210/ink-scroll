'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * Whether `.so-stage` (the sign-off) carries a flag attribute, watched from any
 * element inside it. SignOff sets `data-done` when its last stroke lands (and
 * outright under reduced motion).
 */
export function useStageFlag(ref: RefObject<Element | null>, flag: 'data-done'): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const stage = ref.current?.closest('.so-stage');
    if (!stage) return;
    const read = () => setOn(stage.hasAttribute(flag));
    read();
    const mo = new MutationObserver(read);
    mo.observe(stage, { attributes: true, attributeFilter: [flag] });
    return () => mo.disconnect();
  }, [ref, flag]);
  return on;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
