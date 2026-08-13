# Changelog

All notable changes to `svg-scroll-draw` are documented here.

---

## [Unreleased]

### Fixed

- **`autoplay` animations could complete invisibly.** Leaving the viewport assigned
  `startTime = null`. Since `null` coerces to `0`, a later `pause()` recorded the
  whole timestamp since page load as `pausedElapsed` instead of an elapsed duration,
  and `resume()` then began a run already "elapsed" far past its own duration — so
  the draw finished instantly while still off-screen. Scrolling down revealed a
  static, already-drawn SVG. Replaced with an explicit run-state flag.
- **`getProgress()` always returned `0`** for `autoplay` stroke animations —
  `currentAlpha` was only ever set on the clip-path branch.
- **`replay()` reported the previous run's progress** until the next frame landed.
- **`npx svg-scroll-draw init` generated invalid SVG for Vue and Svelte.** The
  templates emitted JSX-style `strokeWidth` / `strokeLinecap`, which HTML-parsed
  templates discard — the starter example rendered with a 1px butt-capped stroke
  instead of the intended 2.5px round one.
- **`init` prompted for a CSS selector it then ignored** for React, Vue, Svelte and
  Solid. It now asks only for the vanilla target, the only one that uses it.
- Importing the CLI module no longer seizes `stdin`; the readline interface is now
  created inside `main()`.

### Changed

- **Corrected every size and count claim in the README and the npm description.**
  The package advertised `~4.4 KB gzipped` against a real 8.9 KB main entry, plus
  `272 tests` (really 461) and `13 examples` (really 23). The size section is now a
  measured 21-entry table showing that per-API entry points start at 0.2 KB.
- Coverage thresholds now reflect measured reality (85/85/77/79 against 85.9% lines).
  They previously demanded 90/90/85/80 against an actual 74%, so the required CI
  coverage step failed on every push to `main`.
- Coverage exclusions made consistent across all eight framework wrappers.
- `sideEffects` and `engines` added to `package.json`.

### Added

- `scripts/size.mjs` — prints the per-entry gzip table and, with `--check`, fails the
  build when an entry exceeds its budget.
- `scripts/check-claims.mjs` — derives the real test and example counts from source
  and fails when a doc disagrees. Wired into CI and `npm run verify`.
- CI now typechecks the library. Previously only `apps/demo` was checked, which is how
  a type error shipped in `core/engine.ts`.
- 36 tests covering the CLI generators and the devtools overlay, both previously at 0%.
- `prepare` script so a fresh clone builds the library on `npm install`.

---

## [2.9.0] — 2026-06-06

### Added

- **`scrollProgress`** (`svg-scroll-draw/progress`) — expose scroll progress as CSS custom properties (`--scroll-progress`, `--scroll-progress-eased`) on any element. Drive CSS animations, `calc()` expressions, and gradients with zero per-frame JS beyond the variable write.
- **`scrollHorizontal`** (`svg-scroll-draw/horizontal`) — drive `translateX` from vertical scroll. The Apple / Stripe horizontal scroll pattern. You handle sticky CSS; one call drives the transform. Supports `distance`, `easing`, `trigger`, `onProgress`, `refresh()`.
- **`scrollReveal` example** on Examples page — live cascade demo (6 cards, `stagger: 0.12`, `once: true`).
- **`/vs-aos`** comparison page — svg-scroll-draw vs AOS vs ScrollReveal.js. Feature matrix (20 rows), side-by-side code, bundle bars.
- **`/vs-framer-motion`** comparison page — feature matrix, bundle comparison, side-by-side API, honest "when Framer Motion wins" section.
- **Blog post** — "Horizontal scroll sections without GSAP" at `/blog/horizontal-scroll-sections`.
- **Blog index** — horizontal scroll post added. 10 posts total.
- **Home page** — 2 new API cards (`scrollProgress` v2.9.0, `scrollHorizontal` v2.9.0). Grid is now 12 cards.
- **Docs** — v2.9.0 nav group (`scrollProgress`, `scrollHorizontal`). Docs version badge → v2.9.0. MobileMenu → v2.9.0.
- **16 new tests** — scrollProgress (8), scrollHorizontal (7), + velocity (1 updated). Total: 423.
- **`/react-scroll-animation`** — React-focused landing page covering `ScrollAnimate`, `ScrollText`, `ScrollCounter`, `ScrollPin` components, hooks (`useScrollAnimate`, `useScrollDrawProgress`), and real-world patterns with copy-ready code.
- **`/nextjs-scroll-animation`** — Next.js App Router landing page covering SSR-safe usage, `"use client"` pattern, dynamic imports, and all v2 APIs.
- **Blog post** — "Complete guide to scroll animations (2025)" at `/blog/complete-guide-scroll-animations-2025`. 12 patterns, all code included.
- **Blog post** — "Scroll animation performance" at `/blog/scroll-animation-performance`. Deep-dive on `rAF` budgets, native fast path, and avoiding layout thrash.
- **Home page** — new "Compare" + "Framework guides" section with links to all comparison pages and the React/Next.js landing pages.
- **Lenis dist types** — `dist/lenis/index.d.ts` and `.d.mts` shipped so the `svg-scroll-draw/lenis` subpath resolves TypeScript types correctly without manual `paths` config.

