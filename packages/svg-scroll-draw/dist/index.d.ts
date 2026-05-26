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
    /** Normalized scroll-progress offset between each path starting (0–1). e.g. 0.15 → each path begins 15% of the scroll range after the previous. */
    stagger?: number;
    /** 'forward' draws the path in (default). 'reverse' erases — path starts fully drawn and disappears as you scroll. */
    direction?: 'forward' | 'reverse';
    /** Draw once and stay drawn — animation does not reverse when scrolling back up. */
    once?: boolean;
    /** Show trigger zone overlay for debugging. Dev-only — stripped in production. */
    debug?: boolean;
    /** Scroll axis to track. 'y' (default) for vertical scroll, 'x' for horizontal scroll containers. */
    axis?: 'x' | 'y';
    /** Called every animation frame with the current draw progress (0–1) of the first path. */
    onProgress?: (alpha: number) => void;
    /** Fires once on the first frame the animation begins drawing. */
    onStart?: () => void;
    onComplete?: () => void;
}
interface ScrollDrawInstance {
    destroy: () => void;
    /** Reset and replay the animation from the beginning. */
    replay: () => void;
}

declare function scrollDraw(target: string | Element, options?: ScrollDrawOptions): ScrollDrawInstance;

export { type ScrollDrawInstance, type ScrollDrawOptions, scrollDraw };
