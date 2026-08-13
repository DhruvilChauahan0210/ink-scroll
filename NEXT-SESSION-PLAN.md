# Next Session Plan — svg-scroll-draw

> Updated: 2026-08-13

---

## Current state

**Library: v2.9.0 published to npm. 478 unit tests + 76 browser tests per engine
(228 runs across Chromium/Firefox/WebKit). Unreleased work sits on
`phase0-production-ready`.**

Phases 0 (honesty & hygiene) and 1 (real browsers) are complete. **Phase 2
Priority 1 — browser coverage for the untested APIs — is most of the way done**:
`scrollReveal`, `scrollPin`, `scrollSnap`, `scrollText`, `scrollCounter`,
`scrollProgress`, `scrollParallax`, `scrollVideo` and `scrollHorizontal` now have
real-browser coverage, and `scripts/mutation-check.mjs` proves each new test fails against a
deliberately broken build (27/27 mutations caught).

Four defects and two harness faults came out of it — see CHANGELOG `[Unreleased]`.
The worst: `scrollHorizontal` never moved the track at all in the CSS arrangement
its own docs prescribe. The plan's estimate that examining an API in a real browser
finds real bugs held.

### Immediate next steps, in order

1. Browser tests for the rest of Priority 1: Group / Sequence / Timeline,
   `Cinematic`, and `scrollAnimate`'s own native CSS fast path (parity currently
   covers only `scrollDraw`'s).
2. Priority 2 — framework wrapper e2e (~1,000 lines still excluded from coverage).
3. Priority 3 — correctness debt: expose `refresh()` on `scrollDraw`, ship a
   `*.dev.js` CDN build, ratchet coverage.
4. Priority 6 — push the branch, watch CI go green remotely for the first time,
   then cut 2.10.0 (move `[Unreleased]` under the version at release time).

### Conventions worth keeping

- New fixtures go through `e2e/helpers.ts` (deterministic sweep) and
  `e2e/fixtures/_probe.mjs` (parse in the page, assert on numbers in the spec).
- Add a mutation to `scripts/mutation-check.mjs` for every new behaviour asserted.
  A `MISSED` result means either the test is weak or the mutated code is dead — the
  counter's redundant initial write was found exactly that way.
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
See "Immediate next steps" at the top of this file — the ordering now comes from
`PHASE-2-PLAN.md`. The three items previously listed here (horizontal scroll
sections, velocity detection, `scrollPin` ResizeObserver auto-refresh) have all
shipped.
- More blog posts targeting "GSAP alternative" searches

### TASK 2 — Distribution & growth
- Post to Reddit r/webdev, Product Hunt, dev.to
- Submit to "awesome scroll animation" GitHub lists
- Cross-post the `/vs-gsap` page in GSAP-related communities

---

## Guardrails
- **Don't publish without bumping version** — next publish = v2.10.0
- **Don't post to external platforms** — user posts manually
- **Always update STATUS.md + ROADMAP.md + CHANGELOG.md + NEXT-SESSION-PLAN.md after any code change**
- Accuracy: ~9 KB gzipped, 478 tests, zero dependencies, MIT, v2.9.0
