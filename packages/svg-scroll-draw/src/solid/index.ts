import { createEffect, onCleanup, untrack } from 'solid-js';
import { createEngine } from '../core/engine';
import { liveFns, optionsKey } from '../core/reactive';
import { createAnimateEngine } from '../animate/engine';
import { scrollCounter } from '../counter';
import { scrollVideo } from '../video';
import { framesKey, checkLabel, type FramesInput } from '../frames/wrapper';
import { startFrames } from '../frames/start';
import { scrollText } from '../text';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollVideoOptions } from '../video';
import type { ScrollFramesOptions } from '../frames';
import type { ScrollTextOptions } from '../text';

export type { ScrollDrawOptions, ScrollAnimateOptions, ScrollCounterOptions, ScrollVideoOptions, ScrollFramesOptions, ScrollTextOptions };

/** Options as a plain object, or an accessor that keeps them live. */
export type MaybeAccessor<T> = T | (() => T);

// ── The engine behind each hook ──────────────────────────────────────────────

/**
 * Creates the engine once the ref is set and rebuilds it when an option
 * changes. The effect reads every option — through an accessor, or through
 * Solid props' getters — so it subscribes to them; the fingerprint
 * (`optionsKey`, or the `keyOf` scrollFrames passes) decides whether a
 * change is real. The engine is built untracked, so nothing it reads while
 * starting becomes a dependency.
 */
function bind<E extends Element, O extends object>(
  options: MaybeAccessor<O>,
  create: (el: E, options: O, raw: O) => ScrollDrawInstance,
  keyOf: (options: O) => string = optionsKey,
) {
  let el: E | undefined;
  let instance: ScrollDrawInstance | undefined;
  let key: string | undefined;
  let latest: O;

  createEffect(() => {
    latest = typeof options === 'function' ? (options as () => O)() : options;
    const next = keyOf(latest);
    if (!el || next === key) return;
    key = next;
    untrack(() => {
      instance?.destroy();
      instance = create(el!, liveFns(latest, () => latest), latest);
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

// ── useScrollFrames ───────────────────────────────────────────────────────────

/**
 * scrollFrames through bind(), keyed by framesKey: a `frames` function is read
 * by the URLs it gives for `count` (inside the effect, so a signal it reads is
 * tracked and a new URL pattern starts a new film), and an equal fresh one
 * keeps the film. The label is checked once, when the first film starts.
 */
function bindFrames(options: MaybeAccessor<FramesInput>, who: string) {
  let named = false;
  return bind<HTMLCanvasElement, FramesInput>(options, (el, o, raw) => {
    if (!named) checkLabel(el, who);
    named = true;
    return startFrames(el, o, raw);
  }, framesKey);
}

/**
 * SolidJS hook — scrub an image sequence on a <canvas> with the scroll
 * (scrollFrames). The canvas is yours, so give it role="img" and an
 * aria-label saying what the frames show; in development the hook warns when
 * it has no name (unless it is aria-hidden="true" or role="presentation").
 *
 * Pass an accessor to keep the options live: a new film starts only when the
 * URLs or another option changed, and callbacks are read live.
 * `triggerElement` takes an element or a selector, found when the film starts.
 *
 * @example
 * import { useScrollFrames } from 'svg-scroll-draw/solid';
 *
 * function Film() {
 *   const ref = useScrollFrames({
 *     frames: (i) => `/film/${i + 1}.jpg`, count: 120,
 *     triggerElement: '#track', trigger: { start: 'top top', end: 'bottom bottom' },
 *   });
 *   return <canvas ref={ref} role="img" aria-label="The headphones turning" />;
 * }
 */
export function useScrollFrames(options: MaybeAccessor<FramesInput>) {
  return bindFrames(options, 'useScrollFrames').ref;
}

/**
 * Returns both the ref setter and a getter for the live film instance.
 *
 * @example
 * const { ref, getInstance } = createScrollFrames(() => ({ frames: urls(), fit: 'contain' }));
 * <canvas ref={ref} role="img" aria-label="The headphones turning" />
 * <button onClick={() => getInstance()?.replay()}>Replay</button>
 */
export function createScrollFrames(options: MaybeAccessor<FramesInput>) {
  return bindFrames(options, 'createScrollFrames');
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
