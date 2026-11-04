# svg-scroll-draw — Roadmap

> Last updated: 2026-08-14 — 2.10.0 prepared; Phase 2 (correctness) complete, unpublished
>
> Items marked ✓ are shipped. Remaining items are ordered by value/effort ratio.

---

## Shipped ✓

### Library
- [x] Core scroll-draw engine — `stroke-dashoffset` driven by `IntersectionObserver` + `requestAnimationFrame`
- [x] `stagger` — sequential path animation with configurable delay
- [x] `direction: 'reverse'` — erase/undraw animation
- [x] `onProgress` callback — fires every frame with 0–1 alpha
- [x] `onStart` / `onComplete` lifecycle hooks
- [x] `easing` — linear, ease-in/out, spring, bounce, elastic, custom function
- [x] `fade`, `speed`, `once`, `debug`, `delay`, `axis`, `scrollContainer`, `threshold`, `rootMargin`
- [x] `trigger.start` / `trigger.end` — anchor strings + percentage format
- [x] `autoReverse` — follows scroll direction
- [x] `waypoints` — callbacks at specific progress thresholds
- [x] `strokeColor`, `strokeWidth` — animated color and width
- [x] `fillOpacity` — flood fill in sync with stroke draw
- [x] `clip` — clip-path reveal mode (left/right/top/bottom/center)
- [x] `morphTo` — path `d` attribute interpolation
- [x] `velocityScale` — draw speed scales with scroll velocity
- [x] `repeat` / `repeatDelay` — loop or replay N times
- [x] `autoplay` + `duration` — viewport-enter trigger mode
- [x] `native` — CSS `animation-timeline: view()` fast path (no JavaScript per frame)
- [x] `pause` / `resume` / `seek` / `replay` / `getProgress` / `destroy` instance API
- [x] `rect` + `circle` support — perimeter-based length calculation
- [x] `Cinematic` class — reads `story.json` from Cinematic Studio, builds sticky-stage timeline
- [x] Dev warnings read the computed stroke, so CSS-stroked paths are not reported as invisible (2.15.1)
- [x] Zero runtime dependencies, ~4.4 KB gzipped

### Framework Wrappers
- [x] React (`svg-scroll-draw/react`) — `<ScrollDraw>`, `useScrollDrawProgress`
- [x] Vue 3 (`svg-scroll-draw/vue`) — `<ScrollDraw>`, `useScrollDraw`
- [x] Svelte (`svg-scroll-draw/svelte`) — `use:scrollDraw`, `createScrollDraw`
- [x] Solid (`svg-scroll-draw/solid`) — `useScrollDraw`, `createScrollDraw`
- [x] Angular (`svg-scroll-draw/angular`) — `ScrollDrawRef`
- [x] Astro (`svg-scroll-draw/astro`) — `initScrollDraw()`, data-attribute API
- [x] Nuxt (`svg-scroll-draw/nuxt`) — `useScrollDraw()` composable
- [x] Web Component (`svg-scroll-draw/web-component`) — `<scroll-draw>` custom element

### Advanced APIs
- [x] Group API (`svg-scroll-draw/group`) — `scrollDrawGroup`, `scrollDrawSequence`
- [x] Timeline API (`svg-scroll-draw/timeline`) — independent per-element scroll windows
- [x] Cinematic API (`svg-scroll-draw/cinematic`) — Studio bridge

### v2 APIs (Phase 1 — v2.0.0)
- [x] `scrollAnimate` — animate any CSS property on any element driven by scroll; native CSS fast path; full instance API
- [x] `scrollCounter` — animated number counter on scroll with format/decimals
- [x] `scrollParallax` — thin wrapper over `scrollAnimate` for parallax movement
- [x] `ScrollAnimate` React component (`svg-scroll-draw/react`)
- [x] `ScrollCounter` React component (`svg-scroll-draw/react`)

### v2 APIs (Phase 2 — v2.1.0 → shipped in v2.2.0)
- [x] `scrollVideo` — `<video>.currentTime` tied to scroll, ships as `svg-scroll-draw/video`
- [x] `scrollText` — text split + reveal animation on scroll, ships as `svg-scroll-draw/text`
- [x] `ScrollVideo` + `ScrollText` React wrappers

### v2 APIs (Phase 3 — v2.2.0)
- [x] Visual DevTools overlay — `svg-scroll-draw/devtools`, progress panel + trigger lines, dev-only
- [x] Global instance registry in `src/core/registry.ts`

