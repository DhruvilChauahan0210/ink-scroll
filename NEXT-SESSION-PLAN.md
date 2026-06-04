# Next Session Plan — svg-scroll-draw

> Updated: 2026-06-04

---

## Current state

**Library: v1.4.0 — published on npm. 254 tests passing.**

The library is feature-complete for the foreseeable future. All framework wrappers (React, Vue, Svelte, Solid, Angular, Astro, Nuxt, Web Component), advanced APIs (Group, Timeline, Cinematic), and every planned option are shipped.

The demo site is fully built with all pages, components, and SEO infrastructure in place.

---

## Completed this session (v1.6.0)

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

### TASK 0 — npm publish v1.6.0
```bash
cd packages/svg-scroll-draw
npm version 1.6.0
npm publish --access public
```

### TASK 1 — More blog posts
Technical content compounds over time. Good next article:
- "Zero-JS SVG scroll animations with native CSS" — deep-dive on the `animation-timeline` fast path, when it activates, when it falls back, browser support matrix

### TASK 2 — `scrollDrawTimeline` API improvements
Small quality-of-life additions to the timeline API itself:
- Looping timeline support
- Better debugging (visualize track windows like `debug: true` does for scroll draw)

---

## Guardrails
- **Don't publish npm without bumping version** — v1.4.0 is live; any new user-facing features need a version bump before publish
- **Don't post to external platforms** — `launch/` files are drafts, user posts them manually
- **Always update STATUS.md + ROADMAP.md + CHANGELOG.md after any code change**
- Accuracy: ~4.4 KB gzipped, 254 tests, zero dependencies, MIT