---

## [2.8.0] — 2026-06-06

### Added

- **`scrollReveal`** (`svg-scroll-draw/reveal`) — one-line reveal animations. 7 presets (fadeUp/Down/Left/Right, scale, flip, flipX), custom `from` state (opacity, x, y, scale, rotate, rotateX, rotateY), `stagger`, `easing`, `onEnter`/`onLeave`. Drop-in replacement for AOS and ScrollReveal.js.
- **`velocityScale` on `scrollAnimate`** — scale animation speed by scroll velocity. Pass `true` (default sensitivity) or a number. Forces JS engine.
- **`ResizeObserver` on `scrollPin`** — auto-refresh pin dimensions when the element or document layout changes. No more manual `refresh()` calls on accordion/modal open.
- **19 new tests** — scrollReveal (15), velocityScale (4). Total: 407.
- **Blog post** — "Replace AOS / ScrollReveal.js" at `/blog/replace-aos-scrollreveal`.
- **Home page** — `scrollReveal` v2.8.0 card added to API grid (10 cards total).
- **Docs** — v2.8.0 nav group with `scrollReveal` and `velocityScale` sections. Docs version badge → v2.8.0.
- **MobileMenu** version badge → v2.8.0.

---

## [2.7.0] — 2026-06-06

### Added

- **Scroll callbacks** — `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` added to both `ScrollDrawOptions` and `ScrollAnimateOptions`. Fire when scroll position crosses the trigger zone boundary in either direction. Forces JS engine (disables native fast path).
- **`scrollPin`** (`svg-scroll-draw/pin`) — pin any element at a viewport position while the page scrolls past it. Wrapper-based layout (no layout shift). Supports `pinDistance`, `top`, `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack`, `onProgress`, `refresh()`.
- **`scrollSnap`** (`svg-scroll-draw/snap`) — JS-powered section snapping with custom easing, configurable threshold, `snapTo(index)`, `getCurrentIndex()`, and `onSnap` callback. Works on vertical and horizontal axes.
- **`createLenisAdapter`** (`svg-scroll-draw/lenis`) — Lenis v1 smooth-scroll adapter. Patches `window.scrollY` / `window.pageYOffset` with Lenis's virtual scroll value so all engines stay in sync. Lenis v2+ works out of the box without the adapter.
- **30 new tests** — `scrollCallbacks` (6), `scrollPin` (11), `scrollSnap` (7), `lenis` (6). Total: 388.
- **`/vs-gsap` comparison page** — bundle size bars, 20-row feature matrix, side-by-side API code for every major use case, license comparison, CTA.
- **Home page** — 3 new v2 API cards (`scrollPin`, `scrollSnap`, `onEnter/onLeave`). Grid is now 9 cards. Bundle chart links to `/vs-gsap`.
- **Blog post** — "Pin sections on scroll without GSAP — scrollPin" at `/blog/scroll-pin-without-gsap`.
- **`softwareVersion`** JSON-LD updated to 2.7.0. MobileMenu version badge updated to v2.7.0.

---

## [2.6.0] — 2026-06-05

### Added

- **Playground v2 tab** — new `v2 ✦` tab in the SVG Playground. Live interactive demos for three APIs:
  - `scrollAnimate`: 5 effect presets (Fade+Slide, Scale+Fade, Slide Left, Rotate In, Color Shift), 5 easings, scrubber, replay, live card preview.
  - `scrollText`: split mode picker (words/chars/lines), stagger slider, 3 from-presets (Fade Up, Rotate In, Scale), scrubber, dark-bg headline preview.
  - `scrollCounter`: 4 format presets (users, revenue, satisfaction, tests), scrubber, replay.
  - Each panel generates a copy-ready code snippet.