### v2 APIs (Phase 5 — v2.4.0)
- [x] Angular v2 wrappers — `ScrollAnimateRef`, `ScrollCounterRef`, `ScrollVideoRef`, `ScrollTextRef`
- [x] Astro v2 — `initScrollAnimate`, `initScrollCounter`, `initScrollText`, `initAll`
- [x] Nuxt v2 — all v2 composables/components re-exported + plugin
- [x] `scrollAnimateGroup` + `scrollAnimateSequence` in `svg-scroll-draw/group`

### v2 APIs (Phase 4 — v2.3.0)
- [x] Vue 3 v2 wrappers — `useScrollAnimate`, `useScrollCounter`, `useScrollVideo`, `useScrollText` + `<ScrollAnimate>`, `<ScrollCounter>`, `<ScrollVideo>`, `<ScrollText>` components
- [x] Svelte v2 wrappers — `scrollAnimate`, `scrollCounterAction`, `scrollVideoAction`, `scrollTextAction` actions + `create*` helpers
- [x] Solid v2 wrappers — `useScrollAnimate`, `useScrollCounter`, `useScrollVideo`, `useScrollText` + `create*` variants

### Demo site (v2)
- [x] Home page v2 section — 6-card grid with code snippets for all new APIs
- [x] DocsPage — v2.0–2.2 nav group with full option tables for all 6 new APIs
- [x] ExamplesPage — 3 new v2 example cards (scrollAnimate, scrollCounter, scrollText)
- [x] Blog post: "Replace GSAP ScrollTrigger with scrollAnimate" at `/blog/replace-gsap-scrolltrigger`
- [x] `ScrollTextInteractive` — interactive home page demo for `scrollText` (split mode, stagger, presets)
- [x] Changelog page v2 callout — "v2 — The Platform Shift" separator between v2.x and v1.x entries

### Demo Site
- [x] Home page — hero, 15+ demos, API table, framework tabs, bundle comparison, live stats
- [x] `/examples` — 23 examples with framework filter (All / React / Vue / Svelte / Solid / Vanilla / API)
- [x] `/docs` — full API reference
- [x] `/playground` — interactive SVG editor
- [x] `/changelog` — version history
- [x] `/blog/gsap-drawsvg-alternative` — SEO comparison post
- [x] Copy button on all code blocks
- [x] Install tabs — npm / pnpm / yarn / bun / CDN
- [x] Framework quickstart tabs
- [x] Bundle size comparison chart
- [x] Dark/light mode toggle
- [x] Native CSS support badge
- [x] Live npm / GitHub stats

---

## Remaining

### Demo Site

#### ~~`/blog` index page~~ — ✓ shipped
`/blog/page.tsx` exists with post card listing. "Blog" added to all nav instances.

#### ~~More demo examples~~ — ✓ shipped
23 examples including logo reveal, line chart, signature, flowchart, map route, network diagram, group, sequence, timeline, Vue, Svelte, Solid.

#### More blog posts — ongoing
- [x] "Zero-JS SVG scroll animations with native CSS" — `/blog/native-css-svg-scroll-animations`
- [x] "Scroll-driven path morphing with morphTo" — `/blog/scroll-path-morphing`
- [x] "5 scroll animation patterns in under 10 lines" — `/blog/5-patterns-under-10-lines`
- [x] "Replace GSAP ScrollTrigger with scrollAnimate" — `/blog/replace-gsap-scrolltrigger`

---

### v2 APIs (Phase 6 — v2.7.0) ✓
- [x] **Scroll callbacks** — `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` on `ScrollDrawOptions` + `ScrollAnimateOptions`
- [x] **`scrollPin`** (`svg-scroll-draw/pin`) — pin elements at a viewport position with wrapper-based layout, `pinDistance`, `top`, full lifecycle callbacks, `refresh()`
- [x] **`scrollSnap`** (`svg-scroll-draw/snap`) — JS section snapping with custom easing, threshold, `snapTo()`, `getCurrentIndex()`, `onSnap`
- [x] **`createLenisAdapter`** (`svg-scroll-draw/lenis`) — Lenis v1 adapter that patches `window.scrollY`

---

## Remaining

Removed from this section because they shipped: the `/vs-gsap` page (library and
demo site), horizontal scroll sections (`scrollHorizontal`), velocity detection
(`velocityScale`), `scrollPin` ResizeObserver auto-refresh, and the
scrollPin/scrollSnap demos and blog post.

Work is now ordered by `PHASE-2-PLAN.md`, whose premise is that correctness comes
before reach: every bug found in Phase 1 was invisible to jsdom, and five came out
of examining a single API in a real browser.

