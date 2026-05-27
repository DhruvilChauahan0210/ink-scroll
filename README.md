# svg-scroll-draw

[![npm](https://img.shields.io/npm/v/svg-scroll-draw)](https://www.npmjs.com/package/svg-scroll-draw)
[![downloads](https://img.shields.io/npm/dw/svg-scroll-draw)](https://www.npmjs.com/package/svg-scroll-draw)
[![bundle size](https://img.shields.io/bundlephobia/minzip/svg-scroll-draw)](https://bundlephobia.com/package/svg-scroll-draw)
[![license](https://img.shields.io/npm/l/svg-scroll-draw)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/DhruvilChauahan0210/ink-scroll?style=flat)](https://github.com/DhruvilChauahan0210/ink-scroll/stargazers)

> Scroll-driven SVG path animation. Zero dependencies. Under 3 KB gzipped.

**[Live Demo](https://svg-scroll-draw.vercel.app)** · **[Docs](https://svg-scroll-draw.vercel.app/docs)** · **[Examples](https://svg-scroll-draw.vercel.app/examples)** · [npm](https://www.npmjs.com/package/svg-scroll-draw) · [Report a bug](https://github.com/DhruvilChauahan0210/ink-scroll/issues)

![svg-scroll-draw demo](https://raw.githubusercontent.com/DhruvilChauahan0210/ink-scroll/main/demo.gif)

---

## Install

```bash
npm i svg-scroll-draw
# or
pnpm add svg-scroll-draw
# or
yarn add svg-scroll-draw
# or
bun add svg-scroll-draw
```

---

## Why this exists

The `stroke-dashoffset` trick for drawing SVG lines on scroll is well-known — but every existing tool that implements it is broken in a different way:

| Tool | Problem |
|---|---|
| **GSAP DrawSVG** | 40 KB+, requires a paid Club GreenSock license for commercial use |
| **Framer Motion** | 35 KB+, React-only, heavy runtime for a single animation effect |
| **scroll-svg** | ~2 KB but abandoned — forces you to target individual path IDs manually, crashes in Next.js |

`svg-scroll-draw` fixes all three pain points in one package.

---

## Quick start

### Vanilla JS

```js
import { scrollDraw } from 'svg-scroll-draw';

const instance = scrollDraw('#my-svg-container', {
  easing: 'ease-out',
  speed: 1.2,
  fade: true,
  once: true,
});

// Control playback
instance.pause();
instance.resume();
instance.seek(0.5);  // jump to 50%
instance.replay();
instance.destroy();  // clean up on unmount
```

### React / Next.js

```tsx
import { ScrollDraw } from 'svg-scroll-draw/react';

export default function Hero() {
  return (
    <ScrollDraw speed={1.2} easing="ease-out" fade once>
      <svg width="500" height="200" viewBox="0 0 500 200">
        <path d="M10 80 C 40 10, 60 10, 95 80" stroke="black" fill="none" />
      </svg>
    </ScrollDraw>
  );
}
```

### Vue 3

```vue
<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue';
</script>

<template>
  <ScrollDraw easing="ease-out" :speed="1.2" fade once>
    <svg>...</svg>
  </ScrollDraw>
</template>
```

Or use the composable directly:

```ts
import { useScrollDraw } from 'svg-scroll-draw/vue';

const containerRef = useScrollDraw({ easing: 'ease-out', speed: 1.2 });
```

### Svelte

```svelte
<script>
  import { scrollDraw } from 'svg-scroll-draw/svelte';
</script>

<div use:scrollDraw={{ easing: 'ease-out', fade: true, once: true }}>
  <svg>...</svg>
</div>
```

### Solid.js

```tsx
import { useScrollDraw } from 'svg-scroll-draw/solid';

function Hero() {
  const ref = useScrollDraw({ easing: 'ease-out', fade: true, once: true });
  return <div ref={ref}><svg>...</svg></div>;
}
```

### Angular

```ts
import { ScrollDrawRef } from 'svg-scroll-draw/angular';

export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLElement>;
  private draw = new ScrollDrawRef();

  ngAfterViewInit() {
    this.draw.init(this.containerRef.nativeElement, { easing: 'ease-out', once: true });
  }
  ngOnDestroy() { this.draw.destroy(); }
}
```

### Nuxt

```ts
import { ScrollDraw } from 'svg-scroll-draw/nuxt';
// or globally via plugin:
import { createScrollDrawPlugin } from 'svg-scroll-draw/nuxt';
```

### Astro

```astro
<div data-scroll-draw data-scroll-draw-options='{"easing":"ease-out","once":true}'>
  <svg>...</svg>
</div>

<script>
  import { initScrollDraw } from 'svg-scroll-draw/astro';
  initScrollDraw();
</script>
```

### CDN / Web Component

```html
<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>

<scroll-draw easing="ease-out" speed="1.2" fade once>
  <svg>...</svg>
</scroll-draw>
```

---

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `selector` | `string` | `"path, polyline, line, polygon, rect, circle"` | CSS selector for child elements to animate |
| `speed` | `number` | `1` | Scale factor — values above 1 complete faster |
| `easing` | `string \| fn` | `"linear"` | `linear`, `ease-in`, `ease-out`, `ease-in-out`, `spring`, or a custom `(t: number) => number` |
| `fade` | `boolean` | `false` | Animate `opacity 0 → 1` in sync with the draw |
| `stagger` | `number` | `0` | Delay between each path as a fraction of the scroll range |
| `direction` | `"forward" \| "reverse"` | `"forward"` | `reverse` starts fully drawn and erases on scroll |
| `once` | `boolean` | `false` | Lock at max progress — don't erase on scroll back |
| `trigger.start` | `string` | `"top bottom"` | When animation begins. Accepts anchor strings or percentages |
| `trigger.end` | `string` | `"bottom top"` | When animation ends |
| `autoReverse` | `boolean` | `false` | Automatically reverse direction when scrolling back up |
| `axis` | `"x" \| "y"` | `"y"` | Scroll axis — use `"x"` for horizontal scroll containers |
| `scrollContainer` | `string \| Element` | — | Custom scroll container (defaults to `window`) |
| `delay` | `number` | `0` | Milliseconds before the engine starts observing |
| `strokeColor` | `string \| [string, string]` | — | Static color or interpolate `[from, to]` as the path draws |
| `strokeWidth` | `number \| [number, number]` | — | Static width or animate `[from, to]` |
| `fillOpacity` | `number \| [number, number]` | — | Animate fill opacity. `[0, 1]` floods fill in sync with stroke draw |
| `clip` | `boolean \| "left" \| "right" \| "top" \| "bottom" \| "center"` | — | Reveal using CSS `clip-path` instead of stroke — works on any content |
| `morphTo` | `string` | — | Target SVG `d` attribute to morph toward as the animation progresses |
| `velocityScale` | `boolean \| number` | `false` | Scale speed by scroll velocity — faster scrolling draws faster |
| `repeat` | `number \| "infinite"` | `0` | Repeat the animation N times after completion |
| `repeatDelay` | `number` | `0` | Milliseconds between repeats |
| `waypoints` | `Record<number, () => void>` | — | Fire callbacks at specific progress thresholds (e.g. `{ 0.5: fn }`) |
| `onProgress` | `(alpha: number) => void` | — | Called every animation frame with current draw progress (0–1) |
| `onStart` | `() => void` | — | Fires once when animation begins |
| `onComplete` | `() => void` | — | Fires once when all paths reach full draw progress |
| `debug` | `boolean` | `false` | Render a visual overlay showing trigger zones (dev only) |
| `threshold` | `number` | `0` | IntersectionObserver threshold |
| `rootMargin` | `string` | `"0px"` | IntersectionObserver rootMargin |

### Trigger anchors

```js
scrollDraw('#logo', {
  trigger: {
    start: 'top bottom',   // when top of element hits bottom of viewport
    end:   'bottom top',   // when bottom of element hits top of viewport
  }
});

// Percentage shorthand
scrollDraw('#logo', { trigger: { start: '20%', end: '80%' } });
```

Available named anchors: `top`, `center`, `bottom`.

---

## Instance methods

`scrollDraw()` returns an instance with full playback control:

```js
const instance = scrollDraw('#svg', { easing: 'spring' });

instance.pause();          // pause at current progress
instance.resume();         // resume from where it stopped
instance.seek(0.5);        // jump to 50% and pause
instance.getProgress();    // returns current 0–1 value
instance.replay();         // reset and replay from beginning
instance.destroy();        // disconnect observer, cancel rAF, remove listeners
```

---

## CSS custom property

Every instance automatically sets `--scroll-draw-progress` on the container element on every frame. Use it to drive CSS animations without any JS callbacks:

```css
.hero-text {
  opacity: var(--scroll-draw-progress);
  transform: translateY(calc((1 - var(--scroll-draw-progress)) * 24px));
}
```

```js
// No onProgress needed — the CSS variable is set automatically
scrollDraw('#hero-svg', { easing: 'ease-out', once: true });
```

---

## createSpring

Parameterize the spring easing instead of using the hardcoded `'spring'` preset:

```js
import { scrollDraw, createSpring } from 'svg-scroll-draw';

// Gentle (same as 'spring')
scrollDraw('#svg', { easing: createSpring() });

// Snappy
scrollDraw('#svg', { easing: createSpring({ tension: 4, friction: 3 }) });

// Slow and wobbly
scrollDraw('#svg', { easing: createSpring({ tension: 1.5, friction: 1.2 }) });
```

| Param | Default | Description |
|---|---|---|
| `tension` | `2.5` | Oscillation frequency — higher = more bouncy |
| `friction` | `2.2` | Damping — higher = settles faster |

---

## Group & Sequence APIs

### scrollDrawGroup — animate multiple containers simultaneously

```js
import { scrollDrawGroup } from 'svg-scroll-draw/group';

const group = scrollDrawGroup(
  ['#hero-svg', '#logo', '#diagram'],
  { easing: 'ease-out', stagger: 0.1, once: true }
);

group.replay();
group.destroy();
```

### scrollDrawSequence — animate containers one after another

```js
import { scrollDrawSequence } from 'svg-scroll-draw/group';

const seq = scrollDrawSequence(
  ['#step-1', '#step-2', '#step-3'],
  { easing: 'spring', onComplete: () => console.log('done') }
);

seq.replay();
seq.destroy();
```

---

## scrollDrawTimeline

Animate multiple path groups with independent start/end windows within a single scroll range. Unlike `stagger`, windows can overlap freely.

```js
import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';

scrollDrawTimeline('#chart', {
  trigger: { start: 'top 80%', end: 'bottom 20%' },
  tracks: [
    { selector: '.axis',  from: 0,    to: 0.3,  easing: 'ease-out' },
    { selector: '.bar-1', from: 0.1,  to: 0.45, easing: 'ease-out' },
    { selector: '.bar-2', from: 0.28, to: 0.58, easing: 'ease-out' },
    { selector: '.bar-3', from: 0.45, to: 0.75, easing: 'ease-out' },
    { selector: '.trend', from: 0.75, to: 1.0,  easing: 'spring'   },
  ],
});
```

Each track:

| Field | Type | Description |
|---|---|---|
| `selector` | `string` | CSS selector scoped to the container |
| `from` | `number` | 0–1 progress value where this track starts |
| `to` | `number` | 0–1 progress value where this track ends |
| `easing` | `string \| fn` | Easing for this track independently |
| `fade` | `boolean` | Fade opacity in sync with this track's draw |

---

## useScrollDrawProgress (React)

A hook that returns reactive scroll progress (0–1) for any element — use it to drive any animation alongside or independent of an SVG draw:

```tsx
import { useRef } from 'react';
import { useScrollDrawProgress } from 'svg-scroll-draw/react';

function Section() {
  const ref      = useRef<HTMLDivElement>(null);
  const progress = useScrollDrawProgress(ref, { easing: 'ease-out' });

  return (
    <div ref={ref} style={{ opacity: progress, transform: `translateY(${(1 - progress) * 32}px)` }}>
      Fades and slides in
    </div>
  );
}
```

---

## Bundle sizes

| Format | Size |
|---|---|
| ESM (`.mjs`) | ~3.2 KB |
| CJS (`.cjs`) | ~3.2 KB |
| IIFE / CDN (`.global.js`) | ~4.2 KB (includes Web Component) |

---

## Browser support

Chrome 80+, Safari 14+, Firefox 75+, Edge 80+

---

## License

MIT
