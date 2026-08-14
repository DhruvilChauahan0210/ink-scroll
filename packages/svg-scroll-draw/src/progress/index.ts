import type { EasingName, TriggerConfig, ScrollDrawInstance } from '../core/types';
import {
  EASINGS, parseTrigger, computeProgress, computeTriggers, measureTriggerFrame,
} from '../core/utils';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrollProgressOptions {
  /**
   * CSS custom property to set on the target element (raw 0–1, unclamped on
   * the eased side). Default: `'--scroll-progress'`.
   */
  variable?: string;
  /**
   * Second property name for the eased value. Default: `'--scroll-progress-eased'`.
   * Set to `null` to skip writing the eased variable.
   */
  easedVariable?: string | null;
  trigger?: TriggerConfig;
  easing?: EasingName | ((t: number) => number);
  speed?: number;
  /** Scroll axis. Default: 'y'. */
  axis?: 'x' | 'y';
  /** Custom scroll container. Default: window. */
  scrollContainer?: string | Element;
  onProgress?: (raw: number, eased: number) => void;
}

// ── Implementation ────────────────────────────────────────────────────────────

const NOOP: ScrollDrawInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0,
};

/**
 * Expose scroll progress as CSS custom properties on a target element.
 *
 * The raw (linear) value and eased value are written every frame so CSS
 * transitions, `calc()` expressions, and `@property` animations can drive
 * visual effects with zero per-frame JS work beyond the variable update.
 *
 * @example
 * // JS
 * scrollProgress('#hero', { easing: 'ease-in-out' });
 *
 * // CSS
 * #hero {
 *   opacity: calc(var(--scroll-progress));
 *   transform: translateY(calc((1 - var(--scroll-progress-eased)) * 40px));
 * }
 */
export function scrollProgress(
  target: string | Element,
  options: ScrollProgressOptions = {},
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;

  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) {
    warn('scrollProgress: element not found:', target);
    return NOOP;
  }

  const htmlEl = el as HTMLElement;
  const {
    variable      = '--scroll-progress',
    easedVariable = '--scroll-progress-eased',
    trigger       = {},
    easing        = 'linear',
    speed         = 1,
    axis          = 'y',
    scrollContainer,
    onProgress,
  } = options;

  const easeFn      = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS.linear);
  const startConfig = parseTrigger(trigger.start ?? 'top bottom');
  const endConfig   = parseTrigger(trigger.end   ?? 'bottom top');

  const scrollEl: Element | null =
    typeof scrollContainer === 'string'
      ? document.querySelector(scrollContainer)
      : (scrollContainer ?? null);

  let tStart       = 0;
  let tEnd         = 0;
  let rafId        = 0;
  let isVisible    = false;
  let paused       = false;
  let currentRaw   = 0;

  const scrollPos = (): number => {
    if (scrollEl) return axis === 'x' ? scrollEl.scrollLeft : scrollEl.scrollTop;
    return axis === 'x' ? window.scrollX : window.scrollY;
  };

  const vpSize = (): number => {
    if (scrollEl) return axis === 'x' ? scrollEl.clientWidth : scrollEl.clientHeight;
    return axis === 'x' ? window.innerWidth : window.innerHeight;
  };

  function cacheTriggers(): void {
    const frame  = measureTriggerFrame(htmlEl, scrollEl, axis);
    const result = computeTriggers(frame, frame.scroll, vpSize(), startConfig, endConfig);
    tStart = result.tStart;
    tEnd   = result.tEnd;
  }

  function applyProgress(raw: number, eased: number): void {
    htmlEl.style.setProperty(variable, String(raw));
    if (easedVariable != null) htmlEl.style.setProperty(easedVariable, String(eased));
    onProgress?.(raw, eased);
  }

  function update(): void {
    if (!isVisible || paused) return;
    const raw   = computeProgress(scrollPos(), tStart, tEnd, speed);
    const eased = easeFn(raw);
    currentRaw  = raw;
    applyProgress(raw, eased);
    rafId = requestAnimationFrame(update);
  }

  cacheTriggers();

  // Apply initial values immediately
  {
    const initRaw   = computeProgress(scrollPos(), tStart, tEnd, speed);
    const initEased = easeFn(initRaw);
    currentRaw = initRaw;
    applyProgress(initRaw, initEased);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        isVisible = e.isIntersecting;
        if (isVisible && !paused) rafId = requestAnimationFrame(update);
        else cancelAnimationFrame(rafId);
      });
    },
    { root: scrollEl ?? null },
  );

  let resizeTimer: ReturnType<typeof setTimeout>;
  function onResize(): void {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(cacheTriggers, 150);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  observer.observe(el!);

  _register(el, {
    type: 'animate',
    getProgress: () => currentRaw,
    getTrigger:  () => ({ tStart, tEnd }),
  });

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      clearTimeout(resizeTimer);
      htmlEl.style.removeProperty(variable);
      if (easedVariable != null) htmlEl.style.removeProperty(easedVariable);
      _unregister(el);
    },
    replay() {
      cacheTriggers();
    },
    pause() {
      paused = true;
      cancelAnimationFrame(rafId);
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (isVisible) rafId = requestAnimationFrame(update);
    },
    seek(p: number) {
      const raw   = Math.min(1, Math.max(0, p));
      const eased = easeFn(raw);
      currentRaw  = raw;
      paused      = true;
      cancelAnimationFrame(rafId);
      applyProgress(raw, eased);
    },
    getProgress() { return currentRaw; },
  };
}
