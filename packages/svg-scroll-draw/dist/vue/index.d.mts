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
