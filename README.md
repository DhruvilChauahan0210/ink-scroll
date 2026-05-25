# svg-scroll-draw

> Scroll-driven SVG path animation. Zero dependencies. Under 3KB gzipped.

```bash
npm i svg-scroll-draw
```

---

## Why this exists

The `stroke-dashoffset` trick for drawing SVG lines on scroll is well-known — but every existing tool that implements it is broken in a different way:

| Tool | Problem |
|---|---|
| **GSAP DrawSVG** | 40KB+, requires a paid Club GreenSock license for commercial use |
| **Framer Motion** | 35KB+, React-only, heavy runtime for a single animation effect |
| **scroll-svg** | ~2KB but abandoned — forces you to target individual path IDs manually, poor TypeScript types, crashes in Next.js |

`svg-scroll-draw` fixes all three pain points in one package.

---

## What makes it different

### Container automation
Competitors make you target every path by ID:
```js
scrollSvg('#path-1');
scrollSvg('#path-2');
```
One SVG edit from a designer and your code breaks. This library targets the **parent container**. It walks the DOM, discovers every `<path>`, `<polyline>`, `<line>`, and `<polygon>` automatically, and handles multi-path orchestration out of the box.

### SSR-safe by design
Vanilla scroll libraries crash Next.js, Remix, and Nuxt builds with `window is not defined`. This package ships as a dual ESM + CJS bundle with explicit `typeof window !== 'undefined'` guards throughout — safe for Server Components from day one.

### No layout thrashing
Basic `addEventListener('scroll')` loops cause micro-stutters on mobile and 120Hz screens. This library uses a two-layer performance pipeline:
1. **IntersectionObserver** — puts the animation engine to sleep entirely when the SVG is off-screen
2. **requestAnimationFrame** — batches all style updates with the browser's native refresh cycle

---

## Installation

```bash
npm i svg-scroll-draw
```

---

## Usage

### Vanilla JS

```js
import { scrollDraw } from 'svg-scroll-draw';

const instance = scrollDraw('#my-svg-container');

// Clean up (SPA navigation, unmount, etc.)
instance.destroy();
```

### React / Next.js

```tsx
import { ScrollDraw } from 'svg-scroll-draw/react';

export default function Hero() {
  return (
    <ScrollDraw speed={1.2} fade easing="ease-out">
      <svg width="500" height="500" viewBox="0 0 500 500">
        <path d="M10 80 C 40 10, 60 10, 95 80" stroke="black" fill="none" />
      </svg>
    </ScrollDraw>
  );
}
```

> **Next.js App Router:** The `ScrollDraw` component needs to run in the browser. Wrap it in a `'use client'` component or create a thin re-export:
> ```ts
> // components/ScrollDraw.tsx
> 'use client';
> export { ScrollDraw } from 'svg-scroll-draw/react';
> ```

---

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `selector` | `string` | `"path, polyline, line, polygon"` | Override which child elements to animate |
| `speed` | `number` | `1` | Scale factor — values above 1 complete the animation faster relative to scroll |
| `fade` | `boolean` | `false` | Simultaneously fade opacity from 0 → 1 while drawing |
| `easing` | `string \| fn` | `"linear"` | `linear`, `ease-in`, `ease-out`, `ease-in-out`, or a custom `(t: number) => number` |
| `trigger.start` | `string` | `"top bottom"` | When the animation begins. Format: `"element-anchor viewport-anchor"` |
| `trigger.end` | `string` | `"bottom top"` | When the animation completes |
| `onComplete` | `() => void` | — | Fires once when the path reaches 100% draw progress |

### Trigger anchors

Triggers use a two-word format: `"element-anchor viewport-anchor"`.

```js
scrollDraw('#logo', {
  trigger: {
    start: 'top bottom',  // animation starts when top of element hits bottom of viewport
    end: 'bottom top',    // animation ends when bottom of element hits top of viewport
  }
});
```

Available anchors: `top`, `center`, `bottom`.

---

## Bundle sizes

| Format | Size |
|---|---|
| ESM (`.mjs`) | 2.61 KB |
| CJS (`.cjs`) | 2.62 KB |
| IIFE / CDN (`.global.js`) | 3.04 KB |

### CDN usage

```html
<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>
<script>
  SvgScrollDraw.scrollDraw('#my-container');
</script>
```

---

## Browser support

Chrome 80+, Safari 14+, Firefox 75+, Edge 80+

---

## License

MIT
