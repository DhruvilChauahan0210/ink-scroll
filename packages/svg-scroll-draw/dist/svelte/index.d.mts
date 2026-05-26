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
interface ScrollDrawInstance {
    destroy: () => void;
    /** Reset and replay the animation from the beginning. */
    replay: () => void;
}

/**
 * Svelte action — apply to any container element wrapping an SVG.
 *
 * @example
 * <script>
 *   import { scrollDraw } from 'svg-scroll-draw/svelte';
 * </script>
 *
 * <div use:scrollDraw={{ easing: 'ease-out', speed: 1.2, fade: true }}>
 *   <svg>...</svg>
 * </div>
 */
declare function scrollDraw(node: HTMLElement, options?: ScrollDrawOptions): {
    update(newOptions: ScrollDrawOptions): void;
    destroy(): void;
};
/**
 * Composable helper — returns an action and the live instance so you can
 * call `instance.replay()` from your Svelte component logic.
 *
 * @example
 * <script>
 *   import { createScrollDraw } from 'svg-scroll-draw/svelte';
 *   const { action, getInstance } = createScrollDraw({ easing: 'spring' });
 * </script>
 *
 * <div use:action>
 *   <svg>...</svg>
 * </div>
 * <button on:click={() => getInstance()?.replay()}>Replay</button>
 */
declare function createScrollDraw(options?: ScrollDrawOptions): {
    action: (node: HTMLElement) => {
        destroy(): void;
    };
    getInstance: () => ScrollDrawInstance | null;
};

export { type ScrollDrawOptions, createScrollDraw, scrollDraw };
