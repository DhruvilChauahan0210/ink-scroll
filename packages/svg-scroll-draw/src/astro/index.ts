import { createEngine } from '../core/engine';
import { createAnimateEngine } from '../animate/engine';
import { scrollCounter } from '../counter';
import { scrollText } from '../text';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollTextOptions } from '../text';
import { warn } from '../core/env';

export { scrollDraw } from '../core/scroll-draw';
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

// ── Live options ─────────────────────────────────────────────────────────────

/** The engine running on an element for one kind, and how to rebuild it. */
type Running = { inst: ScrollDrawInstance; key: string; build: () => void; users: number };

const running = new WeakMap<Element, Map<string, Running>>();
let watcher: MutationObserver | undefined;

/**
 * Start `kind` on `el` from its options attribute, and keep it in step with it.
 *
 * The init functions read the JSON once, so editing the attribute later did
 * nothing (2.17.0 made the framework wrappers rebuild on a real change), and
 * calling init again — on every `astro:page-load` with View Transitions — put a
 * second engine on an element that already had one. Now one engine runs per
 * element and kind: an equal attribute keeps it, a changed one rebuilds it, and
 * a MutationObserver rebuilds it when the attribute is edited. The instance
 * returned follows whichever engine is current.
 */
function live(el: HTMLElement, kind: string, raw: () => string, make: (raw: string) => ScrollDrawInstance): ScrollDrawInstance {
  const kinds = running.get(el) ?? new Map<string, Running>();
  running.set(el, kinds);
  const build = () => {
    const key = raw();
    const cur = kinds.get(kind);
    if (cur && cur.key === key) return;
    cur?.inst.destroy();
    kinds.set(kind, { inst: make(key), key, build, users: cur?.users ?? 0 });
  };
  build();
  // Every handle is a user of the one engine: it stops when the last one goes.
  kinds.get(kind)!.users++;
  let live = true;
  if (typeof MutationObserver !== 'undefined') {
    watcher ??= new MutationObserver((records) =>
      records.forEach((r) => running.get(r.target as Element)?.forEach((k) => k.build())),
    );
    // One filter for every kind: observing again replaces the options, so a
    // filter for this kind alone stopped the element's other kinds updating.
    watcher.observe(el, { attributes: true, attributeFilter: ['draw', 'animate', 'counter', 'text'].map((k) => `data-scroll-${k}-options`).concat('data-scroll-drawoptions') });
  }
  const now = () => kinds.get(kind)?.inst;
  return {
    destroy: () => {
      const cur = kinds.get(kind);
      if (!live || !cur) return;
      live = false;
      if (--cur.users > 0) return;
      cur.inst.destroy();
      kinds.delete(kind);
    },
    replay: () => now()?.replay(),
    pause: () => now()?.pause(),
    resume: () => now()?.resume(),
    seek: (p) => now()?.seek(p),
    getProgress: () => now()?.getProgress() ?? 0,
    refresh: () => now()?.refresh?.(),
  };
}

/** Parse an options attribute; invalid JSON gives `fallback`. */
function parse<O>(raw: string, fallback: O): O {
  try { return raw ? (JSON.parse(raw) as O) : fallback; } catch { return fallback; }
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
  return Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-draw]')).map((el) =>
    live(
      el,
      'draw',
      () => el.dataset.scrollDrawOptions ?? el.dataset.scrollDrawoptions ?? '',
      (raw) => createEngine(el, parse<ScrollDrawOptions>(raw, {})),
    ),
  );
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
  return Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-animate]')).map((el) =>
    live(
      el,
      'animate',
      () => el.dataset.scrollAnimateOptions ?? '',
      (raw) => createAnimateEngine(el, parse<ScrollAnimateOptions>(raw, { props: {} })),
    ),
  );
}

// ── initScrollCounter ─────────────────────────────────────────────────────────

/**
 * Auto-initialises all [data-scroll-counter] elements on the page.
 * Options are read from the data-scroll-counter-options JSON attribute.
 * The `to` value is required — pass it via JSON options. `format` is a function,
 * so it cannot come from JSON: use `decimals`, or call scrollCounter() yourself.
 *
 * @example
 * <span
 *   data-scroll-counter
 *   data-scroll-counter-options='{"to":1250000,"decimals":0,"once":true}'
 * />
 *
 * <script>
 *   import { initScrollCounter } from 'svg-scroll-draw/astro';
 *   initScrollCounter();
 * </script>
 */
export function initScrollCounter(root: Element | Document | null = defaultRoot()): ScrollDrawInstance[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-counter]')).map((el) =>
    live(el, 'counter', () => el.dataset.scrollCounterOptions ?? '', (raw) => {
      const opts = parse<Partial<ScrollCounterOptions>>(raw, {});
      if (!opts.to && opts.to !== 0) {
        warn('initScrollCounter: element missing "to" in options JSON:', el);
        opts.to = 0;
      }
      // JSON cannot carry a function. A string here threw "format is not a
      // function" on the first frame, and the docs' own example passed one.
      if (typeof opts.format !== 'function' && opts.format !== undefined) {
        warn('initScrollCounter: "format" must be a function, so it cannot come from JSON; use "decimals":', el);
        delete opts.format;
      }
      return scrollCounter(el, opts as ScrollCounterOptions);
    }),
  );
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
  return Array.from(root.querySelectorAll<HTMLElement>('[data-scroll-text]')).map((el) =>
    live(
      el,
      'text',
      () => el.dataset.scrollTextOptions ?? '',
      (raw) => scrollText(el, parse<ScrollTextOptions>(raw, {})),
    ),
  );
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