### Correctness (Phase 2, Priorities 1–3)
- [x] Browser coverage for `scrollReveal`, `scrollPin`, `scrollSnap`, `scrollText`, `scrollCounter`, `scrollProgress`, `scrollParallax`, `scrollVideo`
- [x] Mutation harness proving each new test fails against a deliberately broken build (63 mutations)
- [x] `scrollHorizontal` — reduced-motion decision (keeps scrubbing), the zero-length-trigger fix, and browser tests
- [x] Browser tests for Group / Sequence / Timeline and `Cinematic` — found and fixed the sequence cursor walking off the end (a finished sequence reported 0%)
- [x] Parity test for `scrollAnimate`'s own native CSS fast path — found and fixed both fast paths running the CSS *keyword* instead of this library's easing curve, up to 0.069 apart. Priority 1 is complete: 118 browser tests per engine
- [x] **Framework wrapper e2e** — all 8 mounted for real and held to one contract (mount, unmount without leaks, re-mount, option reactivity), plus an SSR suite with no DOM at all. Found the web component crashing any server-side import, the CDN bundle tree-shaking that component away entirely, and Astro's auto-init throwing in frontmatter
- [x] Expose `refresh()` on `scrollDraw` — and on `scrollDrawTimeline` and the group APIs, on both engine paths
- [x] Ship a `*.dev.js` CDN build — and define the flag to `false` for the production one, so the warnings are dropped rather than shipped and skipped
- [x] Ratchet coverage: `group` 50% → 96%, `snap` 81% → 95%, `text` 80% → 96%, `devtools` 47% → 95%; overall 85% → 91%. Writing the `text` tests found `split: 'lines'` deleting the spaces between words

### Release (Phase 2, Priority 6)
- [x] Push `phase0-production-ready`
- [x] Cut 2.10.0 — user-visible fixes plus new behaviour, no breaking API change
- [x] CI green remotely — every release run (2.15.2, 2.15.3) runs the browser suite on GitHub Actions before it publishes
- [x] `npm publish` through the provenance-signed workflow — 2.10.1, 2026-10-30
- [x] 2.10.1 staged: devtools registry fix, npm README and site claims corrected, `check-claims` widened to every public file

