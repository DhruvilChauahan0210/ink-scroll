import { createEngine } from '../core/engine';
import { createAnimateEngine } from '../animate';
import { scrollCounter } from '../counter';
import { scrollVideo } from '../video';
import { scrollText } from '../text';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';
import type { ScrollAnimateOptions } from '../animate';
import type { ScrollCounterOptions } from '../counter';
import type { ScrollVideoOptions } from '../video';
import type { ScrollTextOptions } from '../text';

export type { ScrollDrawOptions, ScrollAnimateOptions, ScrollCounterOptions, ScrollVideoOptions, ScrollTextOptions, ScrollDrawInstance };

// ── ScrollDrawRef ─────────────────────────────────────────────────────────────

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
export class ScrollDrawRef {
  private instance: ScrollDrawInstance | null = null;

  init(element: HTMLElement, options: ScrollDrawOptions = {}): this {
    this.destroy();
    this.instance = createEngine(element, options);
    return this;
  }

  replay(): this { this.instance?.replay(); return this; }
  pause():  this { this.instance?.pause();  return this; }
  resume(): this { this.instance?.resume(); return this; }
  seek(p: number): this { this.instance?.seek(p); return this; }
  getProgress(): number { return this.instance?.getProgress() ?? 0; }

  destroy(): this {
    this.instance?.destroy();
    this.instance = null;
    return this;
  }
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
export class ScrollAnimateRef {
  private instance: ScrollDrawInstance | null = null;

  init(element: HTMLElement, options: ScrollAnimateOptions): this {
    this.destroy();
    this.instance = createAnimateEngine(element, options);
    return this;
  }

  replay(): this { this.instance?.replay(); return this; }
  pause():  this { this.instance?.pause();  return this; }
  resume(): this { this.instance?.resume(); return this; }
  seek(p: number): this { this.instance?.seek(p); return this; }
  getProgress(): number { return this.instance?.getProgress() ?? 0; }

  destroy(): this {
    this.instance?.destroy();
    this.instance = null;
    return this;
  }
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
export class ScrollCounterRef {
  private instance: ScrollDrawInstance | null = null;

  init(element: HTMLElement, options: ScrollCounterOptions): this {
    this.destroy();
    this.instance = scrollCounter(element, options);
    return this;
  }

  replay(): this { this.instance?.replay(); return this; }
  pause():  this { this.instance?.pause();  return this; }
  resume(): this { this.instance?.resume(); return this; }
  seek(p: number): this { this.instance?.seek(p); return this; }
  getProgress(): number { return this.instance?.getProgress() ?? 0; }

  destroy(): this {
    this.instance?.destroy();
    this.instance = null;
    return this;
  }
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
export class ScrollVideoRef {
  private instance: ScrollDrawInstance | null = null;

  init(element: HTMLVideoElement, options: ScrollVideoOptions = {}): this {
    this.destroy();
    this.instance = scrollVideo(element, options);
    return this;
  }

  replay(): this { this.instance?.replay(); return this; }
  pause():  this { this.instance?.pause();  return this; }
  resume(): this { this.instance?.resume(); return this; }
  seek(p: number): this { this.instance?.seek(p); return this; }
  getProgress(): number { return this.instance?.getProgress() ?? 0; }

  destroy(): this {
    this.instance?.destroy();
    this.instance = null;
    return this;
  }
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
export class ScrollTextRef {
  private instance: ScrollDrawInstance | null = null;

  init(element: HTMLElement, options: ScrollTextOptions = {}): this {
    this.destroy();
    this.instance = scrollText(element, options);
    return this;
  }

  replay(): this { this.instance?.replay(); return this; }
  pause():  this { this.instance?.pause();  return this; }
  resume(): this { this.instance?.resume(); return this; }
  seek(p: number): this { this.instance?.seek(p); return this; }
  getProgress(): number { return this.instance?.getProgress() ?? 0; }

  destroy(): this {
    this.instance?.destroy();
    this.instance = null;
    return this;
  }
}
