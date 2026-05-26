import * as vue from 'vue';

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
    /** Delay in milliseconds before the engine starts observing (useful for page-load sequences). */
    delay?: number;
    /** Animate stroke color. Single string = static override. Tuple = interpolate from → to. */
    strokeColor?: string | [string, string];
    /** Animate stroke width. Single number = static override. Tuple = interpolate from → to. */
    strokeWidth?: number | [number, number];
    /** Fire callbacks at specific progress thresholds (0–1). Resets on replay(). */
    waypoints?: Record<number, () => void>;
    onProgress?: (alpha: number) => void;
    onStart?: () => void;
    onComplete?: () => void;
}

/** Composable — attach to any container ref. */
declare function useScrollDraw(options?: ScrollDrawOptions): vue.Ref<HTMLElement | null, HTMLElement | null>;
/** Component — wraps children in a <div> and initialises the engine. */
declare const ScrollDraw: vue.DefineComponent<vue.ExtractPropTypes<{
    selector: {
        type: StringConstructor;
    };
    speed: {
        type: NumberConstructor;
    };
    fade: {
        type: BooleanConstructor;
    };
    stagger: {
        type: NumberConstructor;
    };
    easing: {
        type: (StringConstructor | FunctionConstructor)[];
    };
    direction: {
        type: () => "forward" | "reverse";
    };
    trigger: {
        type: ObjectConstructor;
    };
    onProgress: {
        type: FunctionConstructor;
    };
    onStart: {
        type: FunctionConstructor;
    };
    onComplete: {
        type: FunctionConstructor;
    };
    once: {
        type: BooleanConstructor;
    };
    debug: {
        type: BooleanConstructor;
    };
}>, () => vue.VNode<vue.RendererNode, vue.RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, vue.ComponentOptionsMixin, vue.ComponentOptionsMixin, {}, string, vue.PublicProps, Readonly<vue.ExtractPropTypes<{
    selector: {
        type: StringConstructor;
    };
    speed: {
        type: NumberConstructor;
    };
    fade: {
        type: BooleanConstructor;
    };
    stagger: {
        type: NumberConstructor;
    };
    easing: {
        type: (StringConstructor | FunctionConstructor)[];
    };
    direction: {
        type: () => "forward" | "reverse";
    };
    trigger: {
        type: ObjectConstructor;
    };
    onProgress: {
        type: FunctionConstructor;
    };
    onStart: {
        type: FunctionConstructor;
    };
    onComplete: {
        type: FunctionConstructor;
    };
    once: {
        type: BooleanConstructor;
    };
    debug: {
        type: BooleanConstructor;
    };
}>> & Readonly<{}>, {
    fade: boolean;
    once: boolean;
    debug: boolean;
}, {}, {}, {}, string, vue.ComponentProvideOptions, true, {}, any>;

export { ScrollDraw, type ScrollDrawOptions, useScrollDraw };
