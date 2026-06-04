# Next Session Plan — svg-scroll-draw

> Updated: 2026-06-04

---

## Current state

**Library: v2.2.0 — published on npm. 358 tests passing.**

svg-scroll-draw is now a full scroll animation platform. All PRD v2 phases (1, 2, 3) are shipped.
The demo site is fully updated with live demos, v2 docs, changelog, and all version numbers synced.

---

## What shipped this session (v2.0.0 → v2.2.0)

### Library
- [x] `scrollAnimate` — any CSS property, any element, scroll-driven. Native CSS fast path.
- [x] `scrollCounter` — animated number on scroll. Format fn, decimals, easing.
- [x] `scrollParallax` — speed multiplier wrapper over scrollAnimate.
- [x] `scrollVideo` — `<video>.currentTime` tied to scroll (`svg-scroll-draw/video`)
- [x] `scrollText` — chars/words/lines split + stagger animate (`svg-scroll-draw/text`). Free GSAP SplitText.
- [x] `devtools` overlay — progress panel + trigger lines, dev-only (`svg-scroll-draw/devtools`)
- [x] Global instance registry (`src/core/registry.ts`)
- [x] React wrappers for all v2 APIs (`ScrollAnimate`, `ScrollCounter`, `ScrollVideo`, `ScrollText`)
- [x] Initial state fix — elements no longer flash before IntersectionObserver fires
- [x] 86 new tests — 358 total across 12 suites
- [x] README fully rewritten for v2 — all APIs documented with examples and options tables
- [x] Published to npm as v2.2.0

### Demo site
- [x] `ScrollAnimateInteractive` — 4-effect live demo with scrubber, easing picker, auto-play, live code
- [x] Home page: interactive demo + compact v2 API grid
- [x] ExamplesPage: 3 real v2 examples — Pricing Card Reveal, Social Proof Strip, Hero Headline Reveal
- [x] DocsPage: v2.0–2.2 nav section with full option tables for all 6 new APIs
- [x] Changelog: v2.2.0, v2.0.0, v1.8.0 entries added with full release notes
- [x] Blog: "Replace GSAP ScrollTrigger with scrollAnimate" migration guide
- [x] All version numbers, sizes, test counts synced site-wide (v2.2.0 · ~9 KB · 358 tests)

---

## Remaining tasks

### TASK 1 — Vue/Svelte/Solid v2 wrappers (v2.3.0)
React has `ScrollAnimate`, `ScrollCounter`, `ScrollVideo`, `ScrollText`.
Vue, Svelte, and Solid have none of the v2 wrappers.

Approach:
- Add v2 composables/components to `src/vue/index.ts` — `useScrollAnimate`, `<ScrollAnimate>`, `useScrollCounter`, `<ScrollCounter>`
- Add v2 actions/helpers to `src/svelte/index.ts` — `scrollAnimate` action wrapper, `createScrollCounter`
- Add v2 hooks to `src/solid/index.ts` — `useScrollAnimate`, `createScrollCounter`
- Ships as v2.3.0

### TASK 2 — Changelog page v2 milestone callout
The `/changelog` page has v2.2.0 at the top but it blends visually with v1.x entries.
Add a visual separator or highlighted "v2 — The Platform Shift" callout between v2.x and v1.x sections.

### TASK 3 — Interactive scrollText demo on home page
Build `ScrollTextInteractive` — similar pattern to `ScrollAnimateInteractive`:
- Split selector (chars / words / lines)
- Stagger slider (0–0.1)
- From preset selector (fade up / rotate in / scale)
- Live preview with a real headline
- Live code block

---

## Guardrails
- **Don't publish without bumping version** — v2.2.0 is live; any new user-facing features need a version bump
- **Don't post to external platforms** — user posts manually
- **Always update STATUS.md + ROADMAP.md + CHANGELOG.md + NEXT-SESSION-PLAN.md after any code change**
- Accuracy: ~9 KB gzipped, 358 tests, zero dependencies, MIT, v2.2.0
