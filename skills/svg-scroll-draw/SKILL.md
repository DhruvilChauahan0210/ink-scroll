---
name: svg-scroll-draw
description: Use when building scroll-driven animation on the web with the svg-scroll-draw npm package — drawing SVG paths/strokes as the page scrolls, reveal-on-scroll (fade/slide in), animating any CSS property with scroll, parallax, pinning a section, snapping between sections, horizontal scroll sections, animated number counters, splitting text into words/chars and staggering it, scrubbing a video with scroll, or exposing scroll progress as a CSS variable. Also use when replacing GSAP ScrollTrigger, DrawSVG, SplitText, AOS or ScrollReveal for those effects, in React, Next.js (App Router), Vue/Nuxt, Svelte, Solid, Angular, Astro, a Web Component, or plain HTML/CDN.
---

# svg-scroll-draw

Zero-dependency, MIT scroll animation library (`npm i svg-scroll-draw`, v2.10.x).
Every API is its own entry point, so import only what you use. Main entry is
10.7 KB gzipped; `svg-scroll-draw/reveal` 5.0 KB, `/text` 2.8 KB, `/pin` 1.4 KB,
`/snap` 1.9 KB.

Where the browser supports CSS scroll-driven animations (`animation-timeline`:
Chrome/Edge 115+, Safari 26+, Firefox 159+), simple `scrollDraw` and
`scrollAnimate` configs run as native CSS with no per-frame JavaScript. Every
other config and browser uses the JS engine automatically. You never choose;
`native: false` forces the JS engine.

Docs: https://svg-scroll-draw.vercel.app/docs · LLM summary: https://svg-scroll-draw.vercel.app/llms.txt

## Pick the entry by effect

| Effect | Import | Call |
|---|---|---|
| Draw SVG strokes on scroll | `svg-scroll-draw` | `scrollDraw(container, opts)` |
| Any CSS property tied to scroll | `svg-scroll-draw` | `scrollAnimate(el, { props, ... })` |
| Parallax | `svg-scroll-draw` | `scrollParallax(el, { speed })` |
| Count a number up | `svg-scroll-draw` | `scrollCounter(el, { to })` |
| Fade/slide elements in (AOS-style) | `svg-scroll-draw/reveal` | `scrollReveal('.card', { preset })` |
| AOS / ScrollReveal / vivus in React or Next.js | `svg-scroll-draw/aos/react`, `/scrollreveal/react`, `/vivus/react` (2.15.0+) | `<AOSInit />` in app/layout.tsx; `const ref = useScrollReveal({ selector, interval })`; `const [ref, vivus] = useVivus(opts)` — all clean up on unmount |
| Project uses AOS, ScrollReveal or vivus and should switch | CLI (2.14.0+) | `npx svg-scroll-draw migrate --dry-run`, then without `--dry-run`: rewrites imports, CDN script tags, aos.css and package.json; review the diff |
| Project already uses vivus (`new Vivus(...)`) | `svg-scroll-draw/vivus` (2.13.0+) | `import Vivus from 'svg-scroll-draw/vivus'` — same API and output; for a draw that follows scroll use `scrollDraw` |
| Project already uses ScrollReveal | `svg-scroll-draw/scrollreveal` (2.12.0+) | `import ScrollReveal from 'svg-scroll-draw/scrollreveal'` — same API, MIT; remove the `scrollreveal` package |
| Project already uses AOS (`data-aos` markup) | `svg-scroll-draw/aos` (2.11.0+) | `import AOS from 'svg-scroll-draw/aos'; AOS.init()` — keep the markup, remove `aos.css` and the `aos` package |
| Pin while scrolling past | `svg-scroll-draw/pin` | `scrollPin(el, { pinDistance })` |
| Snap between sections | `svg-scroll-draw/snap` | `scrollSnap('.section')` |
| Horizontal scroll section | `svg-scroll-draw/horizontal` | `scrollHorizontal('.track')` |
| Split + stagger text | `svg-scroll-draw/text` | `scrollText(el, { split })` |
| Scrub `<video>` with scroll | `svg-scroll-draw/video` | `scrollVideo(video, opts)` |
| Progress as CSS variable | `svg-scroll-draw/progress` | `scrollProgress(el)` → `--scroll-progress` |
| Several at once / in sequence | `svg-scroll-draw/group` | `scrollDrawGroup`, `scrollDrawSequence`, `scrollAnimateGroup`, `scrollAnimateSequence`, `scrollParallaxGroup` |
| Independent windows per path group | `svg-scroll-draw/timeline` | `scrollDrawTimeline(el, { tracks })` |
| Debug overlay (dev only) | `svg-scroll-draw/devtools` | `devtools.enable()` |
| Lenis **v1** smooth scroll | `svg-scroll-draw/lenis` | `createLenisAdapter(lenis)` (Lenis v2+ needs nothing) |

