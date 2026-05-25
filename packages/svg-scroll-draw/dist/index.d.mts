type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
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
    /** Called every animation frame with the current draw progress (0–1) of the first path. */
    onProgress?: (alpha: number) => void;
    onComplete?: () => void;
}
interface ScrollDrawInstance {
    destroy: () => void;
}

declare function scrollDraw(target: string | Element, options?: ScrollDrawOptions): ScrollDrawInstance;

export { type ScrollDrawInstance, type ScrollDrawOptions, scrollDraw };
