# Project Status — svg-scroll-draw

> Current version: **2.2.0** — published on npm
> Tests: **358 passing** across 12 test suites
> Bundle: **~9 KB gzipped** (main) · zero runtime dependencies
> Last updated: 2026-06-04

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

### Testing
- [x] 358 tests across 12 suites — `engine`, `engine-options`, `engine-native`, `group`, `timeline`, `framework`, `cinematic`, `utils`, `scrollAnimate` (30), `scrollCounter` (20), `scrollVideo` (17), `scrollText` (19)
- [x] Initial state fix — `createAnimateEngine` and `scrollCounter` now apply correct alpha immediately on init (no flash before IO fires)

---

## Demo App (`apps/demo`)

### Pages
- [x] `/` — hero, scroll demos, interactive `scrollAnimate` demo, v2 API grid, API reference, framework tabs, bundle chart, live stats, CTA
- [x] `/examples` — 17 examples (14 v1 SVG + 3 v2: Pricing Card Reveal, Social Proof Strip, Hero Headline Reveal) with framework filter
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

## Remaining / Next

- [ ] **Vue/Svelte/Solid v2 wrappers** — `scrollAnimate`, `scrollCounter`, `scrollParallax`, `scrollVideo`, `scrollText` wrappers for Vue, Svelte, Solid. Ships as v2.3.0.
- [ ] **Changelog page UI** — add a visual "v2 milestone" callout to visually separate v2.x from v1.x history.
- [ ] **Interactive scrollText demo** on home page — similar to `ScrollAnimateInteractive` but for text reveal (split selector, stagger slider).
