# svg-scroll-draw — Product Status Doc
**Version:** 1.3.0 · **Bundle:** ~4.4 KB gzipped · **License:** MIT · **Zero dependencies**

---

## 1. What It Is

`svg-scroll-draw` animates SVG paths (and any HTML element via clip-path) as the user scrolls. It uses `stroke-dashoffset` under the hood, has a native CSS fast path for eligible configs, and ships framework adapters for every major ecosystem.

---

## 2. Core Library (`packages/svg-scroll-draw`)

### Entry point
```
scrollDraw(target, options) → ScrollDrawInstance
```
`target` is a CSS selector or `Element`. Returns a fully controllable instance.

---

### All Options (`ScrollDrawOptions`)

| Option | Type | Default | What it does |
|---|---|---|---|
| `selector` | string | `'path, polyline, line, polygon, rect, circle'` | Which child elements to animate |
| `speed` | number | `1` | Multiplier — values >1 complete faster |
| `fade` | boolean | `false` | Fade opacity in sync with draw progress |
| `easing` | EasingName or fn | `'linear'` | Animation curve |
| `trigger.start` | string | `'top bottom'` | When animation starts (element anchor + viewport anchor) |
| `trigger.end` | string | `'bottom top'` | When animation ends |
| `stagger` | number | `0` | Stagger per-path offset as a fraction of scroll range |
| `direction` | `'forward'`/`'reverse'` | `'forward'` | Draw direction |
| `once` | boolean | `false` | Lock at max progress — never un-draws on scroll back |
| `debug` | boolean | `false` | Shows green/red dashed trigger lines overlaid on the page |
| `axis` | `'x'`/`'y'` | `'y'` | Scroll axis (vertical or horizontal) |
| `scrollContainer` | string / Element | `window` | Custom scroll parent |
| `autoReverse` | boolean | `false` | Detects scroll direction and draws/undraws automatically |
| `delay` | number (ms) | `0` | Delay before observer starts |
| `strokeColor` | string / [from, to] | — | Static override or interpolate stroke color |
| `strokeWidth` | number / [from, to] | — | Static override or interpolate stroke width |
| `fillOpacity` | number / [from, to] | — | Animate fill opacity. `[0, 1]` floods fill in sync with draw |
| `clip` | bool / direction | `false` | Reveal with CSS `clip-path` instead of stroke. Works on any element (images, divs, text). Directions: `left`, `right`, `top`, `bottom`, `center` |
| `waypoints` | `Record<0–1, fn>` | — | Fire callbacks at exact progress thresholds. Resets on `replay()` |
| `velocityScale` | bool / number | `false` | Scale animation speed by scroll velocity. Pass a number for sensitivity |
| `threshold` | number | `0` | IntersectionObserver threshold |
| `rootMargin` | string | `'0px'` | IntersectionObserver rootMargin |
| `repeat` | number / `'infinite'` | `0` | Repeat animation N times or infinitely |
| `repeatDelay` | number (ms) | `0` | Pause between repeats |
| `morphTo` | string (path `d`) | — | Morph the path toward a target shape as it draws. Must have compatible command structure. Only on `<path>` elements |
| `native` | boolean | `true` | Use CSS `animation-timeline: view()` compositor path when eligible. `false` forces JS engine |
| `onProgress` | `(alpha: number) => void` | — | Called every frame with 0–1 progress |
| `onStart` | `() => void` | — | Called when progress first crosses 0 |
| `onComplete` | `() => void` | — | Called when progress reaches 1 |

---

### Instance API (`ScrollDrawInstance`)

| Method | What it does |
|---|---|
| `destroy()` | Clean up all observers, listeners, rAF loops |
| `replay()` | Reset and replay from 0 |
| `pause()` | Freeze at current frame |
| `resume()` | Continue from paused state |
| `seek(0–1)` | Jump to exact progress and pause |
| `getProgress()` | Returns current 0–1 progress |

---

### Easing System

**Named strings** (pass as `easing: 'ease-out'` etc.):
- `linear`, `ease-in`, `ease-out`, `ease-in-out`
- `spring` — cosine-based spring with overshoot
- `bounce` — rises to 1 then makes N dips before settling (stays in [0,1])
- `elastic` — overshoots past 1 and oscillates back (can exceed [0,1])

**Factory functions** for custom curves:
```ts
createSpring({ tension?, friction? })   // tune spring frequency + damping
createBounce({ bounces?, decay? })      // tune number of bounces + amplitude decay
createElastic({ amplitude?, period? })  // tune overshoot size + oscillation period
```
Any `(t: number) => number` function is also accepted directly.

---

### Native CSS Fast Path

When `native: true` (default) and the browser supports `animation-timeline: view()` (Chrome, Edge, Firefox), a simple draw delegates entirely to the CSS compositor — zero per-frame JS, zero scroll/resize listeners.

