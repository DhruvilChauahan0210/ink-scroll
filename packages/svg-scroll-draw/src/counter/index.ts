import type { EasingName, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { EASINGS } from '../core/easing';
import { parseTrigger, computeProgress, computeTriggers } from '../core/trigger';
import { _register, _unregister } from '../core/registry';
import { watchLayout } from '../core/layout-watch';
import { warn } from '../core/env';
import { finishWhenReduced } from '../core/motion-live';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ScrollCounterOptions {
  from?: number;
  to: number;
  format?: (value: number) => string;
  easing?: EasingName | ((t: number) => number);
  trigger?: TriggerConfig;
  once?: boolean;
  decimals?: number;
  onComplete?: () => void;
}

// ── Engine ────────────────────────────────────────────────────────────────────

const NOOP: ScrollDrawInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0,
};

export function scrollCounter(
  target: string | Element,
  options: ScrollCounterOptions,
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;

  const raw = (typeof target === 'string' ? document.querySelector(target) : target) as HTMLElement | null;
  if (!raw) {
    warn('scrollCounter: element not found:', target);
    return NOOP;
  }
  // Reduced motion turned on mid-visit writes the final number as a page loaded
  // under it would (core/motion-live).
  return finishWhenReduced(options, (opts, reduced) => buildCounter(raw, opts, reduced));
}

function buildCounter(el: HTMLElement, options: ScrollCounterOptions, prefersReduced: boolean): ScrollDrawInstance {

  const {
    from        = 0,
    to,
    format,
    easing      = 'ease-out',
    trigger     = {},
    once        = true,
    decimals,
    onComplete,
  } = options;

  const fmt: (n: number) => string =
    decimals !== undefined
      ? (n) => n.toFixed(decimals)
      : (format ?? ((n) => String(Math.round(n))));

  const easeFn      = typeof easing === 'function' ? easing : (EASINGS[easing] ?? EASINGS['ease-out']);
  const startConfig = parseTrigger(trigger.start || 'top 80%');
  const endConfig   = parseTrigger(trigger.end   || 'top 20%');

  if (prefersReduced) {
    el.textContent = fmt(to);
    onComplete?.();
    return { ...NOOP, getProgress: () => 1 };
  }

  // The initial text is written further down, once the trigger window is known:
  // `applyAlpha(initAlpha)` renders the value for the CURRENT scroll position,
  // which for an element already scrolled past is its final value, not `from`. A
  // `fmt(from)` write here was dead — always overwritten a few lines later in the
  // same task, so no frame could ever show it.

  let tStart       = 0;
  let tEnd         = 0;
  let measured     = false;
  let rafId        = 0;
  let isVisible    = false;
  let paused       = false;
  /** With `once`, the floor seek() set: -1 when there is none. */
  let frozenAlpha  = -1;
  /**
   * With `once`, the furthest raw scroll progress, eased after. Holding the
   * eased value with Math.max froze spring and elastic past `to` for good
   * (elastic from 0 to 1000 ended on 1273 in Chromium), and flattened bounce's dips.
   */
  let frozenRaw    = 0;
  let currentAlpha = 0;
  let completed    = false;

  const scrollPos = (): number => window.scrollY;
  const vpSize    = (): number => window.innerHeight;

  function cacheTriggers(): void {
    const rect = el.getBoundingClientRect();
    const result = computeTriggers(
      { top: rect.top, height: rect.height },
      scrollPos(), vpSize(), startConfig, endConfig,
    );
    // The counter rewrites its own text, which can change its height; a move
    // under a pixel is rounding, and taking it could re-measure forever.
    if (measured && Math.abs(result.tStart - tStart) < 1 && Math.abs(result.tEnd - tEnd) < 1) return;
    measured = true;
    tStart = result.tStart;
    tEnd   = result.tEnd;
  }

  /** The page's own --scroll-draw-progress, for destroy() to put back: '' removes it. */
  const savedVar = el.style.getPropertyValue('--scroll-draw-progress');

  function applyAlpha(alpha: number): void {
    el.textContent = fmt(from + (to - from) * alpha);
    el.style.setProperty('--scroll-draw-progress', String(alpha));
  }

  function update(): void {
    if (!isVisible || paused) return;
    const progress = computeProgress(scrollPos(), tStart, tEnd, 1);
    const alpha = once
      ? Math.max(frozenAlpha, easeFn(frozenRaw = Math.max(frozenRaw, progress)))
      : easeFn(progress);
    currentAlpha = alpha;
    applyAlpha(alpha);
    if (alpha >= 1 && !completed) {
      completed = true;
      onComplete?.();
    } else if (alpha < 1 && !once) {
      completed = false;
    }
    rafId = requestAnimationFrame(update);
  }

  cacheTriggers();

  // Apply correct initial state — prevents flash before first IO tick.
  {
    frozenRaw = computeProgress(scrollPos(), tStart, tEnd, 1);
    const initAlpha = easeFn(frozenRaw);
    currentAlpha = initAlpha;
    applyAlpha(initAlpha);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        isVisible = e.isIntersecting;
        if (isVisible && !paused) rafId = requestAnimationFrame(update);
        else cancelAnimationFrame(rafId);
      });
    },
  );

  let resizeTimer: ReturnType<typeof setTimeout>;
  function onResize(): void {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(cacheTriggers, 150);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);
  // Layout changes that are not window resizes: images, fonts, late content.
  const unwatch = watchLayout([el], onResize);
  observer.observe(el);

  _register(el, {
    type: 'counter',
    getProgress: () => currentAlpha,
    getTrigger: () => ({ tStart, tEnd }),
  });

  function resume(): void {
    if (!paused) return;
    paused = false;
    if (isVisible) rafId = requestAnimationFrame(update);
  }

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      unwatch();
      clearTimeout(resizeTimer);
      // The number stays as it was last drawn; the progress variable goes, as
      // every other engine's does (core/motion-live: destroy puts it back).
      el.style.setProperty('--scroll-draw-progress', savedVar);
      _unregister(el);
    },
    replay() {
      frozenAlpha  = -1;
      frozenRaw    = 0;
      completed    = false;
      currentAlpha = 0;
      applyAlpha(0);
      // After pause() or seek() the loop is stopped. replay() used to clear
      // `paused` and leave it so, and resume() then had nothing to restart.
      resume();
    },
    pause() {
      paused = true;
      cancelAnimationFrame(rafId);
    },
    resume,
    seek(p: number) {
      const clamped = Math.min(1, Math.max(0, p));
      currentAlpha  = clamped;
      frozenAlpha   = clamped;
      frozenRaw     = 0;
      paused        = true;
      cancelAnimationFrame(rafId);
      applyAlpha(clamped);
    },
    getProgress() { return currentAlpha; },
  };
}
