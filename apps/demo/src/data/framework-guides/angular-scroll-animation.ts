import type { FrameworkGuide } from './types';

export const GUIDE: FrameworkGuide = {
  slug: 'angular-scroll-animation',
  sections: [
    {
      id: 'fw-angular-onchanges',
      k: 'ngOnChanges',
      title: 'Call update() from ngOnChanges',
      body: [
        '`ngOnChanges` runs whenever a bound `@Input` changes, including inputs the animation never reads, and its first call comes before `ngAfterViewInit`. `update()` is shaped for that. Before `init()` it returns without doing anything, so the first call is harmless and `ngAfterViewInit` builds the engine.',
        'After that, `update()` compares the new options with the ones the engine was built from, as JSON. The same values in a fresh object keep the running engine where it is. A different value, such as a new `speed` or `trigger.start`, destroys the engine and builds a new one on the same element. Build the object in one `options()` method and call it from both hooks, since the same keys in a different order also read as a change.',
        '`init()` is the wrong call for `ngOnChanges`. In the component below, its first call would read `this.map.nativeElement` before Angular sets `map`, which it does only once the view is built, and every later call rebuilds whether or not anything changed. The browser suite drives the Angular class the way a component would: an `update()` with equal options keeps the engine, and doubling `speed` at the same scroll offset doubles how much of the path is drawn.',
      ],
      sample: {
        file: 'route-map.component.ts',
        code: `import { Component, ElementRef, Input, ViewChild,
         AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import { ScrollDrawRef, type ScrollDrawOptions } from 'svg-scroll-draw/angular';

@Component({
  selector: 'app-route-map',
  standalone: true,
  template: \`
    <figure #map>
      <svg viewBox="0 0 400 160">
        <path d="M20 140 C 120 20, 280 20, 380 140" stroke="currentColor" fill="none" />
      </svg>
      <figcaption>{{ caption }}</figcaption>
    </figure>
  \`,
})
export class RouteMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('map') map!: ElementRef<HTMLElement>;
  @Input() speed = 1;
  @Input() start = 'top 80%';
  @Input() caption = '';

  private line = new ScrollDrawRef();

  ngAfterViewInit() {
    this.line.init(this.map.nativeElement, this.options());
  }

  // Runs for caption too. Rebuilds only when speed or start differ.
  ngOnChanges() {
    this.line.update(this.options());
  }

  ngOnDestroy() {
    this.line.destroy();
  }

  private options(): ScrollDrawOptions {
    return { speed: this.speed, easing: 'ease-out', trigger: { start: this.start } };
  }
}`,
      },
    },
    {
      id: 'fw-angular-callbacks',
      k: 'callbacks',
      title: 'New callbacks do not rebuild',
      body: [
        'In that comparison a function counts only as present or absent, never by which function it is. So the arrow `options()` creates on each `ngOnChanges`, or a different formatter handed down through an `@Input`, keeps the engine. `init()` gave the engine stand-ins that look up the function of the same name in the latest options on every call, and `update()` stores those options, so the next call reaches the new function.',
        'Two edges follow from the same code. Going from no function to one is a change, so a parent that sets `[format]` after leaving it undefined rebuilds the engine once. And only top-level options are forwarded: a function nested inside one, such as a `waypoints` callback, stays the version the engine was built with until something else rebuilds it.',
      ],
      sample: {
        file: 'stat.component.ts',
        code: `import { Component, ElementRef, EventEmitter, Input, Output, ViewChild,
         AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import { ScrollCounterRef, type ScrollCounterOptions } from 'svg-scroll-draw/angular';

@Component({
  selector: 'app-stat',
  standalone: true,
  template: '<span #value></span>',
})
export class StatComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('value') value!: ElementRef<HTMLElement>;
  @Input({ required: true }) to!: number;
  @Input() format?: (n: number) => string;
  @Output() done = new EventEmitter<void>();

  private counter = new ScrollCounterRef();

  ngAfterViewInit() {
    this.counter.init(this.value.nativeElement, this.options());
  }

  // A new format from the parent, or the new onComplete arrow, is not a rebuild.
  ngOnChanges() {
    this.counter.update(this.options());
  }

  ngOnDestroy() {
    this.counter.destroy();
  }

  private options(): ScrollCounterOptions {
    return { to: this.to, format: this.format, onComplete: () => this.done.emit() };
  }
}`,
      },
    },
    {
      id: 'fw-angular-ssr',
      k: 'ssr',
      title: 'What runs during server rendering',
      body: [
        'With server rendering, Angular creates the component on the server, so a field like `private text = new ScrollTextRef()` runs there. The constructor only records which engine to build. Until `init()` runs, `replay()`, `pause()`, `resume()`, `seek()` and `destroy()` do nothing and `getProgress()` returns 0. The SSR suite imports the entry with no `window` and no `document`, constructs all five classes, and checks that each of those calls returns without throwing and that `getProgress()` is 0.',
        '`ngAfterViewInit` runs during a server render as well. If it calls `init()` there, each engine checks for `window` before anything else and hands back an instance whose methods do nothing. The browser then creates the component again and builds the real engine.',
        'That check is `typeof window` and nothing more, and the suite never calls `init()` on a server. If your server entry defines a global `window`, or you want `init()` kept off the server, test the platform first.',
      ],
      sample: {
        file: 'headline.component.ts',
        code: `import { Component, ElementRef, PLATFORM_ID, ViewChild, inject,
         AfterViewInit, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollTextRef } from 'svg-scroll-draw/angular';

@Component({
  selector: 'app-headline',
  standalone: true,
  template: '<h1 #title>Day three: the coast road</h1>',
})
export class HeadlineComponent implements AfterViewInit, OnDestroy {
  @ViewChild('title') title!: ElementRef<HTMLElement>;
  private text = new ScrollTextRef(); // constructed on the server too
  private browser = isPlatformBrowser(inject(PLATFORM_ID));

  ngAfterViewInit() {
    if (this.browser) {
      this.text.init(this.title.nativeElement, { split: 'words', once: true });
    }
  }

  ngOnDestroy() {
    this.text.destroy(); // safe whether or not init() ran
  }
}`,
      },
    },
  ],
};
