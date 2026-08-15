# svg-scroll-draw v2 — Product Requirements Document

> **Goal:** Transform svg-scroll-draw from "the best SVG scroll animation library" into "the best scroll animation library, period" — making GSAP + ScrollTrigger unnecessary for the vast majority of scroll-driven projects.
>
> **Author:** Dhruvil Chauhan
> **Status:** Draft — June 2026
> **Target version:** v2.0.0

---

## 1. Problem

svg-scroll-draw v1 is the best tool for scroll-driven SVG path animation. But developers working on real projects still reach for GSAP because:

1. **Scope gap** — GSAP animates any CSS property, any DOM element. svg-scroll-draw only animates SVG paths. On a page with both SVG and non-SVG scroll animations, developers install GSAP for both to avoid mixing libraries.
2. **Content animations** — Fading/sliding sections, parallax, number counters, text reveals are extremely common and currently outside svg-scroll-draw's scope.
3. **Video scrubbing** — A flagship scroll pattern (used by Apple, Stripe, Linear) has no lightweight solution. GSAP is the de facto choice despite the cost.
4. **No dev tooling** — GSAP's marker system is beloved. svg-scroll-draw's `debug` option is minimal compared to a proper visual debugger.

**The opportunity:** A developer starting a scroll-heavy project today installs GSAP as a default. We want to change the default.

---

## 2. Goals

- **G1** — Cover 95% of scroll animation use cases that currently require GSAP
- **G2** — Stay under 10 KB gzipped for the full v2 package (GSAP stack is 40 KB+)
- **G3** — Maintain zero runtime dependencies
- **G4** — Every new API follows the same ergonomics as `scrollDraw` — one function call, same trigger syntax, same instance API
- **G5** — Native CSS fast path extended to new APIs where the browser supports it

## 3. Non-Goals

- General-purpose JS animation engine (tweening non-scroll values, timelines with absolute time)
- Canvas animation
- 3D / WebGL
- GSAP plugin compatibility / migration wrapper
- IE11 / legacy browser support

---

## 4. Features

### 4.1 `scrollAnimate` — CSS property animation on scroll

**Priority: P0 — The most important feature in v2.**

Animates any CSS property on any element as the user scrolls. This is the direct replacement for `gsap.to(el, { scrollTrigger })` for the 80% case.

#### API

```ts
import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate(target: string | Element, options: ScrollAnimateOptions): ScrollDrawInstance
```

#### Options

```ts
interface ScrollAnimateOptions {
  // CSS properties to animate from → to
  // Values: strings (any CSS value) or [from, to] tuple
  props: Record<string, string | number | [string | number, string | number]>;

  // Same trigger syntax as scrollDraw()
  trigger?: { start?: string; end?: string };
  easing?: EasingName | ((t: number) => number);
  speed?: number;
  once?: boolean;
  repeat?: number | 'infinite';
  repeatDelay?: number;
  axis?: 'x' | 'y';
  scrollContainer?: string | Element;
  onProgress?: (alpha: number) => void;
  onComplete?: () => void;
}
```

#### Examples

```js
// Fade + slide in
scrollAnimate('#hero-text', {
  props: {
    opacity:   [0, 1],
    transform: ['translateY(40px)', 'translateY(0px)'],
  },
  easing: 'ease-out',
  once: true,
});

// Parallax background
scrollAnimate('#bg', {
  props: { transform: ['translateY(0px)', 'translateY(-120px)'] },
  trigger: { start: 'top bottom', end: 'bottom top' },
});

// Color transition
scrollAnimate('#section', {
  props: {
    backgroundColor: ['#ffffff', '#0d0d0d'],
    color:           ['#000000', '#ffffff'],
  },
});

// Multiple elements with stagger
document.querySelectorAll('.card').forEach((el, i) => {
  scrollAnimate(el, {
    props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
    trigger: { start: `top ${85 - i * 5}%`, end: `top ${50 - i * 5}%` },
    easing: 'ease-out',
    once: true,
  });
});
```

#### React wrapper

```tsx
import { ScrollAnimate } from 'svg-scroll-draw/react';

<ScrollAnimate
  props={{ opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] }}
  easing="ease-out"
  once
>
  <div>Any content</div>
</ScrollAnimate>
```

#### Technical approach

