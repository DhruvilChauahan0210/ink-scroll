import * as vue from 'vue';
import { App } from 'vue';

type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';
type PresetName = 'sketch' | 'reveal' | 'typewriter' | 'cinematic' | 'spring';
interface TriggerConfig {
    start?: string;
    end?: string;
}
interface ScrollDrawOptions {
    /**
     * Apply a named preset as the base configuration. User-supplied options
     * always override the preset. Available presets:
     * - `'sketch'`     — staggered ease-in draw, pencil feel
     * - `'reveal'`     — fade + ease-out, draws once on viewport entry
     * - `'typewriter'` — fast linear draw with stagger
     * - `'cinematic'`  — slow ease-in-out with fade, dramatic entrance
     * - `'spring'`     — spring easing, bouncy organic feel
     */
    preset?: PresetName;
    selector?: string;
    speed?: number;
    fade?: boolean;
    easing?: EasingName | ((t: number) => number);
    trigger?: TriggerConfig;
    stagger?: number;
    direction?: 'forward' | 'reverse';
    once?: boolean;
    debug?: boolean;
    /** Scroll axis to track. 'y' (default) for vertical, 'x' for horizontal. */
    axis?: 'x' | 'y';
    /** CSS selector or Element for a custom scroll container (default: window). */
    scrollContainer?: string | Element;
    /** Automatically reverse the animation when the user scrolls back up. */
    autoReverse?: boolean;
    /** Delay in milliseconds before the engine starts observing. */
    delay?: number;
    /** Animate stroke color. Single string = static override. Tuple = interpolate from → to. */
    strokeColor?: string | [string, string];
    /** Animate stroke width. Single number = static override. Tuple = interpolate from → to. */
    strokeWidth?: number | [number, number];
    /** Animate fill opacity. Single number = static override. Tuple [from, to] = interpolate as the path draws. Use [0, 1] to flood fill in sync with the stroke draw. */
    fillOpacity?: number | [number, number];
    /**
     * Reveal the container using CSS clip-path instead of stroke-dashoffset.
     * Works on any content — SVG, images, text, divs.
     *
     * Pass a direction string to control which edge the reveal starts from,
     * or `true` as shorthand for `'left'`.
     *
     * Values: `'left' | 'right' | 'top' | 'bottom' | 'center'`
     */
    clip?: boolean | 'left' | 'right' | 'top' | 'bottom' | 'center';
    /** Fire callbacks at specific progress thresholds (0–1). Resets on replay(). */
    waypoints?: Record<number, () => void>;
    /** Scale animation speed by scroll velocity — faster scrolling = faster draw. Pass a number to control sensitivity (default 1). */
    velocityScale?: boolean | number;
    /** IntersectionObserver threshold (0–1). Default 0. */
    threshold?: number;
    /** IntersectionObserver rootMargin. Default "0px". */
    rootMargin?: string;
    /** Repeat the animation N times after completion. Use 'infinite' to loop forever. */
    repeat?: number | 'infinite';
    /** Milliseconds to wait between repeats. Default 0. */
    repeatDelay?: number;
    /**
     * Target path `d` attribute to morph toward as the animation progresses.
     * Paths must have compatible command structures (same number of numeric tokens).
     *
     * Only applies to `<path>` elements — silently no-ops on `<rect>`, `<circle>`,
     * `<line>`, and other SVG shape elements.
     */
    morphTo?: string;
    onProgress?: (alpha: number) => void;
    onStart?: () => void;
    onComplete?: () => void;
    /** Fires when scroll position enters the trigger zone (scrolling forward). */
    onEnter?: () => void;
    /** Fires when scroll position exits the trigger zone at the end (scrolling forward). */
    onLeave?: () => void;
    /** Fires when scroll position re-enters the trigger zone from the end (scrolling back). */
    onEnterBack?: () => void;
    /** Fires when scroll position exits the trigger zone at the start (scrolling back). */
    onLeaveBack?: () => void;
    /**
     * Trigger the animation when the element enters the viewport instead of
     * tying it to scroll position. The draw runs over `duration` milliseconds,
     * replaying each time the element re-enters the viewport (use `once: true`
     * to play only the first time).
     *
     * All visual options work in autoplay mode — `easing`, `stagger`, `fade`,
     * `strokeColor`, `strokeWidth`, `fillOpacity`, `clip`, `morphTo`, `waypoints`,
     * `repeat`, `repeatDelay`, `onStart`, `onComplete`, `onProgress`, etc.
     *
     * The full instance API (`pause`, `resume`, `seek`, `replay`, `getProgress`)
     * also works — `seek(0.5)` pauses at 50% of the duration.
     */
    autoplay?: boolean;
    /**
     * Duration of the autoplay animation in milliseconds. Only used when
     * `autoplay: true`. Default `1000`.
     */
    duration?: number;
    /**
     * Use the browser's native CSS scroll-driven animation
     * (`animation-timeline: view()`) when the configuration is simple enough and
     * the browser supports it. This runs the draw entirely on the compositor —
     * zero per-frame JavaScript, zero scroll/resize listeners.
     *
     * Falls back to the JS engine automatically when unsupported or when the
     * config uses a feature native CSS can't express (callbacks, stagger, morph,
     * velocity scaling, custom triggers, `once`, custom easing functions, etc.).
     *
     * - `undefined` / `true` (default): use native when eligible.
     * - `false`: always use the JS engine.
     */
    native?: boolean;
}

