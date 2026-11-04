import { createEffect, onCleanup, untrack } from 'solid-js';
import { createEngine } from '../core/engine';
import { liveFns, optionsKey } from '../core/reactive';
import { createAnimateEngine } from '../animate/engine';
import { scrollCounter } from '../counter';
import { scrollVideo } from '../video';
import { scrollText } from '../text';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollVideoOptions } from '../video';
import type { ScrollTextOptions } from '../text';

export type { ScrollDrawOptions, ScrollAnimateOptions, ScrollCounterOptions, ScrollVideoOptions, ScrollTextOptions };

/** Options as a plain object, or an accessor that keeps them live. */
export type MaybeAccessor<T> = T | (() => T);

// ── The engine behind each hook ──────────────────────────────────────────────

/**
 * Creates the engine once the ref is set and rebuilds it when an option
 * changes. The effect reads every option — through an accessor, or through
 * Solid props' getters — so it subscribes to them; the fingerprint
 * (`optionsKey`) decides whether a change is real. The engine is built
 * untracked, so nothing it reads while starting becomes a dependency.
 */
function bind<E extends Element, O extends object>(
  options: MaybeAccessor<O>,
  create: (el: E, options: O) => ScrollDrawInstance,
) {
  let el: E | undefined;
  let instance: ScrollDrawInstance | undefined;
  let key: string | undefined;
  let latest: O;

  createEffect(() => {
    latest = typeof options === 'function' ? (options as () => O)() : options;
    const next = optionsKey(latest);
    if (!el || next === key) return;
    key = next;
    untrack(() => {
      instance?.destroy();
      instance = create(el!, liveFns(latest, () => latest));
    });
  });

  onCleanup(() => {
    instance?.destroy();
    instance = key = undefined;
  });

  return {
    ref: (node: E) => { el = node; },
    getInstance: () => instance,
  };
}

// ── useScrollDraw ─────────────────────────────────────────────────────────────

/**
 * SolidJS hook — returns a ref setter to attach to any container element.
 * Options can be an accessor (or a component's props) to keep them live:
 * `useScrollDraw(() => ({ speed: speed() }))` rebuilds the draw when the
 * signal changes. A plain object is read once.
 *
 * @example
 * import { useScrollDraw } from 'svg-scroll-draw/solid';
 *
 * function Hero() {
 *   const ref = useScrollDraw({ easing: 'spring', fade: true });
 *   return <div ref={ref}><svg>...</svg></div>;
 * }
 */
export function useScrollDraw(options: MaybeAccessor<ScrollDrawOptions> = {}) {
  return bind<HTMLElement, ScrollDrawOptions>(options, createEngine).ref;
}

/**
 * Returns both the ref setter and a getter for the live instance,
 * so you can call instance.replay() from component logic.
 *
 * @example
 * const { ref, getInstance } = createScrollDraw({ easing: 'ease-out' });
 * <div ref={ref}><svg>...</svg></div>
 * <button onClick={() => getInstance()?.replay()}>Replay</button>
 */
export function createScrollDraw(options: MaybeAccessor<ScrollDrawOptions> = {}) {
  return bind<HTMLElement, ScrollDrawOptions>(options, createEngine);
}

// ── useScrollAnimate ──────────────────────────────────────────────────────────

/**
 * SolidJS hook — animate any CSS property on any element driven by scroll.
 *
 * @example
 * import { useScrollAnimate } from 'svg-scroll-draw/solid';
 *
 * function Card() {
 *   const ref = useScrollAnimate({
 *     props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
 *     easing: 'ease-out',
 *     once: true,
 *   });
 *   return <div ref={ref}>...</div>;
 * }
 */
export function useScrollAnimate(options: MaybeAccessor<ScrollAnimateOptions>) {
  return bind<HTMLElement, ScrollAnimateOptions>(options, createAnimateEngine).ref;
}

