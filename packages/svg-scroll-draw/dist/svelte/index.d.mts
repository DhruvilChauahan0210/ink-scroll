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
interface ScrollDrawInstance {
    destroy: () => void;
    /** Reset and replay the animation from the beginning. */
    replay: () => void;
    /** Pause the animation at the current progress. */
    pause: () => void;
    /** Resume a paused animation. */
    resume: () => void;
    /** Jump to a specific progress value (0–1) and pause. */
    seek: (progress: number) => void;
    /** Returns current draw progress (0–1). */
    getProgress: () => number;
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

/**
 * Svelte action — apply to any container element wrapping an SVG.
 *
 * @example
 * <div use:scrollDraw={{ easing: 'ease-out', speed: 1.2, fade: true }}>
 *   <svg>...</svg>
 * </div>
 */
declare function scrollDraw(node: HTMLElement, options?: ScrollDrawOptions): {
    update(newOptions: ScrollDrawOptions): void;
    destroy(): void;
};
/**
 * Returns an action and a getter for the live instance.
 *
 * @example
 * <script>
 *   import { createScrollDraw } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollDraw({ easing: 'spring' });
 * </script>
 * <div use:action><svg>...</svg></div>
 * <button on:click={() => getInstance()?.replay()}>Replay</button>
 */
declare function createScrollDraw(options?: ScrollDrawOptions): {
    action: (node: HTMLElement) => {
        destroy(): void;
    };
    getInstance: () => ScrollDrawInstance | null;
};
/**
 * Svelte action — animate any CSS property on any element driven by scroll.
 *
 * @example
 * <div use:scrollAnimate={{ props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] }, easing: 'ease-out', once: true }}>
 *   ...
 * </div>
 */
declare function scrollAnimate(node: HTMLElement, options: ScrollAnimateOptions): {
    update(newOptions: ScrollAnimateOptions): void;
    destroy(): void;
};
/**
 * Returns an action and a getter for the live instance.
 *
 * @example
 * <script>
 *   import { createScrollAnimate } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollAnimate({
 *     props: { opacity: [0, 1] }, easing: 'ease-out', once: true,
 *   });
 * </script>
 * <div use:action>...</div>
 * <button on:click={() => getInstance()?.replay()}>Replay</button>
 */
declare function createScrollAnimate(options: ScrollAnimateOptions): {
    action: (node: HTMLElement) => {
        destroy(): void;
    };
    getInstance: () => ScrollDrawInstance | null;
};
/**
 * Svelte action — animate a number from `from` to `to` as the element scrolls in.
 *
 * @example
 * <span use:scrollCounterAction={{ to: 1250000, format: n => '$' + Math.round(n).toLocaleString(), once: true }} />
 */
declare function scrollCounterAction(node: HTMLElement, options: ScrollCounterOptions): {
    update(newOptions: ScrollCounterOptions): void;
    destroy(): void;
};
/**
 * Returns an action and a getter for the live counter instance.
 *
 * @example
 * <script>
 *   import { createScrollCounter } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollCounter({ to: 1000, once: true });
 * </script>
 * <span use:action />
 */
declare function createScrollCounter(options: ScrollCounterOptions): {
    action: (node: HTMLElement) => {
        destroy(): void;
    };
    getInstance: () => ScrollDrawInstance | null;
};
/**
 * Svelte action — tie a <video> element's currentTime to scroll.
 *
 * @example
 * <video use:scrollVideoAction={{ trigger: { start: 'top top', end: 'bottom top' } }}
 *   src="/hero.mp4" muted playsinline preload="auto" />
 */
declare function scrollVideoAction(node: HTMLVideoElement, options?: ScrollVideoOptions): {
    update(newOptions: ScrollVideoOptions): void;
    destroy(): void;
};
/**
 * Returns an action and a getter for the live video instance.
 *
 * @example
 * <script>
 *   import { createScrollVideo } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollVideo({ once: false });
 * </script>
 * <video use:action src="/hero.mp4" muted playsinline preload="auto" />
 */
declare function createScrollVideo(options?: ScrollVideoOptions): {
    action: (node: HTMLVideoElement) => {
        destroy(): void;
    };
    getInstance: () => ScrollDrawInstance | null;
};
/**
 * Svelte action — split text and stagger-animate each piece on scroll.
 *
 * @example
 * <h2 use:scrollTextAction={{ split: 'words', stagger: 0.05, once: true }}>
 *   Animate on scroll.
 * </h2>
 */
declare function scrollTextAction(node: HTMLElement, options?: ScrollTextOptions): {
    update(newOptions: ScrollTextOptions): void;
    destroy(): void;
};
/**
 * Returns an action and a getter for the live text instance.
 *
 * @example
 * <script>
 *   import { createScrollText } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollText({ split: 'chars', stagger: 0.03 });
 * </script>
 * <p use:action>Hello world.</p>
 */
declare function createScrollText(options?: ScrollTextOptions): {
    action: (node: HTMLElement) => {
        destroy(): void;
    };
    getInstance: () => ScrollDrawInstance | null;
};

export { type ScrollAnimateOptions, type ScrollCounterOptions, type ScrollDrawOptions, type ScrollTextOptions, type ScrollVideoOptions, createScrollAnimate, createScrollCounter, createScrollDraw, createScrollText, createScrollVideo, scrollAnimate, scrollCounterAction, scrollDraw, scrollTextAction, scrollVideoAction };
