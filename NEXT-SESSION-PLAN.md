# Next Session Plan — svg-scroll-draw

> Updated: 2026-11-05 — **2.18.0 ready to tag** (`scrollVideo` `triggerElement`; four recipes). **2.17.1 published** (`v2.17.1` on `ed77b58`: `once` keeps `stagger`; the logo example is a full recipe). Recipe 2, the pinned feature tour on `/examples/scroll-pin`, is done (site-only). **2.17.0 published** (`v2.17.0` on `d7b03b2`: the React, Vue, Nuxt, Solid and Svelte wrappers follow option changes, Angular gets `update()` for `ngOnChanges`). **2.16.1 published** (`v2.16.1` on `b3eb52a`) (`svg-scroll-draw/react` ships `"use client"` so Server Components render `<ScrollDraw>` directly; all 56 mutations run again). **2.16.0 published** (`v2.16.0` on `fde9f4c`: ES module entries share code through chunks — main + react 18.1 → 13.2 KB; the drop-ins share one instance with their React hooks; size tables generated; main entry 10.7 KB as shipped files). **2.15.3 published** (`v2.15.3` on `acc9acc`: scrollReveal's `stagger` is a fraction of the reveal window, per row, on top of a custom trigger; 2.15.2 before it kept scrollVideo's end frame under reduced motion). Every page is linked from every page (nav "More", phone menu, footer index — `components/site/sitemap.ts`, guarded by `check-nav`). Sitemap dates come from git for every URL, generated groups included — Search Console (2026-11-04) had 20 indexed, 35 "Discovered – not indexed" (never crawled), 2 "Crawled – not indexed". The native CSS path is no longer described as compositor work anywhere, and `/vs-aos` quotes the reveal entry and the real presets. Every page is on the homepage design and all 23 showcase sites are built — in `32f3409`, on `main`.

---

## Current state (2026-10-30)

**2.10.1 is on npm** (`latest`, signed provenance via `release.yml`). It shipped
the shared devtools registry and the claims pass. The GitHub release page for
`v2.10.1` was not created (the job had `contents: read`, now `write`).

**2.10.2** shipped the day-2 work — see its CHANGELOG entry: `/blocks` + shadcn registry, agent skill, site-wide title fixes,
the ESM types fix, the `scrollVideo` re-seek fix, `<scroll-draw once>`, and the
`firefox-native` e2e project.

Numbers that set the priorities (Search Console and npm, 2026-10-30): 4,020
lifetime downloads, ~170 a month; 5 GitHub stars; 147 Google clicks in five
months, 81% to the homepage; `/vs-gsap` at position 11 with 425 impressions.

### Showcase sites (all 23 built, not yet deployed)
- Each example has a complete demo site for a fictional company under `/showcase/<slug>`,
  linked from its card and its page. The owner wants real products, not this site's ink
  style. Sites 5–23 are built on the shared frame in `src/showcase/kit` (`Site`, `Hero`,
  `Sec`, `Pricing`, `Quote`; brand variables on each site's root class, defaults in
  `:where(.sk)` so the site always wins).
- To change one: edit `src/showcase/<slug>/`; recapture its card image with Playwright
  at 1280×800 ×1.5, demo tab hidden and the nav made opaque, framed where the effect is
  drawn (not always the hero). Save it as `public/showcase/<slug>-<sha8>.webp` — the hash
  busts Next's image cache, a same-name file keeps serving the old picture — and point
  `SHOWCASE` in `src/showcase/index.ts` at it. Card copy and code live in
  `components/examples/scenes/data.ts`.
- The ink previews in `components/examples/ink/` are only used now for the `preview`
  field, which no card shows while a site exists (their `*.codes.ts` are deleted).
- Fictional brands only, no real logos; realistic copy; check desktop and 390px.