- Detect numeric values and interpolate linearly at each frame
- For `transform`, parse individual functions and interpolate independently
- For color values, parse hex/rgb and interpolate channels
- Native CSS fast path: when props map to CSS properties that support `@keyframes` + `animation-timeline: view()`, inject CSS instead of JS (covers `opacity`, `transform`, `background-color`, `color` — the most common cases)
- Ships as `svg-scroll-draw` (main export) + `svg-scroll-draw/react`, `svg-scroll-draw/vue` wrappers
- Bundle target: ≤ 2 KB gzipped for the core

#### Success criteria

- Replaces `gsap.to(el, { opacity: 1, y: 0, scrollTrigger: {...} })` with one function call
- Works on any HTML or SVG element
- Passes all existing trigger/easing/instance tests
- Native CSS fast path activates for `opacity` + `transform` with named easing

---

### 4.2 `scrollVideo` — Video scrubbing tied to scroll

**Priority: P1 — Flagship wow-factor feature.**

Ties a `<video>` element's `currentTime` to scroll position. Turns any video into a scroll-driven animation — the pattern used on Apple product pages, Stripe, Linear, and hundreds of modern landing pages.

#### API

```ts
import { scrollVideo } from 'svg-scroll-draw/video';

scrollVideo(target: string | HTMLVideoElement, options: ScrollVideoOptions): ScrollDrawInstance
```

#### Options

```ts
interface ScrollVideoOptions {
  trigger?: { start?: string; end?: string };
  // Portion of the video to scrub (defaults to full duration)
  from?: number; // seconds, default 0
  to?: number;   // seconds, default video.duration
  easing?: EasingName | ((t: number) => number);
  once?: boolean;
  axis?: 'x' | 'y';
  // Preload strategy: 'auto' | 'metadata' | 'none'
  preload?: 'auto' | 'metadata';
  // Fires when video is ready to scrub (metadata loaded)
  onReady?: () => void;
  onComplete?: () => void;
  onProgress?: (alpha: number) => void;
}
```

#### Examples

```js
// Basic video scrub — plays the video as user scrolls
scrollVideo('#hero-video', {
  trigger: { start: 'top top', end: 'bottom top' },
});

// Scrub only the first 3 seconds
scrollVideo('#product-reveal', {
  from:    0,
  to:      3,
  trigger: { start: 'top 80%', end: 'top 20%' },
  easing:  'ease-in-out',
});
```

#### HTML setup

```html
<!-- Recommended attributes for smooth scrubbing -->
<video
  id="hero-video"
  src="hero.mp4"
  muted
  playsinline
  preload="auto"
  style="width: 100%"
></video>
```

#### Technical approach

- On each scroll frame: `video.currentTime = lerp(from, to, alpha)`
- `video.pause()` immediately on init to prevent autoplay
- Decode strategy: request `preload="auto"` if not set; warn in dev if not set
- Codec recommendation: HEVC (Safari) + H.264 fallback, or WebM — document in README
- Frame accuracy: browsers vary in scrubbing precision; document known limitations
- Ships as `svg-scroll-draw/video` (tree-shakeable sub-path export)
- Bundle target: ≤ 1.5 KB gzipped

#### Success criteria

- Scrubs a 5-second video smoothly at 60fps on Chrome, Firefox, Safari
- Works in Next.js App Router (SSR-safe)
- Documents video encoding recommendations for smooth scrubbing

---

### 4.3 `scrollCounter` — Animated number on scroll

**Priority: P1 — High-frequency request, quick win.**

Animates a numeric value displayed in a DOM element from a start to an end value as it scrolls into view. One of the most common "stats section" patterns on landing pages.

#### API

```ts
import { scrollCounter } from 'svg-scroll-draw';

scrollCounter(target: string | Element, options: ScrollCounterOptions): ScrollDrawInstance
```

#### Options

```ts
interface ScrollCounterOptions {
  from?: number;                          // default 0
  to: number;
  format?: (value: number) => string;     // default: String(Math.round(value))
  easing?: EasingName | ((t: number) => number);
  trigger?: { start?: string; end?: string };
  once?: boolean;
  decimals?: number;                      // fixed decimal places, default 0
  onComplete?: () => void;
}
```

#### Examples

```js
// Simple counter
scrollCounter('#user-count', { to: 50000 });

// Formatted with locale
scrollCounter('#revenue', {
  to:     1_250_000,
  format: n => '$' + Math.round(n).toLocaleString(),
  easing: 'ease-out',
  once:   true,
});

// Percentage with decimal
scrollCounter('#conversion', {
  from:     0,
  to:       94.7,
  decimals: 1,
  format:   n => n.toFixed(1) + '%',
});
```

#### React wrapper

```tsx
import { ScrollCounter } from 'svg-scroll-draw/react';

<ScrollCounter to={50000} format={n => n.toLocaleString()} once />
```

