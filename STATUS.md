# Project Status — svg-scroll-draw

> Current version: **2.25.0** staged on `feat/frames-wrappers-bench` (not tagged); npm `latest` is **2.24.0** (`v2.24.0` on `b43237b`)
> Tests: **1009 unit** across 43 suites · **337 browser tests** per engine (1011 runs
> across Chromium/Firefox/WebKit) · **161 mutations**, each caught by the one test
> named for it · **91.5% line coverage** (gate 90/90/82/82)
> Bundle: **11.9 KB gzipped** (main entry as shipped files, chunks included; per-API entries from 0.2 KB) · zero runtime dependencies
> Last updated: 2026-11-13

---

## Core Library (`packages/svg-scroll-draw`)

### Architecture
- [x] `src/core/` — engine, types, utils, presets, registry
- [x] `src/animate/` — `scrollAnimate`, `scrollParallax`, value interpolation
- [x] `src/counter/` — `scrollCounter`
- [x] `src/video/` — `scrollVideo`
- [x] `src/frames/` — `scrollFrames` (2.24.0); `<ScrollFrames>` in React and Vue, `useScrollFrames` in Vue (2.25.0)
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
- [x] 1009 tests across 43 suites — `motionLive` (reduced motion turned on mid-visit, every engine and the React hook), `reactive` (the wrappers' option fingerprint and live callbacks), `directives` (the built files' "use client"), `engine`, `engine-options`, `engine-native`, `css-easing`, `ssr` (no DOM at all), `group`, `timeline`, `framework`, `cinematic`, `utils`, `scrollAnimate` (30), `scrollCounter` (20), `scrollVideo` (17), `scrollFrames` (47), `scrollFramesWrappers` (48), `scrollText` (23)
- [x] Initial state fix — `createAnimateEngine` and `scrollCounter` now apply correct alpha immediately on init (no flash before IO fires)

### Browser tests (Phase 2, `packages/svg-scroll-draw/e2e`)
337 browser tests per engine, run on Chromium, Firefox and WebKit. Shared harness:
`helpers.ts` (deterministic sweep — scroll to a fixed offset, wait two frames,
read) and `fixtures/_probe.mjs` (parsing stays in the page, so specs assert on
numbers).

