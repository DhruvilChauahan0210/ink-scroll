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
declare function scrollVideo(target: string | HTMLVideoElement, options?: ScrollVideoOptions): ScrollDrawInstance;

export { type ScrollVideoOptions, scrollVideo };
