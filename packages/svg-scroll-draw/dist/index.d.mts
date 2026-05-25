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
    onComplete?: () => void;
}
interface ScrollDrawInstance {
    destroy: () => void;
}

declare function scrollDraw(target: string | Element, options?: ScrollDrawOptions): ScrollDrawInstance;

export { type ScrollDrawInstance, type ScrollDrawOptions, scrollDraw };
