/**
 * Framework landing pages — /vue-scroll-animation, /svelte-scroll-animation, …
 *
 * The library ships first-class wrappers for eight frameworks but only React
 * and Next.js had landing pages, so six real query clusters ("vue scroll
 * animation", "svelte animate on scroll") had nothing to rank.
 *
 * Every code sample here was written against the actual exports in
 * packages/svg-scroll-draw/src/<framework>/index.ts — not from memory. If a
 * wrapper's API changes, these samples are wrong and must change with it.
 */

export type FrameworkLanding = {
  slug: string;
  /** Display name, e.g. "Vue 3". */
  name: string;
  /** Import specifier for the wrapper. */
  entry: string;
  /** Accent colour for the badge — the framework's own brand colour. */
  accent: string;
  /** Small print beside the badge. */
  worksWith: string;
  title: string;
  description: string;
  keywords: string[];
  /** H1 second line. */
  headline: string;
  /** Lede under the H1. */
  intro: string;
  /** The primitive this framework uses, named honestly. */
  primitive: string;
  samples: { heading: string; file: string; code: string }[];
  /** Framework-specific gotcha worth stating. */
  note: string;
  faq: { q: string; a: string }[];
  related: string[];
};

export const FRAMEWORK_LANDINGS: FrameworkLanding[] = [
  {
    slug: 'vue-scroll-animation',
    name: 'Vue 3',
    entry: 'svg-scroll-draw/vue',
    accent: '#42b883',
    worksWith: 'Vue 3 · Vite · Nuxt 3',
    title: 'Vue Scroll Animation Library — Composables & Components',
    description:
      'Scroll animations for Vue 3: a <ScrollDraw> component and a useScrollDraw composable. Typed, SSR-safe, 10 KB for every API, zero dependencies.',
    keywords: [
      'vue scroll animation',
      'vue 3 scroll animation library',
      'vue animate on scroll',
      'useScrollDraw vue',
      'vue scroll reveal',
      'vue svg animation',
      'vue gsap alternative',
      'vue scroll trigger',
      'vue composable scroll animation',
    ],
    headline: 'Composables and components.',
    intro:
      'Vue gets real wrappers here, not a vanilla escape hatch: a component for the common case and a composable when you need the element ref yourself. Both ship in the same package — there is no separate Vue build — and both tear down on unmount, so nothing leaks across route changes.',
    primitive: 'Composable + component',
    samples: [
      {
        heading: 'The composable — you own the ref',
        file: 'Hero.vue',
        code: `<script setup>
import { useScrollDraw } from 'svg-scroll-draw/vue';

// Returns a ref — bind it to the element wrapping your SVG.
const container = useScrollDraw({
  easing: 'ease-out',
  speed: 1.2,
  fade: true,
});
</script>

<template>
  <div ref="container">
    <svg viewBox="0 0 200 100">
      <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
    </svg>
  </div>
</template>`,
      },
      {
        heading: 'The component — no ref wiring',
        file: 'Logo.vue',
        code: `<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue';
</script>

<template>
  <ScrollDraw :easing="'ease-out'" :speed="1.2" once>
    <svg viewBox="0 0 200 100">
      <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
    </svg>
  </ScrollDraw>
</template>`,
      },
      {
        heading: 'Reveal, counters and text',
        file: 'Features.vue',
        code: `<script setup>
import { useScrollAnimate, useScrollCounter, useScrollText } from 'svg-scroll-draw/vue';

const card    = useScrollAnimate({ from: { opacity: 0, y: 24 } });
const revenue = useScrollCounter({ to: 48000, format: n => \`$\${n.toLocaleString()}\` });
const heading = useScrollText({ split: 'words', stagger: 0.05 });
</script>

<template>
  <h2 ref="heading">Every API, one package.</h2>
  <div ref="card"><span ref="revenue">0</span></div>
</template>`,
      },
    ],
    note: 'The composable returns the ref rather than taking one, so you never have to guard against a null element on first render — the engine only starts after onMounted.',
    faq: [
      {
        q: 'How do I animate on scroll in Vue 3?',
        a: 'Install svg-scroll-draw and import either the ScrollDraw component or the useScrollDraw composable from svg-scroll-draw/vue. The composable returns a template ref you bind to the element wrapping your SVG; the animation is driven by scroll position and cleans up automatically on unmount.',
      },
      {
        q: 'Does it work with Nuxt 3 and SSR?',
        a: 'Yes. The engine only initialises in onMounted, so nothing touches the DOM during server rendering. Nuxt users can import from svg-scroll-draw/nuxt, which re-exports every Vue composable and component plus a plugin for global registration.',
      },
      {
        q: 'Is there a Vue alternative to GSAP ScrollTrigger?',
        a: 'svg-scroll-draw covers the common ScrollTrigger cases — scroll-driven animation, pin, snap, parallax, text split, counters and video scrub — at 10.0 KB for every API versus 47.5 KB for GSAP core plus ScrollTrigger plus DrawSVG. GSAP is broader; if you need timelines, Draggable or Flip, use GSAP.',
      },
    ],
    related: ['nuxt-scroll-animation', 'svelte-scroll-animation'],
  },
  {
    slug: 'svelte-scroll-animation',
    name: 'Svelte',
    entry: 'svg-scroll-draw/svelte',
    accent: '#ff3e00',
    worksWith: 'Svelte 4 · 5 · SvelteKit',
    title: 'Svelte Scroll Animation — Native Actions, No Wrapper',
    description:
      'Scroll animations for Svelte using native actions. use:scrollDraw adds no wrapper element and no extra component. 10 KB for every API, zero dependencies.',
    keywords: [
      'svelte scroll animation',
      'svelte animate on scroll',
      'use:scrollDraw',
      'svelte scroll reveal',
      'sveltekit scroll animation',
      'svelte action animation',
      'svelte gsap alternative',
      'svelte svg animation',
      'svelte scroll trigger',
    ],
    headline: 'Actions, not wrappers.',
    intro:
      'Svelte actions are exactly the right primitive for scroll animation: attach behaviour to a node you already have, with no wrapper element and no extra component in the tree. use:scrollDraw is a one-line addition to markup you have already written, and Svelte handles teardown through the action lifecycle.',
    primitive: 'Action',
    samples: [
      {
        heading: 'The action — one attribute',
        file: 'Hero.svelte',
        code: `<script>
  import { scrollDraw } from 'svg-scroll-draw/svelte';
</script>

<div use:scrollDraw={{ easing: 'ease-out', speed: 1.2, fade: true }}>
  <svg viewBox="0 0 200 100">
    <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
  </svg>
</div>`,
      },
      {
        heading: 'When you need the instance',
        file: 'Replayable.svelte',
        code: `<script>
  import { createScrollDraw } from 'svg-scroll-draw/svelte';

  // createScrollDraw returns [action, getInstance]
  const [draw, getInstance] = createScrollDraw({ easing: 'ease-out' });
</script>

<div use:draw>
  <svg viewBox="0 0 200 100">
    <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
  </svg>
</div>

<button on:click={() => getInstance()?.replay()}>Replay</button>`,
      },
      {
        heading: 'Text, counters and any CSS property',
        file: 'Stats.svelte',
        code: `<script>
  import { scrollAnimate, scrollTextAction, scrollCounterAction }
    from 'svg-scroll-draw/svelte';
</script>

<h2 use:scrollTextAction={{ split: 'words', stagger: 0.05 }}>
  Every API, one package.
</h2>

<div use:scrollAnimate={{ from: { opacity: 0, y: 24 } }}>
  <span use:scrollCounterAction={{ to: 48000 }}>0</span>
</div>`,
      },
    ],
    note: 'Note the naming: the draw and animate actions are scrollDraw and scrollAnimate, but text, counter and video are scrollTextAction, scrollCounterAction and scrollVideoAction — suffixed so they do not collide with the core functions of the same name if you import both.',
    faq: [
      {
        q: 'How do I animate on scroll in Svelte?',
        a: 'Import the scrollDraw action from svg-scroll-draw/svelte and apply it with use:scrollDraw={{ … }} on the element wrapping your SVG. Actions add no wrapper element, and Svelte destroys the instance automatically when the node is removed.',
      },
      {
        q: 'Does it work with SvelteKit and SSR?',
        a: 'Yes. Svelte actions only run in the browser after the node is created, so nothing executes during server rendering. No onMount guard or browser check is needed.',
      },
      {
        q: 'How do I replay or pause a Svelte scroll animation?',
        a: 'Use createScrollDraw instead of the bare action. It returns a tuple of the action and a getInstance function, giving you access to replay, pause, resume, seek, getProgress and destroy on the underlying instance.',
      },
    ],
    related: ['solid-scroll-animation', 'vue-scroll-animation'],
  },
  {
    slug: 'solid-scroll-animation',
    name: 'Solid.js',
    entry: 'svg-scroll-draw/solid',
    accent: '#2c4f7c',
    worksWith: 'Solid 1.x · SolidStart',
    title: 'Solid.js Scroll Animation — No Re-Renders',
    description:
      'Scroll animations for Solid.js that stay outside the reactive graph — no signals updated per frame, no re-renders. 10 KB for every API, zero dependencies.',
    keywords: [
      'solid js scroll animation',
      'solidjs animate on scroll',
      'useScrollDraw solid',
      'solid scroll reveal',
      'solidstart scroll animation',
      'solid js animation library',
      'solid gsap alternative',
      'solid svg animation',
      'fine grained reactivity animation',
    ],
    headline: 'Outside the reactive graph.',
    intro:
      'Solid’s performance story depends on not re-rendering, so an animation library that pushed a signal update every frame would undo the thing you picked Solid for. This one never touches the reactive graph: the engine writes to the DOM directly, driven by scroll position, and the hook only hands you a ref setter.',
    primitive: 'Hook returning a ref setter',
    samples: [
      {
        heading: 'The hook — returns a ref setter',
        file: 'Hero.tsx',
        code: `import { useScrollDraw } from 'svg-scroll-draw/solid';

export function Hero() {
  // Returns a callback ref — pass it straight to ref={}
  const draw = useScrollDraw({ easing: 'ease-out', speed: 1.2, fade: true });

  return (
    <div ref={draw}>
      <svg viewBox="0 0 200 100">
        <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
      </svg>
    </div>
  );
}`,
      },
      {
        heading: 'When you need the instance',
        file: 'Replayable.tsx',
        code: `import { createScrollDraw } from 'svg-scroll-draw/solid';

export function Replayable() {
  const [draw, getInstance] = createScrollDraw({ easing: 'ease-out' });

  return (
    <>
      <div ref={draw}>
        <svg viewBox="0 0 200 100">
          <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
        </svg>
      </div>
      <button onClick={() => getInstance()?.replay()}>Replay</button>
    </>
  );
}`,
      },
      {
        heading: 'Text, counters and any CSS property',
        file: 'Stats.tsx',
        code: `import { useScrollAnimate, useScrollCounter, useScrollText }
  from 'svg-scroll-draw/solid';

export function Stats() {
  const card    = useScrollAnimate({ from: { opacity: 0, y: 24 } });
  const revenue = useScrollCounter({ to: 48000 });
  const heading = useScrollText({ split: 'words', stagger: 0.05 });

  return (
    <>
      <h2 ref={heading}>Every API, one package.</h2>
      <div ref={card}><span ref={revenue}>0</span></div>
    </>
  );
}`,
      },
    ],
    note: 'The hook returns a callback ref rather than a signal, which is why you pass it directly to ref={} with no parentheses. Cleanup runs through onCleanup, so it works inside <Show> and <For> without leaking.',
    faq: [
      {
        q: 'How do I animate on scroll in Solid.js?',
        a: 'Import useScrollDraw from svg-scroll-draw/solid. It returns a callback ref you pass directly to ref={} on the element wrapping your SVG. The animation runs outside Solid’s reactive graph, so it triggers no re-renders.',
      },
      {
        q: 'Does it cause re-renders in Solid?',
        a: 'No. The engine writes to the DOM directly rather than updating a signal each frame, so no reactive computation is invalidated by the animation. Only the elements being animated change.',
      },
      {
        q: 'Does it work with SolidStart and SSR?',
        a: 'Yes. Initialisation happens inside onMount, so nothing runs during server rendering, and onCleanup destroys the instance when the component unmounts.',
      },
    ],
    related: ['svelte-scroll-animation', 'vue-scroll-animation'],
  },
  {
    slug: 'angular-scroll-animation',
    name: 'Angular',
    entry: 'svg-scroll-draw/angular',
    accent: '#dd0031',
    worksWith: 'Angular 16+ · standalone components',
    title: 'Angular Scroll Animation — No @angular/core Dependency',
    description:
      'Scroll animations for Angular via plain classes you drive from ngAfterViewInit. No Angular peer dependency, no NgModule, 10 KB for every API.',
    keywords: [
      'angular scroll animation',
      'angular animate on scroll',
      'angular scroll reveal',
      'angular svg animation',
      'angular scroll trigger',
      'angular gsap alternative',
      'angular scroll animation library',
      'ngAfterViewInit animation',
      'angular intersection observer animation',
    ],
    headline: 'Plain classes, no NgModule.',
    intro:
      'The Angular wrapper deliberately does not import @angular/core. It exposes small classes you instantiate in a component and drive from the lifecycle hooks you already write, which means no peer-dependency version matrix to satisfy and nothing to break when Angular changes its module story again.',
    primitive: 'Ref class + lifecycle hooks',
    samples: [
      {
        heading: 'ScrollDrawRef in a standalone component',
        file: 'hero.component.ts',
        code: `import { Component, ElementRef, ViewChild,
         AfterViewInit, OnDestroy } from '@angular/core';
import { ScrollDrawRef } from 'svg-scroll-draw/angular';

@Component({
  standalone: true,
  selector: 'app-hero',
  template: \`
    <div #container>
      <svg viewBox="0 0 200 100">
        <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
      </svg>
    </div>
  \`,
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLElement>;
  private draw = new ScrollDrawRef();

  ngAfterViewInit() {
    this.draw.init(this.containerRef.nativeElement, {
      easing: 'ease-out',
      speed: 1.2,
      fade: true,
    });
  }

  ngOnDestroy() {
    this.draw.destroy();
  }
}`,
      },
      {
        heading: 'Counters and text',
        file: 'stats.component.ts',
        code: `import { ScrollCounterRef, ScrollTextRef } from 'svg-scroll-draw/angular';

export class StatsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('revenue') revenueRef!: ElementRef<HTMLElement>;
  @ViewChild('headline') headlineRef!: ElementRef<HTMLElement>;

  private counter = new ScrollCounterRef();
  private text    = new ScrollTextRef();

  ngAfterViewInit() {
    this.counter.init(this.revenueRef.nativeElement, { to: 48000 });
    this.text.init(this.headlineRef.nativeElement, {
      split: 'words', stagger: 0.05,
    });
  }

  ngOnDestroy() {
    this.counter.destroy();
    this.text.destroy();
  }
}`,
      },
    ],
    note: 'init() is safe to call more than once — it destroys any previous instance first — so re-initialising after an @Input change will not leave a stale observer behind.',
    faq: [
      {
        q: 'How do I animate on scroll in Angular?',
        a: 'Import ScrollDrawRef from svg-scroll-draw/angular, create an instance as a component field, call init() with the native element in ngAfterViewInit, and call destroy() in ngOnDestroy. No NgModule registration and no Angular peer dependency are required.',
      },
      {
        q: 'Does svg-scroll-draw depend on @angular/core?',
        a: 'No. The Angular entry point exports framework-agnostic classes with no Angular import, so there is no peer-dependency version to match and the same code works in Angular 16 and later.',
      },
      {
        q: 'Why ngAfterViewInit rather than ngOnInit?',
        a: 'The element referenced by @ViewChild does not exist until the view has been initialised. Calling init() in ngOnInit would pass an undefined native element.',
      },
    ],
    related: ['vue-scroll-animation', 'solid-scroll-animation'],
  },
  {
    slug: 'astro-scroll-animation',
    name: 'Astro',
    entry: 'svg-scroll-draw/astro',
    accent: '#ff5d01',
    worksWith: 'Astro 4+ · zero hydration',
    title: 'Astro Scroll Animation — Zero Hydration, No Island',
    description:
      'Add scroll animation to Astro with a data attribute and one init call. No framework island, no hydration directive — your components stay server-rendered.',
    keywords: [
      'astro scroll animation',
      'astro animate on scroll',
      'astro svg animation',
      'zero js scroll animation',
      'astro scroll reveal',
      'astro animation library',
      'data attribute scroll animation',
      'astro no hydration animation',
      'astro scroll effect',
    ],
    headline: 'No island required.',
    intro:
      'Astro’s whole premise is shipping no JavaScript unless you ask for it, so wrapping content in a hydrated component just to animate it defeats the point. Here the markup stays a server component: mark elements with a data attribute, pass options as JSON, and call one init function from a single client script. One small script for the whole page, not an island per animation.',
    primitive: 'Data attribute + init call',
    samples: [
      {
        heading: 'Mark the element, init once',
        file: 'Hero.astro',
        code: `---
// No client directive — this stays a server component.
---
<div data-scroll-draw data-scroll-draw-options='{"easing":"ease-out","fade":true}'>
  <svg viewBox="0 0 200 100">
    <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
  </svg>
</div>

<script>
  import { initScrollDraw } from 'svg-scroll-draw/astro';
  initScrollDraw();
</script>`,
      },
      {
        heading: 'Every API in one call',
        file: 'Layout.astro',
        code: `<script>
  // initAll wires up draw, animate, counter and text in one pass —
  // put it in your layout and every page gets it.
  import { initAll } from 'svg-scroll-draw/astro';
  initAll();
</script>`,
      },
      {
        heading: 'The other attributes',
        file: 'Features.astro',
        code: `<h2 data-scroll-text data-scroll-text-options='{"split":"words","stagger":0.05}'>
  Every API, one package.
</h2>

<span data-scroll-counter data-scroll-counter-options='{"to":48000}'>0</span>

<div data-scroll-animate data-scroll-animate-options='{"from":{"opacity":0,"y":24}}'>
  Fades up on scroll.
</div>`,
      },
    ],
    note: 'Options are read from the JSON attribute, so they must be valid JSON — double-quoted keys, no trailing commas, no JS expressions. Single-quoting the attribute in your markup is the easiest way to keep the inner quotes valid.',
    faq: [
      {
        q: 'How do I add scroll animation to Astro without hydration?',
        a: 'Add data-scroll-draw to any element, pass options via data-scroll-draw-options as JSON, and call initScrollDraw() from a plain <script> tag. Astro bundles that script but the component itself is never hydrated, so no framework runtime ships.',
      },
      {
        q: 'Do I need a client:load directive?',
        a: 'No. A client directive hydrates a framework component; this uses a plain script tag instead, so there is no island and no framework runtime in the bundle.',
      },
      {
        q: 'Can I initialise every animation type at once?',
        a: 'Yes. initAll() wires up draw, animate, counter and text in a single pass. Put it in your layout and every page is covered by one small script.',
      },
    ],
    related: ['nuxt-scroll-animation', 'vue-scroll-animation'],
  },
  {
    slug: 'nuxt-scroll-animation',
    name: 'Nuxt 3',
    entry: 'svg-scroll-draw/nuxt',
    accent: '#00dc82',
    worksWith: 'Nuxt 3 · SSR · static',
    title: 'Nuxt 3 Scroll Animation — SSR-Safe Composables',
    description:
      'Scroll animations for Nuxt 3: import composables per component, or register every component globally with one plugin. SSR-safe, 10 KB for every API.',
    keywords: [
      'nuxt scroll animation',
      'nuxt 3 animate on scroll',
      'nuxt scroll reveal',
      'nuxt svg animation',
      'nuxt animation library',
      'nuxt ssr animation',
      'nuxt plugin animation',
      'nuxt gsap alternative',
      'vue nuxt scroll trigger',
    ],
    headline: 'Per component, or global.',
    intro:
      'Nuxt re-exports the full Vue surface plus a plugin factory, so you get to choose: import a composable in the one component that needs it, or register every component once and use them anywhere without imports. Both are SSR-safe — the engine only starts after mount, so server rendering never touches the DOM.',
    primitive: 'Composable, component, or plugin',
    samples: [
      {
        heading: 'Option A — import per component',
        file: 'components/Hero.vue',
        code: `<script setup>
import { useScrollDraw } from 'svg-scroll-draw/nuxt';

const container = useScrollDraw({ easing: 'ease-out', speed: 1.2 });
</script>

<template>
  <div ref="container">
    <svg viewBox="0 0 200 100">
      <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
    </svg>
  </div>
</template>`,
      },
      {
        heading: 'Option B — register globally, once',
        file: 'plugins/svg-scroll-draw.ts',
        code: `import { createScrollDrawPlugin } from 'svg-scroll-draw/nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createScrollDrawPlugin());
});

// Now <ScrollDraw>, <ScrollAnimate>, <ScrollCounter> and <ScrollText>
// are available in any component with no import.`,
      },
      {
        heading: 'Using the globally registered components',
        file: 'pages/index.vue',
        code: `<template>
  <!-- No <script setup> import needed once the plugin is registered -->
  <ScrollDraw :speed="1.2" once>
    <svg viewBox="0 0 200 100">
      <path d="M10 50 Q 100 10 190 50" stroke="#111" fill="none" />
    </svg>
  </ScrollDraw>

  <ScrollText :split="'words'" :stagger="0.05">
    Every API, one package.
  </ScrollText>
</template>`,
      },
    ],
    note: 'The Nuxt entry re-exports the Vue wrappers rather than reimplementing them, so anything true of the Vue API is true here — including that the composables return refs you bind, rather than taking a ref as an argument.',
    faq: [
      {
        q: 'How do I add scroll animations to Nuxt 3?',
        a: 'Install svg-scroll-draw and import useScrollDraw or ScrollDraw from svg-scroll-draw/nuxt in any component. Alternatively register createScrollDrawPlugin() in a Nuxt plugin to make every component globally available without imports.',
      },
      {
        q: 'Is it SSR-safe in Nuxt?',
        a: 'Yes. Initialisation happens in onMounted, so nothing runs during server rendering and there is no window or document access on the server. No <ClientOnly> wrapper is needed.',
      },
      {
        q: 'Should I import per component or use the plugin?',
        a: 'Import per component if only a few components animate — it keeps the bundle smaller through tree-shaking. Use the plugin if animations appear across most pages and the repeated imports become noise.',
      },
    ],
    related: ['vue-scroll-animation', 'astro-scroll-animation'],
  },
];

export const FRAMEWORK_SLUGS = FRAMEWORK_LANDINGS.map((f) => f.slug);
