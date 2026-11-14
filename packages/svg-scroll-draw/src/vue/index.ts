import { ref, unref, watch, onMounted, onUnmounted, defineComponent, h, type Ref } from 'vue';
import { createEngine } from '../core/engine';
import { liveFns, optionsKey } from '../core/reactive';
import { createAnimateEngine } from '../animate/engine';
import { scrollCounter, counterText } from '../counter';
import { scrollVideo } from '../video';
import { framesKey, checkLabel, type FramesInput } from '../frames/wrapper';
import { startFrames } from '../frames/start';
import { scrollText } from '../text';
import type { ScrollDrawOptions } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollVideoOptions } from '../video';
import type { ScrollFramesOptions } from '../frames';
import type { ScrollTextOptions } from '../text';

export type { ScrollDrawOptions, ScrollAnimateOptions, ScrollCounterOptions, ScrollVideoOptions, ScrollFramesOptions, ScrollTextOptions };

/** Options as a plain object, a ref, or a getter — the getter or ref keeps them live. */
export type MaybeRefOrGetter<T> = T | Ref<T> | (() => T);

const read = <T>(o: MaybeRefOrGetter<T>): T =>
  typeof o === 'function' ? (o as () => T)() : unref(o);

// ── The engine behind each composable and component ──────────────────────────

/**
 * Creates the engine on mount and rebuilds it when an option changes. Reading
 * every option in the watcher subscribes to it; the fingerprint (`optionsKey`)
 * decides whether the change is real, so an equal inline object passed again
 * does not rebuild, and callbacks are read live (`liveFns`).
 */
function useEngine<E extends Element, O extends object>(
  el: Ref<E | null>,
  options: () => O,
  create: (el: E, options: O, raw: O) => { destroy(): void },
  keyOf: (options: O) => string = optionsKey,
): void {
  let instance: { destroy(): void } | null = null;
  let latest = options();
  const start = () => {
    instance?.destroy();
    instance = el.value ? create(el.value, liveFns(latest, () => latest), latest) : null;
  };
  onMounted(start);
  watch(() => keyOf((latest = options())), start);
  onUnmounted(() => {
    instance?.destroy();
    instance = null;
  });
}

// ── ScrollDraw ────────────────────────────────────────────────────────────────

/**
 * Composable — attach the returned ref to any container. Pass a getter or a ref
 * to keep options live: `useScrollDraw(() => ({ speed: speed.value }))` rebuilds
 * the draw when `speed` changes. A plain object is read once.
 */
export function useScrollDraw(options: MaybeRefOrGetter<ScrollDrawOptions> = {}) {
  const containerRef = ref<HTMLElement | null>(null);
  useEngine(containerRef, () => read(options), createEngine);
  return containerRef;
}

/**
 * Every ScrollDrawOptions key, with how Vue should read it from a template:
 * 0 any value, 1 a boolean (`<ScrollDraw once>`), 2 a boolean or a string,
 * 3 a boolean or a number. `satisfies` makes a missing key, or one that is not
 * an option, a compile error, so the component cannot fall behind the options
 * again: it declared 12 of the 35, and the other 23 (preset, native, axis,
 * strokeColor…) rendered as attributes on the div and never reached the engine.
 */
const DRAW_KEYS = {
  preset: 0, selector: 0, speed: 0, fade: 1, easing: 0, trigger: 0, stagger: 0, direction: 0,
  once: 1, debug: 1, axis: 0, scrollContainer: 0, autoReverse: 1, delay: 0, strokeColor: 0,
  strokeWidth: 0, fillOpacity: 0, clip: 2, waypoints: 0, velocityScale: 3, threshold: 0,
  rootMargin: 0, repeat: 0, repeatDelay: 0, morphTo: 0, onProgress: 0, onStart: 0, onComplete: 0,
  onEnter: 0, onLeave: 0, onEnterBack: 0, onLeaveBack: 0, autoplay: 1, duration: 0, native: 1,
} satisfies Record<keyof ScrollDrawOptions, 0 | 1 | 2 | 3>;

const BOOLEAN_TYPES = [null, Boolean, [Boolean, String], [Boolean, Number]];

/**
 * A boolean prop Vue leaves undefined when it is absent. Without the explicit
 * `default: undefined` Vue turns an absent Boolean prop into false, which
 * overrode presets and the engines' own defaults: <ScrollCounter> ran with
 * once: false while useScrollCounter and the core default to true.
 */
const flag = (type: unknown) => ({ type, default: undefined }) as unknown as { type: BooleanConstructor };

/** Component — wraps children in a <div> and initialises the engine. */
export const ScrollDraw = defineComponent({
  name: 'ScrollDraw',
  props: Object.fromEntries(
    Object.entries(DRAW_KEYS).map(([k, t]) => [k, t ? flag(BOOLEAN_TYPES[t]) : null]),
  ) as Record<keyof ScrollDrawOptions, null>,
  setup(props, { slots }) {
    const containerRef = ref<HTMLElement | null>(null);

    useEngine(containerRef, () => {
      const opts: Record<string, unknown> = {};
      for (const k in DRAW_KEYS) {
        const v = (props as Record<string, unknown>)[k];
        if (v != null) opts[k] = v; // `:trigger="null"` means unset, as it did
      }
      return opts as ScrollDrawOptions;
    }, createEngine);

    return () => h('div', { ref: containerRef }, slots.default?.());
  },
});

