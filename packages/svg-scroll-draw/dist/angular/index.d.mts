type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';
type PresetName = 'sketch' | 'reveal' | 'typewriter' | 'cinematic' | 'spring';
interface TriggerConfig {
    start?: string;
    end?: string;
}
interface ScrollDrawOptions {
    /**
     * Apply a named preset as the base configuration. User-supplied options
     * always override the preset. Available presets:
     * - `'sketch'`     — staggered ease-in draw, pencil feel
     * - `'reveal'`     — fade + ease-out, draws once on viewport entry
     * - `'typewriter'` — fast linear draw with stagger
     * - `'cinematic'`  — slow ease-in-out with fade, dramatic entrance
     * - `'spring'`     — spring easing, bouncy organic feel
     */
    preset?: PresetName;
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
    /** Delay in milliseconds before the engine starts observing. */
    delay?: number;
    /** Animate stroke color. Single string = static override. Tuple = interpolate from → to. */
    strokeColor?: string | [string, string];
    /** Animate stroke width. Single number = static override. Tuple = interpolate from → to. */
    strokeWidth?: number | [number, number];
    /** Animate fill opacity. Single number = static override. Tuple [from, to] = interpolate as the path draws. Use [0, 1] to flood fill in sync with the stroke draw. */
    fillOpacity?: number | [number, number];
    /**
     * Reveal the container using CSS clip-path instead of stroke-dashoffset.
     * Works on any content — SVG, images, text, divs.
     *
     * Pass a direction string to control which edge the reveal starts from,
     * or `true` as shorthand for `'left'`.
     *
     * Values: `'left' | 'right' | 'top' | 'bottom' | 'center'`
     */
    clip?: boolean | 'left' | 'right' | 'top' | 'bottom' | 'center';
    /** Fire callbacks at specific progress thresholds (0–1). Resets on replay(). */
    waypoints?: Record<number, () => void>;
    /** Scale animation speed by scroll velocity — faster scrolling = faster draw. Pass a number to control sensitivity (default 1). */
    velocityScale?: boolean | number;
    /** IntersectionObserver threshold (0–1). Default 0. */
    threshold?: number;
    /** IntersectionObserver rootMargin. Default "0px". */
    rootMargin?: string;
    /** Repeat the animation N times after completion. Use 'infinite' to loop forever. */
    repeat?: number | 'infinite';
    /** Milliseconds to wait between repeats. Default 0. */
    repeatDelay?: number;
    /**
     * Target path `d` attribute to morph toward as the animation progresses.
     * Paths must have compatible command structures (same number of numeric tokens).
     *
     * Only applies to `<path>` elements — silently no-ops on `<rect>`, `<circle>`,
     * `<line>`, and other SVG shape elements.
     */
    morphTo?: string;
    onProgress?: (alpha: number) => void;
    onStart?: () => void;
    onComplete?: () => void;
    /**
     * Trigger the animation when the element enters the viewport instead of
     * tying it to scroll position. The draw runs over `duration` milliseconds,
     * replaying each time the element re-enters the viewport (use `once: true`
     * to play only the first time).
     *
     * All visual options work in autoplay mode — `easing`, `stagger`, `fade`,
     * `strokeColor`, `strokeWidth`, `fillOpacity`, `clip`, `morphTo`, `waypoints`,
     * `repeat`, `repeatDelay`, `onStart`, `onComplete`, `onProgress`, etc.
     *
     * The full instance API (`pause`, `resume`, `seek`, `replay`, `getProgress`)
     * also works — `seek(0.5)` pauses at 50% of the duration.
     */
    autoplay?: boolean;
    /**
     * Duration of the autoplay animation in milliseconds. Only used when
     * `autoplay: true`. Default `1000`.
     */
    duration?: number;
    /**
     * Use the browser's native CSS scroll-driven animation
     * (`animation-timeline: view()`) when the configuration is simple enough and
     * the browser supports it. This runs the draw entirely on the compositor —
     * zero per-frame JavaScript, zero scroll/resize listeners.
     *
     * Falls back to the JS engine automatically when unsupported or when the
     * config uses a feature native CSS can't express (callbacks, stagger, morph,
     * velocity scaling, custom triggers, `once`, custom easing functions, etc.).
     *
     * - `undefined` / `true` (default): use native when eligible.
     * - `false`: always use the JS engine.
     */
    native?: boolean;
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

interface ScrollAnimateOptions {
    props: Record<string, string | number | [string | number, string | number]>;
    trigger?: TriggerConfig;
    easing?: EasingName | ((t: number) => number);
    speed?: number;
    once?: boolean;
    axis?: 'x' | 'y';
    scrollContainer?: string | Element;
    native?: boolean;
    onProgress?: (alpha: number) => void;
    onComplete?: () => void;
}

interface ScrollCounterOptions {
    from?: number;
    to: number;
    format?: (value: number) => string;
    easing?: EasingName | ((t: number) => number);
    trigger?: TriggerConfig;
    once?: boolean;
    decimals?: number;
    onComplete?: () => void;
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

/**
 * Framework-agnostic class for use in Angular components.
 * No @angular/core dependency required.
 *
 * @example
 * @Component({ template: '<div #container><svg>...</svg></div>' })
 * export class HeroComponent implements AfterViewInit, OnDestroy {
 *   @ViewChild('container') containerRef!: ElementRef<HTMLElement>;
 *   private draw = new ScrollDrawRef();
 *
 *   ngAfterViewInit() {
 *     this.draw.init(this.containerRef.nativeElement, {
 *       easing: 'ease-out', speed: 1.2, fade: true,
 *     });
 *   }
 *
 *   ngOnDestroy() { this.draw.destroy(); }
 * }
 */
declare class ScrollDrawRef {
    private instance;
    init(element: HTMLElement, options?: ScrollDrawOptions): this;
    replay(): this;
    pause(): this;
    resume(): this;
    seek(p: number): this;
    getProgress(): number;
    destroy(): this;
}
/**
 * Animate any CSS property on any element driven by scroll — Angular class-based API.
 *
 * @example
 * @Component({ template: '<div #el>...</div>' })
 * export class CardComponent implements AfterViewInit, OnDestroy {
 *   @ViewChild('el') elRef!: ElementRef<HTMLElement>;
 *   private animate = new ScrollAnimateRef();
 *
 *   ngAfterViewInit() {
 *     this.animate.init(this.elRef.nativeElement, {
 *       props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
 *       easing: 'ease-out',
 *       once: true,
 *     });
 *   }
 *
 *   ngOnDestroy() { this.animate.destroy(); }
 * }
 */
declare class ScrollAnimateRef {
    private instance;
    init(element: HTMLElement, options: ScrollAnimateOptions): this;
    replay(): this;
    pause(): this;
    resume(): this;
    seek(p: number): this;
    getProgress(): number;
    destroy(): this;
}
/**
 * Animate a number from `from` to `to` as the element scrolls into view — Angular class-based API.
 *
 * @example
 * @Component({ template: '<span #counter></span>' })
 * export class StatsComponent implements AfterViewInit, OnDestroy {
 *   @ViewChild('counter') counterRef!: ElementRef<HTMLElement>;
 *   private counter = new ScrollCounterRef();
 *
 *   ngAfterViewInit() {
 *     this.counter.init(this.counterRef.nativeElement, {
 *       to: 1_250_000,
 *       format: n => '$' + Math.round(n).toLocaleString(),
 *       once: true,
 *     });
 *   }
 *
 *   ngOnDestroy() { this.counter.destroy(); }
 * }
 */
declare class ScrollCounterRef {
    private instance;
    init(element: HTMLElement, options: ScrollCounterOptions): this;
    replay(): this;
    pause(): this;
    resume(): this;
    seek(p: number): this;
    getProgress(): number;
    destroy(): this;
}
/**
 * Tie a <video> element's currentTime to scroll — Angular class-based API.
 *
 * @example
 * @Component({ template: '<video #vid src="/hero.mp4" muted playsinline preload="auto"></video>' })
 * export class HeroVideoComponent implements AfterViewInit, OnDestroy {
 *   @ViewChild('vid') vidRef!: ElementRef<HTMLVideoElement>;
 *   private video = new ScrollVideoRef();
 *
 *   ngAfterViewInit() {
 *     this.video.init(this.vidRef.nativeElement, {
 *       trigger: { start: 'top top', end: 'bottom top' },
 *     });
 *   }
 *
 *   ngOnDestroy() { this.video.destroy(); }
 * }
 */
declare class ScrollVideoRef {
    private instance;
    init(element: HTMLVideoElement, options?: ScrollVideoOptions): this;
    replay(): this;
    pause(): this;
    resume(): this;
    seek(p: number): this;
    getProgress(): number;
    destroy(): this;
}
/**
 * Split text and stagger-animate each piece on scroll — Angular class-based API.
 *
 * @example
 * @Component({ template: '<h2 #headline>Animate on scroll.</h2>' })
 * export class HeroComponent implements AfterViewInit, OnDestroy {
 *   @ViewChild('headline') headlineRef!: ElementRef<HTMLElement>;
 *   private text = new ScrollTextRef();
 *
 *   ngAfterViewInit() {
 *     this.text.init(this.headlineRef.nativeElement, {
 *       split: 'words',
 *       stagger: 0.05,
 *       from: { opacity: 0, y: 24 },
 *       once: true,
 *     });
 *   }
 *
 *   ngOnDestroy() { this.text.destroy(); }
 * }
 */
declare class ScrollTextRef {
    private instance;
    init(element: HTMLElement, options?: ScrollTextOptions): this;
    replay(): this;
    pause(): this;
    resume(): this;
    seek(p: number): this;
    getProgress(): number;
    destroy(): this;
}

export { type ScrollAnimateOptions, ScrollAnimateRef, type ScrollCounterOptions, ScrollCounterRef, type ScrollDrawInstance, type ScrollDrawOptions, ScrollDrawRef, type ScrollTextOptions, ScrollTextRef, type ScrollVideoOptions, ScrollVideoRef };