**Falls back to JS engine automatically when config uses:**
- callbacks (`onProgress`, `onStart`, `onComplete`)
- `stagger`, `morphTo`, `clip`, `waypoints`, `repeat`, `velocityScale`
- `once`, `autoReverse`, `speed !== 1`, `delay > 0`
- custom scroll container, custom easing function, non-default triggers
- axis other than `'y'`

The full instance API (pause/seek/getProgress etc.) works on both paths.

---

### CSS Custom Property

Every frame the engine sets `--scroll-draw-progress` on the container element (0–1). Use this to drive CSS animations without JS callbacks.

---

### `prefers-reduced-motion` Support

If the browser reports reduced motion, all paths snap instantly to their final state and `onComplete` is called immediately. No animation runs.

---

## 3. Sub-entry APIs

### Group API (`svg-scroll-draw/group`)

```ts
scrollDrawGroup(targets[], options)    // animate N containers simultaneously, same options
scrollDrawSequence(targets[], options) // chain N containers in order — next starts when previous completes
```
Both return a `ScrollDrawInstance` that controls all child instances together.

`scrollDrawSequence` forces `once: true` on each step internally to prevent chain from resetting on scroll-back.

---

### Timeline API (`svg-scroll-draw/timeline`)

```ts
scrollDrawTimeline(target, {
  trigger, speed, once, axis,
  tracks: [
    { selector, from, to, easing?, fade? },
    ...
  ],
  onComplete,
})
```

Animate multiple path groups inside one container, each with its own `from`/`to` window within the 0–1 scroll range. Unlike `stagger` (time offset), each track has a fully independent slice.

---

### Web Component (`svg-scroll-draw/web-component`)

`<scroll-draw>` custom element. Drop into any HTML without a build step.

---

### CDN (`svg-scroll-draw/cdn`)

Pre-bundled IIFE for direct `<script>` usage without npm.

---

## 4. Framework Adapters

| Framework | Export | Import path |
|---|---|---|
| **React** | `<ScrollDraw>` component + `useScrollDrawProgress` hook | `svg-scroll-draw/react` |
| **Vue 3** | `useScrollDraw` composable | `svg-scroll-draw/vue` |
| **Svelte** | `scrollDraw` action + `createScrollDraw` | `svg-scroll-draw/svelte` |
| **Solid.js** | `useScrollDraw` + `createScrollDraw` | `svg-scroll-draw/solid` |
| **Angular** | `ScrollDrawRef` directive | `svg-scroll-draw/angular` |
| **Astro** | `initScrollDraw` helper | `svg-scroll-draw/astro` |
| **Nuxt** | plugin/composable | `svg-scroll-draw/nuxt` |
| **Vanilla** | `scrollDraw()` | `svg-scroll-draw` |

### React extras

`useScrollDrawProgress(ref, options)` — returns a reactive 0–1 number for any element. Same trigger/speed/easing semantics as `ScrollDraw`. Drive any animation (CSS transforms, opacity, counter values, etc.) alongside SVG draw.

---

## 5. Test Suite

- **249 passing tests** across 7 suites (as of v1.3.0)
- Test files: `engine.test.ts`, `engine-native.test.ts`, `engine-options.test.ts`, `group.test.ts`, `timeline.test.ts`, `framework.test.ts`, `utils.test.ts`
- CI matrix: Node 20 + 22
- Coverage threshold enforced in CI
- `prepublishOnly` runs build + full test suite

---

## 6. Demo Site (`apps/demo`) — Next.js App Router

Live at: `https://svg-scroll-draw.vercel.app`

### Pages

#### `/` — Home
The main marketing + docs page. Contains:
- Sticky nav with dark/light theme toggle and mobile hamburger menu
- Hero section with animated mascot illustration and live SVG draw
- Live npm stats badge (weekly downloads)
- `InstallTabs` — tabbed npm / pnpm / yarn / bun / CDN install commands with one-click copy
- `FrameworkTabs` — tabbed code snippets for React, Vue, Svelte, Solid, Angular, Astro, Vanilla
- `NativeCSSBadge` — live badge showing whether current browser supports CSS scroll-driven animation
- Interactive feature demos (all scroll-driven, all live on the page):
  - `InteractiveScrollDemo` — hero SVG path draw with real-time speed/easing/stagger controls
  - `ScrollShowcase` — multi-section scroll showcase
  - `OnCompleteDemo` — fires callback at 100% draw
  - `WaypointsDemo` — fires callbacks at 25/50/75/100% thresholds
  - `ProgressHookDemo` — `useScrollDrawProgress` driving a live counter
  - `FillOpacityDemo` — fill flooding in sync with stroke
  - `ClipModeDemo` — CSS clip-path reveal on a non-SVG element
