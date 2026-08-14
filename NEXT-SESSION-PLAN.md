# Next Session Plan — svg-scroll-draw

> Updated: 2026-08-14 (third pass that day)

---

## Current state

**2.10.0 is prepared and unpublished. Phase 2 is complete — every priority, not
just the coverage ones.** The work sits on `phase0-production-ready`.

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

### 1. Publish 2.10.0
Everything below is prepared — version strings, changelog entry and dates are all
done, and `npm run verify` is green. Two things gate the actual publish:

- [ ] **Watch CI go green remotely.** The branch is pushed, but the e2e job has
      still never run outside this laptop. The suite now builds framework fixture
      bundles in `globalSetup`, which is new surface for CI to trip over — it
      needs `dist/` to exist first, so the workflow must build the library before
      running the browser tests.
- [ ] **`NPM_TOKEN` in repo secrets**, for the provenance-signed release workflow.
      Without it the release job cannot publish.

Then tag and let the workflow do it. Do not publish by hand from a laptop: the
whole point of that workflow is that the artefact is attested to the commit.

### 2. Site catch-up — `/verify` stops three fixes short
`/verify` is the page that shows each claim being true in a real browser, and it
still ends at the horizontal-scroll fix. Missing sections, in rough order of how
convincing they are:

- [ ] Native-vs-JS easing parity — the same `ease-out` animation on both paths
      side by side with the live delta. Before the fix that read ~0.069.
- [ ] A finished `scrollDrawSequence` reporting 100%.
- [ ] `split: 'lines'` keeping its spaces, since it is the one users can see
      without instrumentation.

Docs-page additions worth making at the same time:
- [ ] An easing with no CSS equivalent (`spring`, `bounce`, `elastic`, any
      function) declines the fast path and stays on the JS engine. That is now
      load-bearing behaviour rather than an implementation detail.
- [ ] The `svg-scroll-draw.dev.global.js` CDN build (README has it; the docs page
      does not).
- [ ] `refresh()` on `scrollDraw` / `scrollDrawTimeline` / the group APIs, and
      `respectReducedMotion` on `scrollDrawTimeline`.

### 3. Option reactivity across the wrappers — a decision, not a bug
The framework spec pins today's behaviour: only the **Svelte** actions re-create
the engine when their options change, because Svelte calls `update()` for you.
React, Vue, Solid and Angular all read their options once on mount
(`useEffect(…, [])`, `onMounted`, `onMount`, `init()`), so changing a prop
afterwards does nothing at all.

That is defensible — re-creating on every render would thrash, since an inline
options object is a new identity each time — but it is undocumented and
surprising. Either document it per wrapper, or give the components a deliberate
`key`-style opt-in. Worth deciding before the migration guides are written, since
they will show prop-driven examples.

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