- [x] `parity` — native CSS fast path vs JS engine (Phase 1)
- [x] `idle` — idle cost of the JS engine (Phase 1)
- [x] `reveal` — resolved transforms, stagger cascade, `once` latching, reduced motion, destroy restores styles
- [x] `pin` — no layout shift on wrapper injection, pin/unpin boundaries, parked position and width, progress, all four lifecycle callbacks, `refresh()`, ResizeObserver auto-refresh, destroy unwraps
- [x] `snap` — exact section landing, index clamping, threshold both directions, one section per gesture, animated vs **real** reduced-motion instant snap, destroy
- [x] `text` — split preserves rendered text exactly, `aria-hidden` pieces + one visually hidden copy (the sentence once in the accessibility snapshot), stagger cascade, no re-split/reflow loop over 30 frames, reduced motion, destroy restores markup byte-for-byte including nested elements
- [x] `counter` — from-value at construction, formatting/decimals/custom format at the final value, well-formed text every frame (no NaN/exponential/out-of-range), `once` hold, reduced motion, destroy
- [x] `progress` — accurate raw value across the window, **dependent CSS resolving the variables through `calc()`**, eased ≠ raw, `onProgress`, renamed variable, `easedVariable: null`, clamping, destroy removes the properties
- [x] `parallax` — travel = speed x height, negative speed reverses, `axis: 'x'` uses width, reverses on the way back, reduced motion, destroy restores
- [x] `video` — real metadata, `currentTime` tracks scroll, **painted frame verified against `currentTime`** by canvas readback, no write before `loadedmetadata`, reduced motion, destroy
- [x] `horizontal` — translateX travel matches the sticky track width, every panel measurably reachable, `onProgress`, reverses, reduced motion keeps scrubbing, `refresh()` after a widened track, destroy; following a narrower window, a growing track and content loading above the runway with no `refresh()`, a stage narrower than the window; and inside a custom `scrollContainer`: distance measured against the container rather than the window, and a re-measure while scrolled that must not move the window
- [x] `animate-parity` — `scrollAnimate`'s own native fast path vs the JS engine across all four named easings, eligibility gate (10 declined configs + a control), `getProgress()` agreeing with what is rendered, reduced motion, destroy removes class/stylesheet/inline styles
- [x] `group` — draw group members animating together, `seek`/`destroy` reaching every member, the sequence gate (a step held until its predecessor finishes), `once` latching across a scroll-back, chain completion reporting, `scrollAnimateGroup` cascade from per-member windows, `scrollParallaxGroup` travel = speed x **each member's own** height
- [x] `timeline` — per-track `from`/`to` windows, a track driving every element it matches, per-track easing, `fade`, the `--scroll-draw-progress` custom property, `onComplete`, `seek`/`replay`, `refresh()`, time-driven `loop`, reduced motion (scrubbing continues, the loop does not), `debug` panel lifecycle, destroy restores the paths
- [x] `cinematic` — the whole structure built from a story (400vh mount, sticky stage, canvas viewBox, stroke widths, pre-measured vs self-measured path lengths), per-animation scene windows, fade curve, first paint mid-story, a story shorter than the viewport, reduced motion, destroy leaves the built DOM
- [x] `motion-live` — reduced motion turned on after load (`emulateMedia`): a part-drawn drawing, a drawing, reveal cards, split text, a counter and parallax all finish without a scroll, each `onComplete` once, the screen-reader copy once; nothing moves afterwards; a `replay()` taken off the instance is ignored; turning it off leaves everything finished. Video and cinematic suites turn it on mid-scrub
- [x] `frameworks` — all eight wrappers (React, Vue, Solid, Svelte, Angular, Astro, Nuxt, the web component) mounted for real and held to one contract: the engine runs, unmounting leaks no observer and no frame loop, re-mounting works, and option changes reach the engine only where the wrapper claims they do. React/Vue/Solid/Nuxt are bundled from `dist/` by `e2e/build-fixtures.mjs`
- [x] `frames-wrappers` — React and Vue `<ScrollFrames>` from `dist/`: the pinned pattern (sticky stage, the track as `triggerElement`) painting the frame the scroll calls for, an equal re-render keeping the film and calling the latest callback, other URLs starting a new film, unmounting stopping it
- [x] `cdn` — both CDN builds loaded from a plain `<script src>`: the production one exposes the API, registers `<scroll-draw>` and says nothing; the dev one reports the same mistakes the production build hides, and does not mistake a stroke set from CSS for a missing one
- [x] `scripts/mutation-check.mjs` — 149 one-line source mutations, each required to fail the single test named for it; `--anchors` checks in a second that every one still applies (verify and CI)
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
- [x] `/examples` previews redrawn — all 24 in the homepage's ink (pencil underdrawing, one accent, real values); the page is a catalogue grid of plates with a code drawer per example
- [x] Showcase sites, one per example (all 24), linked from its card and page — `/showcase/<slug>` for Ferrow, Ledgerline, Quillmark, Hearth & Field, Parcelry, Northbeam, Fieldnotes, Halyard, Relay, Tidewater, Stride, Paygrid status (`statusline`), Linework, Shipyard, Tessera, Greenline, Mint & Co (`mintco`), Plugboard, Atelier Nord (`ateliernord`), Folio, Lumen, Casa Verde (`casaverde`), Aural, Groundtrack (`scroll-frames`); registry in `src/showcase/index.ts`, card copy in `components/examples/scenes/data.ts`
- [x] `/blog` + all 12 posts — in the homepage's design: an index with a topic key drawn to scale that doubles as the filter and a numbered register of posts; every post on one article frame (`components/blog/BlogArticle.tsx`, `blog.css`) with figures that depict the post's real subject
- [x] `/changelog`, `/blocks`, `/playground`, `/verify` — moved into `SiteShell` with their own openings in the drawing-sheet language (release log as title-block strips, blocks as plates with install commands, playground controls kept working, verify's proofs as records)
- [x] `/vs-*` (7), the six framework landings and the React / Next.js / Lenis landings — moved into `SiteShell`; measured numbers drawn as comparisons, every figure read from `data/competitors.ts` / `data/facts.ts`
- [x] `/guides` + each guide — index as a parts list with measured before/after weights; each guide opens beside fig. 1 (the swap: import, version, licence, gzip, React hook, arrows inked on load), then notes, steps on an inked rail, a checked unchanged list, numbered questions, more guides, sticky contents
- [x] `/examples` — 24 examples with framework filter
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

### Handwriting animation generator (2026-11-13; branch `feat/tool-handwriting`)

- [x] `/handwriting-animation-generator` (29th tool): text in a Hershey single-stroke font (Script, Roman, Roman italic; public domain, `components/handwriting/hershey-data.ts`), strokes timed in pen order; CSS-only SVG file, `scrollDraw` with `stagger: 1`, React `<ScrollDraw>`; Run it page in `test:tools` (29 tools, 43 pages); checked in Chromium, Firefox and WebKit (file, `<img>`, loop, Run it page at 375 px in both themes, reduced motion)
- [x] Linked from `/examples/signature` and `/blog/svg-line-drawing-animation-css`
- [ ] Request indexing; Search Console review in 2–3 weeks
- [ ] Library: scrollDraw's dash (`stroke-dasharray: <length>`, an equal gap) lets WebKit paint a dot at the end of every round-capped path not yet drawn; a gap of twice the length (as the CSS tools write) would fix it. The handwriting scroll version uses butt caps until then.

### Stacking cards and scroll marquee generators (2026-11-13; branch `feat/tools-stack-marquee`)

- [x] `/stacking-cards-scroll-generator` (27th tool): 2–6 sticky cards a step apart, the covered one shrinking and dimming; CSS only (view timeline), HTML/CSS/JS on `scrollProgress`, React; both Run it pages in `test:tools`
- [x] `/scroll-marquee-generator` (28th tool): 1–4 rows that slide apart with the scroll over an endless CSS drift, Pause motion, an `aria-hidden` loop copy; HTML/CSS/JS on `scrollAnimate`, React, CSS only; both Run it pages in `test:tools` (28 tools, 42 pages)
- [x] Linked from `/blog/scroll-pin-without-gsap` and `/blog/horizontal-scroll-sections`
- [ ] Request indexing for both; Search Console review in 2–3 weeks

### scrollFrames, its generator and the Groundtrack site (2026-11-13; branches `feat/scroll-frames`, `feat/frames-wrappers-bench`)

- [x] 2.24.0: `svg-scroll-draw/frames` — `scrollFrames` scrubs an image sequence on a canvas: coarse-to-fine loading (first, last, then midpoints, 6 at a time), the nearest loaded frame until the right one arrives, a redraw only when the frame changes, DPR-sized buffer (capped at 2), cover/contain, `triggerElement` for a pinned stage, reduced motion loads and shows only the last frame; independently reviewed (attribute-sized canvas held, inert after destroy, throwing callbacks and frames function isolated); 4.0 KB gzipped, budget 4.1 — unit tests +47, browser tests per engine +19, mutations +9
- [x] `/scroll-image-sequence-generator` (26 tools): demo sequence, your own frames, or frames extracted from a video and downloaded as a zip; preview and code; its Run it page in `test:tools`
- [x] `/examples/scroll-frames` recipe (24 examples, run in `test-recipes`) and the Groundtrack showcase (`/showcase/groundtrack`) on NASA's public-domain Landsat 8 frames (71 WebP, credit on every page and in `public/frames/landsat/README.md`)
- [x] 2.25.0: `<ScrollFrames>` in `svg-scroll-draw/react` and `/vue` (Nuxt re-exports it; Vue also `useScrollFrames`): `role="img"` by default, a dev warning without an `aria-label`, re-created only when the URLs or options change (a `frames` function compared by the URLs it gives), live callbacks, `triggerElement` as a ref (React) or selector (Vue) read when the film starts; reviewed (a frames function replaced by a list of the same URLs keeps a working film); the generator's React tab writes it; react/vue/nuxt 14.9/15.1/15.2 KB gzipped (+2.1, budgets raised in `scripts/size.mjs`) — unit tests +27, browser tests per engine +8, mutations +5
- [ ] scrollFrames wrappers for Svelte, Solid and Angular, if anyone asks
- [x] `/blog/scroll-image-sequence-animation`: canvas vs video, extracting frames, a hand-written version and `scrollFrames`, the frame budget, reduced motion; leads into the generator, the example and Groundtrack
- [ ] Request indexing for `/scroll-image-sequence-generator`, `/examples/scroll-frames` and `/showcase/groundtrack`; Search Console review in 2–3 weeks

### Growth: README loops and star CTAs (2026-11-13; branch `feat/growth`)

- [x] Five README loops in `.github/media/` from a production build (hero pen, Groundtrack `scrollFrames`, Lumen `scrollPin`, Atelier Nord `scrollText`, the line drawing generator), each under 2 MB
- [x] Root README top: hero loop, one-line pitch, three-line quick start, the one-line switch, a 2×2 grid linked to the live pages, a star line; npm README: the hero (absolute raw URL) and the quick start near the top
- [x] "Star on GitHub" (`components/site/GitHubStar.tsx`, hourly cached count from `/api/stars`) in every tool's next step and every blog post's closing
- [ ] After the branch reaches `main`: check the npm README's hero loads (it 404s until `.github/media/` is on `main`; npm shows the new README from the next publish)

### Lead with the heart, tool page speed (2026-11-13; branch `feat/heart-and-speed`)

- [x] Home hero, meta and JSON-LD, both READMEs, the npm description and llms.txt lead with SVG line drawing on the native scroll timeline, then the one-line switch from AOS, ScrollReveal and vivus
- [x] Tool pages measured (phone, 4x CPU, slow network): all 25 already good on LCP, CLS and TBT; the video scrub page no longer downloads its 1.6 MB film on load on phones; parallax and easing send less HTML

### Tools test, window gate everywhere, links (2026-11-13; branch `feat/tools-tests-gates-links`)

- [x] `npm run test:tools` (CI, e2e job): every tool's Run it page built from its code module and run in Chromium against dist — 25 tools, 36 pages, ~15 s; found the path editor's short page
- [x] 2.23.5: scrollDraw JS path, counter, text, video, progress, timeline and useScrollDrawProgress gated on the trigger window (shared core/frame-gate), so a jump across a window paints the end and fires onComplete; 0 frames and 0 layout reads outside every window with 280 engines; main entry 11.4 KB
- [x] In-content links from docs, 17 examples, 12 posts, guides, vs-aos and the React page to the tools
- [x] cinematic on the frame gate (2.23.7; its entry 2.3 -> 3.2 KB, budget moved with the reason)

### Tool kit everywhere, three tools and 2.23.4 (2026-11-12; branch `feat/tools-kit-and-fixes`)

- [x] Release job in `mcr.microsoft.com/playwright:v1.65.0-noble`, like CI's browser job; `scripts/check-playwright-image.mjs` in `verify` keeps the image on the lockfile's Playwright; a branch dry run passed verify and the browser tests in the container
- [x] Tool kit in all 25 tools: source line on generated code, Run it (HTML page, StackBlitz HTML and Vite + React), "Use it in your project" (with an `importLine` for default exports); each tool's exported page run in a browser against the built library
- [x] New tools: SVG path editor (parser cross-checked on 261 `d` strings in Chromium and WebKit), typewriter effect generator (201 checks in 3 engines), scroll video scrub generator (seek accuracy within 0.02 s in 3 engines; encodes timed)
- [x] The SVG path viewer's Tibbixel sample is not downloadable or uploaded to StackBlitz (licence)
- [x] 2.23.4: scrollAnimate frames from the trigger window, not an IntersectionObserver (parallax no longer freezes out of its clip, fade-ups start on time, whole-window jumps paint the end); replay() after pause()/seek() resumes (animate, counter, text, video); counter destroy() removes its variable; useScrollDrawProgress in a scrollContainer; scrollSnap start, border, smooth scroll-behavior and clamping; morphTo dash fits the longer outline; pathLength respected; scrollText chars keeps emoji and words whole and long lines visible; debug keeps the native path in production; scrollVideo seek before metadata; React ScrollVideo preload/poster — unit tests +44, browser tests per engine +29, mutations +21; independently reviewed (two regressions found and fixed: scrollSnap on a page without a doctype, and scrollText chars in scripts without spaces)
- [x] SELF_ENTRIES gains progress, horizontal, video and react, so every tool's next step quotes its entry's size
- [ ] Still IntersectionObserver-gated (a jump across a whole window paints nothing): scrollDraw's JS engine, scrollCounter, scrollText, scrollVideo, useScrollDrawProgress — the animate engine's window gate carries over
- [ ] scrollAnimate clip-path tuples (`inset(0, 50%, …)`), blocked by the reveal and horizontal budgets

### Tools expansion and 2.23.3 (2026-11-11; merged to `main` in `f4ee078`, 2.23.3 published)

- [x] `/tools` hub and 22 tools from one list (`data/tools.ts`), read by the hub, the nav (five named, "All 22 tools"), the footer index (every tool), the sitemap and `llms.txt`; `check-nav` reads the list
- [x] 19 new tools: easing visualizer, counter, parallax, scroll trigger visualizer, CSS scroll-driven, shape to path, progress bar, scroll reveal; SVG wave, blob, to-JSX, line drawing, morph; CSS keyframes, scroll snap, horizontal scroll, cubic-bezier, text fill on scroll, scroll pin
- [x] Each round-1 tool QA'd by a second agent: every claim checked against the source, every control and four or more generated outputs run in Chromium, Firefox and WebKit, fixes in the tool's own files
- [x] Tool kit (`lib/tool-export.ts`, `components/tool-kit/`): source line, HTML download, StackBlitz (HTML and Vite + React), "Use it in your project"; used by morph, text fill and pin
- [x] 2.23.3 staged (not tagged): `once` latches raw progress (overshooting easings end on target); autoplay and debug never take the native path; blank triggers are the default; scroll containers measured from their scrollport; reversed clip starts shown — 37 unit + 9 browser tests, 6 mutations, independently reviewed (700-sequence differential fuzz: linear unchanged)
- [x] Site: one `<main>` per page; slider focus ring site-wide; light-theme accent and Copy button pass AA; `test-a11y` audits the light theme
- [x] CI: browser job in `mcr.microsoft.com/playwright:v1.65.0-noble` (no apt); `npm run report:numbers`; `.github/FUNDING.yml` and a footer sponsor link
- [x] Tool kit in the 19 tools built before it (2026-11-12, see below)
- [x] Library bugs found by QA (2.23.4, see below)
- [x] Typewriter, SVG path editor and scroll video scrub tools (2026-11-12)

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

### Unreleased — recipes (site-only)

- [x] `/examples/scroll-pin` is a full recipe — pinned feature tour (`scrollPin` + `onProgress` + `seek()`), 4 steps with figures, the live tour pinning on the page, ES-module HTML file, 5 pitfalls (React root and ancestor `transform` measured first); files in `apps/demo/src/recipes/scroll-pin/`, checked by `test-recipes`
- [x] `/examples`: recipe cards link as “recipe →”, and a Recipes filter shows just those (`src/recipes/slugs.ts`)
- [x] `/examples/scroll-counter` is a full recipe — stat row, three copies per number, held width, shared formatter, a reachable end (`bottom 90%`, measured against the default and `top 45%`); files in `apps/demo/src/recipes/scroll-counter/`
- [x] `stat-counter-row` block ends its count on `bottom 90%` (was `top 45%`, unreachable near a page's end)
- [x] `/examples/scroll-video` is a full recipe — pinned film in a sticky stage measured with `triggerElement` (2.18.0); keyframe interval and Range requests measured; files in `apps/demo/src/recipes/scroll-video/`
- [x] `/blog/horizontal-scroll-sections` is a full recipe — a case-study strip: runway matched to the travel, count and rail from `onProgress`, `overflow: clip` + a `focusin` scroll for the keyboard; five pitfalls measured on the file; files in `apps/demo/src/recipes/horizontal-scroll-sections/`; the recipe parts render inside a post's sections
- [x] The five recipes planned are done (logo, sticky feature section, stat row, scrubbed film, horizontal strip)

### Live chapter: GitHub figures, lifetime downloads, day read-out (2026-11-06; site-only, merged from `claude/funny-kowalevski-260099`)

- [x] Fixed: the four GitHub cards showed "—" after a refused hourly refresh (Next refetches a stale `fetch` in the foreground during regeneration and caches only 200s). Each figure is an `unstable_cache` entry in `apps/demo/src/lib/live-data.ts` that keeps its last good value; `/api/stars` shares it. Replayed on a production build with GitHub unreachable: old code four "—", new code 8 / 0 / 2
- [x] `GITHUB_TOKEN` used when set (bearer, never in a cache key); refusals logged with status and "rate limit reached"
- [x] "npm / all time": every day since the registry's `time.created`, a year at a time, summed; grid is four to a row, one row per source
- [x] The chart opens on all time (every day since the first publish) with a "last 30 days / all time" switch (`aria-pressed` buttons, total announced, no layout shift on a phone)
- [x] Chart: hover / tap / keyboard read-out of each day (date, downloads, ring, inked rule), a slider to assistive technology; checked in Chromium with Playwright (hover, keys, touch, no layout shift) and axe with the read-out open in both themes
- [ ] Owner: set `GITHUB_TOKEN` on Vercel (a fine-grained token with read-only access to public repositories and no other permissions is enough)
- [x] Merged into `feat/homepage-redesign` and pushed (2026-11-06)

### 2.23.0 — the drop-ins follow reduced motion live (2026-11-07; published, `v2.23.0` on `bd31fe2`)

- [x] `aos`, `scrollreveal` and `vivus` follow reduced motion turned on mid-visit (one way, listener removed by `destroy()`); vivus ends a drawing mid-play
- [x] Browser tests ×3 engines, three mutations (95); sizes +0.14 KB each, aos budget 3.3
- [x] Post `/blog/unslop-ai-looking-ui`
- [x] Released: 2.20.1, 2.21.0, 2.22.0 and 2.23.0 all on npm (2026-11-07); `latest` and GitHub's latest release set to 2.23.0 by hand after the race (see release.yml's dist-tag rule)
- [x] Full mutation run: 92/92 caught (plus the three new, 95)

### Unslop (2026-11-07; site, blocks and showcase; branch `fix/unslop-polish`)

- [x] heydamir/unslop audit: 13 of its 60 signs on the site ("light slop"); every one fixed in polish mode (spacing, nav surface, emoji, copy, labels, italic, radius, looping glow)
- [x] Blocks in React, Vue and Svelte: sentence-case eyebrows, weight 500, concrete default copy; `public/r` regenerated
- [x] Showcase, every pass: "New" pills (10), gradient headlines (4), unverifiable "Trusted by" counts (3), coloured glows (19), washes (58), hue gradients (4), glass (19), weights (209), italics (60), headline periods (144), pills (98), spacing (2,145), caps and tracking
- [x] `scripts/test-showcase.mjs`: every showcase site loads with no errors; colour contrast no worse anywhere (708 → 687 failing nodes)
- [x] Final pass: clamp() spacing on the grid (52), dead marquee CSS, subhead/caption periods (9), two fragment ledes, hero claim chips and star rows (4 showcase sites); pages checked by eye at desktop and phone width
- [x] Last leftovers: three showcase animations on transforms (no width/left/top transitions left), 36 placeholder layers removed, share cards in sentence case, 136 English data labels sentence-cased
- [x] Showcase colour contrast: 708 failing elements fixed at the colour (71 text colours, 8 accent buttons, 4 opacity dims, one specificity bug); test-showcase in CI, 0 problems
- [x] test-blocks, test-seo, test-a11y (0 violations), test-recipes, Vue and Svelte blocks pass
- [ ] Look at the Vercel preview, then merge into `feat/homepage-redesign` and `main`

### 2.22.0 — reduced motion turned on mid-visit applies at once (2026-11-06; pushed in `66af2b5`)

- [x] Every engine but the drop-ins follows `prefers-reduced-motion` turned on while the page is open: `core/motion-live.ts` destroys the instance and rebuilds it through the start-up reduced branch behind the same object (draw, animate — reveal, parallax, groups, horizontal with `respectReducedMotion: true` — text, counter); video and `Cinematic` finish in place; `useScrollDrawProgress` reports 1
- [x] One way: turning it off leaves everything finished until the next load; snap and the timeline's loop still follow both ways
- [x] `onComplete` once for an effect that had not finished, never twice; `scrollCounter`'s reduced `getProgress()` is 1
- [x] Tests: 14 unit (`motionLive.test.ts`), 7 browser tests × 3 engines (`motion-live.spec.ts`, video, cinematic), 9 mutations; two mutation anchors stale since 2.21.0 fixed (92 in all), `--anchors` in verify and CI
- [x] Sizes: main 11.38 → 11.70 KB, CDN +0.22; snap, timeline, pin and the drop-ins unchanged; budgets moved, reason in `scripts/size.mjs`
- [x] Site: the reduced-motion post, `/docs` option rows, the Next.js FAQ, `/changelog`, both READMEs
- [ ] Released

### 2.21.0 — split text a screen reader can read (2026-11-06; pushed in `140ae6c`, not tagged)

- [x] `scrollText`: one visually hidden copy of the text after the `aria-hidden` pieces, instead of an `aria-label` ARIA forbids on `<p>`/`<span>`/`<div>` (a screen reader could read nothing); `destroy()` leaves a page's own `aria-label`
- [x] Tests: unit and browser fixtures count pieces apart from the copy; the browser test reads the accessibility snapshot (sentence exactly once, 3 engines); mutation `text/readable` (84)
- [x] Sizes: text 3.1 → 3.2 KB (3.17), the entries that include it +0.1 KB, reason in `scripts/size.mjs`
- [ ] Released

### Reduced-motion post (2026-11-06; pushed in `08467e6`)

- [x] `/blog/reduced-motion-scroll-animations`: what `prefers-reduced-motion` should do per effect, the library's behaviour per engine (checked against the source and its reduced-motion tests), live listening, a Playwright test; passes axe, the SEO check and the sweep (66 pages)

### Search Console read and the size figures (2026-11-11)

- [x] Search Console (3 months to 2026-11-09): 133 clicks, 1.89K impressions, position 10.4; impressions halved the week of 2026-11-01 (the site-wide redesign); 21 indexed, 42 "Discovered – not indexed", 8 external links
- [x] Homepage title and description agree on the main-entry size; React, Next.js, pen drawing and `llms.txt` read `SELF.gzipKb`; `llms.txt` test counts derived
- [x] `/vs-gsap` title and description lead with "GSAP alternative" and the measured sizes
- [x] 2.23.2 staged (not tagged): autoplay with a stagger — seek(1) finishes every path, getProgress/onProgress span the whole run; 5 unit + 6 browser tests, 2 mutations caught
- [x] `/svg-path-viewer`: sanitised paste (hostile SVG tested: nothing runs, nothing loads), lengths as scrollDraw measures, drawing checks, seek() preview, CSS/JS/React/SVG output; SEO and axe 70 pages, 0 problems
- [x] `/text-animation-generator`: scrollText preview (seek/scrub), real-scroll panel, JS and React output, stagger limit warning; SEO and axe 69 pages, 0 problems
- [x] `/aos-animation`: all 27 AOS effects live on the drop-in, attributes, easings, FAQ; SEO and axe checks 68 pages, 0 problems
- [x] SEO audit 2026-11-11: nothing blocking; finale Star link contrast fixed; `llms.txt` as Markdown links
- [x] Vercel Web Analytics component in the root layout (`@vercel/analytics` 2.0.1); enabled from the Vercel dashboard
- [x] 2.23.1 released 2026-11-11 (was staged): docs-only, so npm shows the README with every guide and comparison linked; `dist/` identical to the published 2.23.0
- [x] `/react-scroll-animation`: library comparison (4, measured) and 6 questions with FAQPage data; SEO check 67 pages, 0 problems
- [x] One-line PRs to nine awesome lists: awesome-svg #277, awesome-web-animation #42, awesome-svelte #279, awesome-vue #4612, awesome-javascript #1216, awesome-nextjs #759, awesome-angular #2676, awesome-solid-js #95, awesome-astro #176

### SEO check and an accessibility post (2026-11-06; pushed in `44e4dfd`)

- [x] `apps/demo/scripts/test-seo.mjs` (`npm run test:seo -w apps/demo`, in CI): every sitemap page's title (≤ 60, unique), description (50–160, unique), canonical, one `<h1>`, `lang`, no `noindex`, OG/Twitter tags with a loading image, JSON-LD that parses, 2+ inbound links — 65 pages, 0 problems after shortening `/examples/line-chart`'s description (175 → 140)
- [x] Post `/blog/accessible-split-text-animation`: the `aria-label` pattern ARIA 1.2 forbids on a paragraph (GSAP SplitText's default), the visually hidden copy `scrollText` uses since 2.21.0, the `ariaSnapshot()` check; passes axe and the SEO check

### Accessibility, links and speed of the site (2026-11-06; pushed in `140ae6c`)

- [x] `apps/demo/scripts/test-a11y.mjs` (`npm run test:a11y -w apps/demo`, in CI): axe WCAG 2.1 A/AA on all 64 sitemap pages under reduced motion, plus every internal link and `#anchor` — 0 violations, 0 broken links
- [x] Fixed: the muted text colour (both themes), 8 dead `/docs` anchors and 4 `/work/…` 404s, names that hid visible text, keyboard-unscrollable code, a `role="img"` hiding links, faded (32–35%) non-current steps in two blocks and two recipes now greyed by colour, and other small contrast misses
- [x] Speed: Syne no longer preloaded on every page (fonts 86 → 52 KB); LCP 0.66–1.3 s, CLS ≤ 0.002, no scroll frame over 50 ms (4× CPU, mobile 4G)
- [x] `/docs` as a Server Component: tried 2026-11-06 and reverted: as a Server Component with a client sidebar it shipped 27 KB less JS but 41 KB more HTML (React's server payload repeats the content), and measured the same main-thread work (script 193 → 188 ms, all tasks 895 → 939 ms at CPU 4×, median of 7) with LCP the same or slightly worse. The script time is React, the router, the drawings and the copy buttons, not the content

### IndexNow and true sitemap dates (2026-11-06; site and CI, pushed in `975dce6`)

- [x] `.github/workflows/indexnow.yml` + `apps/demo/scripts/indexnow.mjs`: after each successful production deploy, the sitemap URLs dated on or after the previous deploy's day go to IndexNow (key file `public/cff7b1aad337fe3f2e7de7398f3b57b9.txt`); a manual run with "all" sends all 64
- [x] `refresh-sitemap-dates.mjs`: uncommitted files count as today, `/docs`, `/examples`, `/blocks` and the strip post read the files behind them, the example group includes the recipes and the framework group its guides; `--check` in verify and CI (full-history checkout). Eleven dates had sat at 2026-11-04 through a day of releases
- [x] A refusal by the engines warns instead of failing: 403, 429 and 5xx leave a GitHub warning annotation and exit 0; 400/422, a missing or unserved key file and an empty sitemap still fail. Bing answered 202 twice, then 403 "UserForbiddedToAccessSite" on `44e4dfd` and `08467e6` with the key file served correctly
- [ ] Owner: add the site to Bing Webmaster Tools and verify it (the first thing to try for the 403); then Actions → IndexNow → Run workflow with "all" once, to send every page (the 35 "Discovered – not indexed" among them)

### 2.20.1 — resuming off screen finishes the drawing (2026-11-06; in the working tree)

- [x] A review of 2.19.1–2.20.0 in a real browser: `once`, `repeat`, `autoReverse`, `refresh()`, `replay()`, a horizontal container and a page loaded mid-tail behave; the pin `vh` probe gives 1.5 × CSS vh in all three engines under a transformed, zoomed or filtered `body`, and is always removed
- [x] Fixed: `resume()` (and `replay()`, `refresh()`) restarted the loop only on screen, so a staggered drawing paused and resumed off screen mid-tail froze (1 / 0.95 / 0.7 / 0.45) and `onComplete` never fired; they now use `live()`, the rule `next()` uses
- [x] Tests: browser test (3 engines), mutation `stagger/resume-tail` (83)
- [ ] Released

### 2.20.0 — pin for screens, not pixels (2026-11-06)

- [x] `scrollPin` `pinDistance: '150vh'`, measured as CSS's vh (follows rotation and resizes, not a phone's address bar), `'600px'`, numbers unchanged; the default stays `window.innerHeight`; anything else warns once
- [x] Tests: browser tests resizing the viewport and simulating an address bar (3 engines), five unit tests, mutations `pin/vh-follows` and `pin/vh-is-css`; `pin/refresh`, `parallax/travel` and `parallax/axis` re-anchored (stale since 2.19.0) — all 82 run and caught
- [x] Docs and examples write screens as `'300vh'`; the scroll-pin recipe and the pinned-feature-tour block (React, Vue, Svelte) use vh; the block requires `svg-scroll-draw@^2.20.0`
- [x] Sizes: pin 1.4 → 1.6 KB (1.58; budget 1.6, reason in `scripts/size.mjs`)
- [x] Released — `v2.20.0` on `972d705`, published by GitHub Actions through npm's trusted publisher (`_npmUser` GitHub Actions, `trustedPublisher: github`), with a SLSA provenance attestation

### npm trusted publishing (2026-11-06; release job only)

- [x] `release.yml` publishes with npm 11 (≥ 11.5.1), trying trusted publishing (OIDC) first and `NPM_TOKEN` second; same tarball as npm 10
- [x] Trusted publisher added on npmjs.com by the owner, 2026-11-06 (GitHub Actions: `DhruvilChauahan0210` / `ink-scroll` / `release.yml`). 2.20.0 published through it the same day, so it stays
- [x] `NODE_AUTH_TOKEN` and `--provenance` dropped from `release.yml` (trusted publishing signs provenance itself); no fallback left
- [ ] Owner: delete the `NPM_TOKEN` repository secret, revoke the automation token on npmjs.com, and set Publishing access to "Require two-factor authentication and disallow bypass 2fa tokens"

### Dependencies (2026-11-06; site and tooling only, no version bump)

- [x] GitHub Actions v7 (`checkout`, `setup-node`, `upload-artifact`) and `action-gh-release` v3
- [x] Next 16.4.5, React 19.3.1, esbuild 0.28.2 (tests only), Tailwind 4.3.4, Vue 3.5.45, Solid 1.9.18, type packages; `npm audit` 32 → 17 findings
- [x] Declined with reasons in `.github/dependabot.yml`: TypeScript 7, ESLint 10, `@types/node` 26 (and `@vitest/coverage-v8` majors now follow vitest's)
- [x] Dependabot PRs #1–#4 and #6–#9 closed after the push (#6–#8 by Dependabot itself once the ignore rules landed). No notes on them: this laptop's network answers GitHub comment posts with its own page, so the reasons live in `660f363`'s message and `dependabot.yml`
- [x] CI's Node matrix is [22, 24] (Node 20 left support in April 2026), `@types/node` ^22 with it; verify and coverage checked under Node 24.22.2 locally
- [x] Every job has `timeout-minutes` (15 / 30 / 30 for the release): a browser job hung 47+ minutes on "Install Playwright browsers" on 2026-11-06, and the default is 6 hours

### 2.19.1 — a staggered drawing finishes (2026-11-06)

- [x] Off screen, the engine follows the scroll until the last staggered window ends (with the default trigger the later paths froze at the exit — 1 / 0.8 / 0.55 / 0.3 — and `onComplete` never fired, on any page); a drawing without `stagger` stops where it always did
- [x] Where the page ends before the last window, the stagger is tightened evenly so the last path finishes at the bottom (measured 0.75 / 0.5 on screen before); a page with room keeps it as written; an unreachable `trigger.end` is left alone
- [x] Tests: `e2e/stagger.spec.ts` (6 × 3 browsers, scrolled in 50px steps), five unit tests, mutations `stagger/fit-page-end` and `stagger/offscreen-tail` (80, all caught)
- [x] Sizes: main 11.2 → 11.4 KB; draw-engine budgets moved with the reason in `scripts/size.mjs`
- [x] Docs: `/docs`, both READMEs, the skill's API table, the `stagger` JSDoc, CHANGELOG, `/changelog`
- [x] Playwright 1.62.1 → 1.65.0 (Chromium 158, Firefox 159, WebKit 27.2): `firefox-native` folded into `firefox`, which takes the fast path with no prefs; the parity suites require it in Chromium and Firefox (watched failing with the feature off)
- [x] Released — `v2.19.1` on `2f7b711`; both release runs passed. The two tags raced: 2.19.0 published last and took npm `latest` and GitHub's latest release, both moved back to 2.19.1 by hand

### 2.19.0 — every engine follows the page (2026-11-06)

- [x] One shared layout watcher (`core/layout-watch`) for the animate, counter, progress, text, timeline and video engines; the draw engine and scrollHorizontal moved onto it. A move under a pixel is dropped; a re-measure leaves out the engine's own transform
- [x] `refresh()` on scrollAnimate instances (group `refresh()` did nothing before)
- [x] Stagger: `getProgress()` = the first path, as `onProgress` and `--scroll-draw-progress`
- [x] React: `id`, `role`, `title`, `aria-*`, `data-*` go on the element. Vue: `<ScrollDraw>` takes all 35 options; absent booleans stay absent (`<ScrollCounter>` defaulted `once` to false)
- [x] `<scroll-draw>` observedAttributes; Astro one live engine per element and kind; the Astro counter example fixed
- [x] Tests: `e2e/layout.spec.ts` (7 engines × 3 browsers), framework fixtures that write the real attribute, `react wrapper attributes`, `vue wrapper props`, unit `layoutWatch` / `vueProps` / refresh / stagger agreement; 15 new mutations (78, all caught)
- [x] Sizes: main 10.7 → 11.2 KB, budgets moved to the measured build with the reason in `scripts/size.mjs`
- [x] Site: each framework page has three sections of its own (`data/framework-guides/`), its own entry size, and the shared Size prose cut — measured, text shared with another framework page fell from 40–50% to 9.5–15.9%; four new blocks (pinned-feature-tour, horizontal-case-strip, video-scrub, reading-progress) run in a browser by `npm run test:blocks`; a Vue version of all nine blocks (`registry/vue/`, published at `/r/vue/<name>.json` for shadcn-vue, shown on /blocks, compiled and run in Chromium by `test-vue-blocks` in CI); sticky-feature re-observes when its steps are renamed (the highlight froze); `build-registry --check` in CI and `verify`
- [x] scrollParallax: travel is a percentage of the layer's own box, so it follows a layer that grows after init (measured 34.6px moved where 57.7px was right)
- [x] scrollPin: a resize while pinned moves the element with its wrapper (it kept its old left and width — measured 220px past the screen's edge); browser test + mutation `pin/resize-pinned`
- [x] The layout watcher also watches the boxes above each element (previous siblings of it and its ancestors): growth inside a custom scrollContainer or on an `html, body { height: 100% }` page is heard; browser tests for both + mutation `layout/boxes-above`
- [x] Svelte 5 versions of all nine blocks (`registry/svelte/`, `/r/svelte/<name>.json` without `path`, on /blocks, `test-svelte-blocks` in CI); `test-blocks` in CI against a built, started site
- [x] Released — `v2.19.0` on `f131f9c`; the release run passed and npm has it

### 2.18.1 — scrollHorizontal follows the layout (2026-11-05)

- [x] Travel and runway re-measured 150 ms after the window, the page, the track or the runway resizes; rebuilt only when either moved; a held (`pause`/`seek`) position survives the rebuild and `refresh()`
- [x] Default distance = track − the sticky stage's content box; without a stage, the scroll container or `documentElement.clientWidth` (classic scrollbar left out)
- [x] Four browser tests × 3 engines, seven unit tests, mutations `horizontal/stage-width` and `horizontal/follow-layout` (63 in all); horizontal entry 5.0 KB, budget 5.1
- [x] Docs: `/docs` scrollHorizontal section, skill API, the complete guide's snippet, the post's API table, CHANGELOG, `/changelog`
- [x] Released — `v2.18.1` on `70c91cd`; the release run passed and npm `latest` is 2.18.1

### 2.18.0 — scrollVideo `triggerElement` (2026-11-05)

- [x] `scrollVideo({ triggerElement })` measures the window from another element; zero-length window warns
- [x] Two browser tests (`video-sticky.html`), two unit tests, mutation `video/trigger-element` (61 in all)
- [x] Docs: npm README table, skill API, `/docs` scrollVideo section (pinned film + encoding), CHANGELOG, `/changelog`
- [x] Released — `v2.18.0` on `1840983`; the release run passed and npm `latest` is 2.18.0

### 2.17.1 — once keeps the stagger, and the first recipe (2026-11-04)

- [x] `once` + `stagger`: each path holds its own progress (`frozenPath` in `core/engine.ts`); `onComplete` waits for the last path; two unit tests watched failing on 2.17.0
- [x] `/examples/logo-reveal` is a full recipe — 4 steps with figures, the complete component running, one-file HTML, 5 pitfalls; files in `apps/demo/src/recipes/logo-reveal/`
- [x] `apps/demo/scripts/test-recipes.mjs` runs each recipe's HTML file in Chromium (CI e2e job)
- [x] Released — tag `v2.17.1` on `ed77b58`, published by `release.yml` with provenance

### 2.17.0 — wrappers follow option changes (2026-11-04)

- [x] React, Vue (+ Nuxt), Solid and Svelte rebuild the engine when an option really changes; equal options keep it; callbacks read live (`src/core/reactive.ts`: `optionsKey`, `liveFns`)
- [x] Angular: `update(options)` on every `Ref` class for `ngOnChanges`, on a shared exported `EngineRef`
- [x] Browser suite: option changes reach the engine on all six; a new equal re-render test keeps the same engine (206 per engine); Astro and the web component still read options once, pinned
- [x] Mutation harness: the four wrapper anchors re-pointed at the new code, four new mutations (Solid and Angular option changes, React and Vue equal options); all 60 caught
- [x] Docs: README (both), `/docs` framework sections, `/verify` limit, CHANGELOG, `/changelog`
- [x] Released — tag `v2.17.0` on `d7b03b2`, published by `release.yml` with provenance (the first push of the tag landed on `44d6f6b`; its run stopped at the version check, as designed, and the tag was moved)

### 2.16.1 — Server Components render the components (2026-11-04)

- [x] `"use client"` on `svg-scroll-draw/react` (post-build, never on shared chunks); `directives.test.ts` reads dist; the demo renders `<ScrollDraw>` from a Server Component so `next build` guards it
- [x] Mutation anchors `reveal/stagger`, `video/scrub`, `video/direction` re-pointed; all 56 run
- [x] Released — tag `v2.16.1` on `b3eb52a`, published by `release.yml` with provenance

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
- [x] `/blocks` + shadcn registry (9 blocks from 2.19.0's site work), agent skill in `skills/`
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