interface ScrollAnimateOptions {
    props: Record<string, string | number | [string | number, string | number]>;
    trigger?: TriggerConfig;
    easing?: EasingName | ((t: number) => number);
    speed?: number;
    once?: boolean;
    axis?: 'x' | 'y';
    scrollContainer?: string | Element;
    native?: boolean;
    /**
     * Scale animation speed by scroll velocity — faster scrolling = faster animation.
     * Pass `true` for default sensitivity (1) or a number to control it.
     * Higher values = more dramatic speed-up. Default sensitivity: 1.
     */
    velocityScale?: boolean | number;
    onProgress?: (alpha: number) => void;
    onComplete?: () => void;
    /** Fires when scroll enters the trigger zone (scrolling forward). */
    onEnter?: () => void;
    /** Fires when scroll exits the trigger zone at the end (scrolling forward). */
    onLeave?: () => void;
    /** Fires when scroll re-enters the trigger zone from the end (scrolling back). */
    onEnterBack?: () => void;
    /** Fires when scroll exits the trigger zone at the start (scrolling back). */
    onLeaveBack?: () => void;
}

interface ScrollCounterOptions {
    from?: number;
    to: number;
    format?: (value: number) => string;
    easing?: EasingName | ((t: number) => number);
    trigger?: TriggerConfig;
    once?: boolean;
    decimals?: number;
    onComplete?: () => void;
}

interface ScrollVideoOptions {
    trigger?: TriggerConfig;
    from?: number;
    to?: number;
    easing?: EasingName | ((t: number) => number);
    once?: boolean;
    axis?: 'x' | 'y';
    preload?: 'auto' | 'metadata';
    onReady?: () => void;
    onComplete?: () => void;
    onProgress?: (alpha: number) => void;
}

interface ScrollTextOptions {
    split?: 'chars' | 'words' | 'lines';
    stagger?: number;
    easing?: EasingName | ((t: number) => number);
    from?: {
        opacity?: number;
        y?: number;
        x?: number;
        rotate?: number;
        scale?: number;
    };
    trigger?: TriggerConfig;
    once?: boolean;
    onComplete?: () => void;
}

