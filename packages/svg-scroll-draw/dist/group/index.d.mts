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
    /** Target path `d` attribute to morph toward as the animation progresses. Paths must have compatible structures. */
    morphTo?: string;
    onProgress?: (alpha: number) => void;
    onStart?: () => void;
    onComplete?: () => void;
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
 * @example
 * import { scrollDrawSequence } from 'svg-scroll-draw/group';
 *
 * const seq = scrollDrawSequence(['#step-1', '#step-2', '#step-3'], {
 *   easing: 'spring',
 * });
 */
declare function scrollDrawSequence(targets: Array<string | Element>, options?: ScrollDrawOptions): ScrollDrawInstance;

export { type ScrollDrawOptions, scrollDrawGroup, scrollDrawSequence };
