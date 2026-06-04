type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';
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

interface TimelineTrack {
    /** CSS selector for paths within the container to animate on this track. */
    selector: string;
    /** Progress value (0–1) within the overall scroll range where this track starts. */
    from: number;
    /** Progress value (0–1) within the overall scroll range where this track ends. */
    to: number;
    /** Easing for this track. Defaults to 'linear'. */
    easing?: EasingName | ((t: number) => number);
    /** Fade opacity in sync with this track's draw progress. */
    fade?: boolean;
}
interface ScrollDrawTimelineOptions {
    /** Scroll trigger window. Same syntax as scrollDraw(). */
    trigger?: {
        start?: string;
        end?: string;
    };
    /** Overall speed multiplier. Default 1. */
    speed?: number;
    /** Lock at max progress once reached. Default false. */
    once?: boolean;
    /** Scroll axis. Default 'y'. */
    axis?: 'x' | 'y';
    /** Per-path animation tracks — each with independent start/end within the scroll range. */
    tracks: TimelineTrack[];
    /** Fires when all tracks have reached their full draw progress. */
    onComplete?: () => void;
    /**
     * Replay the timeline N times (or 'infinite') after it completes. Works with
     * `once: true` — after completion + delay, paths reset and the animation plays
     * again on the next scroll-into-view. With `once: false` (default) the timeline
     * already reverses naturally on scroll-up, so repeat is a no-op.
     */
    repeat?: number | 'infinite';
    /** Milliseconds to wait before each repeat. Default 0. */
    repeatDelay?: number;
    /**
     * After the scroll-driven animation completes, automatically replay the full
     * timeline as a time-driven loop — no further scroll input needed. Use `true`
     * to loop infinitely or a number to loop N additional times.
     *
     * Each iteration plays over `loopDuration` milliseconds, then waits
     * `repeatDelay` before the next iteration begins.
     */
    loop?: boolean | number;
    /** Duration of each time-driven loop iteration in milliseconds. Default 1500. */
    loopDuration?: number;
    /**
     * Show a developer overlay panel visualising each track's window and live
     * fill progress. Injected into document.body as a fixed HUD, removed on destroy().
     * Useful for tuning `from`/`to` values without guessing.
     */
    debug?: boolean;
    /** Label shown in the debug panel header. Defaults to the target selector string. */
    label?: string;
}
/**
 * Animate multiple path groups with independent start/end windows within a
 * single scroll range. Unlike `stagger` (which offsets by time), each track
 * defines its own `from`/`to` slice of the 0–1 progress range.
 *
 * @example
 * import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';
 *
 * scrollDrawTimeline('#diagram', {
 *   trigger: { start: 'top 80%', end: 'bottom 20%' },
 *   tracks: [
 *     { selector: '.outline', from: 0,   to: 0.5, easing: 'ease-out' },
 *     { selector: '.detail',  from: 0.3, to: 0.8, easing: 'ease-in'  },
 *     { selector: '.label',   from: 0.7, to: 1.0, easing: 'spring'   },
 *   ],
 * });
 */
declare function scrollDrawTimeline(target: string | Element, options: ScrollDrawTimelineOptions): ScrollDrawInstance;

export { type ScrollDrawTimelineOptions, type TimelineTrack, scrollDrawTimeline };