- **Blog post** — "Animate multiple elements on scroll — one call" at `/blog/scroll-animation-groups`. Covers all 5 group functions with real-world patterns.
- **README exports table** — updated `svg-scroll-draw/vue`, `/svelte`, `/solid`, `/angular`, `/astro`, `/nuxt`, `/group` rows to list all v2 exports.

### Fixed

- JSON-LD `softwareVersion` on home page corrected from `1.2.0` to `2.6.0`.

---

## [2.5.0] — 2026-06-05

### Added

- **`scrollParallaxGroup(targets, options)`** — fan-out `scrollParallax` across multiple elements simultaneously. Returns the same combined `destroy`/`replay`/`pause`/`resume`/`seek` instance as `scrollAnimateGroup`. Ships in `svg-scroll-draw/group`.
- **DocsPage Angular v2** — `ScrollAnimateRef`, `ScrollCounterRef`, `ScrollVideoRef`, `ScrollTextRef` with Angular `@ViewChild` component lifecycle examples.
- **DocsPage Nuxt v2** — `useScrollAnimate`, `useScrollText`, `useScrollCounter` composables, component wrappers, and `createScrollDrawPlugin`. Full parity with Vue/Svelte/Solid docs depth.
- **DocsPage Astro v2** — `initScrollAnimate`, `initScrollText`, `initScrollCounter`, `initAll` with complete data-attribute code examples.

### Fixed

- Desktop nav duplicate burger menu — `<MobileMenu />` was rendering on desktop on 7 pages (blog index, 5 blog posts, ExamplesPage). All now wrapped in `lg:hidden`.

---

## [2.4.0] — 2026-06-05

### Added — Angular/Astro/Nuxt v2 + scrollAnimateGroup + examples + blog

**Angular v2 wrappers** (`svg-scroll-draw/angular`)
- `ScrollAnimateRef` — class with `init(element, options)` / `replay()` / `pause()` / `resume()` / `seek()` / `destroy()`.
- `ScrollCounterRef` — same class API wrapping `scrollCounter`.
- `ScrollVideoRef` — same class API wrapping `scrollVideo` for `<video>` elements.
- `ScrollTextRef` — same class API wrapping `scrollText`.

**Astro v2** (`svg-scroll-draw/astro`)
- `initScrollAnimate(root?)` — finds all `[data-scroll-animate]` elements and initialises `createAnimateEngine` from the JSON in `data-scroll-animate-options`.
- `initScrollCounter(root?)` — same pattern for `[data-scroll-counter]`.
- `initScrollText(root?)` — same pattern for `[data-scroll-text]`.
- `initAll(root?)` — convenience that runs all four inits and returns `{ draw, animate, counter, text }`.

**Nuxt v2** (`svg-scroll-draw/nuxt`)
- Re-exports all v2 Vue composables: `useScrollAnimate`, `useScrollCounter`, `useScrollVideo`, `useScrollText`.
- Re-exports all v2 Vue components: `ScrollAnimate`, `ScrollCounter`, `ScrollVideo`, `ScrollText`.
- `createScrollDrawPlugin()` now globally registers all five components (`ScrollDraw` + v2 set).

**Group API** (`svg-scroll-draw/group`)
- `scrollAnimateGroup(targets, options)` — fan-out `scrollAnimate` across multiple elements simultaneously. Returns a combined instance with full `destroy`/`replay`/`pause`/`resume`/`seek` API.
- `scrollAnimateSequence(targets, options)` — chain `scrollAnimate` across elements in strict sequence.

**ExamplesPage**
- Product Video Scrub — `scrollVideo` concept with mock timeline, timestamp counter, saturation transition.
- Feature List Reveal — staggered `scrollAnimate` row-by-row entrance.
- Animate Group — `scrollAnimateGroup` fan-out of four v2 API cards.
- Header count updated to 17 examples.

**Blog**
- New post: "scrollAnimate in Vue 3, Svelte, and Solid.js — v2 framework guide" at `/blog/vue-svelte-solid-v2`. Composables, actions, hooks, component wrappers, real-world patterns (staggered card grid, marketing headline), Nuxt plugin, Astro data-attributes, summary table.

