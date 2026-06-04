---
name: project-v2-state
description: Current v2.2.0 published state — APIs shipped, what's next, key facts for next session
metadata:
  type: project
---

svg-scroll-draw v2.2.0 is **published on npm** as of 2026-06-04.

**Why:** PRD v2 goal — transform from "best SVG scroll library" into "full scroll animation platform" to replace GSAP for 95% of scroll animation use cases.

**What shipped:**
- v2.0.0: scrollAnimate, scrollCounter, scrollParallax + React wrappers
- v2.2.0: scrollVideo, scrollText, devtools overlay + React wrappers
- Global instance registry (src/core/registry.ts)
- 358 tests, ~9 KB gzipped, zero deps

**Demo site fully updated:**
- ScrollAnimateInteractive — live scrubber demo on home page
- 3 real v2 examples on /examples (Pricing Card Reveal, Social Proof Strip, Hero Headline Reveal)
- All version numbers synced site-wide (v2.2.0, ~9 KB, 358 tests)
- 5 blog posts including "Replace GSAP ScrollTrigger with scrollAnimate"
- README rewritten for v2

**Next (v2.3.0):**
- Vue/Svelte/Solid wrappers for all v2 APIs (highest priority)
- Interactive scrollText demo on home page
- Changelog page v2 milestone visual callout

**How to apply:** Next session starts at v2.3.0 scope. Don't re-explain v2 APIs — they're already shipped and documented.