Framework wrappers: `/react`, `/vue`, `/nuxt`, `/svelte`, `/solid`, `/angular`,
`/astro`, `/web-component`. Full signatures and options: `references/api.md`.

## Core usage (vanilla)

```js
import { scrollDraw, scrollAnimate } from 'svg-scroll-draw';
import { scrollReveal } from 'svg-scroll-draw/reveal';

// Target is a CONTAINER (an <svg> or wrapper). Its path/line/rect/... children are drawn.
const draw = scrollDraw('#logo', { easing: 'ease-out', fade: true });

const fade = scrollAnimate('#hero-text', {
  props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] },
  trigger: { start: 'top 80%', end: 'top 30%' },
});

const reveal = scrollReveal('.card', { preset: 'fadeUp', stagger: 0.1 });

// Always clean up when the element goes away (SPA route change, unmount):
draw.destroy(); fade.destroy(); reveal.destroy();
```

Triggers are `"<element anchor> <viewport anchor>"`: element `top|center|bottom`,
viewport `top|center|bottom|N%`. `'top 80%'` = element top meets 80% down the
viewport. A bare `'60%'` means `'top 60%'`. Defaults differ per API (see api.md).

Most instances return `{ destroy, replay, pause, resume, seek, getProgress }`
(`refresh?.()` re-measures after layout changes). `scrollReveal` returns only
`{ destroy }`; `scrollPin` returns `{ destroy, refresh, getProgress }`;
`scrollSnap` returns `{ destroy, snapTo, getCurrentIndex }`.

## Framework recipes (short form — more in `references/recipes.md`)

**React / Next.js App Router** — the wrappers use hooks and ship without a
`'use client'` directive, so put them in a client component:

```tsx
'use client';
import { ScrollDraw, ScrollAnimate, ScrollCounter, ScrollText } from 'svg-scroll-draw/react';

export function Hero() {
  return (
    <ScrollDraw easing="ease-out" fade>
      <svg viewBox="0 0 200 100"><path d="M10 80 C 40 10, 60 10, 95 80" stroke="black" fill="none" /></svg>
    </ScrollDraw>
  );
}
```

There is **no `useScrollDraw` hook in `svg-scroll-draw/react`** — use the
components above, `useScrollDrawProgress(ref)` for a 0–1 value, or call any core
function inside `useEffect` and return `instance.destroy`:

```tsx
'use client';
import { useEffect, useRef } from 'react';
import { scrollPin } from 'svg-scroll-draw/pin';

export function PinnedPanel() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const pin = scrollPin(ref.current, { pinDistance: 600 });
    return () => pin.destroy();
  }, []);
  return <div ref={ref}>Pinned for 600px of scroll</div>;
}
```

**Vue 3** — `useScrollDraw`, `useScrollAnimate`, `useScrollCounter`,
`useScrollText`, `useScrollVideo` return a template ref and destroy on unmount:

```vue
<script setup>
import { useScrollDraw } from 'svg-scroll-draw/vue';
const svgWrap = useScrollDraw({ easing: 'ease-out', fade: true });
</script>
<template><div ref="svgWrap"><svg>…</svg></div></template>
```

**Svelte** — actions clean up automatically:
`<div use:scrollDraw={{ easing: 'ease-out', fade: true }}>` with
`import { scrollDraw } from 'svg-scroll-draw/svelte'`.

**Solid** — `const ref = useScrollDraw({ fade: true })` from `svg-scroll-draw/solid`, then `<div ref={ref}>`.

**Angular** — `new ScrollDrawRef().init(el, opts)` in `ngAfterViewInit`, `.destroy()` in `ngOnDestroy` (`svg-scroll-draw/angular`).

**Astro** — `data-scroll-draw` + `data-scroll-draw-options='{"fade":true}'` on the element, then `initScrollDraw()` (or `initAll()`) from `svg-scroll-draw/astro` in a client `<script>`.

**CDN, no build** — the global build exposes the main entry as `SvgScrollDraw` and registers `<scroll-draw>`:

```html
<script src="https://unpkg.com/svg-scroll-draw@2.19.1/dist/cdn/svg-scroll-draw.global.js"></script>
<script>SvgScrollDraw.scrollDraw('#logo', { easing: 'ease-out' });</script>
```