#### Technical approach

- Interpolate `from → to` at current alpha, apply `format()`, set `element.textContent`
- `decimals` shorthand sets `format: n => n.toFixed(decimals)`
- Ships as part of main `svg-scroll-draw` bundle (tiny, no sub-path needed)
- Bundle addition: ≤ 0.5 KB gzipped

---

### 4.4 `scrollText` — Text reveal animations on scroll

**Priority: P2 — Direct replacement for GSAP SplitText (paid plugin).**

Splits a text element into characters, words, or lines and animates each piece on scroll. GSAP's SplitText does the same job and is free to use, but adds ~18 KB; this entry point is 2.5 KB.

#### API

```ts
import { scrollText } from 'svg-scroll-draw/text';

scrollText(target: string | Element, options: ScrollTextOptions): ScrollDrawInstance
```

#### Options

```ts
interface ScrollTextOptions {
  split?: 'chars' | 'words' | 'lines';  // default: 'words'
  stagger?: number;                       // delay between each unit, default 0.04
  easing?: EasingName | ((t: number) => number);
  // Animation applied to each split unit
  from?: {
    opacity?:   number;
    y?:         number;  // translateY in px
    x?:         number;  // translateX in px
    rotate?:    number;  // degrees
    scale?:     number;
  };
  trigger?: { start?: string; end?: string };
  once?: boolean;
  onComplete?: () => void;
}
```

#### Examples

```js
// Words fade up one by one
scrollText('#headline', {
  split:   'words',
  stagger: 0.05,
  from:    { opacity: 0, y: 24 },
  easing:  'ease-out',
  once:    true,
});

// Characters with rotation
scrollText('#tagline', {
  split:   'chars',
  stagger: 0.025,
  from:    { opacity: 0, y: 32, rotate: 8 },
  easing:  'spring',
  once:    true,
});
```

#### React wrapper

```tsx
import { ScrollText } from 'svg-scroll-draw/react';

<ScrollText split="words" stagger={0.05} from={{ opacity: 0, y: 24 }} once>
  Animate this headline.
</ScrollText>
```

#### Technical approach

- On init: wrap each unit (char/word/line) in a `<span>` with `display: inline-block`
- `lines`: measure `offsetTop` to group words by line, re-group on resize
- Animate each span's `opacity` + `transform` with per-unit stagger offset
- On `destroy()`: unwrap all spans, restore original text
- Ships as `svg-scroll-draw/text` (tree-shakeable)
- Bundle target: ≤ 2 KB gzipped
- Accessibility: preserve original text in `aria-label` on the container, hide split spans from screen readers with `aria-hidden="true"`

---

### 4.5 `scrollParallax` — Parallax for any element

**Priority: P2 — Replaces GSAP parallax patterns.**

A micro-API for the most common parallax pattern: move an element at a different rate than the scroll. Simpler than `scrollAnimate` for this specific use case.

#### API

```ts
import { scrollParallax } from 'svg-scroll-draw';

scrollParallax(target: string | Element, options: ScrollParallaxOptions): ScrollDrawInstance
```

#### Options

```ts
interface ScrollParallaxOptions {
  speed?: number;     // multiplier: 0.5 = half scroll speed, -1 = reverse, default 0.3
  axis?: 'x' | 'y';
  easing?: EasingName | ((t: number) => number);
  trigger?: { start?: string; end?: string };
}
```

#### Example

```js
scrollParallax('#hero-bg-image', { speed: 0.4 });
scrollParallax('#floating-element', { speed: -0.2 }); // moves opposite to scroll
```

#### Technical approach

- Translates to `scrollAnimate` under the hood with computed `from`/`to` transform values
- Speed multiplier relative to element height: `speed * elementHeight` pixels of travel
- Native CSS fast path eligible for simple cases
- Ships as part of main bundle (≤ 0.3 KB gzipped addition)

---

### 4.6 Visual DevTools overlay

**Priority: P2 — DX differentiator.**

A browser-based developer tool that visualizes all active scroll animations on the page simultaneously. More powerful than GSAP's `markers: true`.

#### API

```ts
import { devtools } from 'svg-scroll-draw/devtools';

// Call once — instruments all existing and future instances
devtools.enable();
devtools.disable();
devtools.highlight('#my-element'); // focus one element
```

#### Features

