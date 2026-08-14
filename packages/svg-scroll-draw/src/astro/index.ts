import { createEngine } from '../core/engine';
import { createAnimateEngine } from '../animate';
import { scrollCounter } from '../counter';
import { scrollText } from '../text';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollTextOptions } from '../text';
import { warn } from '../core/env';

export { scrollDraw } from '../index';
export type { ScrollDrawOptions, ScrollDrawInstance };

/**
 * The document, or null when there isn't one.
 *
 * Astro is a server-first framework: its components run on the server by
 * default, and `root: Element | Document = document` is evaluated at call time —
 * so calling any of these from component frontmatter, rather than from a client
 * `<script>`, threw `ReferenceError: document is not defined` and took the render
 * with it. Every other entry point in this library degrades to a no-op without a
 * DOM; this one is the most likely to be called without one.
 */
function defaultRoot(): Element | Document | null {
  return typeof document === 'undefined' ? null : document;
}

// ── initScrollDraw ────────────────────────────────────────────────────────────

/**
 * Auto-initialises all elements with a [data-scroll-draw] attribute on the page.
 * Options are read from the data-scroll-draw-options JSON attribute.
 *
 * @example
 * // In your Astro component:
 * <div data-scroll-draw data-scroll-draw-options='{"easing":"ease-out","fade":true}'>
 *   <svg>...</svg>
 * </div>
 *
 * <script>
 *   import { initScrollDraw } from 'svg-scroll-draw/astro';
 *   initScrollDraw();
 * </script>
 */
export function initScrollDraw(root: Element | Document | null = defaultRoot()): ScrollDrawInstance[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-draw]')).map((el) => {
    let opts: ScrollDrawOptions = {};
    try {
      const raw = el.dataset.scrollDrawOptions ?? el.dataset.scrollDrawoptions ?? '';
      if (raw) opts = JSON.parse(raw);
    } catch { /* ignore invalid JSON */ }
    return createEngine(el, opts);
  });
}

// ── initScrollAnimate ─────────────────────────────────────────────────────────

/**
 * Auto-initialises all [data-scroll-animate] elements on the page.
 * Options (including `props`) are read from the data-scroll-animate-options JSON attribute.
 *
 * @example
 * <div
 *   data-scroll-animate
 *   data-scroll-animate-options='{"props":{"opacity":[0,1],"transform":["translateY(40px)","translateY(0)"]},"easing":"ease-out","once":true}'
 * >
 *   Content that fades and slides in
 * </div>
 *
 * <script>
 *   import { initScrollAnimate } from 'svg-scroll-draw/astro';
 *   initScrollAnimate();
 * </script>
 */
export function initScrollAnimate(root: Element | Document | null = defaultRoot()): ScrollDrawInstance[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-animate]')).map((el) => {
    let opts: ScrollAnimateOptions = { props: {} };
    try {
      const raw = el.dataset.scrollAnimateOptions ?? '';
      if (raw) opts = JSON.parse(raw) as ScrollAnimateOptions;
    } catch { /* ignore invalid JSON */ }
    return createAnimateEngine(el, opts);
  });
}

// ── initScrollCounter ─────────────────────────────────────────────────────────

/**
 * Auto-initialises all [data-scroll-counter] elements on the page.
 * Options are read from the data-scroll-counter-options JSON attribute.
 * The `to` value is required — pass it via JSON options.
 *
 * @example
 * <span
 *   data-scroll-counter
 *   data-scroll-counter-options='{"to":1250000,"format":"$%d","once":true}'
 * />
 *
 * <script>
 *   import { initScrollCounter } from 'svg-scroll-draw/astro';
 *   initScrollCounter();
 * </script>
 */
export function initScrollCounter(root: Element | Document | null = defaultRoot()): ScrollDrawInstance[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-counter]')).map((el) => {
    let opts: Partial<ScrollCounterOptions> = {};
    try {
      const raw = el.dataset.scrollCounterOptions ?? '';
      if (raw) opts = JSON.parse(raw) as Partial<ScrollCounterOptions>;
    } catch { /* ignore invalid JSON */ }
    if (!opts.to && opts.to !== 0) {
      warn('initScrollCounter: element missing "to" in options JSON:', el);
      opts.to = 0;
    }
    return scrollCounter(el, opts as ScrollCounterOptions);
  });
}

// ── initScrollText ────────────────────────────────────────────────────────────

/**
 * Auto-initialises all [data-scroll-text] elements on the page.
 * Options are read from the data-scroll-text-options JSON attribute.
 *
 * @example
 * <h2
 *   data-scroll-text
 *   data-scroll-text-options='{"split":"words","stagger":0.05,"once":true}'
 * >
 *   Animate on scroll.
 * </h2>
 *
 * <script>
 *   import { initScrollText } from 'svg-scroll-draw/astro';
 *   initScrollText();
 * </script>
 */
export function initScrollText(root: Element | Document | null = defaultRoot()): ScrollDrawInstance[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-text]')).map((el) => {
    let opts: ScrollTextOptions = {};
    try {
      const raw = el.dataset.scrollTextOptions ?? '';
      if (raw) opts = JSON.parse(raw) as ScrollTextOptions;
    } catch { /* ignore invalid JSON */ }
    return scrollText(el, opts);
  });
}

// ── initAll ───────────────────────────────────────────────────────────────────

/**
 * Convenience — runs all four init functions in one call.
 * Pass a root element to scope to a specific subtree.
 *
 * @example
 * <script>
 *   import { initAll } from 'svg-scroll-draw/astro';
 *   initAll(); // Initialises scrollDraw, scrollAnimate, scrollCounter, scrollText
 * </script>
 */
export function initAll(root: Element | Document | null = defaultRoot()): {
  draw: ScrollDrawInstance[];
  animate: ScrollDrawInstance[];
  counter: ScrollDrawInstance[];
  text: ScrollDrawInstance[];
} {
  return {
    draw:    initScrollDraw(root),
    animate: initScrollAnimate(root),
    counter: initScrollCounter(root),
    text:    initScrollText(root),
  };
}
