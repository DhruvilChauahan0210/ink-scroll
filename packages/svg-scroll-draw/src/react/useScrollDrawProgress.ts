import { useState, useEffect, useRef, type RefObject } from 'react';
import { EASINGS, parseTrigger, computeProgress, computeTriggers } from '../core/utils';
import type { EasingName, TriggerConfig } from '../core/types';

export interface UseScrollDrawProgressOptions {
  /** Same speed multiplier as ScrollDraw. Values > 1 complete faster. Default 1. */
  speed?: number;
  /** Same easing curves as ScrollDraw. Default 'linear'. */
  easing?: EasingName | ((t: number) => number);
  /** Same trigger syntax as ScrollDraw. Default: start 'top bottom', end 'bottom top'. */
  trigger?: TriggerConfig;
  /** Scroll axis. Default 'y'. */
  axis?: 'x' | 'y';
  /** CSS selector or Element for a custom scroll container. Default: window. */
  scrollContainer?: string | Element;
  /** Lock at maximum progress once reached — never decreases on scroll back. Default false. */
  once?: boolean;
}

/**
 * Returns a reactive scroll progress value (0–1) for the given element.
 * Identical trigger/speed/easing semantics to ScrollDraw — use this to
 * drive any animation alongside or independent of an SVG draw.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const progress = useScrollDrawProgress(ref, { speed: 1.2, easing: 'ease-out' });
 * // progress is 0→1 as ref scrolls through the viewport
 */
export function useScrollDrawProgress(
  target: RefObject<Element | null> | string,
  options: UseScrollDrawProgressOptions = {},
): number {
  const [progress, setProgress] = useState(0);

  // Keep latest options accessible inside rAF without re-subscribing the effect
  const optsRef = useRef(options);
  optsRef.current = options;

  // Tracks the highest progress seen — used for `once` mode
  const frozenRef = useRef(-1);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Respect prefers-reduced-motion — jump straight to complete
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }

    const maybeEl =
      typeof target === 'string'
        ? document.querySelector(target)
        : target.current;
    if (!maybeEl) return;
    const el: Element = maybeEl;

    const {
      axis            = 'y',
      scrollContainer,
      trigger         = {},
    } = optsRef.current;

    const scrollEl: Element | null =
      typeof scrollContainer === 'string'
        ? document.querySelector(scrollContainer)
        : (scrollContainer as Element | null | undefined) ?? null;

    const startConfig = parseTrigger(trigger.start ?? 'top bottom');
    const endConfig   = parseTrigger(trigger.end   ?? 'bottom top');

    let tStart   = 0;
    let tEnd     = 0;
    let isVisible = false;
    let rafId    = 0;

    function scrollPos(): number {
      if (scrollEl) return axis === 'x' ? scrollEl.scrollLeft : scrollEl.scrollTop;
      return axis === 'x' ? window.scrollX : window.scrollY;
    }

    function vpSize(): number {
      if (scrollEl) return axis === 'x' ? scrollEl.clientWidth : scrollEl.clientHeight;
      return axis === 'x' ? window.innerWidth : window.innerHeight;
    }

    function cacheTriggers(): void {
      const rect   = el.getBoundingClientRect();
      const scroll = scrollPos();
      const pos    = axis === 'x' ? rect.left : rect.top;
      const size   = axis === 'x' ? rect.width : rect.height;
      const result = computeTriggers(
        { top: pos, height: size },
        scroll,
        vpSize(),
        startConfig,
        endConfig,
      );
      tStart = result.tStart;
      tEnd   = result.tEnd;
    }

    function tick(): void {
      if (!isVisible) return;

      const { speed = 1, easing = 'linear', once = false } = optsRef.current;
      const easeFn = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS.linear);

      const raw = computeProgress(scrollPos(), tStart, tEnd, speed);
      let p = easeFn(raw);

      if (once) {
        frozenRef.current = Math.max(frozenRef.current, p);
        p = frozenRef.current;
      }

      setProgress(p);
      rafId = requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) rafId = requestAnimationFrame(tick);
          else cancelAnimationFrame(rafId);
        });
      },
      { root: scrollEl ?? null, threshold: 0 },
    );

    cacheTriggers();
    observer.observe(el);

    let resizeTimer: ReturnType<typeof setTimeout>;
    function onResize(): void {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(cacheTriggers, 150);
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimer);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return progress;
}