### Reach (Phase 2, Priorities 4–5 — deliberately after the above)
- [ ] **Naming decision** — repo `ink-scroll`, package `svg-scroll-draw`, docs "a scroll animation platform". 21 entry points, most unrelated to SVG; nobody searching npm for "scroll reveal" finds `svg-scroll-draw`. Recommended: publish under a new name, keeping `svg-scroll-draw` as a deprecated alias that re-exports.
- [x] **Migration guides** from GSAP ScrollTrigger, AOS, ScrollReveal.js and vivus — five on `/guides`
- [x] **Real-world recipes** instead of option tables, built into the example pages that already target each search (steps with figures, complete files tested in a browser, pitfalls): animated logo ✓ (`/examples/logo-reveal`, 2.17.1), sticky feature section ✓ (`/examples/scroll-pin`), animated stat row ✓ (`/examples/scroll-counter`), scrubbed explainer video ✓ (`/examples/scroll-video`, with `scrollVideo` `triggerElement` in 2.18.0), horizontal case-study strip ✓ (`/blog/horizontal-scroll-sections`, with `scrollHorizontal` following the layout in 2.18.1)
- [x] README size tables generated by `npm run size -- --write` and checked by `--check` (2.16.0)
- [x] StackBlitz starters (`examples/vanilla`, `examples/react`) linked from both READMEs
- [x] Firefox native path measured: `firefox-native` e2e project enables the Gecko pref on Playwright's Firefox 153 and runs both parity suites (15 tests). Fold it back into `firefox` once Playwright bundles Firefox 159+ (1.64.1 ships 157)
- [x] Types fixed for node16/nodenext ESM (`.d.mts` under `import`) and node10 (`typesVersions`); `attw` reports no problems
- [x] Shared ESM chunks between entries (2.16.0): one tsup config with `splitting`; `size.mjs` counts imported chunks; main + `/react` 18.1 → 13.2 KB as shipped files
- [x] `/vs-gsap` title under 60 chars, comparison table above the fold; every page title ≤ 60 chars, brand once
- [x] Copy-paste blocks (`/blocks`, shadcn registry, 5 blocks) and an agent skill (`skills/svg-scroll-draw`)
- [x] AOS drop-in (`svg-scroll-draw/aos`), parity-tested against AOS 2.3.4 — AOS has 383k weekly downloads and no release since 2.3.4
- [x] Idle-cost e2e test counts update-body runs instead of milliseconds — no more Firefox flake, no retries
- [x] ScrollReveal drop-in (`svg-scroll-draw/scrollreveal`), MIT, inline styles matched byte for byte against 4.0.9
- [x] vivus drop-in (`svg-scroll-draw/vivus`), SVG markup matched exactly against vivus 0.4.6 (last release April 2021); `/vs-vivus` page
- [x] `npx svg-scroll-draw migrate` — one-command switch from AOS / ScrollReveal / vivus
- [x] React / Next.js hooks for the drop-ins (`useAOS` + `<AOSInit />`, `useScrollReveal`, `useVivus`)
- [x] On-site migration guides (`/guides`): AOS in Next.js / React, ScrollReveal in React, vivus in React, GSAP ScrollTrigger in React
- [ ] Check Search Console in ~2 weeks for /guides/* and /vs-* impressions and clicks
- [x] Sitemap dates derived from git for generated pages too (35 pages were "Discovered – not indexed" with stale dates)
- [x] Titles and descriptions for the page-one, no-click pages (`/docs`, `/vs-locomotive-scroll`, `/lenis-scroll-animation`, scroll-pin post)
- [x] A star ask at the moment of delight: the homepage finale constructs a star by compass and scroll, with the live count
- [x] Share card (og:image) on every indexable page, in the current design — 57 of 64 had none
- [x] Structured data: `WebSite` + `SoftwareApplication` on home, breadcrumbs on every page, page data on the pages that had none (FAQ/HowTo rich results are limited by Google since 2023; existing ones kept)
- [ ] Bing Webmaster Tools + IndexNow on deploy
- [x] `/nextjs-scroll-animation` (position 24, the most impressions after home): full App Router example, FAQ, more internal links
- [x] Ship `"use client"` on `svg-scroll-draw/react` (as the drop-in hooks already do) so Server Components can render `<ScrollDraw>` directly (2.16.1)
- [x] Framework wrappers follow option changes — React, Vue, Nuxt, Solid, Svelte rebuild on a real change and keep the engine for equal options; Angular `update()` for `ngOnChanges` (2.17.0)
- [ ] Astro and `<scroll-draw>` still read their options once: a `MutationObserver` on the data attributes / `observedAttributes` would close it
- [x] ~~Dev warning for unsupported trigger strings~~ — decided against (2026-11-04). In the parser it moved the main entry 10.7 → 10.8 KB; noted for `/devtools` it still moved scrollReveal 5.0 → 5.1 KB. The docs list the supported forms (`top`/`center`/`bottom` + percentages) instead
- [ ] Request indexing for the 35 unindexed pages, ~10 a day (sitemap resubmitted 2026-11-04: 64 discovered); re-check Page indexing in ~2 weeks
- [x] Homepage redesign — every chapter a blueprint-grade drawing of a real use case (fountain-pen hero, gallery, watch, proof sheet, balance, API plates, gauges, circuit board, before/after windows, live GitHub + npm stats, drawing-sheet footer), scoped under `.home`
- [x] Showcase sites — one real demo site per example (all 23), linked from the examples pages; 19 rebuilt to industry level, Aural (scroll-video) sets the bar with a rendered product film
- [x] Carry the homepage's look to every page through `SiteShell` — /docs, /examples (+ detail pages), /guides (+ each guide), /blog (+ all 12 posts on one article frame), /blocks, /changelog, /playground, /verify, all seven vs-* pages, the six framework landings and the React / Next.js / Lenis landings; the old ink-bottle mascot is off every page
- [x] Dead code deleted: the ink-preview `*.codes.ts`, `PlaygroundV2Tab.tsx`, every pre-redesign demo component nothing imported, the old `MobileMenu` / `ThemeToggle`, and the mascot with its CSS — 32 files; the 404 page moved into `SiteShell`
- [x] StackBlitz "already migrated" starters for each drop-in, linked from the comparison pages and READMEs
- [ ] More blocks (the registry pattern grows by count), and a Vue/Svelte flavour of each
- [x] One nav for every page — `SiteShell` renders `HomeNav`, which links `/blocks`
- [x] Every page linked from every page — nav "More" menu, phone-menu groups and a footer index, one list built from the page data; `check-nav` guards new routes
- [x] Jump-scroll asymmetry documented in `/docs` (native CSS section), not only in a test comment
- [x] `/verify` section 15 — named-easing parity on both engines; the 0.83 was the page's harness, not the library
- [x] Demo lint clean (52 → 0) and enforced in CI and `verify`, with `check-jsx-text` guarding SWC's dropped spaces

---

## Priority Order

1. ~~Finish Priority 1 browser coverage~~ — done: Group / Sequence / Timeline, Cinematic and `scrollAnimate` native parity all covered, two defects out of it
2. ~~Framework wrapper e2e~~ — done: all eight, plus SSR. "Thin adapter" turned out to be hiding two crashes
3. ~~Correctness debt~~ — done. Remaining: green CI, then publish 2.10.0
4. Rename, then migration guides and recipes — highest-intent traffic, and now it would be built on verified code
