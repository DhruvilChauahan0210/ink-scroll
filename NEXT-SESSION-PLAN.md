# Next Session Plan — svg-scroll-draw

> Updated: 2026-08-14 — **2.10.0 is published to npm** and merged to `main`

---

## Current state

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

### 1. Release follow-ups
- [x] Published 2.10.0 to npm, merged to `main`, tagged `v2.10.0`
- [ ] **`NPM_TOKEN` in repo secrets.** Without it the release workflow cannot
      publish, which is why this one went out by hand and unattested. Adding it
      is what makes the *next* release a tag push rather than a manual step.
- [ ] **Check the `v2.10.0` workflow run.** Pushing the tag triggered
      `release.yml`, which fails at "Confirm this version is not already
      published" when the version is already on npm — expected here, cosmetic.
      What is worth reading in that run is everything *before* that step: it is
      the first time CI has ever run the browser suite remotely, and the new
      `globalSetup` bundling step is untested outside this laptop.
- [ ] Confirm the Vercel deploy from `main` shows v2.10.0 and the new docs
      sections render.

### 2. Accuracy pass on the comparison pages — see `CLAIMS-AUDIT.md`
The highest-priority item in the repo right now, and the only one that involves
somebody else's project. The comparison pages state that GSAP's DrawSVG and
SplitText require a paid Club GreenSock subscription. That stopped being true in
2025 — the plugins ship in the public npm tarball under a no-charge licence — and
the claim is repeated in six places including the whole `/vs-gsap` pitch.

Measured in the same pass: AOS is 6.7 KB and ScrollReveal 5.6 KB against our 10.0
KB, so both are *smaller* than us, not larger as the pages claim; ScrollReveal is
GPL-3.0, not MIT; and our own "honours prefers-reduced-motion by default" is a
blanket claim with three exceptions.

`CLAIMS-AUDIT.md` has every finding with the command that produced it, the
proposed replacement, and the order to do them in. Nothing there has been
actioned.

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
- [ ] Native-vs-JS easing parity — **built, withheld, and it turned up a number
      that needs explaining before it ships.**

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

### 4. Option reactivity across the wrappers — a decision, not a bug
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
