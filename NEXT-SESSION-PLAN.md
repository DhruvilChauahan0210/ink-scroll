# Next Session Plan — svg-scroll-draw

> Updated: 2026-06-04

---

## Current state

**Library: v2.2.0 — NOT YET PUBLISHED. 358 tests passing.**

All PRD v2 phases complete (Phase 1, 2, 3). svg-scroll-draw is now a full scroll animation platform.

### What shipped (all of v2, this session)

**v2.0.0 — Phase 1:**
- [x] `scrollAnimate` — animate any CSS property on any element. Native CSS fast path.
- [x] `scrollCounter` — animated number counter on scroll.
- [x] `scrollParallax` — parallax wrapper over scrollAnimate.
- [x] `ScrollAnimate` + `ScrollCounter` React wrappers.

**v2.2.0 — Phase 2 + 3:**
- [x] `scrollVideo` — `<video>.currentTime` tied to scroll. Ships as `svg-scroll-draw/video`.
- [x] `scrollText` — split text (chars/words/lines) + stagger animate. Ships as `svg-scroll-draw/text`. Free GSAP SplitText replacement.
- [x] `devtools` overlay — progress panel, trigger lines, color-coded by type. Ships as `svg-scroll-draw/devtools`. Dev-only.
- [x] Global instance registry (`src/core/registry.ts`).
- [x] `ScrollVideo` + `ScrollText` React wrappers.
- [x] 36 new tests — 358 total.

**Demo site:**
- [x] Home page v2 section — 6-card grid for all new APIs.
- [x] DocsPage v2.0–2.2 nav group with full docs for all 6 APIs.
- [x] ExamplesPage — 3 new v2 example cards.
- [x] Blog post: "Replace GSAP ScrollTrigger with scrollAnimate" at `/blog/replace-gsap-scrolltrigger`.
- [x] Version badges updated to v2.2.0.

---

## Previous session (v1.8.0 — demo only)

- [x] Changelog page — v1.4.0–v1.7.0 entries added, Latest tag updated
- [x] Examples page — Presets card (14 examples now), PresetShowcase component
- [x] Playground — Preset shortcut dropdown in Motion tab
- [x] Blog post: "5 scroll animation patterns in under 10 lines" at /blog/5-patterns-under-10-lines
- [x] Blog index now shows 4 posts; sitemap updated

## Previous session (v1.7.0)

- [x] `scrollDrawTimeline` `loop` + `loopDuration` — time-driven auto-loop after scroll completion
- [x] `doReset()` fix — `currentAlpha` now resets to 0 (getProgress() correct after replay)
- [x] 5 new loop tests (272 total)
- [x] DocsPage — `preset` in Core Options, new Presets section, new CLI section, timeline options updated
- [x] README — Presets section, CLI in Install, `preset` in options table, timeline table updated, test count updated

## Previous session (v1.6.0)

- [x] `preset` option — sketch, reveal, typewriter, cinematic, spring
- [x] `PRESETS` export — inspect/extend presets directly
- [x] CLI init tool — `src/cli/init.ts`, `bin` in package.json, tsup CJS build
- [x] 5 new preset tests (267 total)
- [x] Blog post: "Scroll-driven path morphing with morphTo" at `/blog/scroll-path-morphing`
- [x] Blog index now shows 3 posts; sitemap updated

## Previous session (v1.5.0)

- [x] `scrollDrawTimeline` — `repeat`, `repeatDelay`, `debug`, `label` options
- [x] 8 new tests (262 total)
- [x] Blog post: "Zero-JS SVG scroll animations with native CSS" at `/blog/native-css-svg-scroll-animations`
- [x] Blog post added to blog index and sitemap

## Previous session

- [x] `/blog` index page — `apps/demo/src/app/blog/page.tsx` with post card listing
- [x] "Blog" nav link — added to homepage, docs, examples, changelog, mobile menu
- [x] Version badges — updated `v1.2.0` → `v1.4.0` across all nav instances
- [x] Timeline scrub bar — `TimelineDemo` in `ExamplesPage.tsx` now shows per-track progress bars + global scroll position live
- [x] Demo examples audit — confirmed 13 examples already cover logo, signature, map, diagram

## Remaining code tasks

### TASK 0 — npm publish v2.2.0
```bash
cd packages/svg-scroll-draw
npm publish --access public
```

### TASK 1 — Vue/Svelte/Solid wrappers for v2 APIs (v2.3.0)
All Phase 1+2 APIs have React wrappers. Vue, Svelte, and Solid wrappers are missing for:
- `scrollAnimate`, `scrollCounter`, `scrollParallax`, `scrollVideo`, `scrollText`

### TASK 2 — Changelog page update
Update `apps/demo/src/app/changelog/page.tsx` to add v2.0.0 and v2.2.0 entries in the UI changelog.

### TASK 3 — Demo site: live `scrollAnimate` demo section on home page
Add an interactive `scrollAnimate` demo component (like `InteractiveScrollDemo` for scrollDraw) to the home page so visitors can see the v2 animations in action rather than just code snippets.

---

## Guardrails
- **Don't publish npm without bumping version** — v1.4.0 is live; any new user-facing features need a version bump before publish
- **Don't post to external platforms** — `launch/` files are drafts, user posts them manually
- **Always update STATUS.md + ROADMAP.md + CHANGELOG.md after any code change**
- Accuracy: ~4.4 KB gzipped, 254 tests, zero dependencies, MIT
