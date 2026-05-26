import { createEngine } from '../core/engine';
import type { ScrollDrawOptions, ScrollDrawInstance } from '../core/types';

export type { ScrollDrawOptions, ScrollDrawInstance };

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
export class ScrollDrawRef {
  private instance: ScrollDrawInstance | null = null;

  init(element: HTMLElement, options: ScrollDrawOptions = {}): this {
    this.destroy();
    this.instance = createEngine(element, options);
    return this;
  }

  replay(): this {
    this.instance?.replay();
    return this;
  }

  destroy(): this {
    this.instance?.destroy();
    this.instance = null;
    return this;
  }
}
