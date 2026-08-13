import type { EasingName, TriggerConfig, ScrollDrawInstance } from '../core/types';
import { createAnimateEngine } from '../animate';
import { warn } from '../core/env';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ScrollHorizontalOptions {
  /**
   * Total horizontal travel distance in pixels.
   * Default: `track.scrollWidth - window.innerWidth` (full content width minus viewport).
   */
  distance?: number;
  /**
   * Trigger window for the scroll → horizontal mapping.
   * Default: `{ start: 'top top', end: 'bottom bottom' }` — full container height.
   */
  trigger?: TriggerConfig;
  /** Easing for the horizontal movement. Default: `'linear'` (scrub feel). */
  easing?: EasingName | ((t: number) => number);
  /** Custom scroll container. Default: window. */
  scrollContainer?: string | Element;
  onProgress?: (progress: number) => void;
}

export interface ScrollHorizontalInstance extends ScrollDrawInstance {
  /** Recalculate travel distance after layout change. */
  refresh: () => void;
}

const NOOP: ScrollHorizontalInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0, refresh: () => {},
};

/**
 * Drive horizontal movement (translateX) from vertical scroll.
 *
 * The Apple / Stripe "scroll to reveal horizontal sections" pattern.
 * You handle the sticky + overflow CSS; `scrollHorizontal` drives the translateX.
 *
 * Minimal CSS setup:
 *   .outer  { height: 400vh; }
 *   .sticky { position: sticky; top: 0; height: 100vh; overflow: hidden; }
 *   .track  { display: flex; width: max-content; }
 *
 * @example
 * scrollHorizontal('.track', {
 *   distance: 3 * window.innerWidth,
 *   trigger:  { start: 'top top', end: 'bottom bottom' },
 *   easing:   'linear',
 * });
 */
export function scrollHorizontal(
  track: string | Element,
  options: ScrollHorizontalOptions = {},
): ScrollHorizontalInstance {
  if (typeof window === 'undefined') return NOOP;

  const el = typeof track === 'string' ? document.querySelector(track) : track;
  if (!el) {
    warn('scrollHorizontal: track element not found:', track);
    return NOOP;
  }

  const htmlEl = el as HTMLElement;
  const {
    easing          = 'linear',
    trigger         = { start: 'top top', end: 'bottom bottom' },
    scrollContainer,
    onProgress,
  } = options;

  function resolveDistance(): number {
    return options.distance ?? (htmlEl.scrollWidth - window.innerWidth);
  }

  let distance = resolveDistance();
  let inner = createAnimateEngine(htmlEl, buildOptions(distance));

  function buildOptions(dist: number) {
    return {
      props: { transform: [`translateX(0px)`, `translateX(${-dist}px)`] } as Record<string, [string, string]>,
      trigger,
      easing,
      native: false,
      ...(scrollContainer !== undefined && { scrollContainer }),
      ...(onProgress      !== undefined && { onProgress }),
    };
  }

  return {
    destroy()  { inner.destroy(); },
    replay()   { inner.replay(); },
    pause()    { inner.pause(); },
    resume()   { inner.resume(); },
    seek(p)    { inner.seek(p); },
    getProgress() { return inner.getProgress(); },
    refresh() {
      inner.destroy();
      distance = resolveDistance();
      inner    = createAnimateEngine(htmlEl, buildOptions(distance));
    },
  };
}
