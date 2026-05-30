# svg-scroll-draw

[![CI](https://github.com/DhruvilChauahan0210/ink-scroll/actions/workflows/ci.yml/badge.svg)](https://github.com/DhruvilChauahan0210/ink-scroll/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/svg-scroll-draw)](https://www.npmjs.com/package/svg-scroll-draw)
[![downloads](https://img.shields.io/npm/dw/svg-scroll-draw)](https://www.npmjs.com/package/svg-scroll-draw)
[![bundle size](https://img.shields.io/bundlephobia/minzip/svg-scroll-draw)](https://bundlephobia.com/package/svg-scroll-draw)
[![license](https://img.shields.io/npm/l/svg-scroll-draw)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/DhruvilChauahan0210/ink-scroll?style=flat)](https://github.com/DhruvilChauahan0210/ink-scroll/stargazers)

> Scroll-driven SVG path animation. Zero dependencies. ~4.4 KB gzipped — vs 35–40 KB for Framer Motion / GSAP DrawSVG.

**[Live Demo](https://ink-scroll.vercel.app)** · [npm](https://www.npmjs.com/package/svg-scroll-draw) · [Report a bug](https://github.com/DhruvilChauahan0210/ink-scroll/issues)

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
| **GSAP DrawSVG** | 40KB+, requires a paid Club GreenSock license for commercial use |
| **Framer Motion** | 35KB+, React-only, heavy runtime for a single animation effect |
| **scroll-svg** | ~2KB but abandoned — forces you to target individual path IDs manually, crashes in Next.js |

`svg-scroll-draw` fixes all three pain points in one package.

---

## Quick start

### Vanilla JS

```js
import { scrollDraw } from 'svg-scroll-draw';

const instance = scrollDraw('#my-svg-container', {
  easing: 'ease-out',
  speed: 1.2,
});

// Clean up on SPA navigation / unmount
instance.destroy();
```

**[Try the Playground →](https://svg-scroll-draw.vercel.app/playground)**

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

**[Try the Playground →](https://svg-scroll-draw.vercel.app/playground)**

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

**[Try the Playground →](https://svg-scroll-draw.vercel.app/playground)**

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
| `native` | `boolean` | `true` | Run the draw as a native CSS scroll-driven animation when the browser supports it and the config is simple. Falls back to the JS engine automatically. Set `false` to always use the JS engine |

### Native CSS rendering

For the common case — a default trigger, a named easing, optional `fade`, forward or
reverse — `svg-scroll-draw` hands the animation to the browser's native
[`animation-timeline: view()`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline).
The draw then runs on the compositor with **zero per-frame JavaScript and no scroll or
resize listeners**.

It falls back to the JS engine automatically when the browser lacks support, or when the
config uses something CSS can't express declaratively — callbacks (`onProgress` /
`onComplete` / `waypoints`), `stagger`, `morphTo`, `velocityScale`, `autoReverse`,
`once`, `repeat`, a custom trigger, a custom scroll container, `speed ≠ 1`, a
custom-function or `spring` easing, or animated color/width/fill. The full instance API
(`pause`, `resume`, `seek`, `replay`, `getProgress`, `destroy`) works on both paths.

Pass `native: false` to force the JS engine regardless.

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

| Format | Minified | Gzipped |
|---|---|---|
| ESM (`.mjs`) | 11.9 KB | ~4.4 KB |
| CJS (`.cjs`) | 11.9 KB | ~4.4 KB |
| React (`/react`) | 13.4 KB | ~4.8 KB |
| IIFE / CDN (`.global.js`) | 12.9 KB | ~4.8 KB (includes Web Component) |

Still 8–9× smaller than Framer Motion (~35 KB) or GSAP DrawSVG (~40 KB), and on supporting browsers the simple case runs as a native CSS scroll animation with zero per-frame JavaScript.

---

## Browser support

Chrome 80+, Safari 14+, Firefox 75+, Edge 80+

---

## License

MIT
