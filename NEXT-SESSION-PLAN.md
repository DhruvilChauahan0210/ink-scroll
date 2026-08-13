# Next Session Plan — svg-scroll-draw

> Updated: 2026-08-14

---

## Current state

**Library: v2.9.0 published to npm. 478 unit tests + 76 browser tests per engine
(228 runs across Chromium/Firefox/WebKit). Unreleased work sits on
`phase0-production-ready`.**

Phases 0 (honesty & hygiene) and 1 (real browsers) are complete. **Phase 2
Priority 1 — browser coverage for the untested APIs — is nearly complete**:
`scrollReveal`, `scrollPin`, `scrollSnap`, `scrollText`, `scrollCounter`,
`scrollProgress`, `scrollParallax`, `scrollVideo` and `scrollHorizontal` now have
real-browser coverage, and `scripts/mutation-check.mjs` proves each new test fails against a
deliberately broken build (27/27 mutations caught).

Four defects and two harness faults came out of it — see CHANGELOG `[Unreleased]`.
The worst: `scrollHorizontal` never moved the track at all in the CSS arrangement
its own docs prescribe. The plan's estimate that examining an API in a real browser
finds real bugs held.

The demo site is caught up too: every option this branch added is documented, and
`/verify` proves all three phases live (sections 10–12 for this one). Verified in a
real browser against a production build, not assumed.

---

## What is left

### 0. Push the branch — blocks everything else reaching anyone
The branch has **no upstream and has never been pushed**, so nothing above is live:
not the fixes, not the docs, not even Phase 0/1's `/verify` page. CI has therefore
never run the e2e job remotely. This is one command and it gates the rest.

### 1. Finish Priority 1 — the last of the browser coverage
- [ ] Group / Sequence / Timeline (`group` is at 50% lines, the weakest in the library)
- [ ] `Cinematic` — story JSON → scene timing
- [ ] `scrollAnimate`'s own native CSS fast path. It has one and it has never been
      checked; the existing parity test covers `scrollDraw`'s only.

### 2. Priority 2 — framework wrappers end to end
~1,000 lines across React, Vue, Svelte, Solid, Angular, Astro, Nuxt and the web
component, all excluded from coverage because jsdom cannot mount them. Mount,
unmount cleanup (no leaked observers or rAF loops), prop reactivity, SSR safety.
They are thin adapters, but "thin" is an assumption nobody has tested — and they
are what most users actually touch.

### 3. Priority 3 — correctness debt
- [ ] **`scrollHorizontal`'s default `distance` ignores `scrollContainer`.** It
      subtracts `window.innerWidth` regardless, so nested-container callers must
      pass `distance` by hand. Found while building `/verify` section 10. Small fix,
      real bug, already documented on the page.
- [ ] Expose `refresh()` on `scrollDraw` — `scrollPin` and `scrollHorizontal` have it.
- [ ] Ship a `*.dev.js` CDN build. This matters more now: a zero-length trigger
      window is reported as a dev warning, and `IS_DEV` is false without a bundler,
      so the one diagnostic that would have caught the `scrollHorizontal` defect is
      invisible to exactly the users most likely to hit it.
- [ ] Ratchet coverage: `group` 50%, `snap` 79%, `text` 80%, `devtools` 47%.
- [x] Verify the `ResizeObserver` fix beyond Chromium — done, the `scrollPin` spec
      exercises it in Firefox and WebKit.

### 4. Release 2.10.0 — the site is ready, so this is version-only
Publish-day checklist, verified against the code:

| File | Line | What |
|---|---|---|
| `apps/demo/src/app/page.tsx` | 42 | JSON-LD `softwareVersion` |
| `apps/demo/src/app/page.tsx` | 151 | hero npm badge |
| `apps/demo/src/app/page.tsx` | 1142 | footer badge |
| `apps/demo/src/app/changelog/page.tsx` | 400 | header badge |
| `apps/demo/src/components/DocsPage.tsx` | 250 | header badge |
| `apps/demo/src/components/MobileMenu.tsx` | 151 | `v2.9.0 · MIT · ~9 KB` |

Plus: move `tag: 'Latest'` / `tagColor: 'bg-lime-glow'` onto the 2.10.0 changelog
entry and set its real date; move `[Unreleased]` under 2.10.0 in `CHANGELOG.md`; bump
`packages/svg-scroll-draw/package.json`; add `NPM_TOKEN` to repo secrets for the
provenance-signed release workflow.

**Do NOT bump** `page.tsx:986,993` or `DocsPage.tsx:60,1711,1773` — those are
"introduced in" markers. Changing them would falsely claim `scrollProgress` and
`scrollHorizontal` are new in 2.10.0.

### 5. Pre-existing doc debt — older than this branch
- [ ] `autoplay` on `scrollDraw` is undocumented on the docs page.
- [ ] `scrollVideo` has never had an option table; `preload` and `onReady` are
      undocumented. (`node scripts/check-claims.mjs` reports the option gaps.)

### 6. Priorities 4–5 — positioning and docs, deliberately last
- [ ] **Rename decision.** Repo `ink-scroll`, package `svg-scroll-draw`, docs "a
      scroll animation platform". 21 entry points, most unrelated to SVG; nobody
      searching npm for "scroll reveal" finds it. Recommendation stands: publish
      under a new name with `svg-scroll-draw` as a deprecated alias. Irreversible,
      so it is your call.
- [ ] Migration guides from GSAP ScrollTrigger, AOS and ScrollReveal.js — the
      highest-intent traffic there is.
- [ ] Real-world recipes rather than option tables.
- [ ] Auto-generate the README size table from `npm run size --write`.
- [ ] Document the jump-scroll asymmetry in the docs, not only in a test comment.

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