For other entries without a bundler, import the self-contained ESM file:
`import { scrollReveal } from 'https://cdn.jsdelivr.net/npm/svg-scroll-draw@2.19.1/dist/reveal/index.mjs'`.

## SSR safety

Every entry is safe to import on the server: with no `window` each function
returns a no-op instance. But nothing animates until it runs in the browser, so
call core functions in `useEffect` / `onMounted` / `onMount` / `ngAfterViewInit`
/ a client `<script>`, never at module top level of server code.

## Reduced motion

Honoured by default. With `prefers-reduced-motion: reduce`, `scrollDraw`,
`scrollAnimate`, `scrollReveal`, `scrollParallax`, `scrollCounter`, `scrollText`,
`scrollVideo` and `scrollDrawTimeline` jump to their final state; `scrollSnap`
still snaps but without the animated scroll. `scrollHorizontal` keeps scrubbing
by default (`respectReducedMotion: false`) because its panels are only reachable
via the transform. `scrollAnimate`, `scrollSnap`, `scrollHorizontal` and
`scrollDrawTimeline` accept `respectReducedMotion` to override. Do not add your
own media-query guard on top.

## Common mistakes

- Passing the `<path>` to `scrollDraw`. Pass its `<svg>` or a wrapper; children matching `selector` (default `path, polyline, line, polygon, rect, circle`) are drawn.
- Paths with no `stroke` (nothing visible) or a solid `fill` (hides the draw). Use `fill="none"` or animate fill with `fillOpacity: [0, 1]`.
- Importing `useScrollDraw` from `svg-scroll-draw/react` (it does not exist; it exists in `/vue` and `/solid`).
- Forgetting `'use client'` in Next.js App Router files that use `svg-scroll-draw/react`.
- Expecting React/Vue wrapper props to re-apply on change: options are read once on mount. Change the component `key` to re-create.
- Never calling `destroy()` in SPAs: listeners and observers leak across route changes.
- Passing a single Element to `scrollReveal` or `scrollSnap`: they take a selector string, `NodeList` or `Element[]` (wrap one element as `[el]`).
- GSAP-style trigger offsets like `'top+=100 center'`, `'+=500'` or `'50% 50%'` (element percentages): not supported. Use anchors and viewport percentages; for pin length use `pinDistance`.
- Inventing options. If it is not in `references/api.md`, it does not exist.
- Expecting native CSS on configs that use `once`, `stagger`, callbacks, a custom trigger, `speed ≠ 1`, `spring`/`bounce`/`elastic`/function easing or a custom `scrollContainer`: those correctly fall back to JS. That is fine; do not "fix" it.
- Adding Lenis adapter for Lenis v2+: not needed.

## Migrating from GSAP ScrollTrigger

| GSAP | svg-scroll-draw |
|---|---|
| `gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin)` | nothing to register |
| `gsap.from('#svg path', { drawSVG: 0, scrollTrigger: { trigger: '#svg', scrub: true } })` | `scrollDraw('#svg')` |
| `gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 30%', scrub: true } })` | `scrollAnimate(el, { props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] }, trigger: { start: 'top 80%', end: 'top 30%' } })` |
| `gsap.from('.card', { opacity: 0, y: 32, stagger: 0.1, scrollTrigger: '.cards' })` | `scrollReveal('.card', { stagger: 0.1 })` |
| `gsap.to(el, { yPercent: -30, ease: 'none', scrollTrigger: { scrub: true } })` | `scrollParallax(el, { speed: 0.3 })` |
| `ScrollTrigger.create({ trigger: el, pin: true, start: 'top top', end: '+=600' })` | `scrollPin(el, { pinDistance: 600 })` |
| `snap` across full-height sections | `scrollSnap('.section')` |
| `gsap.to(track, { x: -dist, scrollTrigger: { pin: true, scrub: true } })` | sticky CSS + `scrollHorizontal('.track')` |
| `SplitText` + `gsap.from(split.words, { opacity: 0, y: 24, stagger: 0.05 })` | `scrollText(el, { split: 'words', stagger: 0.05, from: { opacity: 0, y: 24 } })` |
| scrubbing `video.currentTime` in `onUpdate` | `scrollVideo(video)` |
| `markers: true` | `debug: true` (scrollDraw) or `devtools.enable()` |
| `ScrollTrigger.refresh()` | `instance.refresh?.()` |
| `ctx.revert()` / `useGSAP` cleanup | `instance.destroy()` |

Stay on GSAP (free since 2025, and far broader) for time-based timelines,
`scrub: 1` lag smoothing, Flip, Draggable, MotionPath, ScrollSmoother or pixel
trigger offsets. Details and edge cases: `references/migrate-from-gsap.md`.
