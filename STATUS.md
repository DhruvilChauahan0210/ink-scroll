# Project Status — svg-scroll-draw

> Current version: **2.9.0** — published to npm
> Tests: **425 passing** across 20 test suites
> Bundle: **9.0 KB gzipped** (main entry; per-API entries from 0.2 KB) · zero runtime dependencies
> Last updated: 2026-08-13

---

## Core Library (`packages/svg-scroll-draw`)

### Architecture
- [x] `src/core/` — engine, types, utils, presets, registry
- [x] `src/animate/` — `scrollAnimate`, `scrollParallax`, value interpolation
- [x] `src/counter/` — `scrollCounter`
- [x] `src/video/` — `scrollVideo`
- [x] `src/text/` — `scrollText`
- [x] `src/devtools/` — visual overlay (dev-only)
- [x] `src/react/` `src/vue/` `src/svelte/` `src/solid/` `src/angular/` `src/astro/` `src/nuxt/` `src/web-component/`
- [x] `src/group/` `src/timeline/` `src/cinematic/` `src/cli/`

### v1 APIs (scrollDraw — unchanged)
- [x] All `scrollDraw` options — selector, speed, fade, easing, stagger, direction, once, debug, axis, scrollContainer, autoReverse, delay, strokeColor, strokeWidth, fillOpacity, clip, morphTo, velocityScale, repeat, repeatDelay, waypoints, autoplay, duration, native, preset
- [x] Native CSS `animation-timeline: view()` fast path with automatic JS fallback
- [x] Instance API — `destroy`, `replay`, `pause`, `resume`, `seek`, `getProgress`
- [x] Easing factories — `createSpring`, `createBounce`, `createElastic`
- [x] 5 named presets — sketch, reveal, typewriter, cinematic, spring
- [x] CLI init tool — `npx svg-scroll-draw init`
- [x] Framework wrappers — React, Vue 3, Svelte, Solid, Angular, Astro, Nuxt, Web Component
- [x] Advanced APIs — Group, Sequence, Timeline, Cinematic

### v2 APIs (new in 2.x)
- [x] `scrollAnimate` — animate any CSS property (opacity, transform, color, background-color, any unit value). Native CSS fast path for eligible configs. CSS value interpolation: numbers, hex/rgb colors, multi-function transform strings, unit values.
- [x] `scrollCounter` — animate a number from→to on scroll. Custom format, decimals, easing, once.
- [x] `scrollParallax` — move any element at speed×height pixels of travel. Negative = reverse direction.
- [x] `scrollVideo` — tie `<video>.currentTime` to scroll. Ships as `svg-scroll-draw/video`.
- [x] `scrollText` — split text into chars/words/lines + stagger animate. Ships as `svg-scroll-draw/text`. Accessibility: aria-label on container, aria-hidden on spans, destroy() restores HTML.
- [x] `devtools` overlay — progress panel + trigger lines, color-coded by type. Ships as `svg-scroll-draw/devtools`. Dev-only.
- [x] Global instance registry (`src/core/registry.ts`) — all engines self-register; devtools reads it.
- [x] React wrappers — `ScrollAnimate`, `ScrollCounter`, `ScrollVideo`, `ScrollText` in `svg-scroll-draw/react`
- [x] Vue 3 v2 wrappers — `useScrollAnimate`, `useScrollCounter`, `useScrollVideo`, `useScrollText` + matching components in `svg-scroll-draw/vue`
- [x] Svelte v2 wrappers — `scrollAnimate`, `scrollCounterAction`, `scrollVideoAction`, `scrollTextAction` actions + `create*` helpers in `svg-scroll-draw/svelte`
- [x] Solid v2 wrappers — `useScrollAnimate`, `useScrollCounter`, `useScrollVideo`, `useScrollText` + `create*` variants in `svg-scroll-draw/solid`
- [x] Angular v2 wrappers — `ScrollAnimateRef`, `ScrollCounterRef`, `ScrollVideoRef`, `ScrollTextRef` in `svg-scroll-draw/angular`
- [x] Astro v2 — `initScrollAnimate`, `initScrollCounter`, `initScrollText`, `initAll` in `svg-scroll-draw/astro`
- [x] Nuxt v2 — all v2 composables/components re-exported, plugin registers all 5 components
- [x] `scrollAnimateGroup` + `scrollAnimateSequence` + `scrollParallaxGroup` in `svg-scroll-draw/group`