---

## [2.3.0] — 2026-06-05

### Added — v2 framework wrappers + interactive demo

**Vue 3 v2 composables** (`svg-scroll-draw/vue`)
- `useScrollAnimate(options)` — returns a ref; bind to any element to animate CSS props on scroll.
- `useScrollCounter(options)` — returns a ref; bind to a `<span>` or any element to count up on scroll.
- `useScrollVideo(options)` — returns a ref; bind to a `<video>` to scrub `currentTime` on scroll.
- `useScrollText(options)` — returns a ref; bind to any text element to split and stagger-animate on scroll.
- `<ScrollAnimate :options="...">` — convenience component; wraps children in a `<div>` and animates.
- `<ScrollCounter :to="..." ...>` — renders a `<span>` counter.
- `<ScrollVideo src="..." :options="...">` — renders a `<video>` scrubbed by scroll.
- `<ScrollText :options="..." tag="h2">` — renders any tag with text split and animated.

**Svelte v2 actions** (`svg-scroll-draw/svelte`)
- `scrollAnimate` — Svelte `use:` action for `createAnimateEngine`. `update()` reinitialises on option change.
- `scrollCounterAction` — Svelte action for `scrollCounter`.
- `scrollVideoAction` — Svelte action for `scrollVideo`.
- `scrollTextAction` — Svelte action for `scrollText`.
- `createScrollAnimate(options)` — returns `{ action, getInstance }` for imperative control.
- `createScrollCounter`, `createScrollVideo`, `createScrollText` — same pattern.

**Solid v2 hooks** (`svg-scroll-draw/solid`)
- `useScrollAnimate(options)` — returns ref setter for any element.
- `useScrollCounter(options)` — returns ref setter for a counter element.
- `useScrollVideo(options)` — returns ref setter for a `<video>` element.
- `useScrollText(options)` — returns ref setter for a text element.
- `createScrollAnimate`, `createScrollCounter`, `createScrollVideo`, `createScrollText` — return `{ ref, getInstance }` for imperative control.

**Demo site**
- `ScrollTextInteractive` — interactive home page section for `scrollText`: split mode picker (chars/words/lines), stagger slider (0–0.10), from-preset selector (Fade Up / Rotate In / Scale), scrubber, replay button, live code block.
- Changelog page: "v2 — The Platform Shift" visual callout separating v2.x and v1.x entries.
- DocsPage: new `v2.3.0` nav group with full usage docs for Vue 3 v2 composables/components, Svelte v2 actions, and Solid v2 hooks.
- FrameworkTabs: Vue 3, Svelte, and Solid tabs updated to showcase v2 API (`useScrollAnimate`, `scrollAnimate` action, `useScrollText`, etc.) alongside v1 comment.
- All version badges updated to v2.3.0.

---

## [2.2.0] — 2026-06-04 · **published**

### Added — v2 Phase 2 + Phase 3
- **`scrollVideo(target, options)`** — tie `<video>.currentTime` to scroll position. Ships as `svg-scroll-draw/video`. Supports `from`/`to` in seconds, `preload`, `onReady`, all lifecycle callbacks and instance methods. Auto-pauses on init, handles `loadedmetadata` lazily.
- **`scrollText(target, options)`** — split text into `chars`, `words`, or `lines` and animate each unit on scroll with stagger. Ships as `svg-scroll-draw/text`. Free replacement for GSAP SplitText. Accessibility: `aria-label` on container, `aria-hidden` on spans, `destroy()` restores original HTML.
- **`devtools` overlay** — ships as `svg-scroll-draw/devtools`. Visual panel showing all active animation types (draw/animate/counter/video/text), progress bars, trigger lines, color-coded by type. `devtools.enable()`, `devtools.disable()`, `devtools.toggle()`, `devtools.highlight(el)`. `Cmd/Ctrl+Shift+S` keyboard shortcut. Dev-only — zero production bytes.
- **`ScrollVideo` React component** — `svg-scroll-draw/react` wrapper for `scrollVideo`.
- **`ScrollText` React component** — `svg-scroll-draw/react` wrapper for `scrollText`.
- **Global instance registry** (`src/core/registry.ts`) — all engines (animate, counter, video, text) self-register on init and unregister on destroy. DevTools reads the registry.
- **36 new tests** — `scrollVideo.test.ts` (17), `scrollText.test.ts` (19). 358 total.

