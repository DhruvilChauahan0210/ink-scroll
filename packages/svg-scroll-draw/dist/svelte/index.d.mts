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