### Testing
- [x] 425 tests across 20 suites — `engine`, `engine-options`, `engine-native`, `group`, `timeline`, `framework`, `cinematic`, `utils`, `scrollAnimate` (30), `scrollCounter` (20), `scrollVideo` (17), `scrollText` (19)
- [x] Initial state fix — `createAnimateEngine` and `scrollCounter` now apply correct alpha immediately on init (no flash before IO fires)

---

## Demo App (`apps/demo`)

### Pages
- [x] `/` — hero, scroll demos, interactive `scrollAnimate` demo, v2 API grid, API reference, framework tabs, bundle chart, live stats, CTA
- [x] `/examples` — 23 examples with framework filter
- [x] `/docs` — full API reference including v2.0–2.2 nav group with all 6 new APIs documented
- [x] `/playground` — interactive SVG editor
- [x] `/changelog` — full version history v0.1.0 → v2.2.0 with visual timeline
- [x] `/blog` — 5 posts: GSAP comparison, native CSS, path morphing, 5 patterns, replace GSAP ScrollTrigger

### Key demo components
- [x] `ScrollAnimateInteractive` — live effect selector (4 effects), easing picker, progress scrubber, auto-play, live code
- [x] `ScrollAnimateDemo` `ScrollCounterDemo` `ScrollTextDemo` `ScrollParallaxDemo` — real v2 live sections (home page)
- [x] `V2Previews.tsx` — `ScrollAnimatePreview`, `ScrollCounterPreview`, `ScrollTextPreview` for examples page
- [x] All existing v1 demo components unchanged

### Version sync (all files)
- [x] Version badges — `v2.2.0` across home, docs, mobile menu, changelog
- [x] Bundle size — `~9 KB gzipped` everywhere (was `~4.4 KB`)
- [x] Test count — `358` everywhere (was `241`)
- [x] Description — "scroll animation platform" everywhere (was "SVG scroll draw library")
- [x] GSAP comparison — "4× smaller" (was "9×"), bar `pct: 22` (was `11`)

---

### v2 Phase 1 — GSAP parity features (v2.7.0)
- [x] Scroll callbacks — `onEnter` / `onLeave` / `onEnterBack` / `onLeaveBack` on `scrollAnimate` + `scrollDraw`
- [x] `scrollPin` (`svg-scroll-draw/pin`) — wrapper-based pin, full lifecycle callbacks, `refresh()`
- [x] `scrollSnap` (`svg-scroll-draw/snap`) — JS section snapping, custom easing, `snapTo()`, `onSnap`
- [x] `createLenisAdapter` (`svg-scroll-draw/lenis`) — Lenis v1 smooth-scroll adapter

### Demo Site (v2.7.0)
- [x] `/vs-gsap` comparison page — bundle size bars, feature matrix, side-by-side API, license comparison
- [x] scrollPin / scrollSnap / callbacks added to home page v2 API grid (9 cards now)
- [x] Blog post: "Pin sections on scroll without GSAP" at `/blog/scroll-pin-without-gsap`
- [x] Blog index updated with new post
- [x] Home page bundle chart links to `/vs-gsap` instead of DrawSVG article
- [x] `softwareVersion` JSON-LD updated to 2.7.0
- [x] MobileMenu version badge updated to v2.7.0

## Remaining / Next

- [x] **Published v2.7.0 to npm**

### Demo Site (post-publish)
- [x] Docs page v2.7.0 nav group — `scrollPin`, `scrollSnap`, Scroll Callbacks, Lenis Adapter with full option tables
- [x] scrollAnimate docs table updated with 4 new callback options
- [x] Docs version badge → v2.7.0
- [x] Examples page — `scrollPin` (sticky feature panel) + `scrollSnap` (horizontal carousel) live demos
- [x] Examples page EXAMPLE_FRAMEWORKS updated