### Demo site
- **v2 section on home page** — 6-card grid for scrollAnimate, scrollVideo, scrollCounter, scrollText, scrollParallax, DevTools with code snippets.
- **DocsPage v2.0–2.2 nav group** — full API docs for all 6 new APIs.
- **ExamplesPage** — 3 new v2 example cards: scrollAnimate fade/slide, scrollCounter stats, scrollText word reveal.
- **Blog post: "Replace GSAP ScrollTrigger with scrollAnimate"** — full migration guide with side-by-side code at `/blog/replace-gsap-scrolltrigger`.
- **Blog index** — now shows 5 posts.
- **Sitemap** — updated with new blog post.

---

## [2.0.0] — 2026-06-04

### Added — v2 APIs (Phase 1)
- **`scrollAnimate(target, options)`** — animate any CSS property on any DOM/SVG element driven by scroll. Supports `opacity`, `transform` (with multi-function interpolation), `color`, `background-color`, and any CSS property with numeric units. Native CSS `animation-timeline: view()` fast path when eligible. Same trigger, easing, `once`, `seek`, `pause`, `resume`, `replay`, `getProgress`, `destroy` API as `scrollDraw`.
- **`scrollCounter(target, options)`** — scroll-driven number counter. Animates a numeric value from `from` to `to` as the element scrolls into view. Supports custom `format` function, `decimals` shorthand, `once` (default true), and all lifecycle callbacks.
- **`scrollParallax(target, options)`** — move any element at a different rate than scroll. `speed` multiplier relative to element size (`0.3` = 30% of element height travel, `-0.2` = opposite direction). Thin wrapper over `scrollAnimate`.
- **`ScrollAnimate` React component** — `svg-scroll-draw/react` wrapper for `scrollAnimate`.
- **`ScrollCounter` React component** — `svg-scroll-draw/react` wrapper for `scrollCounter`.
- **50 new tests** — `scrollAnimate.test.ts` (30 tests), `scrollCounter.test.ts` (20 tests). 322 total.
- **`interpolateValue` export** — public utility for CSS value interpolation (numbers, colors, transforms, unit values).

### Breaking changes
None — all v1 APIs unchanged. v2 is purely additive.

---

## [1.8.0] — 2026-06-04

### Added
- **Changelog page** — v1.4.0 through v1.7.0 entries added; "Latest" tag updated to v1.7.0.
- **Examples page** — new Presets example card showing all 5 presets on the same SVG side by side. Count updated from 13 to 14.
- **Playground** — Preset shortcut dropdown at the top of the Motion tab. Selecting a preset instantly applies its option values (easing, stagger, speed, fade, once) to the current state.
- **Blog post: "5 scroll animation patterns in under 10 lines"** — `/blog/5-patterns-under-10-lines`. Covers all 5 presets with Vanilla JS + React code, use cases, and when-to-use guidance. Blog index now shows 4 posts.

### Notes
- No library changes in v1.8.0 — all changes are demo site only. Version bump optional.

---

## [1.7.0] — 2026-06-04

### Added
- **`loop` option for `scrollDrawTimeline`** — after the scroll-driven animation completes, automatically replay as a time-driven loop. `true` = loop infinitely, `number` = loop N additional times. Each iteration plays over `loopDuration` ms.
- **`loopDuration` option** — duration of each time-driven loop iteration in ms (default `1500`).
- **`preset` in docs** — `preset` option now documented in DocsPage Core Options section with link to Presets section.
- **Presets section in DocsPage** — all 5 presets documented with option sets and code example.
- **CLI section in DocsPage** — `npx svg-scroll-draw init` documented with framework-specific output descriptions.
- **README updates** — Presets section with table, CLI in Install section, `preset` in options table, timeline options table updated with `repeat`, `repeatDelay`, `loop`, `loopDuration`, `debug`, `label`. Test count updated to 272.
- **5 new loop tests** — 272 tests total.
- **`doReset()` fix** — now correctly resets `currentAlpha = 0` so `getProgress()` returns 0 after `replay()`.

### Notes
- Fully backward compatible — `loop` and `loopDuration` default to off/1500.

---

## [1.6.0] — 2026-06-04

