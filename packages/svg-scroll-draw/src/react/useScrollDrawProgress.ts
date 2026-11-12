import { useState, useEffect, useRef, type RefObject } from 'react';
import { EASINGS } from '../core/easing';
import { parseTrigger, computeProgress, computeTriggers } from '../core/trigger';
import { measureTriggerFrame } from '../core/trigger-frame';
import { watchLayout } from '../core/layout-watch';
import { watchReducedMotion } from '../core/motion-watch';
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

  // The furthest raw progress seen, for `once`; eased after, so an overshooting
  // easing settles at 1 rather than holding its peak.
  const frozenRef = useRef(0);

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

    const startConfig = parseTrigger(trigger.start || 'top bottom');
    const endConfig   = parseTrigger(trigger.end   || 'bottom top');

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

    // Measured as the engines measure it (core/trigger-frame). With a
    // scrollContainer this added the element's viewport top to the container's
    // scroll offset, leaving out where the container sits: a panel 400px down
    // read 0.19 where scrollProgress read 0.5, and never reached 1.
    function cacheTriggers(): void {
      const frame = measureTriggerFrame(el, scrollEl, axis);
      ({ tStart, tEnd } = computeTriggers(frame, frame.scroll, vpSize(), startConfig, endConfig));
    }

    function tick(): void {
      if (!isVisible) return;

      const { speed = 1, easing = 'linear', once = false } = optsRef.current;
      const easeFn = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS.linear);

      const raw = computeProgress(scrollPos(), tStart, tEnd, speed);
      const p = easeFn(once ? (frozenRef.current = Math.max(frozenRef.current, raw)) : raw);

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
    // Layout changes that are not window resizes: images, fonts, late content.
    const unwatch = watchLayout([el], onResize);

    // Reduced motion turned on mid-visit: complete, and no more ticks, as at
    // mount under it. One way, as in every engine (core/motion-live).
    const unwatchMotion = watchReducedMotion((reduced) => {
      if (!reduced) return;
      unwatchMotion();
      cancelAnimationFrame(rafId);
      observer.disconnect();
      setProgress(1);
    });

    return () => {
      unwatchMotion();
      unwatch();
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
