# Go-To-Market & Strategy — svg-scroll-draw

> The library is feature-complete (every `ROADMAP.md` item shipped). The remaining
> work is **not in `src/`** — it's proof, positioning, and distribution.
> Goal restated honestly: you can't *monopolize* a free 3 KB MIT utility. You can
> **own the category default** — the package people Google to, get recommended, and
> find in every `awesome-*` list. That's the target. This doc is the path to it.

---

## 0. The one strategic decision that gates everything

**Native CSS scroll-driven animations** (`animation-timeline: view()` + `stroke-dashoffset`)
can do the *simple* draw-on-scroll case with **0 KB of JS**, and support is rolling out
across browsers. Our "2.6 KB vs 40 KB" story dies the day a developer's honest alternative
is "0 KB, no dependency."

**Decision: absorb native, don't fight it.** Reposition from "tiny JS animation lib" to
"the compatibility + DX + orchestration layer for scroll-driven SVG drawing — native where
the browser supports it, JS fallback everywhere else, one API for both."

### Fallback design sketch (to implement in `src/core/engine.ts`)

```
createEngine(container, options):
  if supportsNativeTimeline() and options.fade-free simple case and not options.onProgress:
      → inject a <style> with @keyframes draw { to { stroke-dashoffset: 0 } }
        and animation-timeline: view(); animation-range derived from trigger.
        Browser drives it on the compositor. Zero rAF, zero JS per frame.
  else:
      → existing IntersectionObserver + rAF engine (today's code path).

supportsNativeTimeline():
  return typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()')
```

Things native **can't** do cleanly — these become the headline features, not the footnote:
- multi-path `stagger` orchestration
- `onProgress` / `onComplete` JS callbacks, `waypoints`
- `morphTo`, `velocityScale`, `autoReverse`, `once` latching
- custom triggers, custom-function/`spring` easing
- framework lifecycle (`destroy()`, SSR safety)
- consistent behavior on browsers without native support yet

**Do this before any loud launch.** Get ahead of the inevitable "why not just use CSS?" comment.

### ✅ Status — shipped (2026-05-30)

Implemented in `packages/svg-scroll-draw/src/core/engine.ts`:
- New `native?: boolean` option (default on; `false` forces JS).
- `supportsNativeTimeline()` feature-detects `animation-timeline: view()`.
- A `nativeEligible()` gate that only takes the native path for the simple case
  (default trigger → CSS `cover` range, named easing, no callbacks/stagger/morph/
  velocity/autoReverse/once/repeat/custom-container). Anything else → untouched JS engine.
- `buildNative()` injects a per-instance `@keyframes` + class, runs the draw on the
  compositor with **zero per-frame JS and zero scroll/resize listeners**, and still
  honours the full instance API (`pause`/`resume`/`seek`/`replay`/`getProgress`/`destroy`).
- 27 new tests (`engine-native.test.ts`); 221 total passing.
- Cost: **+~0.68 KB gzipped** core (3.68 → 4.36 KB).

✅ **Size claims corrected (2026-05-30):** both READMEs, `package.json`, and all
~15 demo-site instances now state **~4.4 KB gzipped** (with an honest min/gzip
per-bundle table in the READMEs) instead of the stale "<3 KB". Stale "56 tests"
claims also bumped to the real **221**. The bundle-comparison bar chart pct was
recomputed (4.4 / 40 KB → 11%). The competitive line ("8–9× smaller than GSAP/
Framer") is preserved — it still holds. Only the dated v0.1.0 changelog entry keeps
"~3 KB" as a historical record.

---

## 1. Proof & trust (do FIRST — before distribution)

Adoption of an *animation* library is emotional. Nobody adopts from an API table.

- [ ] **Example gallery** — the single highest-leverage missing asset. 6–8 *gorgeous*,
      real-world demos, each copy-pasteable:
  - [ ] Handwriting / signature reveal
  - [ ] Logo draw-on (real brand-style mark)
  - [ ] Map route / geographic path tracing
  - [ ] Technical diagram / infographic line reveal
  - [ ] Org chart or flowchart connectors (shows `stagger`)
  - [ ] "Write then erase" loop (shows `direction: 'reverse'`)
- [ ] **`prefers-reduced-motion` default** — instantly draw (skip animation) when the user
      opts out. Accessibility + correctness signal competitors miss; reviewers love it.
- [ ] **Maintenance signals** — `scroll-svg` lost the slot by looking abandoned. Keep
      `CHANGELOG.md` fresh, respond to issues fast, pin a "v1 roadmap" issue.
- [ ] **Social proof** — download badge (have it), 2–3 named real sites using it, a short
      testimonial/quote when you get one.

---

## 2. Distribution (the actual remaining battle)

Per `ROADMAP.md` these are all still **pending** — this is where the slot is won.

- [ ] **Product Hunt launch** — GIF demo, tagline, first-comment story. Before/after:
      "I replaced 40 KB of GSAP DrawSVG with 2.6 KB."
- [ ] **Technical post** ("How I built a <3 KB SVG scroll-draw library" / "Replacing GSAP
      DrawSVG") on dev.to + Hashnode + cross-post to relevant subreddits.
- [ ] **X/Twitter thread** with the demo GIF + bundle-size bar chart.
- [ ] **`awesome-*` PRs** (passive, compounding, free): `awesome-react`, `awesome-vue`,
      `awesome-svg`, `awesome-animation`, `awesome-javascript`.
- [ ] **SEO the docs** for the long-tail that *makes* defaults year over year:
      "svg draw on scroll", "animate svg line on scroll react / next / vue",
      "draw svg path scroll", "stroke-dashoffset scroll animation".
      → run the `seo-audit` skill against the live docs.

---

## 3. Win by segment (depth before breadth)

**Win React/Next completely first** — it's the sharpest edge and the original pain point —
then expand one segment at a time.

| Segment | Status | Next move to own it |
|---|---|---|
| React / Next.js | Strong (beachhead) | Lock it: best demos, SEO, the GSAP-replacement post. |
| Vue | Wrapper exists | Vue-specific demo + a post in the Vue ecosystem (they won't find React content). |
| Vanilla / CDN / Webflow / WordPress | Web component exists; large TAM | Copy-paste **embed snippets** + a "paste into Webflow" guide. Not npm docs. |
| Agencies / studios | Underserved | The example gallery *is* the pitch for this group. They live in GSAP/Framer. |
| Svelte / Solid / Astro | Not served | Cheap wrapper + awesome-list PR each → doubles reach per community. |

---

## 4. Sequencing

1. **Native-CSS fallback + positioning** (§0) — gates the launch's credibility.
2. **Example gallery + reduced-motion** (§1) — the thing people share.
3. **Product Hunt + technical post + awesome lists** (§2) — the spike + the long tail.
4. **SEO pass** (§2) — compounding traffic.
5. **Segment expansion** (§3) — Vue → no-code → Svelte/Solid/Astro.

## 5. What NOT to do

- ❌ Build more library features. The engine is done; more options = more surface, not more users.
- ❌ Spread thin across every framework before owning React/Next.
- ❌ Launch loudly before having the gallery and the native-CSS answer.
- ❌ Chase "monopoly" via lock-in. The moat is DX + breadth + trust + being the search result.

---

*The library is finished. The product is not — and the unfinished part is proof and reach.*
