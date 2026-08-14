# Project Status — svg-scroll-draw

> Current version: **2.10.0** — staged, not yet published (2.9.0 is the published one)
> Tests: **531 unit** across 25 suites · **175 browser tests** per engine (525 runs
> across Chromium/Firefox/WebKit) · **56 mutations**, each caught by the one test
> named for it · **91.3% line coverage** (gate 90/90/82/82)
> Bundle: **9.0 KB gzipped** (main entry; per-API entries from 0.2 KB) · zero runtime dependencies
> Last updated: 2026-08-14

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
- [x] 531 tests across 25 suites — `engine`, `engine-options`, `engine-native`, `css-easing`, `ssr` (no DOM at all), `group`, `timeline`, `framework`, `cinematic`, `utils`, `scrollAnimate` (30), `scrollCounter` (20), `scrollVideo` (17), `scrollText` (23)
- [x] Initial state fix — `createAnimateEngine` and `scrollCounter` now apply correct alpha immediately on init (no flash before IO fires)

### Browser tests (Phase 2, `packages/svg-scroll-draw/e2e`)
175 browser tests per engine, run on Chromium, Firefox and WebKit. Shared harness:
`helpers.ts` (deterministic sweep — scroll to a fixed offset, wait two frames,
read) and `fixtures/_probe.mjs` (parsing stays in the page, so specs assert on
numbers).

- [x] `parity` — native CSS fast path vs JS engine (Phase 1)
- [x] `idle` — idle cost of the JS engine (Phase 1)
- [x] `reveal` — resolved transforms, stagger cascade, `once` latching, reduced motion, destroy restores styles
- [x] `pin` — no layout shift on wrapper injection, pin/unpin boundaries, parked position and width, progress, all four lifecycle callbacks, `refresh()`, ResizeObserver auto-refresh, destroy unwraps
- [x] `snap` — exact section landing, index clamping, threshold both directions, one section per gesture, animated vs **real** reduced-motion instant snap, destroy
- [x] `text` — split preserves rendered text exactly, `aria-label` + `aria-hidden` spans, stagger cascade, no re-split/reflow loop over 30 frames, reduced motion, destroy restores markup byte-for-byte including nested elements
- [x] `counter` — from-value at construction, formatting/decimals/custom format at the final value, well-formed text every frame (no NaN/exponential/out-of-range), `once` hold, reduced motion, destroy
- [x] `progress` — accurate raw value across the window, **dependent CSS resolving the variables through `calc()`**, eased ≠ raw, `onProgress`, renamed variable, `easedVariable: null`, clamping, destroy removes the properties
- [x] `parallax` — travel = speed x height, negative speed reverses, `axis: 'x'` uses width, reverses on the way back, reduced motion, destroy restores
- [x] `video` — real metadata, `currentTime` tracks scroll, **painted frame verified against `currentTime`** by canvas readback, no write before `loadedmetadata`, reduced motion, destroy
- [x] `horizontal` — translateX travel matches the sticky track width, every panel measurably reachable, `onProgress`, reverses, reduced motion keeps scrubbing, `refresh()` after a widened track, destroy; and inside a custom `scrollContainer`: distance measured against the container rather than the window, and a re-measure while scrolled that must not move the window
- [x] `animate-parity` — `scrollAnimate`'s own native fast path vs the JS engine across all four named easings, eligibility gate (10 declined configs + a control), `getProgress()` agreeing with what is rendered, reduced motion, destroy removes class/stylesheet/inline styles
- [x] `group` — draw group members animating together, `seek`/`destroy` reaching every member, the sequence gate (a step held until its predecessor finishes), `once` latching across a scroll-back, chain completion reporting, `scrollAnimateGroup` cascade from per-member windows, `scrollParallaxGroup` travel = speed x **each member's own** height
- [x] `timeline` — per-track `from`/`to` windows, a track driving every element it matches, per-track easing, `fade`, the `--scroll-draw-progress` custom property, `onComplete`, `seek`/`replay`, `refresh()`, time-driven `loop`, reduced motion (scrubbing continues, the loop does not), `debug` panel lifecycle, destroy restores the paths
- [x] `cinematic` — the whole structure built from a story (400vh mount, sticky stage, canvas viewBox, stroke widths, pre-measured vs self-measured path lengths), per-animation scene windows, fade curve, first paint mid-story, a story shorter than the viewport, reduced motion, destroy leaves the built DOM
- [x] `frameworks` — all eight wrappers (React, Vue, Solid, Svelte, Angular, Astro, Nuxt, the web component) mounted for real and held to one contract: the engine runs, unmounting leaks no observer and no frame loop, re-mounting works, and option changes reach the engine only where the wrapper claims they do. React/Vue/Solid/Nuxt are bundled from `dist/` by `e2e/build-fixtures.mjs`
- [x] `cdn` — both CDN builds loaded from a plain `<script src>`: the production one exposes the API, registers `<scroll-draw>` and says nothing; the dev one reports the same mistakes the production build hides
- [x] `scripts/mutation-check.mjs` — 56 one-line source mutations, each required to fail the single test named for it
- [x] `scripts/make-fixture-video.mjs` — reproducible 4s scrub clip, no system tooling needed

### Browser tests still missing
Nothing. Every entry point the package exports is exercised in Chromium, Firefox
and WebKit, and `src/__tests__/ssr.test.ts` covers all of them again with no DOM
at all.

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