- Feature grid, comparison table
- CTA section
- JSON-LD structured data (`SoftwareApplication` schema)

#### `/docs`
Full API reference. Covers every option, trigger syntax, Group API, Timeline API, framework guides, TypeScript types.
JSON-LD: `TechArticle` schema.

#### `/examples`
Gallery of 13 real-world demos with framework filter strip (All / React / Vue 3 / Svelte / Solid / Vanilla / API). Demos include: logo reveal, line chart, signature animation, flowchart, Solid.js reactivity graph, and more.
JSON-LD: `ItemList` schema (13 items).

#### `/playground`
Live editor — paste any SVG, tweak options, see the animation. Controls:
- Easing dropdown (all 7 named easings + custom spring/bounce/elastic sliders)
- Speed, stagger, fade, direction, once, autoReverse
- strokeColor (from/to pickers), strokeWidth (from/to)
- fillOpacity (from/to), clip mode + direction
- morphTo path input
- Shareable URL (state encoded in query params)

#### `/changelog`
Full release history with version tags, dates, and typed items (new / fix). Covers v0.7.0 → v1.2.0.

#### `/blog`
Blog index listing posts with tag, date, read time.

#### `/blog/gsap-drawsvg-alternative`
SEO comparison article: svg-scroll-draw vs GSAP DrawSVG + ScrollTrigger. Contains:
- Bundle size bar chart (SVG, inline)
- Side-by-side code comparison
- 19-row feature matrix
- Migration guide
JSON-LD: `Article` schema.

---

### OG Images

Every route has a custom `opengraph-image.tsx` (generated with Satori/Next.js):
- `/` root OG
- `/docs` OG
- `/examples` OG
- `/playground` OG
- `/changelog` OG

---

### SEO Infrastructure

- `robots.ts` — sitemap/robots config
- `sitemap.ts` — auto-generated sitemap
- `googlea937c0c149fc8ebe.html` — Google Search Console verification
- Canonical URLs on every page
- Full `<meta>` keywords, og:, twitter: tags on every page

---

## 7. Package Exports (full list)

```
svg-scroll-draw           → scrollDraw(), ScrollDrawOptions, ScrollDrawInstance
svg-scroll-draw/react     → <ScrollDraw>, useScrollDrawProgress
svg-scroll-draw/vue       → useScrollDraw
svg-scroll-draw/svelte    → scrollDraw action, createScrollDraw
svg-scroll-draw/solid     → useScrollDraw, createScrollDraw
svg-scroll-draw/angular   → ScrollDrawRef
svg-scroll-draw/astro     → initScrollDraw
svg-scroll-draw/nuxt      → plugin
svg-scroll-draw/group     → scrollDrawGroup, scrollDrawSequence
svg-scroll-draw/timeline  → scrollDrawTimeline, TimelineTrack
svg-scroll-draw/web-component → <scroll-draw> custom element
```
Ships: ESM (`.mjs`) + CJS (`.cjs`) + TypeScript declarations (`.d.ts`) for every entry.

---

## 8. Repo Structure

```
ink-scroll/
├── packages/svg-scroll-draw/   ← npm package (the library)
│   ├── src/core/               ← engine.ts, types.ts, utils.ts
│   ├── src/react/              ← React component + hook
│   ├── src/vue/                ← Vue composable
│   ├── src/svelte/             ← Svelte action
│   ├── src/solid/              ← Solid.js primitives
│   ├── src/angular/            ← Angular directive
│   ├── src/astro/              ← Astro helper
│   ├── src/nuxt/               ← Nuxt plugin
│   ├── src/group/              ← Group + Sequence API
│   ├── src/timeline/           ← Timeline API
│   ├── src/web-component/      ← Custom element
│   ├── src/cdn.ts              ← CDN bundle entry
│   └── src/__tests__/          ← 478 tests
└── apps/demo/                  ← Next.js site (vercel.app)
    └── src/app/                ← 7 pages + OG images
```

---

## 9. Version History Summary

| Version | Key additions |
|---|---|
| **v1.3.0** | `autoplay` + `duration` options — draw on viewport enter (no scroll), full instance API, 249 tests |
| **v1.2.0** | `bounce` + `elastic` easings, Solid.js demo, framework filter on /examples, OG images for all pages, GSAP comparison blog post, playground bounce/elastic sliders |
| **v1.1.0** | Native CSS `animation-timeline: view()` fast path, `native` option, engine-native tests |
| **v1.0.0** | Fixed `scrollDrawSequence` chain, 194 tests, framework wrapper tests, CI coverage |
| **v0.7.0** | `createSpring()`, Timeline API, `--scroll-draw-progress` CSS custom property |
| **earlier** | Core engine, all framework adapters, Group/Sequence API, clip mode, morphTo, waypoints, velocity scaling, color/width animation, fillOpacity, web component |