### Gotcha: intermittent Vercel production failures
- Twice on 2026-10-31 a production build failed (~3 min in) while the preview build of
  the same commit passed and local `vercel-build` passed; an identical re-run succeeded
  the first time. The logs need a Vercel login (the CLI isn't installed here). If it
  keeps happening, read the log in the dashboard before changing anything.

### Gotcha on this laptop
- The network intercepts TLS, and Node rejects api.github.com's certificate, so a
  plain `npm run dev` keeps serving a stale cached GitHub response. Run the dev server
  (and any local `vercel-build`) with `NODE_OPTIONS=--use-system-ca` (Node ≥ 22.15).
  Don't put that flag in package.json: CI runs Node 20, which rejects it.
- Optional: a `GITHUB_TOKEN` env var on Vercel lifts GitHub's anonymous rate limit
  for the live stats chapter; it works without one.

### In flight
- **Every page into the homepage's design, one page at a time, each pushed live.**
  Wrap the route in `components/site/SiteShell` (nav, tokens, sign-off footer), add
  the route to `components/site/routes.ts` (keeps the mascot off it), give the page
  a `pg-head` opening and restyle its own pieces (shared: `CodeBox` listings,
  `Plate` previews, `tb` title strips, `pill`s). Done: `/docs`, `/examples` (+ detail), `/guides` (+ each guide).
  Also shared: `StepRail` (an inked procedure rail). Next, in order: `/blocks`, `/blog` (+ posts), the
  `vs-*` pages (one `VersusPage` template), `/changelog`, `/playground`, the
  framework landing pages, `/verify`.

### Shipped since
- **Homepage redesign** (site-only, live from `main` at 760bfb6, 2026-10-31): every
  drawing a real use case, inked by the library over a pencil underdrawing — an
  exploded fountain-pen hero that assembles on scroll, the use-case gallery, the
  watch-movement chapter, a red-pen proof sheet, GSAP weighed on a balance, API
  blueprint plates, test gauges, a framework circuit board, before/after windows for
  the drop-ins, the project counted live (GitHub + npm, a 30-day download line, a
  "checked" timestamp) and an engineering-sheet footer; a glass nav that never moves;
  dark by default. Rejected along the way (don't revisit): SaaS cards, giant editorial type,
  generative ink, a torus knot, topo rings, railway/plug/camera metaphors for chapter 08.
- `/guides` — five migration guides, live from `main` (site-only).

- **2.15.1** — the "Element has no stroke" dev warning reads the computed stroke, so
  paths stroked from CSS (the whole homepage) stop flooding the console.
- **2.15.0** — React / Next.js hooks for the drop-ins: `useAOS` + `<AOSInit />`,
  `useScrollReveal`, `useVivus` (all `"use client"`). StackBlitz starters for each
  drop-in are live from `main`.
- **2.14.0** — `npx svg-scroll-draw migrate`: one command to switch from AOS,
  ScrollReveal or vivus.
- **2.13.0** — `svg-scroll-draw/vivus`, the vivus drop-in, with an exact
  SVG-markup parity suite against vivus 0.4.6, and the `/vs-vivus` page.
- **2.12.0** — `svg-scroll-draw/scrollreveal`, the MIT ScrollReveal drop-in, with a
  byte-for-byte inline-style parity suite against ScrollReveal 4.0.9.
- **2.11.0** — `svg-scroll-draw/aos`, the AOS drop-in, with a side-by-side parity
  suite against AOS 2.3.4. Watch npm weekly downloads for its effect.

### Next, in order
1. Create the `v2.10.1` GitHub release page by hand (its job lacked
   `contents: write`). From 2.10.2 the workflow creates it.
2. Re-check Search Console in ~2 weeks for the new titles (`/vs-gsap`, home,
   React, Next.js), and Page indexing for the 35 "Discovered – not indexed"
   pages (sitemap resubmitted 2026-11-04, 64 discovered). Request indexing
   for them ~10 a day; the 2026-11-04 attempt hit the daily quota. Also compare
   CTR on `/docs`, `/vs-locomotive-scroll`, `/lenis-scroll-animation` and the
   scroll-pin post, whose titles changed on 2026-11-04.
   Watch GitHub stars after the homepage finale (shipped 2026-11-04).
3. Astro and `<scroll-draw>` still read their options once (2.17.0 made the
   other six wrappers live) — a `MutationObserver` / `observedAttributes` would close it.
4. Recipes, one at a time, on the pages that already target each search
   (pattern: `src/recipes/<slug>/` files + `components/recipes/recipes.tsx`
   steps and pitfalls + a check in `scripts/test-recipes.mjs`). Done: logo
   (`/examples/logo-reveal`), pinned feature tour (`/examples/scroll-pin`),
   stat row (`/examples/scroll-counter`), pinned film (`/examples/scroll-video`).
   Next: horizontal strip (`/blog/horizontal-scroll-sections`).
   Then more distinct framework pages and more blocks.
5. Fold `firefox-native` into `firefox` once Playwright bundles Firefox 159+.

---

## State at 2.10.0 (2026-08-14)

**2.10.0 is published (npm `latest`) and merged to `main`, tagged `v2.10.0`.
Phase 2 is complete — every priority, not just the coverage ones.**

Published by hand rather than through the release workflow, so this version has
no provenance attestation. Verified after the fact by unpacking the tarball from
the registry: both CDN builds present, `<scroll-draw>` registering in the
production one, and the corrected easing curves in `dist/index.mjs`.

Every entry point the package exports now has real-browser coverage in Chromium,
Firefox and WebKit, plus an SSR suite that runs with no DOM at all. The mutation
harness proves each new test fails against a deliberately broken build.

Ten defects came out of writing that coverage. The ones a user would have hit:

- **Both native fast paths ran the wrong easing curve** — the CSS keyword of the
  same name, which is a different curve, up to **0.069** apart. On
  `scrollAnimate`'s default easing, so Chrome and Safari rendered the same page
  differently.
- **The CDN bundle silently dropped `<scroll-draw>`** — `sideEffects` listed only
  the built output, so the bundler tree-shook the custom element out of the exact
  file the README tells CDN users to load.
- **Importing the web component on a server crashed the render** —
  `extends HTMLElement` at module scope, evaluated on import.
- **Re-measuring while scrolled moved the trigger window** for every
  `scrollContainer` caller: a `scrollHorizontal` strip scrubbed halfway snapped
  back to its first panel on a resize. Three engines, three copies of the same
  arithmetic.
- **`split: 'lines'` deleted the spaces between words** — "Every word here"
  rendered as "Everywordhere". Invisible in jsdom, where there is only ever one
  line.
- **A finished sequence reported 0% progress**, and its `pause`/`resume`/`seek`
  became silent no-ops.
- Plus: `scrollHorizontal`'s default distance ignoring `scrollContainer`,
  `scrollDrawTimeline.destroy()` leaving paths frozen mid-draw, its time-driven
  `loop` ignoring `prefers-reduced-motion`, and Astro's auto-init throwing in
  server frontmatter.

Unit coverage was ratcheted alongside: `group` 50→96%, `snap` 81→95%, `text`
80→96%, `devtools` 47→95%, overall 85→91%.

---

## What is left

### 1. Release follow-ups — done
- [x] `NPM_TOKEN` is in repo secrets: every release since 2.10.1 is a tag push,
      published by `release.yml` with signed provenance (latest: 2.15.3).
- [x] The workflow runs the browser suite remotely before publishing, on every
      release tag.
- [x] `release.yml` has a concurrency group per tag (2026-11-01): re-pushing a
      tag queues a second run instead of racing the first to `npm publish`.

### 2. Accuracy pass on the comparison pages — done
- [x] `CLAIMS-AUDIT.md` items: GSAP is described as free since 2025 everywhere
      (`/vs-gsap`, `data/competitors.ts`); AOS 6.7 KB and ScrollReveal 5.6 KB
      (GPL-3.0) are quoted as smaller than us.
- [x] 2026-11-01: the native CSS path is no longer called compositor work —
      `stroke-dashoffset` repaints on the main thread; what goes away is the
      per-frame script. Fixed on the native, performance and GSAP DrawSVG
      posts, the 2026 guide, `/docs`, the homepage, the Next.js landing,
      `llms.txt`, the root README and the `native` option's JSDoc. The native
      post's figure and scenario table are redrawn to match.
- [x] 2026-11-01: `/vs-aos` quotes the reveal entry (not the full bundle) and
      the seven real presets (`REVEAL_PRESETS` in `data/facts.ts`, held to the
      library by check:claims); AOS's stylesheet and Framer Motion's bundle
      come from `data/competitors.ts` (`cssKb`, `bundleKb`).

### 3. Site catch-up — `/verify` stops three fixes short
`/verify` is the page that shows each claim being true in a real browser, and it
still ends at the horizontal-scroll fix. Missing sections, in rough order of how
convincing they are:

- [x] A finished `scrollDrawSequence` reporting 100%. **Done (2026-08-15)** —
      section 13, `SequenceCompletionProof`. Measures 1.000 with `onComplete`
      fired, live.
- [x] `split: 'lines'` keeping its spaces. **Done (2026-08-15)** — section 14,
      `SplitLinesSpacingProof`. Counts whitespace before and after the split;
      currently 11 and 11.
- [x] Native-vs-JS easing parity — **section 15, live (2026-11-01).** The 0.83
      below was the page's harness: the native cell's React key was its label,
      which changes once support is detected, so React replaced the cell after the
      library attached. `e2e/parity.spec.ts` already had an ease-out case passing
      on every engine. Keyed by role it reads 0.0001. Kept below as the record.
      What follows is the original write-up, from when it was **built, withheld,
      and turned up a number that needed explaining before it shipped.**

      `EasingParityProof` in `apps/demo/src/components/VerifyPhase3.tsx` is
      written and works; it is deliberately not wired into `/verify`.

      What it measures, using the same deterministic sweep as
      `LiveParityProof` (step to 10 fixed offsets, wait four frames, read
      `strokeDashoffset` on both):

      | config | worst Δ mid-draw |
      |---|---|
      | `{ native: true }` vs `{ native: false }` — section 06's control | **0.0000** |
      | the same, plus `easing: 'ease-out'` on both | **0.8271** |

      One variable changed. Reproduce by wiring the component into `/verify`
      and pressing "Run the sweep" in a browser with
      `animation-timeline: view()` support.

      Why it is not published as a verdict:

      - 0.83 is far too large to be a timing-function difference. Two easing
        curves cannot be 0.83 apart at the same progress. That points at the
        **animation range**, not the curve — the native side appears to finish
        much earlier rather than follow a different shape.
      - `nativeEligible()` allows a named easing through (`cssTiming` is the
        only easing gate) and only the default trigger reaches `buildNative()`,
        so both sides should be walking the same `cover` range.
      - It is one new harness, on one browser, written in the same session. The
        first version of it reported a false 0.86 from compositor commit lag
        before the sweep was made deterministic, which is precisely the trap
        `VerifyPhase1` documents. It may still be measuring wrong.

      Next step is to settle it in the e2e suite rather than in the page:
      extend `e2e/parity.spec.ts` with an `ease-out` case. If it reproduces
      there, it is a real 2.10.x bug in `buildNative`'s range or keyframe
      emission and the fix is a release. If it does not, the harness is wrong
      and should be corrected before the section ships.

The docs page itself is done — it shipped with the release: a v2.10.0 group for
`refresh()`, the timeline's reduced-motion option and the dev CDN build, and the
native-CSS section now names the four easings the fast path accepts and says they
are emitted as this library's curves rather than the CSS keywords. What is
missing is the *demonstration*, which is what `/verify` is for.

### 4. Option reactivity across the wrappers — done (2.17.0)
Decided "re-create on change". React, Vue (+ Nuxt), Solid and Svelte rebuild the
engine when an option really changes and keep it for equal options; Angular has
`update()` for `ngOnChanges`. The comparison is `optionsKey` in
`src/core/reactive.ts` (values compared, functions present/absent, elements by
identity) and callbacks are read live (`liveFns`). The browser suite checks both
halves. Left: Astro and `<scroll-draw>` still read their options once.

### Known browser differences, pinned rather than fixed
- Past the end of a `view()` range, Chromium and WebKit hold the animation's end
  state while **Firefox** treats the now-inactive timeline as unresolved and holds
  the *start* state instead — the same card reads 1 in Chrome and 0 in Firefox.
  Not visible: the `cover` range spans exactly the offsets where any part of the
  element is in the scrollport, so the engines only disagree while it is off-screen,
  and it recovers on the frame it re-enters. `group.spec.ts` asserts that property
  rather than a browser name, so a Firefox fix will not fail the suite.
- The jump-scroll asymmetry from Phase 1 still stands (`parity.spec.ts`), and now
  bites the tests too: the JS engine only writes while the element is intersecting,
  so a spec that jumps *past* a target instead of scrolling through it sees an
  undrawn element. Walk the offsets.

### Conventions worth keeping

- New fixtures go through `e2e/helpers.ts` (deterministic sweep) and
  `e2e/fixtures/_probe.mjs` (parse in the page, assert on numbers in the spec).
- Add a mutation to `scripts/mutation-check.mjs` for every new behaviour asserted.
  A `MISSED` result means either the test is weak or the mutated code is dead — the
  counter's redundant initial write was found exactly that way. There is a third
  case now: a difference too small for a browser test to resolve. Substituting the
  CSS keyword for `ease-in-out` is wrong by 0.0119, inside the 0.02 the parity specs
  must allow for sub-frame timing, so that curve is pinned in
  `src/__tests__/css-easing.test.ts` (tolerance 1e-3) and the harness carries a
  comment saying why it has no browser mutation. Prefer that to loosening a
  tolerance or leaving a permanent MISSED.
- Anything time-driven cannot be checked with a sweep — the replay can start and
  finish between two `read()` calls. `timeline.html` instead has the page count the
  movement itself, every frame, and only counts changes that happen while
  `window.scrollY` did not move: that is the exact claim ("it animated without
  scroll input"), and it cannot be raced.
- Fixture arithmetic assumes the 900x800 viewport pinned per-project in
  `e2e/playwright.config.ts`. Assert the geometry in the first test of each spec so
  a layout drift fails loudly instead of silently sampling the wrong offsets.

---

## What shipped this session (v2.6.0 → v2.7.0)

### Library
- [x] **Scroll callbacks** — `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` on `scrollAnimate` + `scrollDraw`
- [x] **`scrollPin`** (`svg-scroll-draw/pin`) — wrapper-based element pin with full lifecycle callbacks
- [x] **`scrollSnap`** (`svg-scroll-draw/snap`) — JS section snapping with `snapTo()` + `onSnap`
- [x] **`createLenisAdapter`** (`svg-scroll-draw/lenis`) — Lenis v1 `window.scrollY` patcher
- [x] 30 new tests → 388 total, build clean

### Demo site
- [x] **`/vs-gsap` page** — bundle bars, feature matrix (20 rows), side-by-side API code, license comparison, CTA
- [x] **Home page v2 grid** — 3 new cards: `scrollPin`, `scrollSnap`, `onEnter/onLeave`
- [x] **Blog post** — "Pin sections on scroll without GSAP" at `/blog/scroll-pin-without-gsap`
- [x] Blog index updated, bundle chart links to `/vs-gsap`, JSON-LD v2.7.0, MobileMenu v2.7.0

---

## What also shipped this session

- [x] Docs page v2.7.0 section — scrollPin, scrollSnap, Scroll Callbacks, Lenis Adapter (full option tables)
- [x] scrollAnimate docs table updated with onEnter/onLeave/onEnterBack/onLeaveBack
- [x] Docs version badge → v2.7.0
- [x] Examples page — scrollPin "Sticky Feature Panel" + scrollSnap "Horizontal Snap Carousel" live demos
- [x] v2.7.0 published to npm

## What also shipped (v2.8.0)

- [x] `scrollReveal` (`svg-scroll-draw/reveal`) — 7 presets, stagger, custom from state, onEnter/onLeave
- [x] `velocityScale` on `scrollAnimate` — speed scales with scroll velocity
- [x] `ResizeObserver` auto-refresh on `scrollPin`
- [x] 407 tests passing, build clean
- [x] Blog post: "Replace AOS / ScrollReveal.js" at `/blog/replace-aos-scrollreveal`
- [x] Home page grid: 10 API cards (added scrollReveal v2.8.0)
- [x] Docs: v2.8.0 nav group (scrollReveal + velocityScale), badge → v2.8.0

## What shipped (v2.9.0)

### Library
- [x] `scrollProgress` (`/progress`) — CSS custom property binding (`--scroll-progress`, `--scroll-progress-eased`)
- [x] `scrollHorizontal` (`/horizontal`) — Apple-style vertical→horizontal scroll sections
- [x] 478 tests passing, build + TS clean

### Demo site
- [x] scrollReveal example card on ExamplesPage (cascade demo)
- [x] `/vs-aos` — svg-scroll-draw vs AOS vs ScrollReveal.js comparison page
- [x] `/vs-framer-motion` — comparison page with side-by-side API + honest "when FM wins"
- [x] Blog: "Horizontal scroll sections without GSAP" at `/blog/horizontal-scroll-sections`
- [x] Home page: 12 API cards (added scrollProgress + scrollHorizontal v2.9.0)
- [x] Docs: v2.9.0 nav group + DocSections, badge → v2.9.0, MobileMenu → v2.9.0

## Track B distribution content shipped

- [x] **v2.9.0 published**
- [x] `/react-scroll-animation` — React landing page targeting "react scroll animation library"
- [x] `/nextjs-scroll-animation` — Next.js landing page targeting "next.js scroll animation"
- [x] `/vs-aos` — comparison vs AOS + ScrollReveal.js
- [x] `/vs-framer-motion` — comparison vs Framer Motion
- [x] Blog: "Complete guide to scroll animations in 2025" (cornerstone, 12 patterns)
- [x] Blog: "Scroll animation performance — native CSS vs JS"
- [x] Home page: Compare + Framework guides section (6 links)
- [x] Blog index: 14 posts total

## Remaining tasks

### What's left
See "What is left" at the top of this file. Phase 2 is closed; the queue after
publishing is Priorities 4–5 in `ROADMAP.md` — the naming decision, then the
migration guides and recipes.
- More blog posts targeting "GSAP alternative" searches

### TASK 2 — Distribution & growth
- Post to Reddit r/webdev, Product Hunt, dev.to
- Submit to "awesome scroll animation" GitHub lists
- Cross-post the `/vs-gsap` page in GSAP-related communities

---

## Guardrails
- **Don't publish without bumping version** — 2.10.0 is already staged in
  `package.json`, the changelog and every site badge, so the next publish after it
  is v2.11.0
- **Publish through the release workflow, not from a laptop** — the provenance
  attestation is the point of it
- **Don't post to external platforms** — user posts manually
- **Always update STATUS.md + ROADMAP.md + CHANGELOG.md + NEXT-SESSION-PLAN.md after any code change**
- Numbers are checked, not remembered: `node scripts/check-claims.mjs` reads the
  suites and fails if any doc disagrees. Run it rather than editing counts by hand.
