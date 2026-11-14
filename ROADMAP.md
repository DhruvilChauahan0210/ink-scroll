# svg-scroll-draw — Roadmap

> Last updated: 2026-11-14 — 2.27.1 prepared (Vue refs that bind, four starters); 2.27.0 on npm
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
- [x] `easing` — linear, ease-in/out, spring, bounce, elastic, custom function; a CSS `cubic-bezier()` string or `ease` in every engine, unknown strings warn in development (2.26.0)
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
- [x] `scrollFrames` — an image sequence scrubbed on a `<canvas>` (coarse-to-fine loading, nearest frame, cover/contain, DPR buffer), ships as `svg-scroll-draw/frames` (2.24.0)
- [x] `scrollText` — text split + reveal animation on scroll, ships as `svg-scroll-draw/text`
- [x] `ScrollVideo` + `ScrollText` React wrappers
- [x] `<ScrollFrames>` for React and Vue (Nuxt re-exports it; Vue `useScrollFrames`) (2.25.0)
- [x] scrollFrames for Svelte (`scrollFramesAction`), Solid (`useScrollFrames`) and Angular (`ScrollFramesRef`) (2.26.0)

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
- [x] `/examples` — 24 examples with framework filter (All / React / Vue / Svelte / Solid / Vanilla / API)
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
- [x] Live stats keep their last good figures when GitHub refuses; lifetime npm downloads, as a figure and as the chart (all time, or the last 30 days); a per-day read-out (hover, tap, keys)

---

## Remaining

### Reach (Search Console, 2026-11-11)

