# svg-scroll-draw recipes

Every import path here is in the package's `exports` map and every option is in
its types. Rule for all frameworks: create in the "mounted" hook, `destroy()` in
the "unmounted" hook.

Try live, no install: [vanilla on StackBlitz](https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/vanilla) ·
[React on StackBlitz](https://stackblitz.com/github/DhruvilChauahan0210/ink-scroll/tree/main/examples/react)

## Vanilla JS (bundler)

```js
import { scrollDraw, scrollAnimate, scrollCounter } from 'svg-scroll-draw';
import { scrollReveal } from 'svg-scroll-draw/reveal';
import { scrollText } from 'svg-scroll-draw/text';

const instances = [
  scrollDraw('#hero-svg', { easing: 'ease-out', fade: true }),
  scrollText('#headline', { split: 'words', stagger: 0.05 }),
  scrollReveal('.feature', { preset: 'fadeUp', stagger: 0.1 }),
  scrollCounter('#users', { to: 50000, format: (n) => Math.round(n).toLocaleString() }),
  scrollAnimate('#section', {
    props: { backgroundColor: ['#ffffff', '#0d0d0d'], color: ['#000000', '#ffffff'] },
    trigger: { start: 'top 60%', end: 'top 20%' },
  }),
];

// SPA route change / teardown:
export function cleanup() {
  instances.forEach((i) => i.destroy());
}
```

HTML for the draw: give paths a stroke and no fill.

```html
<svg id="hero-svg" viewBox="0 0 200 100">
  <path d="M10 80 C 40 10, 60 10, 95 80" stroke="currentColor" stroke-width="2" fill="none" />
</svg>
```

## CDN, no build step

```html
<script src="https://unpkg.com/svg-scroll-draw@2.10.2/dist/cdn/svg-scroll-draw.global.js"></script>

<!-- Declarative: only speed, easing, stagger, direction, selector, fade are read -->
<scroll-draw easing="ease-out" speed="1.2" fade>
  <svg viewBox="0 0 200 100"><path d="M10 80 L190 20" stroke="black" fill="none" /></svg>
</scroll-draw>

<script>
  SvgScrollDraw.scrollAnimate('#hero', { props: { opacity: [0, 1] }, easing: 'ease-out' });
</script>

<!-- Other entries: self-contained ES modules -->
<script type="module">
  import { scrollReveal } from 'https://cdn.jsdelivr.net/npm/svg-scroll-draw@2.10.2/dist/reveal/index.mjs';
  import { scrollPin } from 'https://cdn.jsdelivr.net/npm/svg-scroll-draw@2.10.2/dist/pin/index.mjs';
  scrollReveal('.card');
  scrollPin('#panel', { pinDistance: 800 });
</script>
```

While developing, swap in `dist/cdn/svg-scroll-draw.dev.global.js`: same API,
but it logs mistakes (path with no stroke, selector matching nothing, zero-length
trigger window).

## React

```tsx
import { ScrollDraw, ScrollAnimate, ScrollCounter, ScrollText, ScrollVideo } from 'svg-scroll-draw/react';

export function Landing() {
  return (
    <>
      <ScrollDraw preset="sketch">
        <svg viewBox="0 0 200 100"><path d="M10 80 C 40 10, 60 10, 95 80" stroke="black" fill="none" /></svg>
      </ScrollDraw>

      <ScrollText as="h2" split="words" stagger={0.05} from={{ opacity: 0, y: 24 }}>
        Animate this headline word by word.
      </ScrollText>

      <ScrollAnimate props={{ opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0px)'] }} once>
        <div>Any content</div>
      </ScrollAnimate>

      <ScrollCounter to={1250000} format={(n) => '$' + Math.round(n).toLocaleString()} />

      <ScrollVideo src="/hero.mp4" trigger={{ start: 'top top', end: 'bottom top' }} />
    </>
  );
}
```

APIs without a component (reveal, pin, snap, horizontal, parallax, progress):
call them in `useEffect` and return the cleanup.

```tsx
import { useEffect, useRef } from 'react';
import { scrollReveal } from 'svg-scroll-draw/reveal';
import { scrollParallax } from 'svg-scroll-draw';

export function Cards() {
  const listRef = useRef<HTMLUListElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current || !bgRef.current) return;
    const reveal = scrollReveal(listRef.current.querySelectorAll('li'), { preset: 'fadeUp', stagger: 0.1 });
    const parallax = scrollParallax(bgRef.current, { speed: 0.4 });
    return () => {
      reveal.destroy();
      parallax.destroy();
    };
  }, []);

  return (
    <section>
      <div ref={bgRef} className="bg" />
      <ul ref={listRef}><li>One</li><li>Two</li><li>Three</li></ul>
    </section>
  );
}
```

Reactive progress value for your own rendering:

```tsx
import { useRef } from 'react';
import { useScrollDrawProgress } from 'svg-scroll-draw/react';

export function Bar() {
  const ref = useRef<HTMLDivElement>(null);
  const progress = useScrollDrawProgress(ref, { easing: 'ease-out' });
  return <div ref={ref} style={{ transform: `scaleX(${progress})`, transformOrigin: 'left' }} />;
}
```

Wrapper props are read once on mount. To re-run with new options, change `key`.

## Next.js App Router

Server components cannot use the wrappers (they use hooks), and the package
build has no `'use client'` banner. Make a small client component and render it
from your server page.

```tsx
// app/components/HeroDraw.tsx
'use client';
import { ScrollDraw } from 'svg-scroll-draw/react';

export function HeroDraw() {
  return (
    <ScrollDraw easing="ease-out" fade>
      <svg viewBox="0 0 200 100"><path d="M10 80 L190 20" stroke="black" fill="none" /></svg>
    </ScrollDraw>
  );
}
```

```tsx
// app/page.tsx (server component)
import { HeroDraw } from './components/HeroDraw';

export default function Page() {
  return <main><HeroDraw /></main>;
}
```

No `dynamic(..., { ssr: false })` needed: the server renders the markup, the
animation attaches in `useEffect` on the client.

## Vue 3

```vue
<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useScrollDraw, useScrollCounter, ScrollText } from 'svg-scroll-draw/vue';
import { scrollReveal } from 'svg-scroll-draw/reveal';

const svgWrap = useScrollDraw({ easing: 'ease-out', fade: true });
const users = useScrollCounter({ to: 50000, format: (n) => Math.round(n).toLocaleString() });

const list = ref(null);
let reveal;
onMounted(() => { reveal = scrollReveal(list.value.querySelectorAll('li'), { stagger: 0.1 }); });
onUnmounted(() => reveal?.destroy());
</script>

<template>
  <div ref="svgWrap"><svg viewBox="0 0 200 100"><path d="M10 80 L190 20" stroke="black" fill="none" /></svg></div>
  <span ref="users" />
  <ScrollText :options="{ split: 'words', stagger: 0.05 }" tag="h2">Word by word.</ScrollText>
  <ul ref="list"><li>One</li><li>Two</li></ul>
</template>
```

Nuxt: same composables from `svg-scroll-draw/nuxt` (they only touch the DOM in
`onMounted`, so they are SSR-safe). `createScrollDrawPlugin()` registers them globally.

## Svelte

```svelte
<script>
  import { onMount } from 'svelte';
  import { scrollDraw, scrollTextAction } from 'svg-scroll-draw/svelte';
  import { scrollSnap } from 'svg-scroll-draw/snap';

  onMount(() => {
    const snap = scrollSnap('.panel', { duration: 500 });
    return () => snap.destroy();
  });
</script>

<div use:scrollDraw={{ easing: 'ease-out', fade: true }}>
  <svg viewBox="0 0 200 100"><path d="M10 80 L190 20" stroke="black" fill="none" /></svg>
</div>

<h2 use:scrollTextAction={{ split: 'chars', stagger: 0.025 }}>Letter by letter</h2>

<section class="panel">1</section>
<section class="panel">2</section>
```

Need the instance (e.g. a Replay button)? `const { action, getInstance } = createScrollDraw({...})`, then `use:action` and `getInstance()?.replay()`.

## Solid

```tsx
import { useScrollDraw, createScrollDraw } from 'svg-scroll-draw/solid';

export function Hero() {
  const ref = useScrollDraw({ easing: 'ease-out', fade: true });
  const { ref: ref2, getInstance } = createScrollDraw({ easing: 'spring' });
  return (
    <>
      <div ref={ref}><svg>…</svg></div>
      <div ref={ref2}><svg>…</svg></div>
      <button onClick={() => getInstance()?.replay()}>Replay</button>
    </>
  );
}
```

## Angular

```ts
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ScrollDrawRef } from 'svg-scroll-draw/angular';
import { scrollPin } from 'svg-scroll-draw/pin';

@Component({
  selector: 'app-hero',
  template: `<div #svgWrap><svg>…</svg></div><div #panel>Pinned</div>`,
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('svgWrap') svgWrap!: ElementRef<HTMLElement>;
  @ViewChild('panel') panel!: ElementRef<HTMLElement>;
  private draw = new ScrollDrawRef();
  private pin?: ReturnType<typeof scrollPin>;

  ngAfterViewInit() {
    this.draw.init(this.svgWrap.nativeElement, { easing: 'ease-out', fade: true });
    this.pin = scrollPin(this.panel.nativeElement, { pinDistance: 600 });
  }
  ngOnDestroy() {
    this.draw.destroy();
    this.pin?.destroy();
  }
}
```

With Angular SSR, `ngAfterViewInit` also runs on the server; the library returns
no-ops there, so this is safe.

## Astro

```astro
<div data-scroll-draw data-scroll-draw-options='{"easing":"ease-out","fade":true}'>
  <svg viewBox="0 0 200 100"><path d="M10 80 L190 20" stroke="black" fill="none" /></svg>
