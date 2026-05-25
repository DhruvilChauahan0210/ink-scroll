# Project Status — svg-scroll-draw

## Core Library (`packages/svg-scroll-draw`)

### Architecture
- [x] Directory structure matches plan (`src/core/`, `src/react/`, `src/index.ts`)
- [x] TypeScript interfaces (`ScrollDrawOptions`, `ScrollDrawInstance`, `TriggerConfig`, `EasingName`)
- [x] Pure utility functions extracted to `src/core/utils.ts` (easing, math, trigger parsing)
- [x] Vanilla JS entry point (`scrollDraw()` function)
- [x] React wrapper (`<ScrollDraw>` component)

### FR-1: Initialization Lifecycle
- [x] Path discovery — queries `path, polyline, line, polygon` inside container
- [x] Property injection — sets `stroke-dasharray` and `stroke-dashoffset` dynamically via `getTotalLength()`
- [x] Soft dev warning when element is missing `stroke` attribute
- [x] Warning when `fill` attribute is present and not `none`/`transparent`

### FR-2: Performance Optimization
- [x] IntersectionObserver for visibility culling
- [x] Scroll throttling — rAF loop only runs when element is in viewport
- [x] `requestAnimationFrame` wrapping for 60/120Hz sync

### FR-3: Dynamic Resize Handling
- [x] `resize` and `orientationchange` event listeners
- [x] 150ms debounce on recalculation
- [x] Recomputes `getTotalLength()` and re-sets `stroke-dasharray` on resize
- [x] `cacheTriggers()` called inside resize handler — recomputes `tStart`/`tEnd` after layout changes

### API Options
- [x] `selector` — custom path selector
- [x] `speed` — animation scale factor
- [x] `fade` — opacity fade-in while drawing
- [x] `easing` — `linear`, `ease-in`, `ease-out`, `ease-in-out`, custom function
- [x] `trigger.start` / `trigger.end` — viewport anchor strings
- [x] `onComplete` — fires when alpha reaches 1.0
- [x] `destroy()` — cleans up observer, rAF, listeners, timers

### NFR-1: Bundle Size
- [x] Zero runtime dependencies
- [x] Tree-shakeable (tsup ESM output)
- [x] Core: `2.61 KB` ESM / `2.62 KB` CJS — **under 3KB target ✓**
- [x] React bundle: `2.68 KB` ESM / `2.71 KB` CJS — **under 3KB target ✓**

### NFR-2: Module Formats
- [x] ESM (`.mjs`) output
- [x] CJS (`.cjs`) output
- [x] IIFE/UMD CDN bundle — `dist/cdn/svg-scroll-draw.global.js` (3.04 KB), exposed as `window.SvgScrollDraw`

### NFR-3: SSR/SSG Proofing
- [x] `typeof window === 'undefined'` guard in `createEngine`
- [x] `typeof window === 'undefined'` guard in `scrollDraw()`
- [x] React component uses `useEffect` (browser-only) — safe for Next.js App Router

### Package Exports & Publish Config
- [x] `"."` export — ESM + CJS + types
- [x] `"./react"` export — ESM + CJS + types
- [x] `main`, `module`, `types` fields set correctly
- [x] `files: ["dist"]` — only ships built output
- [x] `prepublishOnly` script — runs `build && test` before every publish

---

## Demo App (`apps/demo`)

- [x] Next.js 16 App Router scaffolded with TypeScript + Tailwind v4
- [x] npm workspace symlink wired (`svg-scroll-draw: "*"`)
- [x] `'use client'` wrapper component (`src/components/ScrollDraw.tsx`)
- [x] Hero section with install command
- [x] Demo 01 — basic path draw
- [x] Demo 02 — easing + speed
- [x] Demo 03 — fade
- [x] Demo 04 — complex multi-path SVG
- [x] Demo 05 — `onComplete` with live amber badge + pulse animation (`OnCompleteDemo.tsx` client component)
- [x] API reference table
- [ ] Interactive controls (toggle easing, speed slider)
- [ ] Dark/light mode toggle

---

## Testing (`plan1.md §7`)
- [x] jsdom environment via Vitest
- [x] Unit tests for all easing functions (`utils.test.ts`)
- [x] Unit tests for scroll progress math — `computeProgress`, `computeTriggers`, `clamp`
- [x] Unit tests for `parseTrigger`, `elementAnchorY`, `viewportAnchorY`
- [x] Lifecycle tests — `destroy()` disconnects observer, removes listeners, cancels rAF
- [x] Warning tests — no stroke, fill present, fill="none" (no warn)
- [x] SSR guard test — window undefined returns no-op
- [x] `onComplete` fires at full draw progress
- [x] `scrollDraw()` handles missing container gracefully
- [x] **43 tests, all passing**
- [x] Coverage report — **97.74% stmts / 95.52% branches / 90% funcs / 97.74% lines** — all ≥90% thresholds pass ✓
- [ ] CI pipeline

---

## Remaining
- [x] Coverage verified — ≥90% across all metrics
- [ ] CI pipeline (GitHub Actions)
- [ ] Interactive demo controls (easing toggle, speed slider)
- [ ] Dark/light mode toggle on demo