// ── ScrollAnimate ─────────────────────────────────────────────────────────────

/**
 * Composable — call with a full options object and bind the returned ref to
 * whichever element you want to animate.
 *
 * @example
 * <script setup>
 *   import { useScrollAnimate } from 'svg-scroll-draw/vue';
 *   const el = useScrollAnimate({ props: { opacity: [0, 1] }, easing: 'ease-out', once: true });
 * </script>
 * <div ref="el">...</div>
 */
export function useScrollAnimate(options: MaybeRefOrGetter<ScrollAnimateOptions>) {
  const containerRef = ref<HTMLElement | null>(null);
  useEngine(containerRef, () => read(options), createAnimateEngine);
  return containerRef;
}

/**
 * Component — accepts a single `:options` prop and wraps children in a <div>.
 *
 * @example
 * <ScrollAnimate :options="{ props: { opacity: [0, 1] }, easing: 'ease-out' }">
 *   <div>...</div>
 * </ScrollAnimate>
 */
export const ScrollAnimate = defineComponent({
  name: 'ScrollAnimate',
  props: {
    options: { type: Object as () => ScrollAnimateOptions, required: true },
  },
  setup(props, { slots }) {
    const containerRef = ref<HTMLElement | null>(null);
    useEngine(containerRef, () => props.options, createAnimateEngine);

    return () => h('div', { ref: containerRef }, slots.default?.());
  },
});

// ── ScrollCounter ─────────────────────────────────────────────────────────────

/**
 * Composable — returns a ref to bind to a span/element that will count up on scroll.
 *
 * @example
 * <script setup>
 *   import { useScrollCounter } from 'svg-scroll-draw/vue';
 *   const el = useScrollCounter({ to: 1000, easing: 'ease-out', once: true });
 * </script>
 * <span ref="el" />
 */
export function useScrollCounter(options: MaybeRefOrGetter<ScrollCounterOptions>) {
  const counterRef = ref<HTMLElement | null>(null);
  useEngine(counterRef, () => read(options), scrollCounter);
  return counterRef;
}

/**
 * Component — renders a <span> that counts from `from` to `to` on scroll.
 *
 * @example
 * <ScrollCounter :to="1250000" :format="n => '$' + Math.round(n).toLocaleString()" />
 */
export const ScrollCounter = defineComponent({
  name: 'ScrollCounter',
  props: {
    to:         { type: Number, required: true },
    from:       { type: Number },
    format:     { type: Function as unknown as () => ScrollCounterOptions['format'] },
    easing:     { type: [String, Function] },
    trigger:    { type: Object },
    once:       flag(Boolean),
    decimals:   { type: Number },
    onComplete: { type: Function },
  },
  setup(props) {
    const counterRef = ref<HTMLElement | null>(null);

    useEngine(counterRef, () => {
      const opts: ScrollCounterOptions = { to: props.to };
      if (props.from       != null) opts.from       = props.from;
      if (props.format     != null) opts.format     = props.format as ScrollCounterOptions['format'];
      if (props.easing     != null) opts.easing     = props.easing as ScrollCounterOptions['easing'];
      if (props.trigger    != null) opts.trigger    = props.trigger as ScrollCounterOptions['trigger'];
      if (props.once       != null) opts.once       = props.once;
      if (props.decimals   != null) opts.decimals   = props.decimals;
      if (props.onComplete != null) opts.onComplete = props.onComplete as ScrollCounterOptions['onComplete'];
      return opts;
    }, scrollCounter);

    // The final number goes in the server HTML, rendered once: the engine owns
    // the text after mount, and a new `to` patched in after its rebuild would
    // leave the final number showing.
    const text = counterText({ to: props.to, decimals: props.decimals, format: props.format as ScrollCounterOptions['format'] });
    return () => h('span', { ref: counterRef }, text);
  },
});

// ── ScrollVideo ───────────────────────────────────────────────────────────────

/**
 * Composable — returns a ref to bind to a <video> element.
 *
 * @example
 * <script setup>
 *   import { useScrollVideo } from 'svg-scroll-draw/vue';
 *   const vid = useScrollVideo({ trigger: { start: 'top top', end: 'bottom top' } });
 * </script>
 * <video ref="vid" src="..." muted playsinline preload="auto" />
 */
export function useScrollVideo(options: MaybeRefOrGetter<ScrollVideoOptions> = {}) {
  const videoRef = ref<HTMLVideoElement | null>(null);
  useEngine(videoRef, () => read(options), scrollVideo);
  return videoRef;
}

/**
 * Component — renders a <video> scrubbed by scroll position.
 *
 * @example
 * <ScrollVideo src="/hero.mp4" :options="{ trigger: { start: 'top top', end: 'bottom top' } }" />
 */
