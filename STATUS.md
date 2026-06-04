# Project Status — svg-scroll-draw

> Current version: **1.6.0** (not yet published — bump `packages/svg-scroll-draw/package.json` before next npm publish)
> Tests: **267 passing** across 8 test suites
> Last updated: 2026-06-04

---

## Core Library (`packages/svg-scroll-draw`)

### Architecture
- [x] Directory structure — `src/core/`, `src/react/`, `src/vue/`, `src/svelte/`, `src/solid/`, `src/angular/`, `src/astro/`, `src/nuxt/`, `src/web-component/`, `src/group/`, `src/timeline/`, `src/cinematic/`
- [x] TypeScript interfaces — `ScrollDrawOptions`, `ScrollDrawInstance`, `TriggerConfig`, `EasingName`, `Story`, `StoryScene`, `StoryAnimation`
- [x] Pure utility functions in `src/core/utils.ts` — easing, math, trigger parsing, color interpolation, `getElementLength`
- [x] Core engine in `src/core/engine.ts` — handles both scroll-driven and autoplay modes, native CSS fast path, clip-path mode

### Base Options API
- [x] `selector` — custom path selector (default: `path, polyline, line, polygon, rect, circle`)
- [x] `speed` — animation scale factor
- [x] `fade` — opacity fade-in while drawing
- [x] `easing` — `linear`, `ease-in`, `ease-out`, `ease-in-out`, `spring`, `bounce`, `elastic`, custom function; factory fns `createSpring`, `createBounce`, `createElastic`
- [x] `trigger.start` / `trigger.end` — viewport anchor strings + percentage format
- [x] `stagger` — offset between each path starting (scroll fraction or duration fraction)
- [x] `direction` — `'forward'` | `'reverse'`
- [x] `once` — lock animation when complete
- [x] `debug` — visualize trigger zones in development
- [x] `axis` — `'x'` | `'y'` (horizontal scroll support)
- [x] `scrollContainer` — custom scrollable element
- [x] `threshold` / `rootMargin` — IntersectionObserver config
- [x] `delay` — ms before engine starts observing
- [x] `autoReverse` — follow scroll direction, reverse on scroll up

### Advanced Options API
- [x] `strokeColor` — static override or `[from, to]` tuple for animated color
- [x] `strokeWidth` — static override or `[from, to]` tuple
- [x] `fillOpacity` — static override or `[from, to]` to flood fill as path draws
- [x] `clip` — clip-path reveal mode: `true` | `'left'` | `'right'` | `'top'` | `'bottom'` | `'center'`
- [x] `morphTo` — interpolate `d` attribute from original to target shape
- [x] `velocityScale` — draw speed scales with scroll velocity
- [x] `repeat` / `repeatDelay` — replay N times or `'infinite'`
- [x] `waypoints` — fire callbacks at specific progress thresholds (0–1)
- [x] `autoplay` — viewport-enter trigger instead of scroll
- [x] `duration` — ms for autoplay mode
- [x] `native` — opt in/out of native CSS `animation-timeline: view()` fast path

### Lifecycle Callbacks
- [x] `onStart` — fires on first animation frame
- [x] `onProgress(alpha)` — fires every frame with current 0–1 value
- [x] `onComplete` — fires when alpha reaches 1.0

### Instance API
- [x] `destroy()` — cleans up observer, rAF, listeners, timers
- [x] `replay()` — re-triggers the animation imperatively
- [x] `pause()` / `resume()` — freeze/unfreeze elapsed time
- [x] `seek(0–1)` — jump to a fraction of the animation
- [x] `getProgress()` — returns current alpha

### Performance & Correctness
- [x] Native CSS fast path — compositor-level animation when `animation-timeline: view()` is supported; automatic JS fallback for ineligible configs
- [x] IntersectionObserver visibility culling — rAF only runs when element is on screen
- [x] `requestAnimationFrame` wrapping — 60/120Hz sync
- [x] 150ms debounced resize handler — recomputes lengths and triggers on layout change
- [x] SSR-safe — `typeof window === 'undefined'` guards throughout

### rect + circle Support
- [x] Default selector includes `rect, circle`
- [x] `getElementLength` handles `SVGRectElement` and `SVGCircleElement` via perimeter math (no `getTotalLength` needed)

### Bundle Size
- [x] Zero runtime dependencies
- [x] Tree-shakeable ESM output
- [x] Core: **~4.4 KB gzipped**
- [x] ESM (`.mjs`) + CJS (`.cjs`) + IIFE CDN (`dist/cdn/svg-scroll-draw.global.js`, `window.SvgScrollDraw`)

---

## Framework Wrappers

- [x] **React** (`svg-scroll-draw/react`) — `<ScrollDraw>` component, `useScrollDrawProgress` hook
- [x] **Vue 3** (`svg-scroll-draw/vue`) — `<ScrollDraw>` component, `useScrollDraw` composable
- [x] **Svelte** (`svg-scroll-draw/svelte`) — `use:scrollDraw` action, `createScrollDraw` helper
- [x] **Solid** (`svg-scroll-draw/solid`) — `useScrollDraw` hook, `createScrollDraw`
- [x] **Angular** (`svg-scroll-draw/angular`) — `ScrollDrawRef` class for `AfterViewInit` pattern
- [x] **Astro** (`svg-scroll-draw/astro`) — `initScrollDraw()` with data-attribute API, no JS in markup
- [x] **Nuxt** (`svg-scroll-draw/nuxt`) — `useScrollDraw()` composable for Nuxt 3
- [x] **Web Component** (`svg-scroll-draw/web-component`) — `<scroll-draw>` custom element, works from CDN