/**
 * Returns both the ref setter and a getter for the live instance.
 *
 * @example
 * const { ref, getInstance } = createScrollAnimate({
 *   props: { opacity: [0, 1] }, easing: 'ease-out', once: true,
 * });
 * <div ref={ref}>...</div>
 * <button onClick={() => getInstance()?.replay()}>Replay</button>
 */
export function createScrollAnimate(options: MaybeAccessor<ScrollAnimateOptions>) {
  return bind<HTMLElement, ScrollAnimateOptions>(options, createAnimateEngine);
}

// ── useScrollCounter ──────────────────────────────────────────────────────────

/**
 * SolidJS hook — animate a number from `from` to `to` as the element scrolls in.
 *
 * @example
 * import { useScrollCounter } from 'svg-scroll-draw/solid';
 *
 * function Stats() {
 *   const ref = useScrollCounter({ to: 1_250_000, format: n => '$' + Math.round(n).toLocaleString(), once: true });
 *   return <span ref={ref} />;
 * }
 */
export function useScrollCounter(options: MaybeAccessor<ScrollCounterOptions>) {
  return bind<HTMLElement, ScrollCounterOptions>(options, scrollCounter).ref;
}

/**
 * Returns both the ref setter and a getter for the live counter instance.
 *
 * @example
 * const { ref, getInstance } = createScrollCounter({ to: 1000, once: true });
 * <span ref={ref} />
 * <button onClick={() => getInstance()?.replay()}>Replay</button>
 */
export function createScrollCounter(options: MaybeAccessor<ScrollCounterOptions>) {
  return bind<HTMLElement, ScrollCounterOptions>(options, scrollCounter);
}

// ── useScrollVideo ────────────────────────────────────────────────────────────

/**
 * SolidJS hook — tie a <video> element's currentTime to scroll position.
 *
 * @example
 * import { useScrollVideo } from 'svg-scroll-draw/solid';
 *
 * function HeroSection() {
 *   const ref = useScrollVideo({ trigger: { start: 'top top', end: 'bottom top' } });
 *   return <video ref={ref} src="/hero.mp4" muted playsinline preload="auto" />;
 * }
 */
export function useScrollVideo(options: MaybeAccessor<ScrollVideoOptions> = {}) {
  return bind<HTMLVideoElement, ScrollVideoOptions>(options, scrollVideo).ref;
}

/**
 * Returns both the ref setter and a getter for the live video instance.
 *
 * @example
 * const { ref, getInstance } = createScrollVideo({ once: false });
 * <video ref={ref} src="/hero.mp4" muted playsinline preload="auto" />
 */
export function createScrollVideo(options: MaybeAccessor<ScrollVideoOptions> = {}) {
  return bind<HTMLVideoElement, ScrollVideoOptions>(options, scrollVideo);
}

// ── useScrollText ─────────────────────────────────────────────────────────────

/**
 * SolidJS hook — split text and stagger-animate each piece on scroll.
 *
 * @example
 * import { useScrollText } from 'svg-scroll-draw/solid';
 *
 * function Headline() {
 *   const ref = useScrollText({ split: 'words', stagger: 0.05, once: true });
 *   return <h2 ref={ref}>Animate on scroll.</h2>;
 * }
 */
export function useScrollText(options: MaybeAccessor<ScrollTextOptions> = {}) {
  return bind<HTMLElement, ScrollTextOptions>(options, scrollText).ref;
}

/**
 * Returns both the ref setter and a getter for the live text instance.
 *
 * @example
 * const { ref, getInstance } = createScrollText({ split: 'chars', stagger: 0.03 });
 * <p ref={ref}>Hello world.</p>
 * <button onClick={() => getInstance()?.replay()}>Replay</button>
 */
export function createScrollText(options: MaybeAccessor<ScrollTextOptions> = {}) {
  return bind<HTMLElement, ScrollTextOptions>(options, scrollText);
}