export const ScrollVideo = defineComponent({
  name: 'ScrollVideo',
  props: {
    src:        { type: String, required: true },
    options:    { type: Object as () => ScrollVideoOptions },
    muted:      { type: Boolean, default: true },
    playsInline:{ type: Boolean, default: true },
    class:      { type: String },
  },
  setup(props) {
    const videoRef = ref<HTMLVideoElement | null>(null);
    useEngine(videoRef, () => props.options ?? {}, scrollVideo);

    return () => h('video', {
      ref: videoRef,
      src: props.src,
      muted: props.muted,
      playsinline: props.playsInline,
      preload: 'auto',
      class: props.class,
    });
  },
});

// ── ScrollFrames ──────────────────────────────────────────────────────────────

// FramesInput (a selector allowed as triggerElement) and startFrames, which
// reads it when the film starts, are shared with the other wrappers
// (frames/wrapper).

/**
 * Composable — returns a ref to bind to a <canvas>, which scrubs an image
 * sequence with the scroll. Options as in useScrollDraw: a getter or a ref
 * keeps them live.
 *
 * @example
 * <script setup>
 *   import { useScrollFrames } from 'svg-scroll-draw/vue';
 *   const film = useScrollFrames({ frames: (i) => `/film/${i + 1}.jpg`, count: 120 });
 * </script>
 * <canvas ref="film" role="img" aria-label="The headphones turning" />
 */
export function useScrollFrames(options: MaybeRefOrGetter<FramesInput>) {
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  useEngine(canvasRef, () => read(options), startFrames, framesKey as (o: FramesInput) => string);
  return canvasRef;
}

/**
 * Every ScrollFramesOptions key, as DRAW_KEYS: 1 marks a boolean. `satisfies`
 * keeps the props in step with the options.
 */
const FRAMES_KEYS = {
  frames: 0, count: 0, trigger: 0, easing: 0, once: 1, axis: 0, triggerElement: 0, fit: 0,
  concurrency: 0, onReady: 0, onLoad: 0, onComplete: 0, onProgress: 0,
} satisfies Record<keyof ScrollFramesOptions, 0 | 1>;

/**
 * Component — renders a <canvas role="img"> that scrubs an image sequence with
 * the scroll. Every option is a prop; `class`, `style` and `aria-label` fall
 * through to the canvas. Pass a `style` that changes as an object: Vue rewrites
 * a changed style string whole, over the inline size scrollFrames holds on a
 * canvas sized by its attributes.
 *
 * @example
 * <section id="track" style="height: 400vh">
 *   <div style="position: sticky; top: 0; height: 100vh">
 *     <ScrollFrames :frames="(i) => `/film/${i + 1}.jpg`" :count="120" trigger-element="#track"
 *       :trigger="{ start: 'top top', end: 'bottom bottom' }" aria-label="The headphones turning" />
 *   </div>
 * </section>
 */
export const ScrollFrames = defineComponent({
  name: 'ScrollFrames',
  props: Object.fromEntries(
    Object.entries(FRAMES_KEYS).map(([k, t]) => [k, t ? flag(Boolean) : k === 'frames' ? { required: true } : null]),
  ) as Record<keyof ScrollFramesOptions, null>,
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null);

    useEngine(canvasRef, () => {
      const opts: Record<string, unknown> = {};
      for (const k in FRAMES_KEYS) {
        const v = (props as Record<string, unknown>)[k];
        if (v != null) opts[k] = v;
      }
      return opts as FramesInput;
    }, startFrames, framesKey as (o: FramesInput) => string);

    onMounted(() => checkLabel(canvasRef.value));

    // role="img" unless the page passes its own: fallthrough attributes win.
    return () => h('canvas', { ref: canvasRef, role: 'img' });
  },
});

// ── ScrollText ────────────────────────────────────────────────────────────────

/**
 * Composable — returns a ref to bind to any text element; splits and animates on scroll.
 *
 * @example
 * <script setup>
 *   import { useScrollText } from 'svg-scroll-draw/vue';
 *   const el = useScrollText({ split: 'words', stagger: 0.05, once: true });
 * </script>
 * <h2 ref="el">Animate on scroll.</h2>
 */
export function useScrollText(options: MaybeRefOrGetter<ScrollTextOptions> = {}) {
  const textRef = ref<HTMLElement | null>(null);
  useEngine(textRef, () => read(options), scrollText);
  return textRef;
}

/**
 * Component — wraps text content in a <p> (or any tag) and animates it on scroll.
 *
 * @example
 * <ScrollText :options="{ split: 'words', stagger: 0.05 }" tag="h2">
 *   Animate on scroll.
 * </ScrollText>
 */
export const ScrollText = defineComponent({
  name: 'ScrollText',
  props: {
    options: { type: Object as () => ScrollTextOptions },
    tag:     { type: String, default: 'p' },
  },
  setup(props, { slots }) {
    const textRef = ref<HTMLElement | null>(null);
    useEngine(textRef, () => props.options ?? {}, scrollText);

    return () => h(props.tag, { ref: textRef }, slots.default?.());
  },
});
