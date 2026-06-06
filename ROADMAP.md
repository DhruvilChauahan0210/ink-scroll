# svg-scroll-draw — Roadmap

> Last updated: 2026-06-06 — v2.9.0
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

### v2 APIs (Phase 5 — v2.4.0)
- [x] Angular v2 wrappers — `ScrollAnimateRef`, `ScrollCounterRef`, `ScrollVideoRef`, `ScrollTextRef`
- [x] Astro v2 — `initScrollAnimate`, `initScrollCounter`, `initScrollText`, `initAll`
- [x] Nuxt v2 — all v2 composables/components re-exported + plugin
- [x] `scrollAnimateGroup` + `scrollAnimateSequence` in `svg-scroll-draw/group`

### v2 APIs (Phase 4 — v2.3.0)
- [x] Vue 3 v2 wrappers — `useScrollAnimate`, `useScrollCounter`, `useScrollVideo`, `useScrollText` + `<ScrollAnimate>`, `<ScrollCounter>`, `<ScrollVideo>`, `<ScrollText>` components
- [x] Svelte v2 wrappers — `scrollAnimate`, `scrollCounterAction`, `scrollVideoAction`, `scrollTextAction` actions + `create*` helpers
- [x] Solid v2 wrappers — `useScrollAnimate`, `useScrollCounter`, `useScrollVideo`, `useScrollText` + `create*` variants

### Demo site (v2)
- [x] Home page v2 section — 6-card grid with code snippets for all new APIs
- [x] DocsPage — v2.0–2.2 nav group with full option tables for all 6 new APIs
- [x] ExamplesPage — 3 new v2 example cards (scrollAnimate, scrollCounter, scrollText)
- [x] Blog post: "Replace GSAP ScrollTrigger with scrollAnimate" at `/blog/replace-gsap-scrolltrigger`
- [x] `ScrollTextInteractive` — interactive home page demo for `scrollText` (split mode, stagger, presets)
- [x] Changelog page v2 callout — "v2 — The Platform Shift" separator between v2.x and v1.x entries

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
- [x] "Zero-JS SVG scroll animations with native CSS" — `/blog/native-css-svg-scroll-animations`
- [x] "Scroll-driven path morphing with morphTo" — `/blog/scroll-path-morphing`
- [x] "5 scroll animation patterns in under 10 lines" — `/blog/5-patterns-under-10-lines`
- [x] "Replace GSAP ScrollTrigger with scrollAnimate" — `/blog/replace-gsap-scrolltrigger`

---

### v2 APIs (Phase 6 — v2.7.0) ✓
- [x] **Scroll callbacks** — `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` on `ScrollDrawOptions` + `ScrollAnimateOptions`
- [x] **`scrollPin`** (`svg-scroll-draw/pin`) — pin elements at a viewport position with wrapper-based layout, `pinDistance`, `top`, full lifecycle callbacks, `refresh()`
- [x] **`scrollSnap`** (`svg-scroll-draw/snap`) — JS section snapping with custom easing, threshold, `snapTo()`, `getCurrentIndex()`, `onSnap`
- [x] **`createLenisAdapter`** (`svg-scroll-draw/lenis`) — Lenis v1 adapter that patches `window.scrollY`

---

## Remaining

### Library — next batch (v2.8.0+)
- [ ] **`/vs-gsap` comparison page** — bundle size, FPS benchmark, license cost, API side-by-side
- [ ] **GSAP migration guide** — `gsap.to()` → `scrollAnimate`, `ScrollTrigger` → `scrollPin`/callbacks
- [ ] **Horizontal scroll sections** — `scrollPin` with horizontal axis
- [ ] **Velocity / momentum detection** on `scrollAnimate`
- [ ] **`scrollPin.refresh()`** auto-call on dynamic content changes (ResizeObserver)

### Demo Site
- [ ] **`/vs-gsap` page** on demo site — side-by-side code + live demos
- [ ] **scrollPin + scrollSnap demos** on home page and examples page
- [ ] **Blog post** — "Pin sections on scroll without GSAP: scrollPin"

---

## Priority Order

1. `/vs-gsap` page — single biggest SEO + conversion driver
2. Demo page for scrollPin — most visually impressive new feature
3. GSAP migration guide — captures "GSAP alternative" search intent