/** Composable — attach to any container ref. */
declare function useScrollDraw(options?: ScrollDrawOptions): vue.Ref<HTMLElement | null, HTMLElement | null>;
/** Component — wraps children in a <div> and initialises the engine. */
declare const ScrollDraw: vue.DefineComponent<vue.ExtractPropTypes<{
    selector: {
        type: StringConstructor;
    };
    speed: {
        type: NumberConstructor;
    };
    fade: {
        type: BooleanConstructor;
    };
    stagger: {
        type: NumberConstructor;
    };
    easing: {
        type: (StringConstructor | FunctionConstructor)[];
    };
    direction: {
        type: () => "forward" | "reverse";
    };
    trigger: {
        type: ObjectConstructor;
    };
    onProgress: {
        type: FunctionConstructor;
    };
    onStart: {
        type: FunctionConstructor;
    };
    onComplete: {
        type: FunctionConstructor;
    };
    once: {
        type: BooleanConstructor;
    };
    debug: {
        type: BooleanConstructor;
    };
}>, () => vue.VNode<vue.RendererNode, vue.RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, vue.ComponentOptionsMixin, vue.ComponentOptionsMixin, {}, string, vue.PublicProps, Readonly<vue.ExtractPropTypes<{
    selector: {
        type: StringConstructor;
    };
    speed: {
        type: NumberConstructor;
    };
    fade: {
        type: BooleanConstructor;
    };
    stagger: {
        type: NumberConstructor;
    };
    easing: {
        type: (StringConstructor | FunctionConstructor)[];
    };
    direction: {
        type: () => "forward" | "reverse";
    };
    trigger: {
        type: ObjectConstructor;
    };
    onProgress: {
        type: FunctionConstructor;
    };
    onStart: {
        type: FunctionConstructor;
    };
    onComplete: {
        type: FunctionConstructor;
    };
    once: {
        type: BooleanConstructor;
    };
    debug: {
        type: BooleanConstructor;
    };
}>> & Readonly<{}>, {
    fade: boolean;
    once: boolean;
    debug: boolean;
}, {}, {}, {}, string, vue.ComponentProvideOptions, true, {}, any>;
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
declare function useScrollAnimate(options: ScrollAnimateOptions): vue.Ref<HTMLElement | null, HTMLElement | null>;
/**
 * Component — accepts a single `:options` prop and wraps children in a <div>.
 *
 * @example
 * <ScrollAnimate :options="{ props: { opacity: [0, 1] }, easing: 'ease-out' }">
 *   <div>...</div>
 * </ScrollAnimate>
 */
declare const ScrollAnimate: vue.DefineComponent<vue.ExtractPropTypes<{
    options: {
        type: () => ScrollAnimateOptions;
        required: true;
    };
}>, () => vue.VNode<vue.RendererNode, vue.RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, vue.ComponentOptionsMixin, vue.ComponentOptionsMixin, {}, string, vue.PublicProps, Readonly<vue.ExtractPropTypes<{
    options: {
        type: () => ScrollAnimateOptions;
        required: true;
    };
}>> & Readonly<{}>, {}, {}, {}, {}, string, vue.ComponentProvideOptions, true, {}, any>;
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
declare function useScrollCounter(options: ScrollCounterOptions): vue.Ref<HTMLElement | null, HTMLElement | null>;
/**
 * Component — renders a <span> that counts from `from` to `to` on scroll.
 *
 * @example
 * <ScrollCounter :to="1250000" :format="n => '$' + Math.round(n).toLocaleString()" />
 */
declare const ScrollCounter: vue.DefineComponent<vue.ExtractPropTypes<{
    to: {
        type: NumberConstructor;
        required: true;
    };
    from: {
        type: NumberConstructor;
    };
    format: {
        type: () => ScrollCounterOptions["format"];
    };
    easing: {
        type: (StringConstructor | FunctionConstructor)[];
    };
    trigger: {
        type: ObjectConstructor;
    };
    once: {
        type: BooleanConstructor;
    };
    decimals: {
        type: NumberConstructor;
    };
    onComplete: {
        type: FunctionConstructor;
    };
}>, () => vue.VNode<vue.RendererNode, vue.RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, vue.ComponentOptionsMixin, vue.ComponentOptionsMixin, {}, string, vue.PublicProps, Readonly<vue.ExtractPropTypes<{
    to: {
        type: NumberConstructor;
        required: true;
    };
    from: {
        type: NumberConstructor;
    };
    format: {
        type: () => ScrollCounterOptions["format"];
    };
    easing: {
        type: (StringConstructor | FunctionConstructor)[];
    };
    trigger: {
        type: ObjectConstructor;
    };
    once: {
        type: BooleanConstructor;
    };
    decimals: {
        type: NumberConstructor;
    };
    onComplete: {
        type: FunctionConstructor;
    };
}>> & Readonly<{}>, {
    once: boolean;
}, {}, {}, {}, string, vue.ComponentProvideOptions, true, {}, any>;
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
declare function useScrollVideo(options?: ScrollVideoOptions): vue.Ref<HTMLVideoElement | null, HTMLVideoElement | null>;
/**
 * Component — renders a <video> scrubbed by scroll position.
 *
 * @example
 * <ScrollVideo src="/hero.mp4" :options="{ trigger: { start: 'top top', end: 'bottom top' } }" />
 */