- ~~AOS animation gallery~~ — `/aos-animation`, 2026-11-11.
- ~~Text animation generator~~ — `/text-animation-generator`, 2026-11-11.
- ~~SVG path tool~~ — `/svg-path-viewer`, 2026-11-11.
- ~~Autoplay seek/progress with a stagger~~ — fixed in 2.23.2. The no-stagger stop seen in the viewer was autoplay taking the native path, fixed in 2.23.3.
- ~~More tools~~ — `/tools` and 19 new tools (22 in all), 2026-11-11; the tool kit in every tool and three more (SVG path editor for "svg path editor", 316 Bing searches; typewriter; scroll video scrub), 2026-11-12: 25 in all.
- ~~The IntersectionObserver gate in scrollDraw, scrollCounter, scrollText, scrollVideo and useScrollDrawProgress~~ — 2.23.5 (shared core/frame-gate); Cinematic in 2.23.7.
- ~~Scroll image sequence (Apple-style frames on a canvas)~~ — `scrollFrames` in 2.24.0, with `/scroll-image-sequence-generator` (26 tools), the `/examples/scroll-frames` recipe and the Groundtrack showcase on NASA's public-domain Landsat 8 frames, and the post `/blog/scroll-image-sequence-animation`, 2026-11-13.
- ~~scrollFrames framework wrappers for React and Vue~~ — `<ScrollFrames>` in 2.25.0 (Nuxt re-exports it), and the generator's React tab writes it, 2026-11-13.
- ~~scrollFrames wrappers for Svelte, Solid and Angular~~ — 2.26.0, 2026-11-13.
- ~~CSS `cubic-bezier()` strings as `easing`~~ — they silently ran as the default; every engine and the native path take them in 2.26.0, 2026-11-13.
- ~~The Lenis story~~ — Lenis 1.x scrolls the real page and needs no adapter; the docs, the Lenis page and the Locomotive comparison said otherwise, corrected with the adapter's `destroy()` fix in 2.26.0, 2026-11-13.
- ~~WebKit cap dot on undrawn paths~~ — the draw dash is `L 2L` in every engine, 2.26.0, 2026-11-13.
- ~~`ScrollCounter` empty in server HTML~~ — React and Vue render the final number, 2.26.1, 2026-11-14.
- ~~scrollAnimate clip-path tuples~~ — they were written in a syntax browsers drop; fixed with a smaller interpolator, 2.26.2, 2026-11-14.
- ~~scrollSnap Next twice in one glide; onSnap again on the last section~~ — 2.26.2, 2026-11-14.
- ~~scrollVideo time outside [from, to] under overshooting easings~~ — clamped, 2.26.2, 2026-11-14.
- ~~A real Nuxt module~~ — `modules: ['svg-scroll-draw/nuxt']`, auto-imports, no dependencies, 2.27.0, 2026-11-14.
- ~~Starters for Vue, Nuxt, SvelteKit and Solid~~ — `examples/`, on StackBlitz, 2.27.1, 2026-11-14 (with the Vue `:ref` fix they turned up).
- Next for Nuxt: the nuxt.com/modules listing (owner reopens nuxt/modules#1744 in their own words). The real-Nuxt check runs in CI (job `nuxt`).
- ~~Awesome-list PRs (shadcn, web components, UI component libraries)~~ — opened 2026-11-13.
- Next: the GSAP benchmark's full ~1 h run on `feat/gsap-bench` (idle machine); request indexing for the new pages (Google takes about 2 a day) and review them in Search Console after 2–3 weeks; a shadcn directory listing (logo ready, needs signed commits by the owner); links to inner pages (tools, posts), which Search Console shows as the bottleneck: 9 external links, all to the home page.
- ~~Stacking cards and scroll marquee generators~~ — `/stacking-cards-scroll-generator` and `/scroll-marquee-generator` (28 tools), 2026-11-13.
- ~~Handwriting animation generator~~ — `/handwriting-animation-generator` (29 tools), Hershey single-stroke fonts, 2026-11-13.
- scrollDraw on round-capped paths in WebKit: a dot at the end of each path not yet drawn (the dash's gap equals the length, so the next, empty dash starts at the end). Write the gap as twice the length, with a browser test that counts pixels before the draw; then the handwriting generator's scroll version can go back to round caps.
- Measure the tools before building more: `npm run report:numbers` weekly, Search Console per page after 2–3 weeks; improve the ones with impressions and few clicks.
- GitHub Sponsors: the owner sets up the profile; the footer link and FUNDING.yml are on the branch. Ads: not at this traffic (see the 2026-11-11 discussion: about $1–5 a month, a consent banner, Vercel Hobby is non-commercial); revisit a single developer ad network (Carbon, EthicalAds) past ~10k views a month on a custom domain.
- ~~Awesome-list PRs~~ — nine opened 2026-11-11 (see STATUS); follow up on review comments.
- The JavaScript Weekly / React Status / Frontend Focus submission forms (text in `reports/link-submissions-2026-11-11.md`); Best of JS once the repo has more stars. Only 8 external links today, and 42 pages are never crawled.
- Request indexing for the 42 "Discovered – not indexed" pages, ~10 a day.
- ~~README hero media and star calls to action~~ — five loops of the real site in `.github/media/`, both READMEs lead with the hero and a quick start, and a "Star on GitHub" closes every tool and blog post, 2026-11-13. Next: watch stars and installs over 2–3 weeks (`npm run report:numbers`) before adding more.
- ~~Vercel Web Analytics~~ — component added 2026-11-11; the owner enables it in the Vercel dashboard.
- Optional: a custom domain instead of `*.vercel.app`.

### Demo Site

#### ~~`/blog` index page~~ — ✓ shipped
`/blog/page.tsx` exists with post card listing. "Blog" added to all nav instances.

#### ~~More demo examples~~ — ✓ shipped
24 examples including logo reveal, line chart, signature, flowchart, map route, network diagram, group, sequence, timeline, Vue, Svelte, Solid and a scroll image sequence.

#### More blog posts — ongoing
- [x] "Zero-JS SVG scroll animations with native CSS" — `/blog/native-css-svg-scroll-animations`
- [x] "Scroll-driven path morphing with morphTo" — `/blog/scroll-path-morphing`
- [x] "5 scroll animation patterns in under 10 lines" — `/blog/5-patterns-under-10-lines`
- [x] "Replace GSAP ScrollTrigger with scrollAnimate" — `/blog/replace-gsap-scrolltrigger`
- [x] "Split-text animation a screen reader can read" — `/blog/accessible-split-text-animation` (2026-11-06)
- [x] "Reduced motion for scroll animations, effect by effect" — `/blog/reduced-motion-scroll-animations` (2026-11-06)

---

### v2 APIs (Phase 6 — v2.7.0) ✓
- [x] **Scroll callbacks** — `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` on `ScrollDrawOptions` + `ScrollAnimateOptions`
- [x] **`scrollPin`** (`svg-scroll-draw/pin`) — pin elements at a viewport position with wrapper-based layout, `pinDistance`, `top`, full lifecycle callbacks, `refresh()`
- [x] **`scrollSnap`** (`svg-scroll-draw/snap`) — JS section snapping with custom easing, threshold, `snapTo()`, `getCurrentIndex()`, `onSnap`
- [x] **`createLenisAdapter`** (`svg-scroll-draw/lenis`) — patches `window.scrollY` for a scroller that keeps a virtual position (Lenis 1.x scrolls the real page and needs none); `destroy()` restores the browser's property (2.26.0)

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
- [x] Mutation harness proving each new test fails against a deliberately broken build (92 mutations; `--anchors` in verify and CI)
- [x] A staggered drawing finishes (2.19.1): followed off screen until its last window ends, and fitted to the page's end where the page is too short
- [x] `scrollPin` `pinDistance: '150vh'` (2.20.0), measured as CSS's vh: follows rotation, not a phone's address bar; numbers stay pixels
- [x] Reduced motion turned on mid-visit applies at once in every engine (2.22.0), the drop-ins included (2.23.0): each finishes as a page loaded under it would, one way only
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
- [x] **Distinct framework pages** — Vue, Nuxt, Svelte, Solid, Angular and Astro each get three sections of their own on how the wrapper works (`data/framework-guides/`, written from the source and independently reviewed), their own entry size, and no shared Size prose: text shared with another of the six fell from 40–50% to 9.5–15.9% (word 5-grams, measured)
- [x] README size tables generated by `npm run size -- --write` and checked by `--check` (2.16.0)
- [x] StackBlitz starters (`examples/vanilla`, `examples/react`) linked from both READMEs
- [x] Firefox native path measured: the `firefox-native` e2e project enabled the Gecko pref on Playwright's Firefox 153 and ran both parity suites (15 tests); folded back into `firefox` with Playwright 1.65.0, whose Firefox 159 takes the fast path with no prefs (2.19.1)
- [x] Types fixed for node16/nodenext ESM (`.d.mts` under `import`) and node10 (`typesVersions`); `attw` reports no problems
- [x] Shared ESM chunks between entries (2.16.0): one tsup config with `splitting`; `size.mjs` counts imported chunks; main + `/react` 18.1 → 13.2 KB as shipped files
- [x] `/vs-gsap` title under 60 chars, comparison table above the fold; every page title ≤ 60 chars, brand once
- [x] Copy-paste blocks (`/blocks`, shadcn registry, 9 blocks with 2.19.0's site work, run in a browser by `test:blocks`) and an agent skill (`skills/svg-scroll-draw`)
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
- [x] IndexNow on deploy — `.github/workflows/indexnow.yml` sends the changed sitemap URLs after each production deploy; the sitemap's dates are checked against git in CI (2026-11-06)
- [x] Every page passes axe (WCAG 2.1 A/AA) and every internal link resolves — `test-a11y.mjs`, in CI (2026-11-06)
- [x] Every page gives a crawler a full set: title, description, canonical, one h1, preview image, JSON-LD, two or more inbound links — `test-seo.mjs`, in CI (2026-11-06)
- [x] ~~`/docs` as server-rendered content with client islands~~ — tried 2026-11-06 and reverted: as a Server Component with a client sidebar it shipped 27 KB less JS but 41 KB more HTML (React's server payload repeats the content), and measured the same main-thread work (script 193 → 188 ms, all tasks 895 → 939 ms at CPU 4×, median of 7) with LCP the same or slightly worse. The script time is React, the router, the drawings and the copy buttons, not the content
- [x] No AI-looking UI by heydamir/unslop's rules: site, blocks and showcase (branch `fix/unslop-polish`, 2026-11-07)
- [ ] Bing Webmaster Tools (owner): add and verify the site — Bing refused IndexNow with 403 "UserForbiddedToAccessSite" from the third run on (2026-11-06; the workflow now warns instead of failing) — then watch submissions there
- [x] `/nextjs-scroll-animation` (position 24, the most impressions after home): full App Router example, FAQ, more internal links
- [x] Ship `"use client"` on `svg-scroll-draw/react` (as the drop-in hooks already do) so Server Components can render `<ScrollDraw>` directly (2.16.1)
- [x] Framework wrappers follow option changes — React, Vue, Nuxt, Solid, Svelte rebuild on a real change and keep the engine for equal options; Angular `update()` for `ngOnChanges` (2.17.0)
- [x] Astro and `<scroll-draw>` follow their options (2.19.0): `observedAttributes` on the element, a `MutationObserver` on Astro's JSON attribute, and one engine per element when the scanner runs again
- [x] ~~Dev warning for unsupported trigger strings~~ — decided against (2026-11-04). In the parser it moved the main entry 10.7 → 10.8 KB; noted for `/devtools` it still moved scrollReveal 5.0 → 5.1 KB. The docs list the supported forms (`top`/`center`/`bottom` + percentages) instead
- [ ] Request indexing for the 35 unindexed pages, ~10 a day (sitemap resubmitted 2026-11-04: 64 discovered); re-check Page indexing in ~2 weeks
- [x] Homepage redesign — every chapter a blueprint-grade drawing of a real use case (fountain-pen hero, gallery, watch, proof sheet, balance, API plates, gauges, circuit board, before/after windows, live GitHub + npm stats, drawing-sheet footer), scoped under `.home`
- [x] Showcase sites — one real demo site per example (all 24), linked from the examples pages; 19 rebuilt to industry level, Aural (scroll-video) sets the bar with a rendered product film
- [x] Carry the homepage's look to every page through `SiteShell` — /docs, /examples (+ detail pages), /guides (+ each guide), /blog (+ all 12 posts on one article frame), /blocks, /changelog, /playground, /verify, all seven vs-* pages, the six framework landings and the React / Next.js / Lenis landings; the old ink-bottle mascot is off every page
- [x] Dead code deleted: the ink-preview `*.codes.ts`, `PlaygroundV2Tab.tsx`, every pre-redesign demo component nothing imported, the old `MobileMenu` / `ThemeToggle`, and the mascot with its CSS — 32 files; the 404 page moved into `SiteShell`
- [x] StackBlitz "already migrated" starters for each drop-in, linked from the comparison pages and READMEs
- [x] Vue and Svelte flavours of each block (`registry/vue/`, `registry/svelte/`; `/r/vue/…`, `/r/svelte/…`; both compiled and run in CI) — four more React blocks landed in 2.19.0's site work (pinned feature tour, horizontal case strip, video scrub, reading progress). shadcn-vue takes React-shaped items at their own URL; shadcn-svelte needs `content` + `target` and no `path`, so each framework gets its own item (`/r/vue/…`, `/r/svelte/…`). Svelte is not installed in the repo yet, which the tests need
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
