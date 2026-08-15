import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileMenu } from '@/components/MobileMenu';

export const metadata: Metadata = {
  title: 'Changelog — Release History',
  description:
    'Complete release history for svg-scroll-draw, the scroll-driven SVG path animation library. Track what shipped in each version, including native CSS scroll animation support.',
  alternates: { canonical: '/changelog' },
  openGraph: {
    title: 'Changelog — svg-scroll-draw',
    description:
      'Complete release history for svg-scroll-draw. Native CSS scroll animation, stroke-dashoffset, React/Vue/Svelte support and more.',
    url: 'https://svg-scroll-draw.vercel.app/changelog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Changelog — svg-scroll-draw',
    description:
      'Complete release history for svg-scroll-draw. Native CSS scroll animation, React/Vue/Svelte/Nuxt support.',
  },
};

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const RELEASES = [
  {
    version: '2.10.0',
    date: 'August 2026',
    tag: 'Latest',
    tagColor: 'bg-lime-glow',
    items: [
      { type: 'fix', text: 'Both native CSS fast paths ran a different easing curve from the JS engine they replace. ease-in and ease-out here are quadratics; the CSS keywords of the same name are fixed cubic-beziers, and they differ by up to 0.069 — around 7 points of progress mid-scroll. The fast path only engages where the browser supports animation-timeline: view(), so the same page animated one way in Chrome and Firefox and a measurably different way in Safari, which always falls back to the JS engine. scrollAnimate defaults to ease-out, so this was the default configuration. Both engines now emit a timing function that reproduces the JS curve exactly.' },
      { type: 'fix', text: 'The CDN bundle dropped the <scroll-draw> web component — caught before release, so no published version shipped without it. The sideEffects field added during this cycle listed only the built output, while the bundle is built from source, so the bundler tree-shook the custom element out of the very file the README tells CDN users to load. Verified against the published 2.9.0 tarball, which registers the element correctly.' },
      { type: 'fix', text: 'Importing svg-scroll-draw/web-component on a server threw ReferenceError: HTMLElement is not defined, taking the whole render down. The class is now defined inside the same guard as the registration, so it degrades to a no-op like every other entry point.' },
      { type: 'fix', text: 'A finished scrollDrawSequence or scrollAnimateSequence reported 0% progress: the active-step cursor walked past the end of the array, so getProgress() returned 0 at the exact moment everything had completed, and pause(), resume() and seek() became silent no-ops.' },
      { type: 'fix', text: 'Any re-measure while scrolled shifted the trigger window for custom scrollContainer callers. The element offset inside a scroll container already includes the scroll position, and it was being added a second time — so a resize mid-scroll moved the window by however far the user had scrolled. A scrollHorizontal strip scrubbed halfway snapped back to its first panel with no scrolling at all. Three engines had their own copy of the arithmetic, and all three of it.' },
      { type: 'fix', text: 'scrollHorizontal’s default distance ignored scrollContainer, subtracting the window width regardless — so inside a container narrower than the viewport the strip overshot the last panel and parked on empty space, and every nested-container caller had to pass distance by hand.' },
      { type: 'fix', text: 'split: \'lines\' in scrollText threw away the spaces between words. It groups word spans by offsetTop and moved only the words, leaving behind the whitespace spans the splitter creates to hold the gaps open, so "Every word here" rendered as "Everywordhere". Only visible with real layout, which is why jsdom never saw it.' },
      { type: 'fix', text: 'scrollDrawTimeline.destroy() left every path frozen on its last frame, and with fade also half-transparent, for the rest of the page’s life. It now restores what it wrote, like every other module.' },
      { type: 'new', text: 'refresh() on scrollDraw, scrollDrawTimeline and the group APIs — re-measure path lengths and the trigger window after a layout change that fires no resize, such as a tab switching or a font swapping inside a fixed-height box. scrollPin and scrollHorizontal already had it.' },
      { type: 'new', text: 'respectReducedMotion on scrollDrawTimeline (default true), covering the time-driven loop only. Scroll scrubbing advances 1:1 with the user’s own input and keeps working; the loop replays off a timer with no scroll input at all, which is autonomous motion, and it had no check whatsoever.' },
      { type: 'new', text: 'A development CDN build — svg-scroll-draw.dev.global.js. IS_DEV was derived from process.env.NODE_ENV, and process does not exist in a browser without a bundler, so every warning this library has was invisible to exactly the users with the fewest other diagnostics. The production CDN build now drops those warnings at build time instead of shipping and skipping them.' },
      { type: 'new', text: 'Browser coverage for all eight framework wrappers — React, Vue, Solid, Svelte, Angular, Astro, Nuxt and the web component — mounted for real and held to one contract: the engine runs, unmounting stops it (no leaked observers, no leaked frame loop), re-mounting works, and option changes reach the engine only where the wrapper says they do. Roughly a thousand lines that had been excluded from coverage because jsdom cannot mount them.' },
      { type: 'new', text: 'An SSR suite that runs with no DOM at all, covering every entry point: importing must not throw, and every public API must return an inert instance rather than reaching for document. Astro’s auto-init helpers defaulted their root to document at call time, so calling one from component frontmatter — on the server, which is Astro’s default — threw instead of doing nothing.' },
      { type: 'fix', text: 'scrollHorizontal never moved the track in its own documented setup. The default trigger window was measured against the track, and a position:sticky stage pins that track at exactly one stage tall — so both ends resolved to the same scroll position, clamping progress at 0 forever. It had 100% line coverage in jsdom the whole time it was broken: every rect there is 0, so the window is equally degenerate and looks identical to a working one. The trigger is now measured from the container that actually holds the scroll room.' },
      { type: 'new', text: 'triggerElement on scrollHorizontal and scrollAnimate — measure the trigger window from an element other than the animated one. Needed when the animated element is sticky-pinned and cannot supply the scroll length itself. Setting it disables the native CSS fast path, since animation-timeline: view() can only measure its own subject.' },
      { type: 'new', text: 'respectReducedMotion on scrollAnimate (default true) and scrollHorizontal (default false). Horizontal scrubbing opts out deliberately: the transform advances only as the user scrolls, 1:1 with their input, so it is direct manipulation rather than motion that plays at them — and holding a final state instead would leave every panel but one unreachable inside the sticky overflow:hidden container, hiding the content from exactly the people who asked for less motion.' },
      { type: 'fix', text: 'destroy() left the last animated frame’s inline styles on the element. Destroying anything mid-animation froze it there permanently — a card destroyed at 34% stayed at opacity 0.34 and offset by 21px for the rest of the page’s life, which is worse than never having animated it. Affects scrollReveal, scrollAnimate and scrollParallax, and it also made scrollReveal’s documented "restore original styles" untrue.' },
      { type: 'fix', text: 'scrollSnap fired onSnap twice for a single snap. The scroll event produced by its own animated scroll was treated as a fresh user gesture. Guaranteed under reduced motion and easing-dependent otherwise — a public callback that fires once or twice depending on the curve is worse than either.' },
      { type: 'new', text: 'A zero-length trigger window is now a development warning rather than a silently inert element. That is the defect class above: everything looks configured and nothing ever moves.' },
      { type: 'new', text: 'Real-browser coverage for every entry point — 30 to 175 tests per engine on Chromium, Firefox and WebKit. Every API and all eight framework wrappers are now exercised in a real browser rather than in jsdom, where getTotalLength() is stubbed and every rect is 0. scrollVideo verifies the painted frame against currentTime by canvas readback; scrollProgress drives real calc() widths off its custom properties instead of reading the values back in JS.' },
      { type: 'new', text: 'Mutation harness (scripts/mutation-check.mjs) — patches one line of source, rebuilds, and requires the single test named for that behaviour to fail. 56 mutations, all caught, including a regression guard for every fix in this release.' },
      { type: 'fix', text: 'Two test-harness faults that were producing false results: the "fixed" e2e viewport was silently overridden per browser project, leaving WebKit 100px shorter than the others, and the fixture server refused HTTP Range requests — which makes Chromium report media as non-seekable, so a correct scrollVideo looked completely inert.' },
    ],
  },
  {
    version: '2.9.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'scrollProgress (svg-scroll-draw/progress) — expose scroll progress as CSS custom properties (--scroll-progress, --scroll-progress-eased) on any element. Drive CSS animations, calc() expressions, and gradients with zero per-frame JS beyond the variable write.' },
      { type: 'new', text: 'scrollHorizontal (svg-scroll-draw/horizontal) — drive translateX from vertical scroll. The Apple / Stripe horizontal scroll pattern. Supports distance, easing, trigger, onProgress, refresh().' },
      { type: 'new', text: '/vs-aos comparison page — svg-scroll-draw vs AOS vs ScrollReveal.js. 20-row feature matrix, side-by-side code, bundle bars.' },
      { type: 'new', text: '/vs-framer-motion comparison page — feature matrix, bundle comparison, side-by-side API, honest "when Framer Motion wins" section.' },
      { type: 'new', text: '/react-scroll-animation landing page — React-focused guide covering ScrollAnimate, ScrollText, ScrollCounter, ScrollPin components, hooks, and real-world patterns with copy-ready code.' },
      { type: 'new', text: '/nextjs-scroll-animation landing page — Next.js App Router guide covering SSR-safe usage, "use client" pattern, dynamic imports, and all v2 APIs.' },
      { type: 'new', text: 'Blog post: "Horizontal scroll sections without GSAP" at /blog/horizontal-scroll-sections.' },
      { type: 'new', text: 'Blog post: "Complete guide to scroll animations (2025)" at /blog/complete-guide-scroll-animations-2025. 12 patterns, all code included.' },
      { type: 'new', text: 'Blog post: "Scroll animation performance" at /blog/scroll-animation-performance. Deep-dive on rAF budgets, native fast path, and avoiding layout thrash.' },
      { type: 'new', text: 'Home page — "Compare" + "Framework guides" section linking to all comparison pages and the React/Next.js landing pages.' },
      { type: 'new', text: 'Lenis dist types — dist/lenis/index.d.ts and .d.mts shipped so svg-scroll-draw/lenis resolves TypeScript types without manual paths config.' },
      { type: 'new', text: '16 new tests — scrollProgress (8), scrollHorizontal (7), + velocity (1 updated). Total: 423.' },
    ],
  },
  {
    version: '2.8.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'scrollReveal (svg-scroll-draw/reveal) — one-line reveal animations. 7 presets (fadeUp/Down/Left/Right, scale, flip, flipX), custom from state (opacity, x, y, scale, rotate, rotateX, rotateY), stagger, easing, onEnter/onLeave. Drop-in replacement for AOS and ScrollReveal.js.' },
      { type: 'new', text: 'velocityScale on scrollAnimate — scale animation speed by scroll velocity. Pass true (default sensitivity) or a number. Forces JS engine.' },
      { type: 'new', text: 'ResizeObserver on scrollPin — auto-refresh pin dimensions when the element or document layout changes. No more manual refresh() calls on accordion/modal open.' },
      { type: 'new', text: 'Blog post: "Replace AOS / ScrollReveal.js" at /blog/replace-aos-scrollreveal.' },
      { type: 'new', text: '19 new tests — scrollReveal (15), velocityScale (4). Total: 407.' },
    ],
  },
  {
    version: '2.7.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Scroll callbacks — onEnter, onLeave, onEnterBack, onLeaveBack added to both ScrollDrawOptions and ScrollAnimateOptions. Fire when scroll position crosses the trigger zone boundary in either direction. Forces JS engine.' },
      { type: 'new', text: 'scrollPin (svg-scroll-draw/pin) — pin any element at a viewport position while the page scrolls past it. Wrapper-based layout (no layout shift). Supports pinDistance, top, all lifecycle callbacks, onProgress, refresh().' },
      { type: 'new', text: 'scrollSnap (svg-scroll-draw/snap) — JS-powered section snapping with custom easing, configurable threshold, snapTo(index), getCurrentIndex(), and onSnap callback. Works on vertical and horizontal axes.' },
      { type: 'new', text: 'createLenisAdapter (svg-scroll-draw/lenis) — Lenis v1 smooth-scroll adapter. Patches window.scrollY / window.pageYOffset with Lenis\'s virtual scroll value so all engines stay in sync. Lenis v2+ works out of the box without the adapter.' },
      { type: 'new', text: '/vs-gsap comparison page — bundle size bars, 20-row feature matrix, side-by-side API code for every major use case, license comparison, CTA.' },
      { type: 'new', text: 'Blog post: "Pin sections on scroll without GSAP — scrollPin" at /blog/scroll-pin-without-gsap.' },
      { type: 'new', text: '30 new tests — scrollCallbacks (6), scrollPin (11), scrollSnap (7), lenis (6). Total: 388.' },
    ],
  },
  {
    version: '2.6.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Playground v2 tab — new "v2 ✦" tab in the SVG Playground with live interactive demos for scrollAnimate (5 effect presets, 5 easings, scrubber), scrollText (split/stagger/from-preset), and scrollCounter (4 format presets). Each panel has replay, scrubber, and a copy-ready code snippet.' },
      { type: 'new', text: 'Blog post: "Animate multiple elements on scroll — one call" at /blog/scroll-animation-groups. Covers scrollAnimateGroup, scrollAnimateSequence, scrollParallaxGroup, scrollDrawGroup, scrollDrawSequence with real-world patterns for pricing grids, hero sections, and feature lists.' },
      { type: 'new', text: 'README sub-path exports table updated — all v2 wrappers for Vue, Svelte, Solid, Angular, Astro, Nuxt, and group APIs documented.' },
      { type: 'fix', text: 'JSON-LD structured data on home page: softwareVersion updated from 1.2.0 to 2.6.0.' },
    ],
  },
  {
    version: '2.5.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'scrollParallaxGroup — fan-out scrollParallax across multiple elements simultaneously. Same combined instance API as scrollAnimateGroup. Ships in svg-scroll-draw/group.' },
      { type: 'new', text: 'DocsPage Angular v2 — full docs for ScrollAnimateRef, ScrollCounterRef, ScrollVideoRef, ScrollTextRef with Angular component examples.' },
      { type: 'new', text: 'DocsPage Nuxt v2 — useScrollAnimate, useScrollText, useScrollCounter composables + component wrappers + createScrollDrawPlugin. Full parity with Vue/Svelte/Solid docs.' },
      { type: 'new', text: 'DocsPage Astro v2 — initScrollAnimate, initScrollText, initScrollCounter, initAll data-attribute API with full code examples.' },
      { type: 'fix', text: 'Desktop nav bug — burger menu was rendering on desktop across 7 pages (blog index, 5 blog posts, ExamplesPage). Wrapped all bare <MobileMenu /> in lg:hidden containers.' },
    ],
  },
  {
    version: '2.4.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Angular v2 wrappers — ScrollAnimateRef, ScrollCounterRef, ScrollVideoRef, ScrollTextRef classes. Same class-based init(element, options)/destroy() pattern as ScrollDrawRef. Ships in svg-scroll-draw/angular.' },
      { type: 'new', text: 'Astro v2 — initScrollAnimate(), initScrollText(), initScrollCounter() data-attribute auto-init functions. Plus initAll() convenience that runs all four inits in one call. Ships in svg-scroll-draw/astro.' },
      { type: 'new', text: 'Nuxt v2 — svg-scroll-draw/nuxt now re-exports all v2 Vue composables (useScrollAnimate, useScrollCounter, useScrollVideo, useScrollText) and components. createScrollDrawPlugin() globally registers all five components.' },
      { type: 'new', text: 'scrollAnimateGroup — animate multiple HTML/SVG elements simultaneously with scrollAnimate options. Same fan-out + combined instance API as scrollDrawGroup. Ships in svg-scroll-draw/group.' },
      { type: 'new', text: 'scrollAnimateSequence — animate multiple elements in strict sequence, each starting only after the previous reaches 100%. Ships in svg-scroll-draw/group.' },
      { type: 'new', text: 'ExamplesPage — three new v2 examples: Product Video Scrub (scrollVideo), Feature List Reveal (staggered scrollAnimate rows), Animate Group (scrollAnimateGroup fan-out).' },
      { type: 'new', text: 'Blog post: "scrollAnimate in Vue 3, Svelte, and Solid.js — v2 framework guide" at /blog/vue-svelte-solid-v2. Covers composables, actions, hooks, component wrappers, real-world patterns, Nuxt plugin, Astro data-attributes.' },
    ],
  },
  {
    version: '2.3.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Vue 3 v2 composables — useScrollAnimate, useScrollCounter, useScrollVideo, useScrollText. Each returns a ref to bind to any element. Ships in svg-scroll-draw/vue alongside the existing useScrollDraw.' },
      { type: 'new', text: 'Vue 3 v2 components — <ScrollAnimate :options="...">, <ScrollCounter :to="...">, <ScrollVideo src="..." :options="...">, <ScrollText :options="..." tag="h2">. Ships in svg-scroll-draw/vue.' },
      { type: 'new', text: 'Svelte v2 actions — scrollAnimate, scrollCounterAction, scrollVideoAction, scrollTextAction Svelte use: actions + createScrollAnimate, createScrollCounter, createScrollVideo, createScrollText helpers that expose getInstance(). Ships in svg-scroll-draw/svelte.' },
      { type: 'new', text: 'Solid v2 hooks — useScrollAnimate, useScrollCounter, useScrollVideo, useScrollText returning ref setters + createScrollAnimate, createScrollCounter, createScrollVideo, createScrollText exposing getInstance(). Ships in svg-scroll-draw/solid.' },
      { type: 'new', text: 'ScrollTextInteractive demo — interactive home page section for scrollText: split mode picker (chars/words/lines), stagger slider (0–0.10), from-preset selector (Fade Up / Rotate In / Scale), scrubber, replay button, and live code block.' },
    ],
  },
  {
    version: '2.2.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'scrollVideo — tie <video>.currentTime to scroll position. Ships as svg-scroll-draw/video. The Apple / Stripe product-page scrub pattern. Supports from/to in seconds, preload strategy, onReady callback, and the full pause/resume/seek/replay/getProgress instance API.' },
      { type: 'new', text: 'scrollText — split any element into chars, words, or lines and stagger-animate each unit on scroll. Ships as svg-scroll-draw/text, a 2.5 KB alternative to GSAP SplitText. Accessibility: aria-label on container, aria-hidden on spans, destroy() restores original HTML.' },
      { type: 'new', text: 'devtools overlay — ships as svg-scroll-draw/devtools. Fixed panel showing all active animation types (draw/animate/counter/video/text), progress bars, trigger-start/end lines on the page, color-coded by type. enable(), disable(), toggle(), highlight(el). Cmd/Ctrl+Shift+S keyboard shortcut. Zero production bytes (dev-only guard).' },
      { type: 'new', text: 'Global instance registry (src/core/registry.ts) — all engines (animate, counter, video, text) self-register on init and unregister on destroy. DevTools reads the registry.' },
      { type: 'new', text: 'ScrollVideo + ScrollText React components added to svg-scroll-draw/react.' },
      { type: 'new', text: '36 new tests — scrollVideo.test.ts (17), scrollText.test.ts (19). 358 total across 12 suites.' },
      { type: 'new', text: 'Demo site — DocsPage v2.0–2.2 nav group with full option tables. Examples page: Pricing Card Reveal (scrollAnimate), Social Proof Strip (scrollCounter), Hero Headline Reveal (scrollText). Blog post: "Replace GSAP ScrollTrigger with scrollAnimate".' },
    ],
  },
  {
    version: '2.0.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'scrollAnimate — animate any CSS property (opacity, transform, color, background-color, filter, or any unit-based value) on any HTML or SVG element driven by scroll. Direct replacement for gsap.to + ScrollTrigger for the 80% case. Interpolates numbers, hex/rgb colors, transform functions (multi-function string parsing), and CSS unit values.' },
      { type: 'new', text: 'Native CSS fast path — for opacity/transform with named easing and default trigger, scrollAnimate injects animation-timeline: view() CSS instead of running JS on every frame. Automatically falls back to the JS engine when native is unsupported or the config uses callbacks, custom triggers, once, etc.' },
      { type: 'new', text: 'scrollCounter — animate a number from from to to as the element scrolls into view. Custom format function, decimals shorthand, all standard easing. Ships in the main bundle.' },
      { type: 'new', text: 'scrollParallax — move any element at speed × elementHeight pixels of travel. Negative speed reverses direction. Thin wrapper over scrollAnimate. Ships in the main bundle.' },
      { type: 'new', text: 'ScrollAnimate + ScrollCounter React components added to svg-scroll-draw/react.' },
      { type: 'new', text: '50 new tests — scrollAnimate.test.ts (30), scrollCounter.test.ts (20). 322 total across 10 suites.' },
      { type: 'new', text: 'interpolateValue utility exported — public helper for CSS value interpolation (numbers, colors, transforms, unit values).' },
    ],
  },
  {
    version: '1.8.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Changelog page — v1.4.0–v1.7.0 entries added with full release notes; "Latest" tag updated to v1.7.0.' },
      { type: 'new', text: 'Examples page — new Presets card (14 examples total); PresetShowcase component shows all 5 presets side by side on the same SVG.' },
      { type: 'new', text: 'Playground — Preset shortcut dropdown at the top of the Motion tab. Selecting a preset instantly applies its options to the current state.' },
      { type: 'new', text: 'Blog post: "5 scroll animation patterns in under 10 lines" at /blog/5-patterns-under-10-lines. Covers all 5 presets with Vanilla JS + React code. Blog index now shows 4 posts.' },
    ],
  },
  {
    version: '1.7.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'scrollDrawTimeline loop option — after the scroll-driven animation completes, automatically replay as a time-driven loop with no further scroll input needed. loop: true = infinite, loop: number = N additional iterations.' },
      { type: 'new', text: 'scrollDrawTimeline loopDuration option — duration of each time-driven loop iteration in ms (default 1500).' },
      { type: 'fix', text: 'doReset() now correctly resets currentAlpha to 0, so getProgress() returns 0 immediately after replay().' },
      { type: 'new', text: 'DocsPage updated — preset in Core Options, new Presets section, new CLI init section, timeline options fully documented (repeat, repeatDelay, loop, loopDuration, debug, label).' },
      { type: 'new', text: 'README updated — Presets section with table, CLI in Install section, preset in options table, timeline table with all new options.' },
      { type: 'new', text: '272 passing tests (5 new loop tests).' },
    ],
  },
  {
    version: '1.6.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'preset option — apply a named option bag as the base config. Five presets: sketch (staggered ease-in), reveal (fade + ease-out + once), typewriter (fast linear stagger), cinematic (slow ease-in-out + fade), spring (spring easing). User options always override.' },
      { type: 'new', text: 'PRESETS export — the preset definitions are exported from the main package for inspection and extension.' },
      { type: 'new', text: 'CLI init tool — npx svg-scroll-draw init scaffolds a ready-to-use starter file for React, Vue, Svelte, Solid, or Vanilla JS. Asks for framework, preset, easing, and selector.' },
      { type: 'new', text: 'Blog post: "Scroll-driven SVG path morphing with morphTo" at /blog/scroll-path-morphing.' },
      { type: 'new', text: '267 passing tests (5 new preset tests).' },
    ],
  },
  {
    version: '1.5.0',
    date: 'June 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'scrollDrawTimeline repeat option — replay N times (or \'infinite\') after completion with once: true. After delay, paths reset and animate again on next scroll-into-view.' },
      { type: 'new', text: 'scrollDrawTimeline repeatDelay option — ms to wait before each repeat.' },
      { type: 'new', text: 'scrollDrawTimeline debug option — inject a fixed HUD panel into document.body showing each track\'s scroll window as a coloured progress bar with live fill and global progress. Removed on destroy().' },
      { type: 'new', text: 'scrollDrawTimeline label option — label shown in the debug panel header.' },
      { type: 'new', text: 'Blog post: "Zero-JS SVG scroll animations with native CSS" at /blog/native-css-svg-scroll-animations.' },
      { type: 'new', text: '262 passing tests (8 new timeline tests).' },
    ],
  },
  {
    version: '1.4.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Cinematic class — the runtime bridge for Cinematic Studio. Reads a story.json and wires a scroll-scrubbed timeline with zero JS on the author\'s side. Import from svg-scroll-draw/cinematic.' },
      { type: 'new', text: 'loadStory(story) — builds a sticky-stage scroll structure from the story, strokes draw paths across their scroll range, fades layers in. Honors prefers-reduced-motion.' },
      { type: 'new', text: 'Story protocol types exported: Story, StoryScene, StoryAnimation, DrawAnimation, FadeAnimation, StoryEasing.' },
      { type: 'new', text: '254 passing tests (5 new cinematic tests).' },
    ],
  },
  {
    version: '1.3.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'autoplay option — trigger the animation on viewport enter instead of scroll. Draws over duration milliseconds, replays on each re-entry. Use once: true to play only the first time.' },
      { type: 'new', text: 'duration option (number, default 1000ms) — controls how long the autoplay animation runs. Only used when autoplay: true.' },
      { type: 'new', text: 'All existing visual options work in autoplay mode — easing, stagger, fade, strokeColor, strokeWidth, fillOpacity, clip, morphTo, waypoints, repeat, repeatDelay, direction, onStart, onComplete, onProgress.' },
      { type: 'new', text: 'Full instance API in autoplay mode — pause/resume freeze/unfreeze elapsed time; seek(0–1) jumps to a fraction of duration; replay restarts from scratch.' },
      { type: 'new', text: '249 passing tests (8 new) — autoplay draw, onStart, onComplete, seek, replay, destroy, clip mode, and once covered.' },
    ],
  },
  {
    version: '1.2.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'createBounce({ bounces, decay }) — bounce-out easing that rises to 1 then makes N dips before settling. Also available as the named string \'bounce\'. Values stay within [0, 1]' },
      { type: 'new', text: 'createElastic({ amplitude, period }) — elastic-out easing that overshoots past 1 and oscillates back. Also available as the named string \'elastic\'. Based on the Penner elastic-out formula' },
      { type: 'new', text: 'EasingName type updated — \'bounce\' and \'elastic\' are now valid TypeScript string values for the easing option' },
      { type: 'new', text: '241 passing tests (20 new) — createBounce and createElastic covered across boundary values, curve shape, overshoot, and factory parameterization' },
      { type: 'new', text: 'Solid.js gallery demo on /examples — fine-grained reactivity graph (createSignal → createMemo → createEffect) in Solid brand blue' },
      { type: 'new', text: 'Framework filter on /examples — pill strip (All / React / Vue 3 / Svelte / Solid / Vanilla / API) filters the 13-demo gallery client-side' },
      { type: 'new', text: 'Page-specific OG images for /playground and /changelog; display:inline-block Satori crash fixed across all five OG images' },
      { type: 'new', text: '/blog/gsap-drawsvg-alternative — full SEO comparison page with bundle size chart, side-by-side code, 19-row feature matrix, and migration guide' },
      { type: 'new', text: 'Playground easing dropdown now includes bounce and elastic with live parameter sliders (Bounces/Decay and Amplitude/Period)' },
    ],
  },
  {
    version: '1.1.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Native CSS scroll-driven rendering — on supporting browsers (Chrome, Edge, Firefox) the simple draw case runs on the compositor via animation-timeline: view() with zero per-frame JavaScript and no scroll/resize listeners' },
      { type: 'new', text: 'native option (default true) — automatically uses the CSS fast path when eligible; pass false to always use the JS engine. The full instance API works on both paths' },
      { type: 'new', text: '221 passing tests across 7 suites — engine-native.test.ts added to cover the native CSS path and fallback logic' },
      { type: 'fix', text: 'Bundle size claim corrected to ~4.4 KB gzipped across all docs (stale "<3 KB" figure removed)' },
    ],
  },
  {
    version: '1.0.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'fix', text: 'scrollDrawSequence chain was broken — engines now created upfront and paused; each step resumes only when the previous fires onComplete. activeIdx tracks correctly so pause/resume/seek/getProgress always target the active step.' },
      { type: 'new', text: '194 passing tests across 6 suites — engine, engine-options, group, timeline, framework wrappers (Angular, Astro, Svelte, Solid), and utilities' },
      { type: 'new', text: 'Framework wrapper tests — Angular ScrollDrawRef, Astro initScrollDraw, Svelte scrollDraw action + createScrollDraw, Solid useScrollDraw + createScrollDraw' },
      { type: 'new', text: 'Root workspace test runner — npx vitest run from the repo root works via vitest.workspace.ts' },
      { type: 'new', text: 'CI coverage threshold enforcement — Node 20 + 22 matrix' },
      { type: 'new', text: 'JSDoc improvements — clip, morphTo, and scrollDrawSequence document their non-obvious edge cases inline' },
    ],
  },
  {
    version: '0.7.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'createSpring({ tension, friction }) — parameterize the spring easing instead of the hardcoded preset' },
      { type: 'new', text: 'svg-scroll-draw/timeline — scrollDrawTimeline API for independent per-track scroll windows within a single range' },
      { type: 'new', text: '--scroll-draw-progress CSS custom property — set on the container every frame, drive CSS animations without JS callbacks' },
      { type: 'new', text: 'Docs page (/docs) — full API reference with sidebar navigation and IntersectionObserver-based active tracking' },
      { type: 'new', text: 'Group & Sequence demos on the examples page' },
      { type: 'new', text: 'Timeline API demo on the examples page' },
    ],
  },
  {
    version: '0.6.2',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'fillOpacity — animate fill opacity in sync with the stroke draw. Use [0, 1] to flood a fill as the outline traces itself' },
      { type: 'new', text: 'useScrollDrawProgress React hook — reactive 0–1 scroll progress for any element, same trigger/easing API' },
      { type: 'new', text: 'svg-scroll-draw/web-component subpath export — <scroll-draw> importable directly, not just via CDN' },
    ],
  },
  {
    version: '0.6.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Pause / Resume / Seek — full imperative playback control on every instance' },
      { type: 'new', text: 'Path Morphing (morphTo) — interpolate a path\'s d attribute to a target shape on scroll' },
      { type: 'new', text: 'Velocity Scale (velocityScale) — draw speed scales with scroll speed' },
      { type: 'new', text: 'Repeat / RepeatDelay — replay N times or loop infinitely' },
      { type: 'new', text: 'Astro adapter (svg-scroll-draw/astro) — data-attribute API with initScrollDraw()' },
      { type: 'new', text: 'Nuxt adapter (svg-scroll-draw/nuxt) — useScrollDraw() composable for Nuxt 3' },
      { type: 'new', text: 'Group API (svg-scroll-draw/group) — scrollDrawGroup and scrollDrawSequence' },
      { type: 'new', text: 'Web Component — <scroll-draw> custom element, auto-registers via CDN' },
    ],
  },
  {
    version: '0.4.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Solid.js adapter (svg-scroll-draw/solid) — useScrollDraw and createScrollDraw hooks' },
      { type: 'new', text: 'Angular adapter (svg-scroll-draw/angular) — ScrollDrawRef class for AfterViewInit lifecycle' },
      { type: 'new', text: 'Stroke color animation (strokeColor) — static or [from, to] interpolation' },
      { type: 'new', text: 'Stroke width animation (strokeWidth) — static or [from, to] interpolation' },
      { type: 'new', text: 'Auto Reverse (autoReverse) — follows scroll direction automatically' },
      { type: 'new', text: 'Custom scroll container (scrollContainer)' },
      { type: 'new', text: 'Waypoints — fire callbacks at specific 0–1 progress thresholds' },
      { type: 'new', text: 'Delay option — milliseconds before the engine starts observing' },
    ],
  },
  {
    version: '0.3.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Svelte adapter (svg-scroll-draw/svelte) — use:scrollDraw action and createScrollDraw' },
      { type: 'new', text: 'Horizontal scroll support (axis: "x")' },
      { type: 'new', text: 'Replay API — instance.replay() to re-trigger imperatively' },
      { type: 'new', text: 'Spring easing — physics-based overshoot-and-settle curve' },
      { type: 'new', text: 'Once mode (once) — draw once and stay drawn' },
      { type: 'new', text: 'Debug overlay (debug) — visualizes trigger zones in dev mode' },
      { type: 'new', text: 'onStart lifecycle hook' },
    ],
  },
  {
    version: '0.2.0',
    date: 'May 2026',
    tag: null,
    tagColor: '',
    items: [
      { type: 'new', text: 'Vue 3 adapter (svg-scroll-draw/vue) — <ScrollDraw> component and useScrollDraw composable' },
      { type: 'new', text: 'SVG Playground at /playground — live SVG editor with all options' },
      { type: 'new', text: 'Interactive demo with easing and speed controls' },
      { type: 'fix', text: 'OpenGraph and Twitter preview card image URLs' },
    ],
  },
  {
    version: '0.1.0',
    date: 'May 2026',
    tag: 'Initial release',
    tagColor: 'bg-lime-glow',
    items: [
      { type: 'new', text: 'Core scrollDraw() function — zero dependencies, ~3 KB gzipped' },
      { type: 'new', text: 'React wrapper (svg-scroll-draw/react) — <ScrollDraw> component' },
      { type: 'new', text: 'Easing curves — linear, ease-in, ease-out, ease-in-out' },
      { type: 'new', text: 'Trigger system — element/viewport anchor strings' },
      { type: 'new', text: 'Stagger, fade, direction, once, speed options' },
      { type: 'new', text: 'IntersectionObserver viewport culling' },
      { type: 'new', text: 'SSR safe — window guards, Next.js App Router compatible' },
      { type: 'new', text: 'rect and circle support via perimeter approximation' },
      { type: 'new', text: 'CDN IIFE bundle at dist/cdn/svg-scroll-draw.global.js' },
    ],
  },
] as const;