- Overlay shows trigger start/end lines for every active animation on the page
- Hover an element to see its trigger window, current progress, and applied options
- Keyboard shortcut to toggle (`Ctrl+Shift+S` / `Cmd+Shift+S`)
- Progress bar per instance in a floating panel
- Color-coded by animation type (SVG draw, CSS animate, video, text)
- **Only loads in development** — `import.meta.env.DEV` / `process.env.NODE_ENV !== 'production'` guard; zero bytes in production bundle

---

## 5. New sub-path exports

| Import | Contents | Est. size |
|---|---|---|
| `svg-scroll-draw` | `scrollDraw`, `scrollAnimate`, `scrollCounter`, `scrollParallax`, presets, utils | ≤ 6 KB gz |
| `svg-scroll-draw/react` | `ScrollDraw`, `ScrollAnimate`, `ScrollCounter`, `ScrollText`, `useScrollDrawProgress` | ≤ 3 KB gz |
| `svg-scroll-draw/vue` | Vue composables for all new APIs | ≤ 3 KB gz |
| `svg-scroll-draw/video` | `scrollVideo` | ≤ 1.5 KB gz |
| `svg-scroll-draw/text` | `scrollText` | ≤ 2 KB gz |
| `svg-scroll-draw/devtools` | Dev overlay (dev-only) | ≤ 4 KB gz (dev only) |
| `svg-scroll-draw/timeline` | Existing — no change | existing |
| `svg-scroll-draw/group` | Existing — no change | existing |

---

## 6. Shared architecture constraints

All new APIs must:

1. **Use the same trigger system** — `parseTrigger`, `computeTriggers`, `computeProgress` from `core/utils.ts`
2. **Return the same instance API** — `{ destroy, replay, pause, resume, seek, getProgress }`
3. **Be SSR-safe** — `typeof window === 'undefined'` guard, return noop on server
4. **Support the same easing system** — `EasingName`, custom function, `createSpring`/`createBounce`/`createElastic`
5. **Set `--scroll-draw-progress`** CSS custom property on the container
6. **Respect `prefers-reduced-motion`** — jump to final state, skip animation
7. **Be tree-shakeable** — no side effects at import time

The core engine pattern is already established in `engine.ts`. New APIs should either reuse `createEngine` where appropriate or follow its exact structure.

---

## 7. Breaking changes from v1

None planned. All v1 APIs remain unchanged. v2 is purely additive.

`scrollDraw()` stays the same function with the same options. The new APIs are new exports.

---

## 8. Build order (implementation phases)

### Phase 1 — The platform shift (4–6 days)
1. `scrollAnimate` — core + React wrapper + tests
2. `scrollCounter` — core + React wrapper + tests
3. `scrollParallax` — thin wrapper over `scrollAnimate` + tests

**Ships as: v2.0.0**

### Phase 2 — The wow features (3–4 days)
4. `scrollVideo` — core + React wrapper + tests
5. `scrollText` — core + React wrapper + tests (hardest — line detection)

**Ships as: v2.1.0**

### Phase 3 — The DX layer (3–4 days)
6. Visual DevTools overlay
7. Vue/Svelte/Solid wrappers for all Phase 1+2 APIs
8. Demo site updates — new examples, updated docs, playground additions

**Ships as: v2.2.0**

---

## 9. Demo site updates (per phase)

Each new API needs:
- A section on the home page demo
- A dedicated `/docs` section with full option reference
- At least one `/examples` card
- A blog post or expanded tutorial

Specific additions:
- `/blog/scroll-animate-everything` — introducing `scrollAnimate`, replaces `gsap.to + ScrollTrigger`
- `/blog/video-scrubbing` — how `scrollVideo` works, encoding guide
- New examples: `scrollAnimate` fade/slide, parallax hero, video scrub, counter stats section, text reveal
- Playground tab for `scrollAnimate` (non-SVG mode)

---

## 10. Success metrics

| Metric | Target |
|---|---|
| Bundle size (full v2 main) | ≤ 6 KB gzipped |
| Features requiring GSAP after v2 | Complex multi-element non-SVG timelines only |
| GSAP comparison blog post updated | Before v2.0.0 ships |
| Test coverage | ≥ 90% branches on all new APIs |
| TypeScript errors | Zero |

---

## 11. Positioning after v2

**Before v2:** "The best SVG scroll animation library. 9× smaller than GSAP."

**After v2:** "The scroll animation platform. Animate SVG paths, CSS properties, video, text, and counters — all scroll-driven, all MIT, all under 10 KB. GSAP is overkill."

The battle isn't won by having more features than GSAP — it's won by covering the 95% case so well that developers never install GSAP in the first place.

---

*Last updated: 2026-06-04*