### Added
- **`preset` option** — apply a named option bag as the base config. User options always override. Five presets:
  - `'sketch'` — staggered ease-in draw, pencil feel
  - `'reveal'` — fade + ease-out, draws once on viewport entry
  - `'typewriter'` — fast linear draw with stagger
  - `'cinematic'` — slow ease-in-out with fade, dramatic entrance
  - `'spring'` — spring easing, bouncy organic feel
  ```js
  scrollDraw('#logo', { preset: 'reveal' });
  scrollDraw('#logo', { preset: 'sketch', easing: 'ease-out' }); // easing overrides preset
  ```
- **`PRESETS` export** — the preset definitions are exported so you can inspect or extend them:
  ```js
  import { PRESETS } from 'svg-scroll-draw';
  console.log(PRESETS.reveal); // { easing: 'ease-out', fade: true, speed: 1.2, once: true }
  ```
- **CLI init tool** (`npx svg-scroll-draw init`) — interactive scaffolder that generates a starter file for your framework. Asks for framework (React/Vue/Svelte/Solid/Vanilla), preset, easing, and selector. Writes a ready-to-use component file.
- **5 new tests** for preset option — 267 tests total.
- **Blog post: "Scroll-driven SVG path morphing with morphTo"** — `/blog/scroll-path-morphing`. Covers path compatibility rules, use cases (icon transitions, data viz, blobs), combining with fade/strokeColor, limitations, and full API reference.

### Notes
- Fully backward compatible — `preset` defaults to undefined (no change in behaviour).

---

## [1.5.0] — 2026-06-04

### Added
- **`repeat` option for `scrollDrawTimeline`** — replay the timeline N times or `'infinite'` after it completes. Works with `once: true`: after completion + `repeatDelay` ms, all paths reset and the animation plays again on the next scroll-into-view.
  ```js
  scrollDrawTimeline('#diagram', {
    tracks: [...],
    once: true,
    repeat: 3,
    repeatDelay: 800,
  });
  ```
- **`repeatDelay` option for `scrollDrawTimeline`** — milliseconds to wait before each repeat (default `0`).
- **`debug` option for `scrollDrawTimeline`** — injects a fixed HUD panel into `document.body` showing each track's scroll window as a coloured progress bar, live fill, and global progress. Removed automatically on `destroy()`. Designed for tuning `from`/`to` values without guesswork.
  ```js
  scrollDrawTimeline('#diagram', {
    tracks: [...],
    debug: true,
    label: 'hero diagram',
  });
  ```
- **`label` option for `scrollDrawTimeline`** — string shown in the debug panel header. Defaults to the target selector.
- **8 new tests** covering `repeat` reset, `repeat` + `onComplete` multi-fire, timer cancellation on `destroy`, `replay()` resetting the repeat counter, debug overlay injection, and debug overlay removal. **262 tests total.**
- **Blog post: "Zero-JS SVG scroll animations with native CSS"** — `/blog/native-css-svg-scroll-animations`. Deep-dive on the `animation-timeline: view()` fast path: eligibility rules, browser support matrix, performance benefits, opt-out, and instance API.

### Notes
- Fully backward compatible — `repeat`, `repeatDelay`, `debug`, `label` all default to off/undefined.

---

## [1.4.0] — 2026-05-31

