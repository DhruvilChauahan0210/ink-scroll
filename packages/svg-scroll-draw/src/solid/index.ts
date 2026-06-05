import { onMount, onCleanup } from 'solid-js';
import { createEngine } from '../core/engine';
import { createAnimateEngine } from '../animate';
import { scrollCounter } from '../counter';
import { scrollVideo } from '../video';
import { scrollText } from '../text';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollVideoOptions } from '../video';
import type { ScrollTextOptions } from '../text';

export type { ScrollDrawOptions, ScrollAnimateOptions, ScrollCounterOptions, ScrollVideoOptions, ScrollTextOptions };

// ── useScrollDraw ─────────────────────────────────────────────────────────────

/**
 * SolidJS hook — returns a ref setter to attach to any container element.
 *
 * @example
 * import { useScrollDraw } from 'svg-scroll-draw/solid';
 *
 * function Hero() {
 *   const ref = useScrollDraw({ easing: 'spring', fade: true });
 *   return <div ref={ref}><svg>...</svg></div>;
 * }
 */
export function useScrollDraw(options: ScrollDrawOptions = {}) {
  let el: HTMLElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = createEngine(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
  });

  return (node: HTMLElement) => { el = node; };
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
export function createScrollDraw(options: ScrollDrawOptions = {}) {
  let el: HTMLElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = createEngine(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
    instance = undefined;
  });

  return {
    ref: (node: HTMLElement) => { el = node; },
    getInstance: () => instance,
  };
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
export function useScrollAnimate(options: ScrollAnimateOptions) {
  let el: HTMLElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = createAnimateEngine(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
  });

  return (node: HTMLElement) => { el = node; };
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
export function createScrollAnimate(options: ScrollAnimateOptions) {
  let el: HTMLElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = createAnimateEngine(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
    instance = undefined;
  });

  return {
    ref: (node: HTMLElement) => { el = node; },
    getInstance: () => instance,
  };
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
export function useScrollCounter(options: ScrollCounterOptions) {
  let el: HTMLElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = scrollCounter(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
  });

  return (node: HTMLElement) => { el = node; };
}

/**
 * Returns both the ref setter and a getter for the live counter instance.
 *
 * @example
 * const { ref, getInstance } = createScrollCounter({ to: 1000, once: true });
 * <span ref={ref} />
 * <button onClick={() => getInstance()?.replay()}>Replay</button>
 */
export function createScrollCounter(options: ScrollCounterOptions) {
  let el: HTMLElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = scrollCounter(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
    instance = undefined;
  });

  return {
    ref: (node: HTMLElement) => { el = node; },
    getInstance: () => instance,
  };
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
export function useScrollVideo(options: ScrollVideoOptions = {}) {
  let el: HTMLVideoElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = scrollVideo(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
  });

  return (node: HTMLVideoElement) => { el = node; };
}

/**
 * Returns both the ref setter and a getter for the live video instance.
 *
 * @example
 * const { ref, getInstance } = createScrollVideo({ once: false });
 * <video ref={ref} src="/hero.mp4" muted playsinline preload="auto" />
 */
export function createScrollVideo(options: ScrollVideoOptions = {}) {
  let el: HTMLVideoElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = scrollVideo(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
    instance = undefined;
  });

  return {
    ref: (node: HTMLVideoElement) => { el = node; },
    getInstance: () => instance,
  };
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
export function useScrollText(options: ScrollTextOptions = {}) {
  let el: HTMLElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = scrollText(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
  });

  return (node: HTMLElement) => { el = node; };
}

/**
 * Returns both the ref setter and a getter for the live text instance.
 *
 * @example
 * const { ref, getInstance } = createScrollText({ split: 'chars', stagger: 0.03 });
 * <p ref={ref}>Hello world.</p>
 * <button onClick={() => getInstance()?.replay()}>Replay</button>
 */
export function createScrollText(options: ScrollTextOptions = {}) {
  let el: HTMLElement | undefined;
  let instance: ScrollDrawInstance | undefined;

  onMount(() => {
    if (!el) return;
    instance = scrollText(el, options);
  });

  onCleanup(() => {
    instance?.destroy();
    instance = undefined;
  });

  return {
    ref: (node: HTMLElement) => { el = node; },
    getInstance: () => instance,
  };
}
