# svg-scroll-draw

[![npm](https://img.shields.io/npm/v/svg-scroll-draw)](https://www.npmjs.com/package/svg-scroll-draw)
[![downloads](https://img.shields.io/npm/dw/svg-scroll-draw)](https://www.npmjs.com/package/svg-scroll-draw)
[![size](https://img.shields.io/bundlephobia/minzip/svg-scroll-draw)](https://bundlephobia.com/package/svg-scroll-draw)
[![license](https://img.shields.io/npm/l/svg-scroll-draw)](./LICENSE)

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
| **scroll-svg** | ~2KB but abandoned — forces you to target individual path IDs manually, crashes in Next.js |

`svg-scroll-draw` fixes all three pain points in one package.

---

## Installation

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

## Usage

### Vanilla JS

```js
import { scrollDraw } from 'svg-scroll-draw';

const instance = scrollDraw('#my-svg-container', {
  easing: 'ease-out',
  speed: 1.2,
});

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

> **Next.js App Router:** add `'use client'` to any component that uses `ScrollDraw`.

### Vue 3

```vue
<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue';
</script>

<template>
  <ScrollDraw easing="ease-out" :speed="1.2">
    <svg>...</svg>
  </ScrollDraw>
</template>
```

Or use the composable directly:

```ts
import { useScrollDraw } from 'svg-scroll-draw/vue';

const containerRef = useScrollDraw({ easing: 'ease-out', speed: 1.2 });
```

### CDN / Web Component

```html
<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>

<!-- Web Component (auto-registered) -->
<scroll-draw easing="ease-out" speed="1.2">
  <svg>...</svg>
</scroll-draw>

<!-- Or vanilla JS API -->
<script>
  SvgScrollDraw.scrollDraw('#my-container', { easing: 'ease-out' });
</script>
```

---

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `selector` | `string` | `"path, polyline, line, polygon, rect, circle"` | CSS selector for child elements to animate |
| `speed` | `number` | `1` | Scale factor — values above 1 complete faster relative to scroll distance |
| `fade` | `boolean` | `false` | Simultaneously animate `opacity 0 → 1` while drawing |
| `easing` | `string \| fn` | `"linear"` | `linear`, `ease-in`, `ease-out`, `ease-in-out`, or a custom `(t: number) => number` |
| `stagger` | `number` | `0` | Normalized offset between each path starting. `0.15` = each path begins 15% of the scroll range after the previous |
| `direction` | `"forward" \| "reverse"` | `"forward"` | `reverse` starts fully drawn and erases as you scroll |
| `trigger.start` | `string` | `"top bottom"` | When animation begins. Accepts anchor strings (`"top bottom"`) or viewport percentages (`"20%"`) |
| `trigger.end` | `string` | `"bottom top"` | When animation ends |
| `onProgress` | `(alpha: number) => void` | — | Called every animation frame with current draw progress (0–1) |
| `onComplete` | `() => void` | — | Fires once when all paths reach 100% draw progress |

### Trigger anchors

```js
scrollDraw('#logo', {
  trigger: {
    start: 'top bottom',  // when top of element hits bottom of viewport
    end: 'bottom top',    // when bottom of element hits top of viewport
  }
});

// Or use viewport percentages
scrollDraw('#logo', {
  trigger: { start: '20%', end: '80%' }
});
```

Available named anchors: `top`, `center`, `bottom`.

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
