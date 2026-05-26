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
 * Framework-agnostic class for use in Angular components.
 * No @angular/core dependency required.
 *
 * @example
 * // In your Angular component:
 * import { ScrollDrawRef } from 'svg-scroll-draw/angular';
 *
 * @Component({ template: '<div #container><svg>...</svg></div>' })
 * export class HeroComponent implements AfterViewInit, OnDestroy {
 *   @ViewChild('container') containerRef!: ElementRef<HTMLElement>;
 *   private draw = new ScrollDrawRef();
 *
 *   ngAfterViewInit() {
 *     this.draw.init(this.containerRef.nativeElement, {
 *       easing: 'ease-out',
 *       speed: 1.2,
 *       fade: true,
 *     });
 *   }
 *
 *   ngOnDestroy() { this.draw.destroy(); }
 *
 *   replay() { this.draw.replay(); }
 * }
 */
declare class ScrollDrawRef {
    private instance;
    init(element: HTMLElement, options?: ScrollDrawOptions): this;
    replay(): this;
    destroy(): this;
}

export { type ScrollDrawInstance, type ScrollDrawOptions, ScrollDrawRef };
