type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';
type PresetName$1 = 'sketch' | 'reveal' | 'typewriter' | 'cinematic' | 'spring';
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
    preset?: PresetName$1;
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

type PresetName = 'sketch' | 'reveal' | 'typewriter' | 'cinematic' | 'spring';
/**
 * Named option bags for common scroll-draw patterns.
 * User options always override preset values.
 *
 * @example
 * scrollDraw('#logo', { preset: 'reveal' });
 * scrollDraw('#logo', { preset: 'sketch', easing: 'ease-out' }); // easing overrides preset
 */
declare const PRESETS: Record<PresetName, Partial<Omit<ScrollDrawOptions, 'preset'>>>;

/**
 * Returns a custom spring easing function.
 * - `tension` controls oscillation frequency (default 2.5 — higher = more bouncy)
 * - `friction` controls damping (default 2.2 — higher = less bouncy)
 *
 * @example
 * scrollDraw('#svg', { easing: createSpring({ tension: 3, friction: 1.8 }) });
 */
declare function createSpring({ tension, friction, }?: {
    tension?: number;
    friction?: number;
}): (t: number) => number;
/**
 * Returns a bounce-out easing function.
 * The animation rises to 1 and then makes `bounces` dips below 1 that settle.
 * - `bounces` — number of bounces after the initial approach (default 3)
 * - `decay`   — amplitude reduction per bounce (0–1, default 0.5)
 *
 * @example
 * scrollDraw('#svg', { easing: createBounce() });
 * scrollDraw('#svg', { easing: createBounce({ bounces: 5, decay: 0.4 }) });
 */
declare function createBounce({ bounces, decay, }?: {
    bounces?: number;
    decay?: number;
}): (t: number) => number;
/**
 * Returns an elastic-out easing function.
 * The animation overshoots past 1 and oscillates back, settling at 1.
 * Can produce values outside [0, 1] — the overshoot is the effect.
 * - `amplitude` — overshoot magnitude (>=1, default 1 → overshoots to ~1.25)
 * - `period`    — oscillation period in [0, 1] time (default 0.4)
 *
 * @example
 * scrollDraw('#svg', { easing: createElastic() });
 * scrollDraw('#svg', { easing: createElastic({ amplitude: 1.5, period: 0.3 }) });
 */
declare function createElastic({ amplitude, period, }?: {
    amplitude?: number;
    period?: number;
}): (t: number) => number;

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
interface ScrollParallaxOptions {
    speed?: number;
    axis?: 'x' | 'y';
    easing?: EasingName | ((t: number) => number);
    trigger?: TriggerConfig;
    onProgress?: (alpha: number) => void;
}
declare function scrollAnimate(target: string | Element, options: ScrollAnimateOptions): ScrollDrawInstance;
declare function scrollParallax(target: string | Element, options?: ScrollParallaxOptions): ScrollDrawInstance;

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
declare function scrollCounter(target: string | Element, options: ScrollCounterOptions): ScrollDrawInstance;

type StoryEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';
/** A traced path that strokes itself on across a scroll range. */
interface DrawAnimation {
    type: 'draw';
    /** DOM id the runtime binds to (with leading '#'), e.g. "#path-3". */
    target: string;
    /** SVG path data, in canvas coordinates. */
    d: string;
    /** Pre-measured total path length (px). */
    length: number;
    /** Scroll progress where the draw begins, e.g. "20%". */
    start: string;
    /** Scroll progress where the draw completes, e.g. "50%". */
    end: string;
    stroke: string;
    strokeWidth: number;
    easing: StoryEasing;
}
/** Any layer fading opacity across a scroll range. */
interface FadeAnimation {
    type: 'fade';
    target: string;
    start: string;
    end: string;
    from: number;
    to: number;
}
type StoryAnimation = DrawAnimation | FadeAnimation;
interface StoryScene {
    id: string;
    /** Optional background layer (a product photo) as a data URL or remote URL. */
    background?: string;
    animations: StoryAnimation[];
}
interface Story {
    version: 1;
    /** Total scroll height of the experience, e.g. "400vh". */
    totalHeight: string;
    /** The authoring viewBox the coordinates are expressed in. */
    canvas: {
        width: number;
        height: number;
    };
    scenes: StoryScene[];
}

interface CinematicOptions {
    /** Mount point — a selector or element. Becomes the scroll wrapper. */
    wrapper: string | HTMLElement;
}
interface CinematicInstance {
    /** Stop the scroll loop and detach observers (built DOM is left in place). */
    destroy: () => void;
    /** Current global scroll progress through the story (0–1). */
    getProgress: () => number;
}
/**
 * The viral loader. Reads a Cinematic Story (authored in the Studio) and wires
 * a scroll-scrubbed timeline: paths stroke themselves on and layers fade in as
 * the user scrolls, all driven off the wrapper's scroll progress.
 *
 *   import { Cinematic } from "svg-scroll-draw";
 *   import story from "./story.json";
 *   new Cinematic({ wrapper: "#app" }).loadStory(story);
 */
declare class Cinematic {
    private mount;
    constructor(options: CinematicOptions);
    loadStory(story: Story): CinematicInstance;
}

declare function scrollDraw(target: string | Element, options?: ScrollDrawOptions): ScrollDrawInstance;

export { Cinematic, type CinematicInstance, type CinematicOptions, type DrawAnimation, type FadeAnimation, PRESETS, type PresetName$1 as PresetName, type ScrollAnimateOptions, type ScrollCounterOptions, type ScrollDrawInstance, type ScrollDrawOptions, type ScrollParallaxOptions, type Story, type StoryAnimation, type StoryEasing, type StoryScene, createBounce, createElastic, createSpring, scrollAnimate, scrollCounter, scrollDraw, scrollParallax };
