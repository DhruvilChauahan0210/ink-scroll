import { ref, unref, watch, onMounted, onUnmounted, defineComponent, h, type Ref } from 'vue';
import { createEngine } from '../core/engine';
import { liveFns, optionsKey } from '../core/reactive';
import { createAnimateEngine } from '../animate/engine';
import { scrollCounter } from '../counter';
import { scrollVideo } from '../video';
import { scrollText } from '../text';
import type { ScrollDrawOptions } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollVideoOptions } from '../video';
import type { ScrollTextOptions } from '../text';

export type { ScrollDrawOptions, ScrollAnimateOptions, ScrollCounterOptions, ScrollVideoOptions, ScrollTextOptions };

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
  create: (el: E, options: O) => { destroy(): void },
): void {
  let instance: { destroy(): void } | null = null;
  let latest = options();
  const start = () => {
    instance?.destroy();
    instance = el.value ? create(el.value, liveFns(latest, () => latest)) : null;
  };
  onMounted(start);
  watch(() => optionsKey((latest = options())), start);
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

/** Component — wraps children in a <div> and initialises the engine. */
export const ScrollDraw = defineComponent({
  name: 'ScrollDraw',
  props: {
    selector:   { type: String },
    speed:      { type: Number },
    fade:       { type: Boolean },
    stagger:    { type: Number },
    easing:     { type: [String, Function] },
    direction:  { type: String as () => 'forward' | 'reverse' },
    trigger:    { type: Object },
    onProgress: { type: Function },
    onStart:    { type: Function },
    onComplete: { type: Function },
    once:       { type: Boolean },
    debug:      { type: Boolean },
  },
  setup(props, { slots }) {
    const containerRef = ref<HTMLElement | null>(null);

    useEngine(containerRef, () => {
      const opts: ScrollDrawOptions = {};
      if (props.selector   != null) opts.selector   = props.selector;
      if (props.speed      != null) opts.speed      = props.speed;
      if (props.fade       != null) opts.fade       = props.fade;
      if (props.stagger    != null) opts.stagger    = props.stagger;
      if (props.easing     != null) opts.easing     = props.easing as ScrollDrawOptions['easing'];
      if (props.direction  != null) opts.direction  = props.direction;
      if (props.trigger    != null) opts.trigger    = props.trigger as ScrollDrawOptions['trigger'];
      if (props.once       != null) opts.once       = props.once;
      if (props.debug      != null) opts.debug      = props.debug;
      if (props.onProgress != null) opts.onProgress = props.onProgress as ScrollDrawOptions['onProgress'];
      if (props.onStart    != null) opts.onStart    = props.onStart    as ScrollDrawOptions['onStart'];
      if (props.onComplete != null) opts.onComplete = props.onComplete as ScrollDrawOptions['onComplete'];
      return opts;
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
 * <div :ref="el">...</div>
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
 * <span :ref="el" />
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
    once:       { type: Boolean },
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

    return () => h('span', { ref: counterRef });
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
 * <video :ref="vid" src="..." muted playsinline preload="auto" />
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

// ── ScrollText ────────────────────────────────────────────────────────────────

/**
 * Composable — returns a ref to bind to any text element; splits and animates on scroll.
 *
 * @example
 * <script setup>
 *   import { useScrollText } from 'svg-scroll-draw/vue';
 *   const el = useScrollText({ split: 'words', stagger: 0.05, once: true });
 * </script>
 * <h2 :ref="el">Animate on scroll.</h2>
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