### Added
- **`Cinematic` class** — the runtime bridge for [Cinematic Studio](https://github.com/DhruvilChauahan0210/reel),
  the visual scroll-animation editor. Reads a `story.json` authored in the Studio and
  wires a scroll-scrubbed timeline with zero JavaScript on the author's side:

  ```js
  import { Cinematic } from "svg-scroll-draw";
  import story from "./story.json";
  new Cinematic({ wrapper: "#app" }).loadStory(story);
  ```
- **`loadStory(story)`** builds a sticky-stage scroll structure from the story, strokes
  each traced `draw` path on across its scroll range, and fades `fade` layers (the product
  photo) in. Honors `prefers-reduced-motion` by jumping to the finished frame, and only
  runs its rAF loop while the stage is on screen (IntersectionObserver-gated).
- **Cinematic Story protocol types** exported: `Story`, `StoryScene`, `StoryAnimation`,
  `DrawAnimation`, `FadeAnimation`, `StoryEasing`. New `svg-scroll-draw/cinematic` subpath
  for tree-shaken imports.
- **5 new tests** covering DOM construction, draw + fade scrubbing at a known scroll
  position, reduced-motion fallback, and observer lifecycle. **254 tests total.**

### Notes
- Fully backward compatible — purely additive. The existing `scrollDraw` API is untouched.

---

## [1.3.0] — 2026-05-30

### Added
- **`autoplay` option** (`boolean`, default `false`) — trigger the animation when the
  element enters the viewport instead of tying it to scroll position. The draw runs over
  `duration` milliseconds and replays each time the element re-enters the viewport. Use
  `once: true` to play only the first time.
- **`duration` option** (`number`, default `1000`) — animation duration in milliseconds,
  used only when `autoplay: true`.
- All existing visual options work in autoplay mode: `easing`, `stagger`, `fade`,
  `strokeColor`, `strokeWidth`, `fillOpacity`, `clip`, `morphTo`, `waypoints`, `repeat`,
  `repeatDelay`, `onStart`, `onComplete`, `onProgress`, `direction`.
- The full instance API works in autoplay mode — `pause` / `resume` freeze/unfreeze
  elapsed time; `seek(0–1)` jumps to a fraction of `duration`; `replay` restarts from 0.
- **8 new tests** covering autoplay draw, `onStart`, `onComplete`, `seek`, `replay`,
  `destroy`, clip mode, and `once`. **249 tests total.**

### Notes
- Fully backward compatible — `autoplay` defaults to `false`, existing scroll-driven
  code is unchanged.

---

## [1.1.0] — 2026-05-30

### Added
- **Native CSS scroll-driven rendering** — when the browser supports
  [`animation-timeline: view()`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)
  and the config is simple (default trigger, named easing, optional `fade`, forward or
  reverse), the draw now runs on the compositor with **zero per-frame JavaScript and no
  scroll/resize listeners**. The full instance API (`pause`, `resume`, `seek`, `replay`,
  `getProgress`, `destroy`) works on both the native and JS paths.
- **`native` option** (`boolean`, default `true`) — set `false` to always use the JS
  engine. When `true`, the JS engine is still used automatically for any config CSS
  can't express declaratively (callbacks, `stagger`, `morphTo`, `velocityScale`,
  `autoReverse`, `once`, `repeat`, custom trigger/scroll-container, `speed ≠ 1`,
  custom-function or `spring` easing, animated color/width/fill).
- **27 new tests** (`engine-native.test.ts`) covering native activation, automatic
  fallback for every non-eligible config, the unsupported-browser path, and the
  instance API on the native path. **221 tests total.**

### Changed
- Documentation now reports the accurate **~4.4 KB gzipped** core size (the engine has
  grown well beyond the original ~3 KB with morph, clip, velocity, waypoints, timeline,
  and group features). Still 8–9× smaller than Framer Motion or GSAP DrawSVG.

### Notes
- Fully backward compatible — existing code keeps working unchanged, and behavior is
  identical in browsers without native `animation-timeline` support.

---

## [1.0.0] — 2026-05-28

First stable release. The public API is now considered stable — no breaking changes
will be made without a major version bump.

### Added
- **`scrollDrawSequence` bug fix** — engines are now all created upfront and paused;
  later steps no longer read the wrong scroll position when chained. `activeIdx`
  now tracks correctly so `pause()`, `resume()`, `seek()`, and `getProgress()`
  always target the currently active step.
- **194 passing tests** across 6 test suites — engine, engine-options, group,
  timeline, framework wrappers (Angular, Astro, Svelte, Solid), and utilities.
- **Framework wrapper tests** — Angular `ScrollDrawRef`, Astro `initScrollDraw`,
  Svelte `scrollDraw` action + `createScrollDraw`, Solid `useScrollDraw` +
  `createScrollDraw` all now have dedicated test coverage.
- **Root workspace test runner** — `npx vitest run` from the repo root now works
  correctly via `vitest.workspace.ts`, picking up all packages with the right jsdom
  environment.

### Improved
- **Coverage** — lines 94.98%, functions 95.23%, branches 82.94%; all thresholds pass.
- **JSDoc** — `clip`, `morphTo`, and `scrollDrawSequence` now document their
  non-obvious edge cases inline (clip:true maps to 'left', morphTo silently no-ops
  on non-path elements, sequence forces once:true per step).

---

## [0.6.2] — 2026

