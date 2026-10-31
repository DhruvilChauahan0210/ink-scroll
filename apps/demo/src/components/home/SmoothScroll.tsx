'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Lenis smooth scroll for the homepage only. Lenis 1.x scrolls the real
 * window, so window.scrollY and CSS scroll timelines keep working and no
 * svg-scroll-draw adapter is needed. Off for reduced-motion users.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    // Lenis re-measures when <html> resizes, but <html> is `h-full` here and
    // never changes size — while the pinned chapters set their stage heights
    // after mount and grow the page. Without this its scroll limit stays at
    // the first measurement and the page stops short of the end.
    const ro = new ResizeObserver(() => lenis.resize());
    ro.observe(document.body);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);
  return null;
}
