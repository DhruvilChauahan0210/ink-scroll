# svg-scroll-draw — Roadmap

> Last updated: 2026-06-04 — v2.0.0
>
> Items marked ✓ are shipped. Remaining items are ordered by value/effort ratio.

---

## Shipped ✓

### Library
- [x] Core scroll-draw engine — `stroke-dashoffset` driven by `IntersectionObserver` + `requestAnimationFrame`
- [x] `stagger` — sequential path animation with configurable delay
- [x] `direction: 'reverse'` — erase/undraw animation
- [x] `onProgress` callback — fires every frame with 0–1 alpha
- [x] `onStart` / `onComplete` lifecycle hooks
- [x] `easing` — linear, ease-in/out, spring, bounce, elastic, custom function
- [x] `fade`, `speed`, `once`, `debug`, `delay`, `axis`, `scrollContainer`, `threshold`, `rootMargin`
- [x] `trigger.start` / `trigger.end` — anchor strings + percentage format
- [x] `autoReverse` — follows scroll direction
- [x] `waypoints` — callbacks at specific progress thresholds
- [x] `strokeColor`, `strokeWidth` — animated color and width
- [x] `fillOpacity` — flood fill in sync with stroke draw
- [x] `clip` — clip-path reveal mode (left/right/top/bottom/center)
- [x] `morphTo` — path `d` attribute interpolation
- [x] `velocityScale` — draw speed scales with scroll velocity
- [x] `repeat` / `repeatDelay` — loop or replay N times
- [x] `autoplay` + `duration` — viewport-enter trigger mode
- [x] `native` — compositor-level CSS `animation-timeline: view()` fast path
- [x] `pause` / `resume` / `seek` / `replay` / `getProgress` / `destroy` instance API
- [x] `rect` + `circle` support — perimeter-based length calculation
- [x] `Cinematic` class — reads `story.json` from Cinematic Studio, builds sticky-stage timeline
- [x] Zero runtime dependencies, ~4.4 KB gzipped

### Framework Wrappers
- [x] React (`svg-scroll-draw/react`) — `<ScrollDraw>`, `useScrollDrawProgress`
- [x] Vue 3 (`svg-scroll-draw/vue`) — `<ScrollDraw>`, `useScrollDraw`
- [x] Svelte (`svg-scroll-draw/svelte`) — `use:scrollDraw`, `createScrollDraw`
- [x] Solid (`svg-scroll-draw/solid`) — `useScrollDraw`, `createScrollDraw`
- [x] Angular (`svg-scroll-draw/angular`) — `ScrollDrawRef`
- [x] Astro (`svg-scroll-draw/astro`) — `initScrollDraw()`, data-attribute API
- [x] Nuxt (`svg-scroll-draw/nuxt`) — `useScrollDraw()` composable
- [x] Web Component (`svg-scroll-draw/web-component`) — `<scroll-draw>` custom element

### Advanced APIs
- [x] Group API (`svg-scroll-draw/group`) — `scrollDrawGroup`, `scrollDrawSequence`
- [x] Timeline API (`svg-scroll-draw/timeline`) — independent per-element scroll windows
- [x] Cinematic API (`svg-scroll-draw/cinematic`) — Studio bridge

### v2 APIs (Phase 1 — v2.0.0)
- [x] `scrollAnimate` — animate any CSS property on any element driven by scroll; native CSS fast path; full instance API
- [x] `scrollCounter` — animated number counter on scroll with format/decimals
- [x] `scrollParallax` — thin wrapper over `scrollAnimate` for parallax movement
- [x] `ScrollAnimate` React component (`svg-scroll-draw/react`)
- [x] `ScrollCounter` React component (`svg-scroll-draw/react`)

### v2 APIs (Phase 2 — v2.1.0 → shipped in v2.2.0)
- [x] `scrollVideo` — `<video>.currentTime` tied to scroll, ships as `svg-scroll-draw/video`
- [x] `scrollText` — text split + reveal animation on scroll, ships as `svg-scroll-draw/text`
- [x] `ScrollVideo` + `ScrollText` React wrappers

### v2 APIs (Phase 3 — v2.2.0)
- [x] Visual DevTools overlay — `svg-scroll-draw/devtools`, progress panel + trigger lines, dev-only
- [x] Global instance registry in `src/core/registry.ts`

### Demo site (v2)
- [x] Home page v2 section — 6-card grid with code snippets for all new APIs
- [x] DocsPage — v2.0–2.2 nav group with full option tables for all 6 new APIs
- [x] ExamplesPage — 3 new v2 example cards (scrollAnimate, scrollCounter, scrollText)
- [x] Blog post: "Replace GSAP ScrollTrigger with scrollAnimate" at `/blog/replace-gsap-scrolltrigger`

### Demo Site
- [x] Home page — hero, 15+ demos, API table, framework tabs, bundle comparison, live stats
- [x] `/examples` — 13 examples with framework filter (All / React / Vue / Svelte / Solid / Vanilla / API)
- [x] `/docs` — full API reference
- [x] `/playground` — interactive SVG editor
- [x] `/changelog` — version history
- [x] `/blog/gsap-drawsvg-alternative` — SEO comparison post
- [x] Copy button on all code blocks
- [x] Install tabs — npm / pnpm / yarn / bun / CDN
- [x] Framework quickstart tabs
- [x] Bundle size comparison chart
- [x] Dark/light mode toggle
- [x] Native CSS support badge
- [x] Live npm / GitHub stats

---

## Remaining

### Demo Site

#### ~~`/blog` index page~~ — ✓ shipped
`/blog/page.tsx` exists with post card listing. "Blog" added to all nav instances.

#### ~~More demo examples~~ — ✓ shipped
13 examples including logo reveal, line chart, signature, flowchart, map route, network diagram, group, sequence, timeline, Vue, Svelte, Solid.

#### More blog posts — ongoing
- "Zero-JS SVG scroll animations with native CSS" — deep-dive on the `animation-timeline` fast path
- "Scroll-driven path morphing" — uses the `morphTo` option with real examples

---

### Library

#### Vue/Svelte/Solid wrappers for v2 APIs — v2.3.0 (future)
- [ ] `scrollAnimate`, `scrollCounter`, `scrollParallax`, `scrollVideo`, `scrollText` wrappers for Vue, Svelte, and Solid

#### `scrollDrawTimeline` demo — scrub bar ✓ shipped
`TimelineDemo` in `ExamplesPage.tsx` now shows per-track progress bars + global scroll position live below the chart.

#### `scrollDrawTimeline` API improvements — medium effort
Potential future improvements to the API itself:
- Per-entry easing override (currently per-track easing works, but no looping)
- Looping timeline support

#### Presets / theme system — medium effort
Ship a small collection of named preset configs (e.g. `'sketch'`, `'typewriter'`, `'reveal'`) that set sane defaults for common use cases. Zero breaking changes — just named option bags.
```ts
scrollDraw('#path', { preset: 'sketch' })
```

#### CLI / init tool — larger effort
`npx svg-scroll-draw init` scaffolds framework-specific boilerplate (React component, Vue SFC, Svelte file) with a starter SVG already wired up. Reduces the "how do I set this up" friction from the docs.

---

## Priority Order

1. `/blog` index page — 1 hour, fixes a broken discoverability gap
2. More demo examples — logo + signature immediately make the site more convincing
3. `scrollDrawTimeline` scrub UI — elevates the most unique API
4. Presets — lowers the bar for new users
5. More blog posts — compound SEO value over time
6. CLI init tool — largest effort, highest long-term DX payoff