### Added
- **`fillOpacity`** — animate fill opacity in sync with the stroke draw. Single number = static override; `[from, to]` tuple = interpolate as the path draws. Use `fillOpacity={[0, 1]}` to flood a shape's fill in as its outline traces itself — no `onComplete` hack needed.
- **`useScrollDrawProgress` hook (React)** — returns a reactive `number` (0–1) representing scroll progress for any element. Same `trigger` / `speed` / `easing` / `axis` / `scrollContainer` / `once` options as `ScrollDraw`. Use it to drive any animation alongside or independent of an SVG draw.
- **`svg-scroll-draw/web-component`** export — `<scroll-draw>` custom element now importable directly; previously only available via CDN.

---

## [0.6.0] — 2025

### Added
- **Pause / Resume / Seek** — imperative API to programmatically control animation state
- **Path Morphing** (`morphTo`) — interpolate a path's `d` attribute from its original shape to a target shape as you scroll
- **Velocity Scale** (`velocityScale`) — draw speed scales with how fast the user scrolls
- **Repeat** (`repeat`, `repeatDelay`) — replay the animation N times or loop it infinitely
- **Astro adapter** (`svg-scroll-draw/astro`) — data-attribute API with `initScrollDraw()`, no JS imports in markup
- **Nuxt adapter** (`svg-scroll-draw/nuxt`) — `useScrollDraw()` composable for Nuxt 3
- **Group API** (`svg-scroll-draw/group`) — `scrollDrawGroup` and `scrollDrawSequence` for animating multiple SVG containers simultaneously or in sequence
- **Web Component** (`svg-scroll-draw/web-component`) — `<scroll-draw>` custom element, auto-registers via CDN or import

---

## [0.5.0]

### Added
- Internal refactor preparing adapters for Astro, Nuxt, and Group API

---

## [0.4.0]

### Added
- **SolidJS adapter** (`svg-scroll-draw/solid`) — `useScrollDraw` hook
- **Angular adapter** (`svg-scroll-draw/angular`) — `ScrollDrawRef` class for `AfterViewInit` pattern
- **Color animation** (`strokeColor`) — static override or `[from, to]` tuple to animate stroke color as the path draws
- **Width animation** (`strokeWidth`) — static override or `[from, to]` tuple to animate stroke width as the path draws
- **Auto Reverse** (`autoReverse`) — animation follows scroll direction, reversing when the user scrolls back up
- **Custom scroll container** (`scrollContainer`) — target a specific scrollable element instead of the window
- **Waypoints** — fire callbacks at specific scroll progress thresholds (0–1)
- **Delay** (`delay`) — milliseconds to wait before the engine starts observing

---

## [0.3.0]

### Added
- **Svelte adapter** (`svg-scroll-draw/svelte`) — `use:scrollDraw` action
- **Horizontal scroll** (`axis: "x"`) — track horizontal scroll containers
- **Replay API** — `instance.replay()` to re-trigger the animation imperatively
- **Spring easing** — physics-based overshoot-and-settle curve
- **Once mode** (`once`) — draw once and stay drawn
- **Debug overlay** (`debug`) — visualizes trigger start/end zones in development
- **`onStart` lifecycle hook** — fires on the first animation frame

---

## [0.2.1]

### Fixed
- OpenGraph and Twitter preview card image URLs

---

## [0.2.0]

### Added
- **Vue 3 adapter** (`svg-scroll-draw/vue`) — `<ScrollDraw>` component and `useScrollDraw` composable
- SVG Playground at `/playground` — paste any SVG and tweak all options live
- Live GitHub / npm stats section on the demo site
- Interactive demo component with easing and speed controls

---

## [0.1.0] — Initial release

### Added
- Core scroll-draw engine — `stroke-dashoffset` animation driven by `IntersectionObserver` + `requestAnimationFrame`
- Zero dependencies, ~3 KB gzipped
- **React / Next.js adapter** (`svg-scroll-draw/react`) — `<ScrollDraw>` wrapper component
- Vanilla JS API — `scrollDraw(selector, options)`
- CDN build — global `SvgScrollDraw` with `<scroll-draw>` web component auto-registration
- Options: `selector`, `speed`, `fade`, `easing` (linear, ease-in, ease-out, ease-in-out), `stagger`, `direction`, `once`, `debug`, `axis`, `scrollContainer`, `threshold`, `rootMargin`
- Lifecycle hooks: `onStart`, `onProgress`, `onComplete`
- Trigger control: `trigger.start`, `trigger.end`
- SSR-safe (no `window` access during server render)
- 56 passing tests