export default function ChangelogPage() {
  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight shrink-0">svg-scroll-draw</Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          <Link href="/docs" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Docs</Link>
          <Link href="/examples" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Examples</Link>
          <Link href="/blog" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Blog</Link>
          <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">⚡ Playground</Link>
          <a href={NPM} target="_blank" rel="noopener noreferrer" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-mono whitespace-nowrap">v2.10.0</a>
          <a href={GH} target="_blank" rel="noopener noreferrer" className="text-sm px-4 py-1.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium whitespace-nowrap">GitHub →</a>
        </div>

        {/* Mobile / tablet */}
        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </nav>

      {/* Header */}
      <section className="border-b border-pitch-black px-4 sm:px-6 md:px-12 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-3 font-medium">Release history</p>
          <h1 className="font-display font-extrabold text-[clamp(36px,7vw,80px)] leading-[0.92] tracking-[-0.04em] mb-4">
            Changelog
          </h1>
          <p className="text-base text-graphite-border">
            Every release of <code className="font-mono text-pitch-black text-sm bg-marketplace-gray border border-subtle-ash px-1.5 py-0.5 rounded-md">svg-scroll-draw</code>, newest first.
          </p>
        </div>
      </section>

      {/* Releases */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-12 space-y-0">
        {RELEASES.map((release, i) => (
          <React.Fragment key={release.version}>

            {/* v2 → v1 platform shift separator — sits between v2.0.0 (index 8) and v1.8.0 (index 9) */}
            {i === 9 && (
              <div className="relative flex gap-4 sm:gap-6 md:gap-10 pb-10 sm:pb-12">
                {/* Timeline line continuation */}
                <div className="absolute left-[13px] top-0 bottom-0 w-px bg-subtle-ash" />
                <div className="shrink-0 w-7" />
                <div className="flex-1 min-w-0">
                  <div className="rounded-2xl border-2 border-pitch-black bg-pitch-black text-light-linen px-6 py-5 shadow-[4px_4px_0px_rgba(0,0,0,0.15)]">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] bg-creator-pink text-pitch-black px-2.5 py-0.5 rounded-full">v2.0 — The Platform Shift</span>
                      <span className="text-[11px] font-mono text-light-linen/50">June 2026</span>
                    </div>
                    <p className="text-[13px] text-light-linen/70 leading-relaxed">
                      svg-scroll-draw grew from an SVG path drawing tool into a full scroll animation platform.
                      Six new APIs — <code className="font-mono text-[12px] text-creator-pink">scrollAnimate</code>,{' '}
                      <code className="font-mono text-[12px] text-creator-pink">scrollCounter</code>,{' '}
                      <code className="font-mono text-[12px] text-creator-pink">scrollParallax</code>,{' '}
                      <code className="font-mono text-[12px] text-creator-pink">scrollVideo</code>,{' '}
                      <code className="font-mono text-[12px] text-creator-pink">scrollText</code>, and{' '}
                      <code className="font-mono text-[12px] text-creator-pink">devtools</code> — added in v2.0–v2.2.
                      Everything below this line is the original SVG draw library.
                    </p>
                  </div>
                </div>
              </div>
            )}

          <div className="relative flex gap-4 sm:gap-6 md:gap-10 pb-10 sm:pb-12">
            {/* Timeline line */}
            {i < RELEASES.length - 1 && (
              <div className="absolute left-[13px] top-8 bottom-0 w-px bg-subtle-ash" />
            )}

            {/* Dot */}
            <div className="relative flex flex-col items-center shrink-0 pt-1">
              <div className={`w-7 h-7 rounded-full border-2 border-pitch-black flex items-center justify-center ${release.tag ? 'bg-pitch-black' : 'bg-light-linen'}`}>
                {release.tag && <div className="w-2 h-2 rounded-full bg-creator-pink" />}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <a
                  href={`${NPM}/v/${release.version}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display font-extrabold text-xl tracking-tight hover:underline"
                >
                  v{release.version}
                </a>
                {release.tag && (
                  <span className={`text-[10px] font-bold uppercase tracking-[0.14em] px-2.5 py-0.5 rounded-full ${release.tagColor} text-pitch-black`}>
                    {release.tag}
                  </span>
                )}
                <span className="text-[11px] font-mono text-graphite-border">{release.date}</span>
              </div>

              <ul className="space-y-2">
                {release.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-0.5 shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full font-mono ${
                      item.type === 'new' ? 'bg-lime-glow/40 text-pitch-black' : 'bg-creator-pink/30 text-pitch-black'
                    }`}>
                      {item.type === 'new' ? 'new' : 'fix'}
                    </span>
                    <span className="text-graphite-border leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          </React.Fragment>
        ))}
      </div>

      {/* Footer */}
      <footer className="border-t border-subtle-ash px-6 md:px-12 py-6 text-center text-[11px] font-mono text-graphite-border">
        svg-scroll-draw · MIT · ~10 KB gzipped ·{' '}
        <a href={GH} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
          GitHub
        </a>
      </footer>
    </div>
  );
}
