# Next Session Plan — svg-scroll-draw

> Updated: 2026-06-05

---

## Current state

**Library: v2.7.0 — local build. 388 tests passing.**

Full scroll animation platform. Phase 1 GSAP-parity features shipped.

---

## What shipped this session (v2.6.0 → v2.7.0)

- [x] **Scroll callbacks** — `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` on `scrollAnimate` + `scrollDraw`
- [x] **`scrollPin`** (`svg-scroll-draw/pin`) — wrapper-based element pin with full lifecycle callbacks
- [x] **`scrollSnap`** (`svg-scroll-draw/snap`) — JS section snapping with `snapTo()` + `onSnap`
- [x] **`createLenisAdapter`** (`svg-scroll-draw/lenis`) — Lenis v1 `window.scrollY` patcher
- [x] 30 new tests (callbacks × 6, pin × 11, snap × 7, lenis × 6) → 388 total

---

## Remaining tasks

### TASK 1 — Publish v2.7.0 to npm
Run `npm login` then `cd packages/svg-scroll-draw && npm publish`.

### TASK 2 — `/vs-gsap` comparison page on the demo site
Single biggest SEO lever. Bundle size, FPS benchmark, license cost, side-by-side API code.

### TASK 3 — scrollPin + scrollSnap demos on home/examples page
Show the new APIs in action. Most visually impressive new features.

### TASK 4 — Blog post: "Pin sections on scroll without GSAP: scrollPin"
Target "GSAP pin alternative" search intent.

---

## Guardrails
- **Don't publish without bumping version** — v2.7.0 is ready to publish
- **Don't post to external platforms** — user posts manually
- **Always update STATUS.md + ROADMAP.md + CHANGELOG.md + NEXT-SESSION-PLAN.md after any code change**
- Accuracy: ~9 KB gzipped, 388 tests, zero dependencies, MIT, v2.7.0
- **Don't post to external platforms** — user posts manually
- **Always update STATUS.md + ROADMAP.md + CHANGELOG.md + NEXT-SESSION-PLAN.md after any code change**
- Accuracy: ~9 KB gzipped, 358 tests, zero dependencies, MIT, v2.6.0
