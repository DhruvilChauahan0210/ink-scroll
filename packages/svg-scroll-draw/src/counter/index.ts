import type { Easing, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { resolveEasing } from '../core/easing';
import { parseTrigger, computeProgress, computeTriggers } from '../core/trigger';
import { _register, _unregister } from '../core/registry';
import { warn } from '../core/env';
import { finishWhenReduced } from '../core/motion-live';
import { frameGate } from '../core/frame-gate';

// ── Public types ──────────────────────────────────────────────────────────────

export interface ScrollCounterOptions {
  from?: number;
  to: number;
  format?: (value: number) => string;
  easing?: Easing;
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

  const easeFn      = resolveEasing(easing, 'ease-out');
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

  /** Where the scroll is through the window: what runs the frames (core/frame-gate). */
  const at = (): number => computeProgress(scrollPos(), tStart, tEnd, 1);

  function update(): void {
    const progress = at();
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
  }

  cacheTriggers();

  // Apply correct initial state — prevents a flash before the first frame.
  {
    frozenRaw = computeProgress(scrollPos(), tStart, tEnd, 1);
    const initAlpha = easeFn(frozenRaw);
    currentAlpha = initAlpha;
    applyAlpha(initAlpha);
  }

  // The frames follow the trigger window, not an observer of the element: a
  // jump across the whole window never had it on screen, so the count stayed on
  // its first number and onComplete never fired. The gate also re-measures on
  // a resize or a layout change: images, fonts, late content.
  const gate = frameGate(window, [el], at, update, cacheTriggers);

  _register(el, {
    type: 'counter',
    getProgress: () => currentAlpha,
    getTrigger: () => ({ tStart, tEnd }),
  });

  const resume = (): void => gate.hold(false);

  return {
    destroy() {
      gate.off();
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
    pause: () => gate.hold(true),
    resume,
    seek(p: number) {
      const clamped = Math.min(1, Math.max(0, p));
      currentAlpha  = clamped;
      frozenAlpha   = clamped;
      frozenRaw     = 0;
      gate.hold(true);
      applyAlpha(clamped);
    },
    getProgress() { return currentAlpha; },
  };
}
