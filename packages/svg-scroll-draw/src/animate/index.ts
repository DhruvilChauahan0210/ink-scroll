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
  // The travel is `speed` times the element's own size. As a percentage the
  // browser resolves it against the element's box on every frame; it used to
  // be measured once in px and baked in, so a layer that grew after init (an
  // image loading inside it) kept travelling its first height.
  const travel = -speed * 100;

  // An SVG child resolves transform percentages against the SVG's viewport
  // unless its transform box is its own: give it its own, and give it back.
  const style = (el as HTMLElement).style;
  const svg = !!(el as SVGElement).ownerSVGElement;
  const box = style.getPropertyValue('transform-box');
  if (svg) style.setProperty('transform-box', 'fill-box');

  const inst = createAnimateEngine(el, {
    props: axis === 'x'
      ? { transform: [`translateX(0%)`, `translateX(${travel}%)`] }
      : { transform: [`translateY(0%)`, `translateY(${travel}%)`] },
    trigger: trigger ?? { start: 'top bottom', end: 'bottom top' },
    easing,
    native: false,
    onProgress,
  });
  if (!svg) return inst;
  return { ...inst, destroy() { inst.destroy(); style.setProperty('transform-box', box); } };
}
