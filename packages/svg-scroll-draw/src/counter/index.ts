import type { EasingName, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { EASINGS, parseTrigger, computeProgress, computeTriggers } from '../core/utils';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';

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
  const el = raw;

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
  const startConfig = parseTrigger(trigger.start ?? 'top 80%');
  const endConfig   = parseTrigger(trigger.end   ?? 'top 20%');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    el.textContent = fmt(to);
    onComplete?.();
    return NOOP;
  }

  // The initial text is written further down, once the trigger window is known:
  // `applyAlpha(initAlpha)` renders the value for the CURRENT scroll position,
  // which for an element already scrolled past is its final value, not `from`. A
  // `fmt(from)` write here was dead — always overwritten a few lines later in the
  // same task, so no frame could ever show it.

  let tStart       = 0;
  let tEnd         = 0;
  let rafId        = 0;
  let isVisible    = false;
  let paused       = false;
  let frozenAlpha  = -1;
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
    tStart = result.tStart;
    tEnd   = result.tEnd;
  }

  function applyAlpha(alpha: number): void {
    el.textContent = fmt(from + (to - from) * alpha);
    el.style.setProperty('--scroll-draw-progress', String(alpha));
  }

  function update(): void {
    if (!isVisible || paused) return;
    let alpha = easeFn(computeProgress(scrollPos(), tStart, tEnd, 1));
    if (once) {
      frozenAlpha = Math.max(frozenAlpha, alpha);
      alpha = frozenAlpha;
    }
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
    const initAlpha = easeFn(computeProgress(scrollPos(), tStart, tEnd, 1));
    if (once && initAlpha > 0) frozenAlpha = initAlpha;
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
  observer.observe(el);

  _register(el, {
    type: 'counter',
    getProgress: () => currentAlpha,
    getTrigger: () => ({ tStart, tEnd }),
  });

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      clearTimeout(resizeTimer);
      _unregister(el);
    },
    replay() {
      frozenAlpha  = -1;
      completed    = false;
      currentAlpha = 0;
      paused       = false;
      applyAlpha(0);
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
      const clamped = Math.min(1, Math.max(0, p));
      currentAlpha  = clamped;
      frozenAlpha   = clamped;
      paused        = true;
      cancelAnimationFrame(rafId);
      applyAlpha(clamped);
    },
    getProgress() { return currentAlpha; },
  };
}
