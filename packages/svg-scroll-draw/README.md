# svg-scroll-draw

[![CI](https://github.com/DhruvilChauahan0210/ink-scroll/actions/workflows/ci.yml/badge.svg)](https://github.com/DhruvilChauahan0210/ink-scroll/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/svg-scroll-draw)](https://www.npmjs.com/package/svg-scroll-draw)
[![downloads](https://img.shields.io/npm/dw/svg-scroll-draw)](https://www.npmjs.com/package/svg-scroll-draw)
[![bundle size](https://img.shields.io/bundlephobia/minzip/svg-scroll-draw)](https://bundlephobia.com/package/svg-scroll-draw)
[![license](https://img.shields.io/npm/l/svg-scroll-draw)](./LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/DhruvilChauahan0210/ink-scroll?style=flat)](https://github.com/DhruvilChauahan0210/ink-scroll/stargazers)

> The scroll animation platform. Animate SVG paths, CSS properties, counters, video, and text — all scroll-driven, all MIT, all under 10 KB. GSAP is overkill.

**[Live Demo](https://svg-scroll-draw.vercel.app)** · [npm](https://www.npmjs.com/package/svg-scroll-draw) · [Docs](https://svg-scroll-draw.vercel.app/docs) · [Examples](https://svg-scroll-draw.vercel.app/examples) · [Report a bug](https://github.com/DhruvilChauahan0210/ink-scroll/issues)

---

## What's in v2

| API | Import | What it does |
|---|---|---|
| `scrollAnimate` | `svg-scroll-draw` | Animate **any CSS property** on any element driven by scroll. Replaces `gsap.to + ScrollTrigger`. |
| `scrollCounter` | `svg-scroll-draw` | Animate a number from `from` to `to` as it scrolls into view. Custom format, decimals, easing. |
| `scrollParallax` | `svg-scroll-draw` | Move any element at a different rate than scroll. Speed multiplier, reverse direction. |
| `scrollDraw` | `svg-scroll-draw` | The original — scroll-driven SVG path drawing via `stroke-dashoffset`. |
| `scrollVideo` | `svg-scroll-draw/video` | Tie `<video>.currentTime` to scroll. The Apple/Stripe product-page pattern. |
| `scrollText` | `svg-scroll-draw/text` | Split text into chars/words/lines and stagger-animate each on scroll. Free GSAP SplitText. |
| `devtools` | `svg-scroll-draw/devtools` | Visual overlay showing every active animation's triggers and progress. Dev-only. |

All APIs return the same instance object: `{ destroy, replay, pause, resume, seek, getProgress }`.

---

## Install

```bash
npm i svg-scroll-draw
# pnpm add svg-scroll-draw
# yarn add svg-scroll-draw
# bun add svg-scroll-draw
```

---

## scrollAnimate — any CSS property on scroll

```js
import { scrollAnimate } from 'svg-scroll-draw';

// Fade + slide in
scrollAnimate('#hero-text', {
  props: {
    opacity:   [0, 1],
    transform: ['translateY(40px)', 'translateY(0px)'],
  },
  easing: 'ease-out',
  once:   true,
});

// Color transition
scrollAnimate('#section', {
  props: {
    backgroundColor: ['#ffffff', '#0d0d0d'],
    color:           ['#000000', '#ffffff'],
  },
  trigger: { start: 'top 60%', end: 'top 20%' },
});

// Multiple elements with stagger
document.querySelectorAll('.card').forEach((el, i) => {
  scrollAnimate(el, {
    props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
    trigger: { start: `top ${85 - i * 5}%`, end: `top ${50 - i * 5}%` },
    easing: 'ease-out',
    once:   true,
  });
});
```

#### React

```tsx
import { ScrollAnimate } from 'svg-scroll-draw/react';

<ScrollAnimate
  props={{ opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] }}
  easing="ease-out"
  once
>
  <div>Any content — HTML or SVG</div>
</ScrollAnimate>
```

#### scrollAnimate options

| Option | Type | Default | Description |
|---|---|---|---|
| `props` | `Record<string, [from, to]>` | — | CSS properties to animate. Supports numbers, hex/rgb colors, transform functions, and unit values like `40px`. |
| `trigger.start` | `string` | `"top bottom"` | When animation begins |
| `trigger.end` | `string` | `"bottom top"` | When animation ends |
| `easing` | `string \| fn` | `"ease-out"` | Same easing system as `scrollDraw` |
| `speed` | `number` | `1` | Animation scale factor |
| `once` | `boolean` | `false` | Freeze at max progress — doesn't reverse on scroll back |
| `axis` | `"x" \| "y"` | `"y"` | Scroll axis |
| `native` | `boolean` | `true` | Use CSS `animation-timeline: view()` fast path when eligible |
| `onProgress` | `(n: number) => void` | — | Called every frame with alpha 0–1 |
| `onComplete` | `() => void` | — | Fires when alpha reaches 1 |

---

## scrollCounter — animated number on scroll

```js
import { scrollCounter } from 'svg-scroll-draw';

// Simple count-up
scrollCounter('#users', { to: 50_000, once: true });

// Formatted currency
scrollCounter('#revenue', {
  to:     1_250_000,
  format: n => '$' + Math.round(n).toLocaleString(),
  easing: 'ease-out',
  once:   true,
});

// Percentage with decimal
scrollCounter('#rate', {
  from:     0,
  to:       94.7,
  decimals: 1,
  format:   n => n.toFixed(1) + '%',
});
```

#### React

```tsx
import { ScrollCounter } from 'svg-scroll-draw/react';

<ScrollCounter to={50000} format={n => n.toLocaleString()} once />
```

#### scrollCounter options

| Option | Type | Default | Description |
|---|---|---|---|
| `to` | `number` | — | Target value **(required)** |
| `from` | `number` | `0` | Starting value. Set higher than `to` to count down. |
| `format` | `(n: number) => string` | `String(Math.round(n))` | Custom formatter |
| `decimals` | `number` | — | Shorthand for `format: n => n.toFixed(decimals)` |
| `easing` | `string \| fn` | `"ease-out"` | — |
| `trigger` | `TriggerConfig` | `{ start: 'top 80%', end: 'top 20%' }` | — |
| `once` | `boolean` | `true` | — |
| `onComplete` | `() => void` | — | — |

---

## scrollParallax — parallax in one line

```js
import { scrollParallax } from 'svg-scroll-draw';

scrollParallax('#hero-bg', { speed: 0.4 });           // 40% of scroll rate
scrollParallax('#floating-badge', { speed: -0.3 });   // opposite direction
scrollParallax('#sidebar', { speed: 0.3, axis: 'x' }); // horizontal
```

`speed` is a multiplier relative to element height. `0.5` = half scroll speed, `-0.2` = opposite direction.

---

## scrollVideo — video scrubbing on scroll

```js
import { scrollVideo } from 'svg-scroll-draw/video';

// Scrub the full video as user scrolls through the section
scrollVideo('#hero-video', {
  trigger: { start: 'top top', end: 'bottom top' },
});

// Scrub only the first 3 seconds
scrollVideo('#product-reveal', {
  from:    0,
  to:      3,
  trigger: { start: 'top 80%', end: 'top 20%' },
  easing:  'ease-in-out',
});
```

```html
<!-- Recommended attributes for smooth scrubbing -->
<video id="hero-video" src="hero.mp4" muted playsinline preload="auto"></video>
```

#### React

```tsx
import { ScrollVideo } from 'svg-scroll-draw/react';

<ScrollVideo src="/hero.mp4" trigger={{ start: 'top top', end: 'bottom top' }} />
```

#### scrollVideo options

| Option | Type | Default | Description |
|---|---|---|---|
| `from` | `number` | `0` | Start time in seconds |
| `to` | `number` | `video.duration` | End time in seconds |
| `trigger` | `TriggerConfig` | `{ start: 'top top', end: 'bottom top' }` | — |
| `easing` | `string \| fn` | `"linear"` | — |
| `once` | `boolean` | `false` | — |
| `preload` | `"auto" \| "metadata"` | `"auto"` | Sets `preload` attribute if not already present |
| `onReady` | `() => void` | — | Fires when video metadata is loaded |
| `onProgress` | `(n: number) => void` | — | — |
| `onComplete` | `() => void` | — | — |

---

## scrollText — text reveal on scroll

Free replacement for GSAP SplitText (which requires a $150+/yr Club GreenSock subscription).

```js
import { scrollText } from 'svg-scroll-draw/text';

// Words fade up one by one
scrollText('#headline', {
  split:   'words',
  stagger: 0.05,
  from:    { opacity: 0, y: 24 },
  easing:  'ease-out',
  once:    true,
});

// Characters with rotation
scrollText('#tagline', {
  split:   'chars',
  stagger: 0.025,
  from:    { opacity: 0, y: 32, rotate: 8 },
  once:    true,
});
```

#### React

```tsx
import { ScrollText } from 'svg-scroll-draw/react';

<ScrollText split="words" stagger={0.05} from={{ opacity: 0, y: 24 }} once>
  Animate this headline word by word.
</ScrollText>
```

#### scrollText options

| Option | Type | Default | Description |
|---|---|---|---|
| `split` | `"chars" \| "words" \| "lines"` | `"words"` | How to split the text |
| `stagger` | `number` | `0.04` | Delay between each unit (0–1 fraction of the animation range) |
| `from` | `{ opacity?, y?, x?, rotate?, scale? }` | `{ opacity: 0, y: 24 }` | Starting state of each unit |
| `easing` | `string \| fn` | `"ease-out"` | — |
| `trigger` | `TriggerConfig` | `{ start: 'top 85%', end: 'top 40%' }` | — |
| `once` | `boolean` | `true` | — |
| `onComplete` | `() => void` | — | — |

> **Accessibility:** `scrollText` preserves the original text in `aria-label` on the container and adds `aria-hidden="true"` to all split spans. `destroy()` fully restores the original HTML.

---

## scrollDraw — SVG path drawing (v1 API, unchanged)

```js
import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#my-svg', {
  easing:    'ease-out',
  speed:     1.2,
  fade:      true,
  once:      true,
  stagger:   0.15,
  trigger:   { start: 'top 80%', end: 'top 20%' },
});
```

#### React / Next.js

```tsx
import { ScrollDraw } from 'svg-scroll-draw/react';

export default function Hero() {
  return (
    <ScrollDraw speed={1.2} fade easing="ease-out" once>
      <svg width="500" height="500" viewBox="0 0 500 500">
        <path d="M10 80 C 40 10, 60 10, 95 80" stroke="black" fill="none" />
      </svg>
    </ScrollDraw>
  );
}
```

> **Next.js App Router:** add `'use client'` to any component that uses these wrappers.

#### Vue 3

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

#### scrollDraw options

| Option | Type | Default | Description |
|---|---|---|---|
| `selector` | `string` | `"path, polyline…"` | CSS selector for child elements to animate |
| `speed` | `number` | `1` | Scale factor relative to scroll distance |
| `fade` | `boolean` | `false` | Animate `opacity 0 → 1` simultaneously |
| `easing` | `string \| fn` | `"linear"` | `linear`, `ease-in`, `ease-out`, `ease-in-out`, `spring`, `bounce`, `elastic`, or `(t) => t` |
| `stagger` | `number` | `0` | Offset between each path starting (fraction of scroll range) |
| `direction` | `"forward" \| "reverse"` | `"forward"` | `reverse` erases the path as you scroll |
| `trigger.start` | `string` | `"top bottom"` | When animation begins |
| `trigger.end` | `string` | `"bottom top"` | When animation ends |
| `once` | `boolean` | `false` | Lock at max progress |
| `debug` | `boolean` | `false` | Show trigger zone overlay (dev only) |
| `axis` | `"x" \| "y"` | `"y"` | Scroll axis |
| `scrollContainer` | `string \| Element` | `window` | Custom scroll container |
| `autoReverse` | `boolean` | `false` | Reverse when scrolling back up |
| `delay` | `number` | `0` | ms before the engine starts observing |
| `strokeColor` | `string \| [string, string]` | — | Static color or `[from, to]` animation |
| `strokeWidth` | `number \| [number, number]` | — | Static width or `[from, to]` animation |
| `fillOpacity` | `number \| [number, number]` | — | Animate fill opacity in sync with the draw |
| `clip` | `boolean \| "left" \| "right" \| "top" \| "bottom" \| "center"` | `false` | Reveal via CSS `clip-path` instead of stroke-dashoffset |
| `morphTo` | `string` | — | SVG path `d` value to morph toward |
| `waypoints` | `Record<number, () => void>` | — | Callbacks at specific progress thresholds (0–1) |
| `velocityScale` | `boolean \| number` | `false` | Scale draw speed by scroll velocity |
| `repeat` | `number \| "infinite"` | `0` | Replay N times after completion |
| `repeatDelay` | `number` | `0` | ms between repeats |
| `autoplay` | `boolean` | `false` | Trigger on viewport entry instead of scroll |
| `duration` | `number` | `1000` | Duration in ms for `autoplay` mode |
| `native` | `boolean` | `true` | Use CSS `animation-timeline: view()` when eligible |
| `preset` | `"sketch" \| "reveal" \| "typewriter" \| "cinematic" \| "spring"` | — | Apply a named option preset as the base config |
| `onProgress` | `(alpha: number) => void` | — | Called every frame with draw progress (0–1) |
| `onStart` | `() => void` | — | Fires on the first frame |
| `onComplete` | `() => void` | — | Fires when all paths reach 100% |

---

## Instance API

Every function returns the same instance object:

```ts
const inst = scrollAnimate('#el', { props: { opacity: [0, 1] } });
// Same for scrollDraw, scrollCounter, scrollVideo, scrollText, scrollParallax

inst.pause();           // pause at current frame
inst.resume();          // resume from paused state
inst.seek(0.5);         // jump to 50% and pause
inst.replay();          // reset and replay from the beginning
inst.getProgress();     // → number 0–1
inst.destroy();         // remove all listeners and clean up
```

---

## Easing

All APIs share the same easing system:

```js
// Named strings
easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic'

// Custom function
easing: (t: number) => number

// Factory functions for parameterized physics easings
import { createSpring, createBounce, createElastic } from 'svg-scroll-draw';

easing: createSpring({ tension: 3, friction: 1.8 })
easing: createBounce({ bounces: 4, decay: 0.4 })
easing: createElastic({ amplitude: 1.5, period: 0.3 })
```

---

## Presets

Named option bags for `scrollDraw`:

```js
import { scrollDraw, PRESETS } from 'svg-scroll-draw';

scrollDraw('#logo', { preset: 'sketch' });    // staggered ease-in, pencil feel
scrollDraw('#hero', { preset: 'reveal' });    // fade + ease-out, once
scrollDraw('#type', { preset: 'typewriter' }); // fast linear stagger
scrollDraw('#film', { preset: 'cinematic' }); // slow ease-in-out + fade
scrollDraw('#icon', { preset: 'spring' });    // spring easing

// Inspect or extend
console.log(PRESETS.sketch);
```

---

## DevTools

Visual debug overlay — shows every active animation's trigger window, progress bar, and type. Zero production bytes.

```js
import { devtools } from 'svg-scroll-draw/devtools';

devtools.enable();    // Cmd/Ctrl+Shift+S to toggle
devtools.disable();
devtools.highlight('#my-element'); // outline for 2 seconds
```

---

## Sub-path exports

| Import | Contents |
|---|---|
| `svg-scroll-draw` | `scrollDraw`, `scrollAnimate`, `scrollCounter`, `scrollParallax`, `PRESETS`, easing factories |
| `svg-scroll-draw/react` | `ScrollDraw`, `ScrollAnimate`, `ScrollCounter`, `ScrollVideo`, `ScrollText`, `useScrollDrawProgress` |
| `svg-scroll-draw/vue` | `ScrollDraw`, `useScrollDraw` |
| `svg-scroll-draw/svelte` | `scrollDraw` action, `createScrollDraw` |
| `svg-scroll-draw/solid` | `useScrollDraw`, `createScrollDraw` |
| `svg-scroll-draw/angular` | `ScrollDrawRef` |
| `svg-scroll-draw/astro` | `initScrollDraw()` |
| `svg-scroll-draw/nuxt` | `useScrollDraw()` composable |
| `svg-scroll-draw/video` | `scrollVideo` |
| `svg-scroll-draw/text` | `scrollText` |
| `svg-scroll-draw/group` | `scrollDrawGroup`, `scrollDrawSequence` |
| `svg-scroll-draw/timeline` | `scrollDrawTimeline` |
| `svg-scroll-draw/cinematic` | `Cinematic` |
| `svg-scroll-draw/devtools` | `devtools` (dev-only) |

---

## Bundle sizes

| Entry | Gzipped |
|---|---|
| `svg-scroll-draw` (main) | ~9 KB |
| `svg-scroll-draw/react` | ~3 KB |
| `svg-scroll-draw/video` | ~1.5 KB |
| `svg-scroll-draw/text` | ~2 KB |
| `svg-scroll-draw/devtools` | ~4 KB (dev only) |

GSAP core + ScrollTrigger = ~40 KB gzipped. **svg-scroll-draw v2 covers 95% of those use cases at ~9 KB.**

---

## CDN / Web Component

```html
<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>

<scroll-draw easing="ease-out" speed="1.2">
  <svg>...</svg>
</scroll-draw>

<script>
  SvgScrollDraw.scrollDraw('#container', { easing: 'ease-out' });
  SvgScrollDraw.scrollAnimate('#hero', {
    props: { opacity: [0, 1] }, easing: 'ease-out', once: true,
  });
</script>
```

---

## CLI

```bash
npx svg-scroll-draw init
```

Scaffolds a ready-to-use starter file for React, Vue, Svelte, Solid, or Vanilla JS.

---

## Browser support

Chrome 80+, Safari 14+, Firefox 75+, Edge 80+

Native CSS `animation-timeline: view()` fast path: Chrome 115+, Safari 18+, Firefox 110+. Automatically falls back to the JS engine on older browsers.

---

## License

MIT
