# Project Status — svg-scroll-draw

> Current version: **2.16.1** — committed, waiting for the `v2.16.1` tag (2.16.0 is on npm, published with provenance through `release.yml` on 2026-11-01)
> Tests: **642 unit** across 33 suites · **198 browser tests** per engine (594 runs
> across Chromium/Firefox/WebKit) · **56 mutations**, each caught by the one test
> named for it · **91.3% line coverage** (gate 90/90/82/82)
> Bundle: **10.7 KB gzipped** (main entry as shipped files, chunks included; per-API entries from 0.2 KB) · zero runtime dependencies
> Last updated: 2026-11-01

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
- [x] 642 tests across 33 suites — `directives` (the built files' "use client"), `engine`, `engine-options`, `engine-native`, `css-easing`, `ssr` (no DOM at all), `group`, `timeline`, `framework`, `cinematic`, `utils`, `scrollAnimate` (30), `scrollCounter` (20), `scrollVideo` (17), `scrollText` (23)
- [x] Initial state fix — `createAnimateEngine` and `scrollCounter` now apply correct alpha immediately on init (no flash before IO fires)

### Browser tests (Phase 2, `packages/svg-scroll-draw/e2e`)
198 browser tests per engine, run on Chromium, Firefox and WebKit. Shared harness:
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
- [x] `cdn` — both CDN builds loaded from a plain `<script src>`: the production one exposes the API, registers `<scroll-draw>` and says nothing; the dev one reports the same mistakes the production build hides, and does not mistake a stroke set from CSS for a missing one
- [x] `scripts/mutation-check.mjs` — 56 one-line source mutations, each required to fail the single test named for it
- [x] `scripts/make-fixture-video.mjs` — reproducible 4s scrub clip, no system tooling needed

### Browser tests still missing
Nothing. Every entry point the package exports is exercised in Chromium, Firefox
and WebKit, and `src/__tests__/ssr.test.ts` covers all of them again with no DOM
at all.

---

## Demo App (`apps/demo`)

### Pages
- [x] `/` — redesigned (branch `feat/homepage-redesign`): every drawing a real use case, inked by scroll over a pencil underdrawing — an exploded fountain-pen hero that assembles on scroll, use-case gallery, watch-movement blueprint, red-pen proof sheet, GSAP weighed on a balance, eight API blueprint plates on a sideways rail, browser-test gauges + size-budget meter, framework circuit board, before / after browser windows for the drop-ins, live GitHub + npm numbers with a 30-day download line, engineering-sheet footer; dark default, ink-on-paper light
- [x] `/docs` — in the homepage's design via `SiteShell`: glass nav with the section marked, an opening with the version / weight / test cells beside fig. 1 (a real `scrollDraw()` call with a leader from each part to its section), zone references and title-block strips per section, a parts-list sidebar in page order that follows the reader one row at a time, gliding in-page links, a parts-list install table, spec-sheet options under inked dimension lines, numbered code listings, the sign-off sheet as footer
- [x] `/examples` + each example's page — same frame: split opening with filter pills and figure cells, a title-block strip per example (number, APIs, frameworks), numbered listings beside live previews mounted as captioned, pinned plates; related examples as a parts list
- [x] `/examples` previews redrawn — all 23 in the homepage's ink (pencil underdrawing, one accent, real values); the page is a catalogue grid of plates with a code drawer per example
- [x] Showcase sites, one per example (all 23), linked from its card and page — `/showcase/<slug>` for Ferrow, Ledgerline, Quillmark, Hearth & Field, Parcelry, Northbeam, Fieldnotes, Halyard, Relay, Tidewater, Stride, Paygrid status (`statusline`), Linework, Shipyard, Tessera, Greenline, Mint & Co (`mintco`), Plugboard, Atelier Nord (`ateliernord`), Folio, Lumen, Casa Verde (`casaverde`), Aural; registry in `src/showcase/index.ts`, card copy in `components/examples/scenes/data.ts`
- [x] `/blog` + all 12 posts — in the homepage's design: an index with a topic key drawn to scale that doubles as the filter and a numbered register of posts; every post on one article frame (`components/blog/BlogArticle.tsx`, `blog.css`) with figures that depict the post's real subject
- [x] `/changelog`, `/blocks`, `/playground`, `/verify` — moved into `SiteShell` with their own openings in the drawing-sheet language (release log as title-block strips, blocks as plates with install commands, playground controls kept working, verify's proofs as records)
- [x] `/vs-*` (7), the six framework landings and the React / Next.js / Lenis landings — moved into `SiteShell`; measured numbers drawn as comparisons, every figure read from `data/competitors.ts` / `data/facts.ts`
- [x] `/guides` + each guide — index as a parts list with measured before/after weights; each guide opens beside fig. 1 (the swap: import, version, licence, gzip, React hook, arrows inked on load), then notes, steps on an inked rail, a checked unchanged list, numbered questions, more guides, sticky contents
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
- [x] Bundle size claim corrected to the measured figure — the README had advertised `~4.4 KB` against 8.9 KB real. Now derived: `check-claims` fails the build when the advertised size and `dist/index.mjs` disagree
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

### Unreleased — migration guides (branch `feat/migration-guides`, 2026-10-31; site-only)
- [x] `/guides` + 4 guides (AOS Next.js, AOS React, ScrollReveal React, vivus React), sitemap, nav, vs-page and README links

### Unreleased — site cleanup (2026-11-01; site-only)
- [x] `/guides/gsap-scrolltrigger-react` — the fifth guide; `/vs-gsap`, `/guides`, playground, `llms.txt` and README link it
- [x] `/verify` section 15 (named-easing parity) wired in; sweeps jump instantly; limits list brought up to date
- [x] 22 sentences no longer run words together (SWC + entity); `check-jsx-text` in build, CI and `verify`
- [x] 32 dead files removed (~4,900 lines), mascot and its CSS included; 404 page in `SiteShell`
- [x] Demo lint 52 → 0, enforced with `--max-warnings=0`
- [x] `/docs`: jump-scroll asymmetry documented; Note boxes fixed
- [x] Navigation: nav "More" menu, phone-menu groups and a footer index from one list (`components/site/sitemap.ts`); no page more than two clicks from the homepage; `check-nav` in build, CI and `verify`
- [x] `/nextjs-scroll-animation`: complete App Router example, Pages Router note, 6-question FAQ (+ FAQPage); linked from the homepage strip, docs and the 2026 guide
- [x] Structured data: `WebSite` on home, `BreadcrumbList` on every other page (`SiteShell` `crumbs`), page data on React, Next.js, /blog, /guides
- [x] Homepage finale: a star constructed by compass and scroll (`components/home/Finale.tsx`), one stroke at a time, live star count; sign-off star button; `/api/stars` (ISR, hourly)
- [x] Share cards on all 64 indexable pages, one renderer (`app/_lib/og.tsx`) in the site's design; figures from `data/`
- [x] Search titles and descriptions rewritten for `/docs`, `/vs-locomotive-scroll`, `/lenis-scroll-animation`, `/blog/scroll-pin-without-gsap` (page-one rankings, near-zero clicks)
- [x] Sitemap `lastModified` from git for all 64 URLs, generated groups included (`npm run sitemap:dates`)

### 2.16.1 — Server Components render the components (2026-11-04)

- [x] `"use client"` on `svg-scroll-draw/react` (post-build, never on shared chunks); `directives.test.ts` reads dist; the demo renders `<ScrollDraw>` from a Server Component so `next build` guards it
- [x] Mutation anchors `reveal/stagger`, `video/scrub`, `video/direction` re-pointed; all 56 run
- [ ] Released — tag `v2.16.1`

### 2.16.0 — shared ESM chunks (2026-11-01)

- [x] One ESM build with code splitting; CJS, CDN and CLI builds unchanged; published paths and `exports` unchanged
- [x] Drop-ins and their React hooks share one instance under ESM (`AOS.refresh()` reaches `useAOS`'s instance)
- [x] `size.mjs` counts each entry's file plus the chunks it imports (`scripts/bundle-size.mjs`, shared with check-claims); main + react budgeted
- [x] README size tables generated (`npm run size -- --write`) and checked; root `npm run size` forwards its arguments
- [x] 632 unit · 609 browser runs (198 per engine + 15 firefox-native) · every export loads through `require()` and `import()`
- [x] Released — tag `v2.16.0` on `fde9f4c`, published by `release.yml` with provenance

### 2.15.3 — scrollReveal's stagger (2026-11-01)

- [x] `scrollReveal` `stagger` is a fraction of the reveal window, counted per row from the layout, capped at one window, and applied on top of a custom `trigger` (default 0.15); `reveal` entry 4.7 KB
- [x] Six unit tests on the per-element trigger windows; e2e cascade at the default stagger with a visible step, plus a custom-trigger row (both fail on 2.15.2)
- [x] `native` option JSDoc no longer claims the compositor
- [x] Released — tag `v2.15.3` on `acc9acc`, published by `release.yml` with provenance

### 2.15.2 — scrollVideo keeps its end frame under reduced motion (2026-11-01)

- [x] `scrollVideo` keeps its last frame under reduced motion once the clip scrolls into view (e2e case fails on 2.15.1)
- [x] Released — tag `v2.15.2` on `32f3409`, published by `release.yml` with provenance

### 2.15.1 — the "no stroke" warning reads CSS (2026-10-31)

- [x] Dev check reads the computed stroke, so CSS-stroked paths no longer warn; skipped in production builds
- [x] Unit tests for CSS class, CSS `stroke: none` and CSS-cancelled fill; browser test in all three engines
- [x] Released as 2.15.1

### 2.15.0 — React hooks for the drop-ins (branch `feat/drop-in-react-hooks`, 2026-10-31)
- [x] `svg-scroll-draw/aos/react` (`useAOS`, `AOSInit`), `/scrollreveal/react` (`useScrollReveal`), `/vivus/react` (`useVivus`), all `"use client"`
- [x] StrictMode + route-change e2e in three engines; real Next.js 16 App Router build and run
- [x] Released as 2.15.0

### Drop-in starters (branch `feat/drop-in-starters`, 2026-10-31; site-only, live on main)
- [x] `examples/aos`, `examples/scrollreveal`, `examples/vivus` (StackBlitz), linked from the comparison pages and READMEs
- [x] Each installed from npm (2.14.0), built and checked in Chromium with no errors

### 2.14.0 — migrate CLI (branch `feat/migrate-cli`, 2026-10-31)
- [x] `npx svg-scroll-draw migrate` (imports, CDN tags, aos.css, package.json; `--dry-run`, git-dirty guard)
- [x] 17 unit tests; real Vite apps migrated, installed and built; CDN page loads with no errors
- [x] Released as 2.14.0

### 2.13.0 — vivus drop-in (branch `feat/vivus-dropin`, 2026-10-31)
- [x] `svg-scroll-draw/vivus` + `dist/cdn/vivus.global.js` (3.9 KB gzip, budgets 4.2)
- [x] Exact SVG-markup parity with vivus 0.4.6 in three engines; 13 unit tests; SSR import
- [x] Docs: both READMEs, new `/vs-vivus` page, llms.txt, agent skill
- [x] Released as 2.13.0

### 2.12.0 — ScrollReveal drop-in (branch `feat/scrollreveal-dropin`, 2026-10-31)
- [x] `svg-scroll-draw/scrollreveal` + `dist/cdn/scrollreveal.global.js` (4.5 KB gzip, budgets 4.9)
- [x] Byte-for-byte inline-style parity with ScrollReveal 4.0.9 in three engines; 17 unit tests; SSR import
- [x] Docs: both READMEs, `/vs-aos` ScrollReveal section, llms.txt, agent skill
- [x] Released as 2.12.0

### 2.11.0 — AOS drop-in (branch `feat/aos-dropin`, 2026-10-30)
- [x] `svg-scroll-draw/aos` + `dist/cdn/aos.global.js` (3.0 / 3.1 KB gzip, budgets 3.2 / 3.4)
- [x] Side-by-side e2e parity with AOS 2.3.4 in three engines; 25 unit tests; SSR import
- [x] Docs: both READMEs, `/vs-aos` "switch in one line" section, llms.txt, agent skill
- [x] Released as 2.11.0

### 2.10.2 — reach pass (branch `feat/day2-reach`, 2026-10-30)
- [x] `/blocks` + shadcn registry (5 blocks), agent skill in `skills/`
- [x] Titles ≤ 60 chars site-wide, `/vs-gsap` table up top, 2025 guide → 2026 with redirect
- [x] Types fixed for ESM/node10 (`attw` clean); `scrollVideo` no longer re-seeks every frame; `<scroll-draw once>` works
- [x] `firefox-native` e2e project; release job can create the GitHub release
- [x] Released as 2.10.2

### 2.10.1 — trust pass (branch `fix/day1-trust`, 2026-10-30)
- [x] devtools registry shared across entries via `globalThis`; scrollDraw, scrollAnimate native, scrollSnap, timeline and Cinematic register
- [x] npm README and site claims corrected (SplitText, 9×, 95%, per-entry sizes, Firefox 159 / Safari 26)
- [x] `check-claims` scans the npm README, all demo source, llms.txt and launch drafts; per-entry sizes and banned claims
- [x] StackBlitz starters in `examples/`, GIF + keywords on the npm README
- [x] GitHub topics set
- [x] GitHub repo homepage and description set
- [x] `NPM_TOKEN` added; `v2.10.1` published by the workflow with a signed provenance statement
- [ ] GitHub release for `v2.10.1` — the job had `contents: read` and got a 403 after publishing; fixed for the next tag, create this one by hand
- [x] Native path measured on Gecko via the `firefox-native` e2e project (pref on, Playwright Firefox 153)

- [x] **Published v2.7.0 to npm**

### Demo Site (post-publish)
- [x] Docs page v2.7.0 nav group — `scrollPin`, `scrollSnap`, Scroll Callbacks, Lenis Adapter with full option tables
- [x] scrollAnimate docs table updated with 4 new callback options
- [x] Docs version badge → v2.7.0
- [x] Examples page — `scrollPin` (sticky feature panel) + `scrollSnap` (horizontal carousel) live demos
- [x] Examples page EXAMPLE_FRAMEWORKS updated
