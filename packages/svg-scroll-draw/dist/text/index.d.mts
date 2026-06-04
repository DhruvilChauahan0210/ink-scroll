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
declare function scrollText(target: string | Element, options?: ScrollTextOptions): ScrollDrawInstance;

export { type ScrollTextOptions, scrollText };
