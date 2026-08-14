# Phase 2 plan — make it useful

> **Closed on 2026-08-14.** Priorities 1, 2, 3 and 6 are done and staged as
> 2.10.0; Priorities 4–5 (naming, migration guides, recipes) moved to `ROADMAP.md`
> as the queue after publishing. Live numbers are in `STATUS.md` — the ones below
> are left as written so the estimates can still be read against what they were
> estimating.
>
> How the central bet held up: the plan assumed that examining an API in a real
> browser finds real bugs. Applied to the remaining nine APIs, both native fast
> paths, all eight framework wrappers and the SSR surface, it found ten more —
> including one that crashed any server-side import and one where the CDN bundle
> shipped without the component it advertises. There was no area it was applied to
> where it found nothing.
>
> Status of the previous phases *when this was written*: **Phase 0 (honesty &
> hygiene) and Phase 1 (real browsers) are complete** on branch
> `phase0-production-ready`, 13 commits, unpushed. `npm run verify` and
> `npm run test:e2e` both exit 0.
>
> 478 unit tests · 30 browser tests · 85.6% line coverage · 21 entry points
> · main entry 9.0 KB gzipped

---

## What the first two phases actually taught us

Worth stating before planning anything, because it should shape the priorities:

1. **Every bug found in Phase 1 was invisible to jsdom.** Five real defects —
   including the library's headline claim being false — sat undetected behind 475
   passing unit tests. The unit tests stub `getTotalLength`, fake
   `IntersectionObserver`, and run where `getBoundingClientRect()` returns zeros.
2. **Isolated fixtures missed a bug that a real page caught.** The stale
   trigger-cache bug (a 21px layout shift during hydration permanently offsetting
   the JS engine) never appeared in the clean e2e fixtures. It only surfaced on
   the busy `/verify` page. Synthetic fixtures are necessary and not sufficient.
3. **Measurement code is as bug-prone as product code.** Three of my own
   verification harnesses were wrong: a probe that silently counted nothing, an
   idle meter contaminated by the host page, and verdicts that rendered
   "unmeasured" as "failed". Every measurement needs validating against a known
   bad state before it is trusted.
4. **The e2e suite covers 2 of 11 APIs.** `scrollDraw` parity and idle cost. The
   other nine have no browser coverage at all — and the one area we did look at
   yielded five bugs.

**Conclusion for Phase 2:** the highest-value work is extending real-browser
coverage to the rest of the surface, *before* any polish, renaming, or marketing.
Usefulness that rests on unverified code is not usefulness.

---

## Priority 1 — Browser coverage for the other nine APIs

The single most valuable thing left. Rough expectation, based on a 5-bugs-per-API-area
hit rate so far: **expect to find real defects here.** Budget time for fixing, not
just writing tests.

| API | Unit cov. | What a browser test must check |
|---|---|---|
| `scrollReveal` | 100% lines | Real transforms/opacity applied; stagger cascade ordering; `once` latching; reduced-motion jumps to final state |
| `scrollPin` | 89% | Wrapper injection causes no layout shift; pin/unpin boundaries; `refresh()` after content change; nested scroll containers |
| `scrollSnap` | 79% | Scroll actually lands on section boundaries; threshold behaviour; **reduced-motion instant snap** (currently only unit-tested with a stubbed matchMedia) |
| `scrollText` | 80% | Split preserves rendered text; `aria-label` present and spans `aria-hidden`; `destroy()` restores original markup exactly; no reflow loop |
| `scrollCounter` | 96% | Formatting and decimals at real frame rates; no flicker on init |
| `scrollVideo` | 94% | `currentTime` tracks scroll; behaviour before `loadedmetadata`; seeking on a real video element |
| `scrollProgress` | 88% | CSS custom properties actually land and are readable by dependent CSS |
| `scrollHorizontal` | 100% | `translateX` distance matches sticky container width; reduced-motion decision (**see open question below**) |
| `scrollParallax` | — | Travel distance matches `speed × height`; negative speed reverses |
| Group / Sequence / Timeline | 50% (`group`) | Simultaneous vs sequential ordering; independent scroll windows; `loop` |
| `Cinematic` | 95% | Story JSON → correct scene timing |

**Approach**

- One fixture per API under `e2e/fixtures/`, following `parity.html`.
- **Reuse the deterministic-sweep pattern**, not passive polling. Passive
  observation produced false positives *and* false negatives on `/verify`; the
  sweep (scroll to fixed offsets, wait two frames, read) is what actually works.
- Where an API has a native CSS fast path, add a parity test for it too —
  `scrollAnimate` has one and it has never been checked.
- **Validate each new test against a deliberately broken build** before trusting
  it. This is not optional; it caught two useless tests already.

**Acceptance:** every entry point has at least one browser test; each new test
demonstrated to fail against an intentionally broken version.

---

## Priority 2 — Framework wrappers, end to end

~1,000 lines currently excluded from coverage entirely because jsdom cannot mount
them: `react`, `vue`, `svelte`, `solid`, `angular`, `astro`, `nuxt`,
`web-component`.

This was flagged in Phase 0 as a deliberate compromise with a promise to fix it
here. They are thin adapters, but "thin" is an assumption nobody has tested — and
they are what most users actually touch.

**Approach:** minimal real apps per framework, built and served, driven by
Playwright. Verify mount, unmount cleanup (no leaked observers or rAF loops), prop
reactivity, and SSR safety where applicable. Consider one shared fixture harness
rather than eight bespoke ones.

**Acceptance:** each wrapper mounts, animates, and tears down cleanly in a real
browser; coverage exclusions in `vitest.config.ts` reduced or justified per file.

---

## Priority 3 — Correctness debt still open

Concrete, known, small:

