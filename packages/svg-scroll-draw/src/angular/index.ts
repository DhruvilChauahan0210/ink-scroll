import { createEngine } from '../core/engine';
import { liveFns, optionsKey } from '../core/reactive';
import { createAnimateEngine } from '../animate/engine';
import { scrollCounter } from '../counter';
import { scrollVideo } from '../video';
import { scrollText } from '../text';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollVideoOptions } from '../video';
import type { ScrollTextOptions } from '../text';

export type { ScrollDrawOptions, ScrollAnimateOptions, ScrollCounterOptions, ScrollVideoOptions, ScrollTextOptions, ScrollDrawInstance };

// ── The engine behind each class ─────────────────────────────────────────────

/**
 * What every Ref class shares. `init()` starts the engine; `update()` is for
 * `ngOnChanges`: it rebuilds the engine when an option really changed and does
 * nothing for an equal object, so binding it to every change is safe. Callbacks
 * are read live, so a new function alone never rebuilds. Exported for typing;
 * use the five Ref classes below.
 */
export class EngineRef<E extends Element, O extends object> {
  private instance: ScrollDrawInstance | null = null;
  private el: E | null = null;
  private key = '';
  private latest!: O;

  constructor(private readonly create: (el: E, options: O) => ScrollDrawInstance) {}

  init(element: E, options: O): this {
    this.destroy();
    this.el = element;
    this.latest = options;
    this.key = optionsKey(options);
    this.instance = this.create(element, liveFns(options, () => this.latest));
    return this;
  }

  /** Call from `ngOnChanges` with the current options. A no-op before `init()`. */
  update(options: O): this {
    if (!this.el) return this;
    if (optionsKey(options) !== this.key) return this.init(this.el, options);
    this.latest = options;
    return this;
  }

  replay(): this { this.instance?.replay(); return this; }
  pause():  this { this.instance?.pause();  return this; }
  resume(): this { this.instance?.resume(); return this; }
  seek(p: number): this { this.instance?.seek(p); return this; }
  getProgress(): number { return this.instance?.getProgress() ?? 0; }

  destroy(): this {
    this.instance?.destroy();
    this.instance = this.el = null;
    return this;
  }
}

// ── ScrollDrawRef ─────────────────────────────────────────────────────────────

/**
 * Framework-agnostic class for use in Angular components.
 * No @angular/core dependency required.
 *
 * @example
 * @Component({ template: '<div #container><svg>...</svg></div>' })
 * export class HeroComponent implements AfterViewInit, OnChanges, OnDestroy {
 *   @ViewChild('container') containerRef!: ElementRef<HTMLElement>;
 *   private draw = new ScrollDrawRef();
 *
 *   @Input() speed = 1.2;
 *
 *   ngAfterViewInit() {
 *     this.draw.init(this.containerRef.nativeElement, this.options());
 *   }
 *
 *   // Rebuilds only when an option really changed.
 *   ngOnChanges() { this.draw.update(this.options()); }
 *
 *   ngOnDestroy() { this.draw.destroy(); }
 *
 *   private options() { return { easing: 'ease-out', speed: this.speed, fade: true }; }
 * }
 */
export class ScrollDrawRef extends EngineRef<HTMLElement, ScrollDrawOptions> {
  constructor() { super(createEngine); }
  init(element: HTMLElement, options: ScrollDrawOptions = {}): this { return super.init(element, options); }
}

// ── ScrollAnimateRef ──────────────────────────────────────────────────────────

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
export class ScrollAnimateRef extends EngineRef<HTMLElement, ScrollAnimateOptions> {
  constructor() { super(createAnimateEngine); }
}

// ── ScrollCounterRef ──────────────────────────────────────────────────────────

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
export class ScrollCounterRef extends EngineRef<HTMLElement, ScrollCounterOptions> {
  constructor() { super(scrollCounter); }
}

// ── ScrollVideoRef ────────────────────────────────────────────────────────────

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
export class ScrollVideoRef extends EngineRef<HTMLVideoElement, ScrollVideoOptions> {
  constructor() { super(scrollVideo); }
  init(element: HTMLVideoElement, options: ScrollVideoOptions = {}): this { return super.init(element, options); }
}

// ── ScrollTextRef ─────────────────────────────────────────────────────────────

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
export class ScrollTextRef extends EngineRef<HTMLElement, ScrollTextOptions> {
  constructor() { super(scrollText); }
  init(element: HTMLElement, options: ScrollTextOptions = {}): this { return super.init(element, options); }
}
