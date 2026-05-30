import * as vue from 'vue';
import { App } from 'vue';

type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
interface TriggerConfig {
    start?: string;
    end?: string;
}
interface ScrollDrawOptions {
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
 * Nuxt 3 integration for svg-scroll-draw.
 *
 * Re-exports the Vue composable and component for direct use, plus a
 * plugin factory for global auto-registration.
 *
 * ## Option A — Import per component (recommended)
 * ```ts
 * import { useScrollDraw, ScrollDraw } from 'svg-scroll-draw/nuxt';
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
 * Then use <ScrollDraw> globally with no imports.
 */

/**
 * Vue plugin that globally registers the <ScrollDraw> component.
 * Pass to nuxtApp.vueApp.use() inside a Nuxt plugin.
 */
declare function createScrollDrawPlugin(): {
    install(app: App): void;
};

export { ScrollDraw, type ScrollDrawOptions, createScrollDrawPlugin, useScrollDraw };
