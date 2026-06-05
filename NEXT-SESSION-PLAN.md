# Next Session Plan — svg-scroll-draw

> Updated: 2026-06-05

---

## Current state

**Library: v2.6.0 — local build. 358 tests passing.**

Full scroll animation platform. Complete framework coverage. Playground now covers v2 APIs.

---

## What shipped this session (v2.5.0 → v2.6.0)

- [x] JSON-LD `softwareVersion` on home page: `1.2.0` → `2.6.0`
- [x] README sub-path exports table: all v2 wrappers listed for every framework
- [x] Blog post: "Animate multiple elements on scroll — one call" at `/blog/scroll-animation-groups`
- [x] Playground v2 tab — `scrollAnimate` (5 effects, 5 easings), `scrollText` (split/stagger/presets), `scrollCounter` (4 format presets). Each with scrubber, replay, and copy-ready code.

---

## Remaining tasks

### TASK 1 — Publish to npm
v2.6.0 is ready. Run `npm login` then `cd packages/svg-scroll-draw && npm publish`.

---

## Guardrails
- **Don't publish without bumping version** — v2.6.0 is ready to publish
- **Don't post to external platforms** — user posts manually
- **Always update STATUS.md + ROADMAP.md + CHANGELOG.md + NEXT-SESSION-PLAN.md after any code change**
- Accuracy: ~9 KB gzipped, 358 tests, zero dependencies, MIT, v2.6.0