---

## Advanced APIs

- [x] **Group API** (`svg-scroll-draw/group`) — `scrollDrawGroup` (parallel), `scrollDrawSequence` (chained)
- [x] **Timeline API** (`svg-scroll-draw/timeline`) — `scrollDrawTimeline` with independent per-element scroll windows; `repeat`, `repeatDelay`, `debug`, `label` options
- [x] **Cinematic API** (`svg-scroll-draw/cinematic`) — `Cinematic` class; reads a `story.json` from Cinematic Studio and builds a sticky-stage scroll timeline with zero JS on the author's side

---

## Testing

- [x] jsdom environment via Vitest
- [x] `engine.test.ts` — core scroll-draw lifecycle (24 tests)
- [x] `engine-options.test.ts` — every option + edge case (57 tests)
- [x] `engine-native.test.ts` — native CSS path, fallback conditions, instance API (27 tests)
- [x] `group.test.ts` — group + sequence APIs (27 tests)
- [x] `timeline.test.ts` — timeline API (20 tests)
- [x] `framework.test.ts` — Angular, Astro, Svelte, Solid wrappers (33 tests)
- [x] `cinematic.test.ts` — Cinematic DOM construction, scrubbing, reduced-motion, observer (5 tests)
- [x] `utils.test.ts` — easing, math, trigger parsing, color interpolation
- [x] **254 tests total, all passing**

---

## Demo App (`apps/demo`)

### Pages
- [x] `/` — home: hero, 15+ scroll demos, API reference table, framework quickstart tabs, bundle comparison, live stats
- [x] `/examples` — 13 production examples with framework filter pill strip (All / React / Vue 3 / Svelte / Solid / Vanilla / API)
- [x] `/docs` — full API reference with every option, type, and example
- [x] `/playground` — interactive SVG editor; paste any SVG and tweak options live
- [x] `/changelog` — version history page
- [x] `/blog/gsap-drawsvg-alternative` — SEO comparison post with code side-by-side, feature matrix, migration guide

### Components
- [x] `CopyButton.tsx` — clipboard copy with 2s feedback, in all code blocks
- [x] `InstallTabs.tsx` — npm / pnpm / yarn / bun / CDN tabbed install block
- [x] `FrameworkTabs.tsx` — React / Vue / Svelte / Solid / Vanilla quickstart tabs
- [x] `InteractiveScrollDemo.tsx` — live easing toggles, speed slider, replay button
- [x] `AutoplayDemo.tsx` — viewport-enter animation demo
- [x] `OnCompleteDemo.tsx` — `onComplete` with amber badge + pulse
- [x] `WaypointsDemo.tsx` — waypoints callback demo
- [x] `ProgressHookDemo.tsx` — `useScrollDrawProgress` hook demo
- [x] `FillOpacityDemo.tsx` — fill opacity flood demo
- [x] `ClipModeDemo.tsx` — clip-path reveal demo
- [x] `SvgPlayground.tsx` — full interactive editor with Monaco/textarea, live preview
- [x] `ThemeToggle.tsx` — dark/light mode, FOUC-prevention script
- [x] `NativeCSSBadge.tsx` — detects browser support for `animation-timeline: view()`
- [x] `LiveStats.tsx` — live npm downloads + GitHub stars
- [x] `ScrollShowcase.tsx` — hero scroll animation section
- [x] `Mascot.tsx` — animated mascot character

### SEO & Infrastructure
- [x] OG images for all pages (`/`, `/playground`, `/changelog`, `/blog/gsap-drawsvg-alternative`)
- [x] `sitemap.ts` — static route generation
- [x] `robots.ts`
- [x] YAML front matter in `launch/devto-article.md`

---

## Remaining

- [x] `/blog` index page — `apps/demo/src/app/blog/page.tsx` exists with post listing
- [x] "Blog" in all nav instances — homepage, docs, examples, changelog, mobile menu; version badge updated to v1.4.0 everywhere
- [x] Timeline scrub bar — `TimelineDemo` in `ExamplesPage.tsx` now shows per-track progress bars + global scroll position live
- [x] More demo examples — 13 examples including logo reveal, line chart, signature, flowchart, map route, network diagram, group, sequence, timeline, Vue, Svelte, Solid
- [x] Blog post: "Zero-JS SVG scroll animations with native CSS" — `/blog/native-css-svg-scroll-animations`
- [x] `preset` option — 5 named presets (sketch, reveal, typewriter, cinematic, spring); `PRESETS` exported
- [x] CLI init tool — `npx svg-scroll-draw init` scaffolds starter files for all frameworks
- [x] Blog post: "Scroll-driven path morphing with morphTo" — `/blog/scroll-path-morphing`
- [ ] npm publish v1.6.0 — bump `packages/svg-scroll-draw/package.json` then `npm publish --access public`
