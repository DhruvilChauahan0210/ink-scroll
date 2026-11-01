/*
 * scrollAnimate and scrollParallax, the public faces of the animate engine.
 *
 * The engine itself lives in ./engine, and the other modules that drive it
 * (scrollReveal, scrollHorizontal, the framework wrappers) import it from there,
 * not from here: in the chunked ESM build a file is the unit of sharing, so
 * importing this one would add these two functions to every entry that only
 * needs the engine.
 */
import type { EasingName, ScrollDrawInstance, TriggerConfig } from '../core/types';
import { warn } from '../core/env';
import { createAnimateEngine, type ScrollAnimateOptions } from './engine';

export { createAnimateEngine, interpolateValue } from './engine';
export type { ScrollAnimateOptions } from './engine';

export interface ScrollParallaxOptions {
  speed?: number;
  axis?: 'x' | 'y';
  easing?: EasingName | ((t: number) => number);
  trigger?: TriggerConfig;
  onProgress?: (alpha: number) => void;
}

// ── Public API ────────────────────────────────────────────────────────────────

const NOOP: ScrollDrawInstance = {
  destroy: () => {}, replay: () => {}, pause: () => {},
  resume: () => {}, seek: () => {}, getProgress: () => 0,
};

export function scrollAnimate(
  target: string | Element,
  options: ScrollAnimateOptions,
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) {
    warn('scrollAnimate: element not found:', target);
    return NOOP;
  }
  return createAnimateEngine(el, options);
}

export function scrollParallax(
  target: string | Element,
  options: ScrollParallaxOptions = {},
): ScrollDrawInstance {
  if (typeof window === 'undefined') return NOOP;
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) {
    warn('scrollParallax: element not found:', target);
    return NOOP;
  }

  const { speed = 0.3, axis = 'y', easing = 'linear', trigger, onProgress } = options;
  const rect   = el.getBoundingClientRect();
  const size   = axis === 'x' ? rect.width : rect.height;
  const travel = speed * size;

  return createAnimateEngine(el, {
    props: axis === 'x'
      ? { transform: [`translateX(0px)`, `translateX(${-travel}px)`] }
      : { transform: [`translateY(0px)`, `translateY(${-travel}px)`] },
    trigger: trigger ?? { start: 'top bottom', end: 'bottom top' },
    easing,
    native: false,
    onProgress,
  });
}