</div>
<h2 data-scroll-text data-scroll-text-options='{"split":"words"}'>Hello</h2>

<script>
  import { initAll } from 'svg-scroll-draw/astro';
  initAll(); // draw + animate + counter + text
</script>
```

With View Transitions, re-run on `astro:page-load` and destroy the returned
instances on `astro:before-swap`.

## Horizontal scroll section

```html
<div class="outer">
  <div class="sticky">
    <div class="track"><section>1</section><section>2</section><section>3</section></div>
  </div>
</div>
<style>
  .outer  { height: 400vh; }
  .sticky { position: sticky; top: 0; height: 100vh; overflow: hidden; }
  .track  { display: flex; width: max-content; }
  .track section { width: 100vw; }
</style>
<script type="module">
  import { scrollHorizontal } from 'svg-scroll-draw/horizontal';
  scrollHorizontal('.track');
</script>
```

## Pin with progress-driven content

```js
import { scrollPin } from 'svg-scroll-draw/pin';

const label = document.querySelector('#step');
scrollPin('#stage', {
  pinDistance: 1200,
  onProgress: (p) => { label.textContent = `Step ${Math.min(3, Math.floor(p * 3) + 1)} of 3`; },
});
```

## CSS-only follow-up with progress variables

```js
import { scrollProgress } from 'svg-scroll-draw/progress';
scrollProgress('#hero', { easing: 'ease-in-out' });
```

```css
#hero .title {
  opacity: var(--scroll-progress);
  transform: translateY(calc((1 - var(--scroll-progress-eased)) * 40px));
}
```