declare const ScrollVideo: vue.DefineComponent<vue.ExtractPropTypes<{
    src: {
        type: StringConstructor;
        required: true;
    };
    options: {
        type: () => ScrollVideoOptions;
    };
    muted: {
        type: BooleanConstructor;
        default: boolean;
    };
    playsInline: {
        type: BooleanConstructor;
        default: boolean;
    };
    class: {
        type: StringConstructor;
    };
}>, () => vue.VNode<vue.RendererNode, vue.RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, vue.ComponentOptionsMixin, vue.ComponentOptionsMixin, {}, string, vue.PublicProps, Readonly<vue.ExtractPropTypes<{
    src: {
        type: StringConstructor;
        required: true;
    };
    options: {
        type: () => ScrollVideoOptions;
    };
    muted: {
        type: BooleanConstructor;
        default: boolean;
    };
    playsInline: {
        type: BooleanConstructor;
        default: boolean;
    };
    class: {
        type: StringConstructor;
    };
}>> & Readonly<{}>, {
    muted: boolean;
    playsInline: boolean;
}, {}, {}, {}, string, vue.ComponentProvideOptions, true, {}, any>;
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
declare function useScrollText(options?: ScrollTextOptions): vue.Ref<HTMLElement | null, HTMLElement | null>;
/**
 * Component — wraps text content in a <p> (or any tag) and animates it on scroll.
 *
 * @example
 * <ScrollText :options="{ split: 'words', stagger: 0.05 }" tag="h2">
 *   Animate on scroll.
 * </ScrollText>
 */
declare const ScrollText: vue.DefineComponent<vue.ExtractPropTypes<{
    options: {
        type: () => ScrollTextOptions;
    };
    tag: {
        type: StringConstructor;
        default: string;
    };
}>, () => vue.VNode<vue.RendererNode, vue.RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, vue.ComponentOptionsMixin, vue.ComponentOptionsMixin, {}, string, vue.PublicProps, Readonly<vue.ExtractPropTypes<{
    options: {
        type: () => ScrollTextOptions;
    };
    tag: {
        type: StringConstructor;
        default: string;
    };
}>> & Readonly<{}>, {
    tag: string;
}, {}, {}, {}, string, vue.ComponentProvideOptions, true, {}, any>;

/**
 * Nuxt 3 integration for svg-scroll-draw.
 *
 * Re-exports all Vue composables and components (v1 + v2) for direct use,
 * plus a plugin factory for global auto-registration.
 *
 * ## Option A — Import per component (recommended)
 * ```ts
 * import { useScrollDraw, ScrollDraw } from 'svg-scroll-draw/nuxt';
 * import { useScrollAnimate, ScrollAnimate } from 'svg-scroll-draw/nuxt';
 * import { useScrollText, useScrollCounter } from 'svg-scroll-draw/nuxt';
 * ```
 *
 * ## Option B — Global auto-registration via Nuxt plugin
 * Create `plugins/svg-scroll-draw.ts` in your Nuxt project:
 * ```ts
 * import { createScrollDrawPlugin } from 'svg-scroll-draw/nuxt';
 * export default defineNuxtPlugin((nuxtApp) => {
 *   nuxtApp.vueApp.use(createScrollDrawPlugin());
 * });
 * ```
 *
 * Then use <ScrollDraw>, <ScrollAnimate>, <ScrollCounter>, etc. globally.
 */

/**
 * Vue plugin that globally registers all svg-scroll-draw components.
 * Pass to nuxtApp.vueApp.use() inside a Nuxt plugin.
 *
 * Registers: <ScrollDraw>, <ScrollAnimate>, <ScrollCounter>, <ScrollVideo>, <ScrollText>
 */
declare function createScrollDrawPlugin(): {
    install(app: App): void;
};

export { ScrollAnimate, type ScrollAnimateOptions, ScrollCounter, type ScrollCounterOptions, ScrollDraw, type ScrollDrawOptions, ScrollText, type ScrollTextOptions, ScrollVideo, type ScrollVideoOptions, createScrollDrawPlugin, useScrollAnimate, useScrollCounter, useScrollDraw, useScrollText, useScrollVideo };
