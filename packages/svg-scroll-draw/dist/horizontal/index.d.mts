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

interface ScrollHorizontalOptions {
    /**
     * Total horizontal travel distance in pixels.
     * Default: `track.scrollWidth - window.innerWidth` (full content width minus viewport).
     */
    distance?: number;
    /**
     * Trigger window for the scroll → horizontal mapping.
     * Default: `{ start: 'top top', end: 'bottom bottom' }` — full container height.
     */
    trigger?: TriggerConfig;
    /** Easing for the horizontal movement. Default: `'linear'` (scrub feel). */
    easing?: EasingName | ((t: number) => number);
    /** Custom scroll container. Default: window. */
    scrollContainer?: string | Element;
    onProgress?: (progress: number) => void;
}
interface ScrollHorizontalInstance extends ScrollDrawInstance {
    /** Recalculate travel distance after layout change. */
    refresh: () => void;
}
/**
 * Drive horizontal movement (translateX) from vertical scroll.
 *
 * The Apple / Stripe "scroll to reveal horizontal sections" pattern.
 * You handle the sticky + overflow CSS; `scrollHorizontal` drives the translateX.
 *
 * Minimal CSS setup:
 *   .outer  { height: 400vh; }
 *   .sticky { position: sticky; top: 0; height: 100vh; overflow: hidden; }
 *   .track  { display: flex; width: max-content; }
 *
 * @example
 * scrollHorizontal('.track', {
 *   distance: 3 * window.innerWidth,
 *   trigger:  { start: 'top top', end: 'bottom bottom' },
 *   easing:   'linear',
 * });
 */
declare function scrollHorizontal(track: string | Element, options?: ScrollHorizontalOptions): ScrollHorizontalInstance;

export { type ScrollHorizontalInstance, type ScrollHorizontalOptions, scrollHorizontal };
