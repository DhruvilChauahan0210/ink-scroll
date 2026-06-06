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
interface ScrollParallaxOptions {
    speed?: number;
    axis?: 'x' | 'y';
    easing?: EasingName | ((t: number) => number);
    trigger?: TriggerConfig;
    onProgress?: (alpha: number) => void;
}

/**
 * Animate multiple SVG containers simultaneously with the same options.
 * Each container tracks its own scroll position independently.
 *
 * @example
 * import { scrollDrawGroup } from 'svg-scroll-draw/group';
 *
 * const group = scrollDrawGroup(['#hero-svg', '#logo', '#diagram'], {
 *   easing: 'ease-out',
 *   stagger: 0.1,
 * });
 *
 * group.replay(); // replays all at once
 * group.destroy();
 */
declare function scrollDrawGroup(targets: Array<string | Element>, options?: ScrollDrawOptions): ScrollDrawInstance;
/**
 * Animate multiple SVG containers in sequence — each one starts only after
 * the previous has reached 100% draw progress.
 *
 * **Note:** each step is internally forced to `once: true` regardless of the
 * option you pass. This prevents a completed step from being reset when the
 * user scrolls back, which would break the chain. If you need every step to
 * be reversible, use `scrollDrawGroup` with `autoReverse` instead.
 *
 * @example
 * import { scrollDrawSequence } from 'svg-scroll-draw/group';
 *
 * const seq = scrollDrawSequence(['#step-1', '#step-2', '#step-3'], {
 *   easing: 'spring',
 * });
 */
declare function scrollDrawSequence(targets: Array<string | Element>, options?: ScrollDrawOptions): ScrollDrawInstance;
/**
 * Animate multiple HTML/SVG elements simultaneously with scrollAnimate options.
 * Each element tracks its own scroll position independently. Perfect for
 * staggered card reveals, feature grids, or any multi-element entrance.
 *
 * @example
 * import { scrollAnimateGroup } from 'svg-scroll-draw/group';
 *
 * const group = scrollAnimateGroup(
 *   [card1El, card2El, card3El],
 *   {
 *     props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
 *     easing: 'ease-out',
 *     once: true,
 *   }
 * );
 *
 * group.replay();
 * group.destroy();
 */
declare function scrollAnimateGroup(targets: Array<string | Element>, options: ScrollAnimateOptions): ScrollDrawInstance;
/**
 * Fan-out scrollAnimate in sequence — each element starts animating only after
 * the previous one has reached 100%. Useful for step-by-step reveals.
 *
 * @example
 * import { scrollAnimateSequence } from 'svg-scroll-draw/group';
 *
 * scrollAnimateSequence(
 *   [step1El, step2El, step3El],
 *   {
 *     props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
 *     easing: 'ease-out',
 *   }
 * );
 */
declare function scrollAnimateSequence(targets: Array<string | Element>, options: ScrollAnimateOptions): ScrollDrawInstance;
/**
 * Apply a parallax effect to multiple elements simultaneously.
 * Each element moves at `speed × elementHeight` pixels independently.
 *
 * @example
 * import { scrollParallaxGroup } from 'svg-scroll-draw/group';
 *
 * // Three background layers at the same speed
 * scrollParallaxGroup(['#layer-far', '#layer-mid', '#layer-near'], { speed: 0.4 });
 *
 * // Opposite direction (floats upward as you scroll down)
 * scrollParallaxGroup(['#badge', '#tag'], { speed: -0.2 });
 */
declare function scrollParallaxGroup(targets: Array<string | Element>, options?: ScrollParallaxOptions): ScrollDrawInstance;

export { type ScrollAnimateOptions, type ScrollDrawOptions, type ScrollParallaxOptions, scrollAnimateGroup, scrollAnimateSequence, scrollDrawGroup, scrollDrawSequence, scrollParallaxGroup };