- **Expose `refresh()` on `scrollDraw`.** `scrollPin` and `scrollHorizontal` have
  it; the draw engine does not. The `ResizeObserver` added in Phase 1 covers the
  common case, but an explicit escape hatch is standard (GSAP's
  `ScrollTrigger.refresh()`) and cheap.
- **Dev warnings are silent in CDN builds.** Without a bundler there is no
  `NODE_ENV`, so `IS_DEV` is false and every warning is suppressed. Safe, but a
  CDN user gets no diagnostics at all. Ship a separate `*.dev.js` CDN build with
  `IS_DEV` defined true, as React and Vue do.
- **Ratchet coverage.** Current gate is 85/85/77/79 against 85.6% measured. In
  value order: `group` 50% lines, `snap` 79%/70% branches, `text` 80%, `progress`
  and `pin` both ~50–57% functions, `devtools` 47%.
- **Verify the `ResizeObserver` fix more broadly.** It required observing
  `document.body` — observing `documentElement` alone produced no callback for a
  21px document growth. That asymmetry is worth a dedicated browser test, and
  worth checking in Firefox and WebKit, where it has only been verified in
  Chromium.

---

## Priority 4 — Positioning and identity

Deferred to here deliberately: renaming a package people can already install is
irreversible in a way test coverage is not.

**The problem, restated:** three identities — repo `ink-scroll`, package
`svg-scroll-draw`, docs "a scroll animation platform". The name actively blocks
discovery: 21 entry points, most with nothing to do with SVG, and nobody searching
npm for "scroll reveal" or "GSAP ScrollTrigger alternative" will find
`svg-scroll-draw`. Current traction: 130 downloads/month, 5 stars.

**Options, in increasing cost:**

1. Keep the name; lead the README with the general pitch. Zero risk, keeps the
   discovery problem.
2. Publish under a new name, keep `svg-scroll-draw` as a deprecated alias that
   re-exports. Standard, low-risk, needs a deprecation notice and a migration note.
3. Scoped rename (`@cdh/scroll`) with the same alias strategy.

**Recommendation:** option 2, and not before Priorities 1–2 are done. A rename
multiplies the cost of every later doc fix, so do it once the API surface is
verified and stable.

---

## Priority 5 — Docs that make it genuinely useful

- **Real-world recipes**, not option tables. The docs list 30+ options and few
  complete patterns. Ship: an animated logo on scroll, a sticky product-feature
  section, a horizontal case-study strip, an animated stat row, a scroll-scrubbed
  explainer video.
- **Migration guides** from GSAP ScrollTrigger, AOS, and ScrollReveal.js, with a
  side-by-side option mapping. This is the highest-intent traffic there is.
- **Auto-generate the README size table** from `npm run size` rather than pasting
  it. The script already emits markdown; a `--write` flag that rewrites the table
  between markers removes the last hand-maintained number.
- **Document the known asymmetry** (jump-scrolling past an element leaves the JS
  engine undrawn while CSS holds the filled state) in the docs, not just in a test
  comment.

---

## Priority 6 — Ship it

Everything below is ready and blocked only on a decision:

- **Push the branch.** 13 commits sitting locally. `phase0-production-ready` now
  understates the scope — rename to something like `correctness-phases-0-1`.
- **Watch CI go green** on GitHub, including the new `e2e` job across three
  browsers. This has never actually run remotely.
- **Cut a release.** `release.yml` is written and dry-runnable: tag-triggered, full
  verify plus browser tests, refuses to publish if the tag disagrees with
  `package.json`, publishes with `--provenance`. Needs `NPM_TOKEN` in repo secrets.
  Suggest **2.10.0** — the changes are user-visible fixes plus new behaviour
  (`respectReducedMotion`), no breaking API change.
- **`CHANGELOG.md`**: move `[Unreleased]` under the new version at release time.

---

## Open questions for CD

1. **`scrollHorizontal` under reduced motion.** It delegates to
   `createAnimateEngine`, which jumps to the *final* state — meaning a
   horizontal strip snaps to its last panel. Is that the intent, or should it stay
   at the first panel, or opt out of the transform entirely? This is a product
   decision, not a bug, and I should not pick it silently.
2. **Repo location.** `~/Desktop/repo` exists (holding `UnifyApps`) and is what
   "the repo folder" originally meant; this clone lives at
   `~/Developer/CDH/ink-scroll`. Move it, or leave it?
3. **Codex trust.** Only `~/Desktop/repo/UnifyApps` is a trusted project, so codex
   prompts for trust and runs sandboxed in this repo. Add a trust entry?
4. **Rename or not** (Priority 4). Irreversible-ish; your call.

---

## Suggested order

```
1. Browser coverage for the nine untested APIs      ← start here
2. Fix whatever that finds
3. Framework wrapper e2e
4. Correctness debt (refresh(), dev CDN build, coverage ratchet)
5. Push + green CI + release 2.10.0
6. Rename decision, then docs and recipes
```

Priorities 1–2 first is the whole point: five bugs came out of examining one API
in a real browser. Nine remain unexamined. Polishing docs for unverified code
would be building on sand.

---

## Working rules carried forward

From `CONTRIBUTING.md`, restated because they were each learned the hard way:

- A bug fix needs a test **watched failing** against the old code. A regression
  test that passes on the broken version looks like coverage and is worse than none.
- Verification harnesses get the same scrutiny as product code, and must be
  validated against a known-bad build.
- "Unmeasured" must never render as "passed".
- Claims must be measured. `npm run size` and `npm run check:claims` enforce this
  in CI; do not work around them.
- No bare `process.*` in library source — import `IS_DEV` / `warn` from `core/env`.
- Anything that moves the page on its own honours `prefers-reduced-motion`.
