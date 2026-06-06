type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';
interface TriggerConfig {
    start?: string;
    end?: string;
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

interface ScrollProgressOptions {
    /**
     * CSS custom property to set on the target element (raw 0–1, unclamped on
     * the eased side). Default: `'--scroll-progress'`.
     */
    variable?: string;
    /**
     * Second property name for the eased value. Default: `'--scroll-progress-eased'`.
     * Set to `null` to skip writing the eased variable.
     */
    easedVariable?: string | null;
    trigger?: TriggerConfig;
    easing?: EasingName | ((t: number) => number);
    speed?: number;
    /** Scroll axis. Default: 'y'. */
    axis?: 'x' | 'y';
    /** Custom scroll container. Default: window. */
    scrollContainer?: string | Element;
    onProgress?: (raw: number, eased: number) => void;
}
/**
 * Expose scroll progress as CSS custom properties on a target element.
 *
 * The raw (linear) value and eased value are written every frame so CSS
 * transitions, `calc()` expressions, and `@property` animations can drive
 * visual effects with zero per-frame JS work beyond the variable update.
 *
 * @example
 * // JS
 * scrollProgress('#hero', { easing: 'ease-in-out' });
 *
 * // CSS
 * #hero {
 *   opacity: calc(var(--scroll-progress));
 *   transform: translateY(calc((1 - var(--scroll-progress-eased)) * 40px));
 * }
 */
declare function scrollProgress(target: string | Element, options?: ScrollProgressOptions): ScrollDrawInstance;

export { type ScrollProgressOptions, scrollProgress };
