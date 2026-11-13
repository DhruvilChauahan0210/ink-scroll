# svg-scroll-draw API reference (v2.10.x)

Every option below exists in the package's TypeScript types
(`packages/svg-scroll-draw/src/**`). If an option is not listed here, it does not
exist: do not invent one.

Shared types:

```ts
type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic';
type Easing = EasingName | ((t: number) => number);
interface TriggerConfig { start?: string; end?: string }

interface ScrollDrawInstance {
  destroy(): void;
  replay(): void;
  pause(): void;
  resume(): void;
  seek(progress: number): void; // 0–1, then pauses
  getProgress(): number;        // 0–1
  refresh?(): void;             // re-measure after a layout change
}
```

Trigger strings are `"<element anchor> <viewport anchor>"`. Element anchor:
`top | center | bottom`. Viewport anchor: `top | center | bottom | N%`.
A bare `"N%"` means `"top N%"`. No pixel offsets (`+=100`) and no element
percentages.

Easing factories (main entry): `createSpring({ tension = 2.5, friction = 2.2 })`,
`createBounce({ bounces = 3, decay = 0.5 })`,
`createElastic({ amplitude = 1, period = 0.4 })`.

---

## Main entry: `svg-scroll-draw`

Exports: `scrollDraw`, `scrollAnimate`, `scrollParallax`, `scrollCounter`,
`PRESETS`, `createSpring`, `createBounce`, `createElastic`, `Cinematic`, and
their option types.

### `scrollDraw(target: string | Element, options?: ScrollDrawOptions): ScrollDrawInstance`

`target` is a **container**; descendants matching `selector` are drawn with
`stroke-dashoffset`. Sets `--scroll-draw-progress` on the container every frame.

| Option | Type | Default | Notes |
|---|---|---|---|
| `preset` | `'sketch' \| 'reveal' \| 'typewriter' \| 'cinematic' \| 'spring'` | — | Base config; your options override it |
| `selector` | `string` | `'path, polyline, line, polygon, rect, circle'` | |
| `speed` | `number` | `1` | >1 completes sooner |
| `fade` | `boolean` | `false` | opacity 0→1 with the draw |
| `easing` | `Easing` | `'linear'` | |
| `trigger` | `TriggerConfig` | `{ start: 'top bottom', end: 'bottom top' }` | |
| `stagger` | `number` | `0` | fraction of the scroll range between paths; the last path ends that much after `trigger.end`, tightened to finish at the page's bottom when the page ends first |
| `direction` | `'forward' \| 'reverse'` | `'forward'` | reverse erases |
| `once` | `boolean` | `false` | latch at max progress |
| `debug` | `boolean` | `false` | trigger-zone overlay |
| `axis` | `'x' \| 'y'` | `'y'` | |
| `scrollContainer` | `string \| Element` | window | |
| `autoReverse` | `boolean` | `false` | |
| `delay` | `number` (ms) | `0` | before observing |
| `strokeColor` | `string \| [string, string]` | — | static or interpolated |
| `strokeWidth` | `number \| [number, number]` | — | |
| `fillOpacity` | `number \| [number, number]` | — | `[0, 1]` floods fill with the draw |
| `clip` | `boolean \| 'left' \| 'right' \| 'top' \| 'bottom' \| 'center'` | — | clip-path reveal; works on any content |
| `morphTo` | `string` (path `d`) | — | `<path>` only, compatible commands |
| `waypoints` | `Record<number, () => void>` | — | e.g. `{ 0.5: fn }` |
| `velocityScale` | `boolean \| number` | `false` | |
| `threshold` | `number` | `0` | IntersectionObserver |
| `rootMargin` | `string` | `'0px'` | IntersectionObserver |
| `repeat` | `number \| 'infinite'` | `0` | |
| `repeatDelay` | `number` (ms) | `0` | |
| `autoplay` | `boolean` | `false` | play over `duration` on viewport entry instead of scrubbing |
| `duration` | `number` (ms) | `1000` | autoplay only |
| `native` | `boolean` | `true` | `false` forces the JS engine |
| `onProgress` | `(alpha: number) => void` | — | |
| `onStart`, `onComplete` | `() => void` | — | |
| `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` | `() => void` | — | |

Native CSS path is used only when: browser supports `animation-timeline`, easing
is `linear`/`ease-in`/`ease-out`/`ease-in-out`, default trigger, `axis: 'y'`, no
`scrollContainer`, `speed: 1`, no `stagger`, `once`, `autoReverse`,
`velocityScale`, `morphTo`, `waypoints`, `repeat`, `delay`, `clip`, callbacks,
or stroke color/width/fill animation. Otherwise JS. Same instance API either way.

### `scrollAnimate(target: string | Element, options: ScrollAnimateOptions): ScrollDrawInstance`

| Option | Type | Default |
|---|---|---|
| `props` (required) | `Record<string, string \| number \| [from, to]>` | — camelCase CSS props; numbers, colors (`#`, `rgb`, `hsl`), transform functions, unit values |
| `trigger` | `TriggerConfig` | `{ start: 'top bottom', end: 'bottom top' }` |
| `easing` | `Easing` | `'ease-out'` |
| `speed` | `number` | `1` |
| `once` | `boolean` | `false` |
| `axis` | `'x' \| 'y'` | `'y'` |
| `scrollContainer` | `string \| Element` | window |
| `native` | `boolean` | `true` |
| `velocityScale` | `boolean \| number` | `false` |
| `respectReducedMotion` | `boolean` | `true` |
| `triggerElement` | `Element` | the target (disables native path) |
| `onProgress` | `(alpha) => void` | — |
| `onComplete`, `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` | `() => void` | — |

Transform from/to strings must use the same functions in the same order
(`'translateY(40px)'` → `'translateY(0px)'`). Native path also requires every
prop to be one of `opacity, transform, background-color, color, filter, scale,
translate, rotate`, plus the same restrictions as `scrollDraw`.

### `scrollParallax(target: string | Element, options?: ScrollParallaxOptions): ScrollDrawInstance`

| Option | Type | Default |
|---|---|---|
| `speed` | `number` | `0.3` — travel = speed × element height (width for `x`); negative reverses |
| `axis` | `'x' \| 'y'` | `'y'` |
| `easing` | `Easing` | `'linear'` |
| `trigger` | `TriggerConfig` | `{ start: 'top bottom', end: 'bottom top' }` |
| `onProgress` | `(alpha) => void` | — |

### `scrollCounter(target: string | Element, options: ScrollCounterOptions): ScrollDrawInstance`

| Option | Type | Default |
|---|---|---|
| `to` (required) | `number` | — |
| `from` | `number` | `0` (set above `to` to count down) |
| `format` | `(n: number) => string` | `String(Math.round(n))` |
| `decimals` | `number` | — (overrides `format` with `n.toFixed(decimals)`) |
| `easing` | `Easing` | `'ease-out'` |
| `trigger` | `TriggerConfig` | `{ start: 'top 80%', end: 'top 20%' }` |
| `once` | `boolean` | `true` |
| `onComplete` | `() => void` | — |

---

## `svg-scroll-draw/reveal`

### `scrollReveal(target: string | NodeList | Element[], options?: ScrollRevealOptions): { destroy(): void }`

| Option | Type | Default |
|---|---|---|
| `preset` | `'fadeUp' \| 'fadeDown' \| 'fadeLeft' \| 'fadeRight' \| 'scale' \| 'flip' \| 'flipX'` | `'fadeUp'` |
| `from` | `{ opacity?, x?, y?, scale?, rotate?, rotateX?, rotateY? }` (px / deg) | — merged over the preset |
| `stagger` | `number` | `0.08` (offsets each element's trigger window) |
| `easing` | `Easing` | `'ease-out'` |
| `once` | `boolean` | `true` |
| `trigger` | `TriggerConfig` | per-element `top 88%` → 35% later, staggered |
| `onEnter` | `() => void` | first element enters |
| `onLeave` | `() => void` | last element leaves |

Scroll-scrubbed over a short window (not a timed tween). Always JS engine.

## `svg-scroll-draw/pin`

### `scrollPin(target: string | Element, options?: ScrollPinOptions): { destroy(); refresh(); getProgress(): number }`

| Option | Type | Default |
|---|---|---|
| `pinDistance` | `number` (px, fixed) or `'150vh'` / `'600px'` (vh is CSS's vh: follows rotation and resizes, not a phone's address bar; 2.20.0+) | `window.innerHeight` |
| `top` | `number` (px from viewport top) | `0` |
| `scrollContainer` | `string \| Element` | window |
| `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack` | `() => void` | — |
| `onProgress` | `(progress: number) => void` | — |

Wraps the element in a `[data-ssd-pin-wrapper]` div that reserves the scroll
room; `destroy()` unwraps and restores inline styles.

## `svg-scroll-draw/snap`

### `scrollSnap(sections: string | NodeList | Element[], options?: ScrollSnapOptions): { destroy(); snapTo(i: number); getCurrentIndex(): number }`

| Option | Type | Default |
|---|---|---|
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` |
| `duration` | `number` (ms) | `600` |
| `easing` | `Easing` | `'ease-in-out'` |
| `threshold` | `number` 0–1 | `0.3` |
| `scrollContainer` | `string \| Element` | window |
| `onSnap` | `(index: number) => void` | — |
| `respectReducedMotion` | `boolean` | `true` (jump instead of animate) |

## `svg-scroll-draw/horizontal`

### `scrollHorizontal(track: string | Element, options?: ScrollHorizontalOptions): ScrollDrawInstance & { refresh(): void }`

You provide the CSS; it drives `translateX`:

```css
.outer  { height: 400vh; }
.sticky { position: sticky; top: 0; height: 100vh; overflow: clip; }
.track  { display: flex; width: max-content; }
```

`overflow: clip`, not `hidden`: a hidden stage can still be scrolled sideways by
keyboard focus, which shifts the strip and leaves it shifted. Leave `distance`
out: the default is measured against the stage and again whenever the window,
the page, the track or the runway resizes (2.18.1); `refresh()` re-measures on
demand.

| Option | Type | Default |
|---|---|---|
| `distance` | `number` (px) | `track.scrollWidth` − the sticky stage's content width (else the scroll container's or viewport's, scrollbar excluded); re-measured on layout change |
| `trigger` | `TriggerConfig` | `{ start: 'top top', end: 'bottom bottom' }` |
| `easing` | `Easing` | `'linear'` |
| `scrollContainer` | `string \| Element` | window |
| `triggerElement` | `string \| Element` | container of nearest sticky ancestor |
| `respectReducedMotion` | `boolean` | **`false`** |
| `onProgress` | `(progress: number) => void` | — |

## `svg-scroll-draw/text`

### `scrollText(target: string | Element, options?: ScrollTextOptions): ScrollDrawInstance`

| Option | Type | Default |
|---|---|---|
| `split` | `'chars' \| 'words' \| 'lines'` | `'words'` |
| `stagger` | `number` (0–1 of range) | `0.04` |
| `from` | `{ opacity?, y?, x?, rotate?, scale? }` | `{ opacity: 0, y: 24 }` |
| `easing` | `Easing` | `'ease-out'` |
| `trigger` | `TriggerConfig` | `{ start: 'top 85%', end: 'top 40%' }` |
| `once` | `boolean` | `true` |
| `onComplete` | `() => void` | — |

Keeps the original text in `aria-label`, hides split spans from assistive tech;
`destroy()` restores the original HTML.

## `svg-scroll-draw/video`

### `scrollVideo(target: string | HTMLVideoElement, options?: ScrollVideoOptions): ScrollDrawInstance`

| Option | Type | Default |
|---|---|---|
| `from` | `number` (s) | `0` |
| `to` | `number` (s) | `video.duration` |
| `trigger` | `TriggerConfig` | `{ start: 'top top', end: 'bottom top' }` |
| `easing` | `Easing` | `'linear'` |
| `once` | `boolean` | `false` |
| `axis` | `'x' \| 'y'` | `'y'` |
| `preload` | `'auto' \| 'metadata'` | `'auto'` |
| `triggerElement` | `Element` | the video — set it to the track behind a sticky stage (2.18.0) |
| `onReady`, `onComplete` | `() => void` | — |
| `onProgress` | `(alpha) => void` | — |

Use `<video muted playsinline preload="auto">`.

## `svg-scroll-draw/frames`

### `scrollFrames(target: string | HTMLCanvasElement, options: ScrollFramesOptions): ScrollDrawInstance`

| Option | Type | Default |
|---|---|---|
| `frames` | `string[] \| (index: number) => string` | required |
| `count` | `number` | `frames.length`; required with a function |
| `trigger` | `TriggerConfig` | `{ start: 'top top', end: 'bottom top' }` |
| `easing` | `Easing` | `'linear'` |
| `once` | `boolean` | `false` |
| `axis` | `'x' \| 'y'` | `'y'` |
| `triggerElement` | `Element` | the canvas — set it to the track behind a sticky stage |
| `fit` | `'cover' \| 'contain'` | `'cover'` |
| `concurrency` | `number` | `6` |
| `onReady` (first frame drawn), `onLoad` (every frame loaded or failed), `onComplete` | `() => void` | — |
| `onProgress` | `(alpha, frame) => void` | — |

Draws frame `round(alpha × (count − 1))`, or the nearest loaded one until it
arrives. Loads frame 0, the last, then midpoints coarse to fine. Size the canvas
with CSS; the buffer follows the box × devicePixelRatio (capped at 2). Reduced
motion loads and shows only the last frame. Components: `<ScrollFrames>` in
`svg-scroll-draw/react` and `svg-scroll-draw/vue` (and `useScrollFrames` in Vue
and Nuxt). From 2.26.0 also `scrollFramesAction` / `createScrollFrames` (Svelte),
`useScrollFrames` / `createScrollFrames` (Solid) and `ScrollFramesRef`
(Angular), which bind to a canvas you write. Called directly, or on your own
canvas, give it `role="img"` and an `aria-label`.

## `svg-scroll-draw/progress`

### `scrollProgress(target: string | Element, options?: ScrollProgressOptions): ScrollDrawInstance`

Writes raw and eased progress to CSS custom properties on the target.

| Option | Type | Default |
|---|---|---|
| `variable` | `string` | `'--scroll-progress'` |
| `easedVariable` | `string \| null` | `'--scroll-progress-eased'` (`null` skips it) |
| `trigger` | `TriggerConfig` | `{ start: 'top bottom', end: 'bottom top' }` |
| `easing` | `Easing` | `'linear'` |
| `speed` | `number` | `1` |
| `axis` | `'x' \| 'y'` | `'y'` |
| `scrollContainer` | `string \| Element` | window |
| `onProgress` | `(raw: number, eased: number) => void` | — |

## `svg-scroll-draw/group`

All take `targets: Array<string | Element>` and return one `ScrollDrawInstance`
that fans out to every target.

- `scrollDrawGroup(targets, ScrollDrawOptions)` — all at once
- `scrollDrawSequence(targets, ScrollDrawOptions)` — each starts when the previous completes
- `scrollAnimateGroup(targets, ScrollAnimateOptions)`
- `scrollAnimateSequence(targets, ScrollAnimateOptions)`
- `scrollParallaxGroup(targets, ScrollParallaxOptions)`

## `svg-scroll-draw/timeline`

### `scrollDrawTimeline(target: string | Element, options: ScrollDrawTimelineOptions): ScrollDrawInstance`

| Option | Type | Default |
|---|---|---|
| `tracks` (required) | `{ selector: string; from: number; to: number; easing?: Easing; fade?: boolean }[]` | — `from`/`to` are 0–1 windows, may overlap |
| `trigger` | `{ start?, end? }` | `{ start: 'top bottom', end: 'bottom top' }` |
| `speed` | `number` | `1` |
| `once` | `boolean` | `false` |
| `axis` | `'x' \| 'y'` | `'y'` |
| `repeat` | `number \| 'infinite'` | `0` |
| `repeatDelay` | `number` (ms) | `0` |
| `loop` | `boolean \| number` | `false` (time-driven loop after scroll completes) |
| `loopDuration` | `number` (ms) | `1500` |
| `debug` | `boolean` | `false` |
| `label` | `string` | — |
| `respectReducedMotion` | `boolean` | `true` |
| `onComplete` | `() => void` | — |

## `svg-scroll-draw/devtools`

`devtools.enable()`, `devtools.disable()`, `devtools.toggle()`,
`devtools.highlight(target)`. Keyboard toggle Cmd/Ctrl+Shift+S. Dev only.

## `svg-scroll-draw/lenis`

`createLenisAdapter(lenis): { destroy(); getScrollY(): number }` — only for
Lenis v1, which does not update `window.scrollY`. Lenis v2+ needs no adapter.

---

## Framework entries

### `svg-scroll-draw/react`

Exports exactly: `ScrollDraw`, `ScrollAnimate`, `ScrollCounter`, `ScrollVideo`,
`ScrollFrames`, `ScrollText`, `useScrollDrawProgress`. **No `useScrollDraw`.** No `'use client'`
directive in the build; add it to your own file in Next.js App Router.

- `<ScrollDraw {...ScrollDrawOptions} className? style?>children</ScrollDraw>` — renders a `<div>`
- `<ScrollAnimate {...ScrollAnimateOptions} className? style?>children</ScrollAnimate>` — renders a `<div>`
- `<ScrollCounter {...ScrollCounterOptions} className? style? />` — renders a `<span>`
- `<ScrollVideo src {...ScrollVideoOptions} muted={true} playsInline={true} className? style? />`
- `<ScrollFrames {...ScrollFramesOptions} triggerElement?={element | ref} aria-label className? style? />` — renders a `<canvas role="img">`; warns in dev without an `aria-label`. A `frames` function is compared by the URLs it gives (an inline one keeps the film); callbacks are live
- `<ScrollText {...ScrollTextOptions} as?="p" className? style?>plain string</ScrollText>` — children must be a string
- `useScrollDrawProgress(ref | selector, { speed?, easing?, trigger?, axis?, scrollContainer?, once? }): number` — reactive 0–1

Options are read once on mount. Re-create by changing `key`.

### `svg-scroll-draw/vue` (and `svg-scroll-draw/nuxt`, which re-exports them plus `createScrollDrawPlugin()`)

- Composables returning a template ref, destroyed on unmount: `useScrollDraw(opts)`, `useScrollAnimate(opts)`, `useScrollCounter(opts)`, `useScrollVideo(opts)`, `useScrollFrames(opts)` (bind to a `<canvas>`), `useScrollText(opts)`
- `<ScrollDraw>` props: `selector, speed, fade, stagger, easing, direction, trigger, once, debug, onProgress, onStart, onComplete` (other ScrollDraw options: use the composable)
- `<ScrollAnimate :options="{ props: {...} }">`
- `<ScrollCounter :to :from :format :easing :trigger :once :decimals :onComplete />`
- `<ScrollVideo src :options muted playsInline />`
- `<ScrollFrames :frames :count trigger-element="#track" :trigger aria-label="…" />` — every ScrollFramesOptions key is a prop; `trigger-element` takes an element or a selector; renders a `<canvas role="img">`
- `<ScrollText :options tag="p">`

### `svg-scroll-draw/svelte`

Actions (support `update`/`destroy` automatically): `scrollDraw`, `scrollAnimate`,
`scrollCounterAction`, `scrollVideoAction`, `scrollFramesAction` (2.26.0+),
`scrollTextAction`.
Factories returning `{ action, getInstance }`: `createScrollDraw`,
`createScrollAnimate`, `createScrollCounter`, `createScrollVideo`,
`createScrollFrames` (2.26.0+), `createScrollText`.

- `<canvas use:scrollFramesAction={{ frames, count, triggerElement: '#track', trigger }} role="img" aria-label="…" />` — on a `<canvas>`; `update()` starts a new film only when the URLs (a `frames` function is read by the URLs it gives) or another option changed; callbacks are live; `triggerElement` is an element or a selector, found when the film starts; warns in dev when the canvas has no `aria-label`

### `svg-scroll-draw/solid`

Ref-setter hooks: `useScrollDraw`, `useScrollAnimate`, `useScrollCounter`,
`useScrollVideo`, `useScrollFrames` (2.26.0+), `useScrollText`. Factories
returning `{ ref, getInstance }`: `createScrollDraw`, `createScrollAnimate`,
`createScrollCounter`, `createScrollVideo`, `createScrollFrames` (2.26.0+),
`createScrollText`.

- `useScrollFrames(() => ({ frames, count, triggerElement: '#track', trigger }))` → ref for `<canvas ref={ref} role="img" aria-label="…" />`; an accessor keeps the options live (a signal the `frames` function reads is tracked), the same rebuild and live-callback rules as Svelte's action

### `svg-scroll-draw/angular`

Classes with `init(element, options)`, `update(options)` (for `ngOnChanges`)
and `destroy()` (plus `replay`, `pause`, `resume`, `seek`, `getProgress`):
`ScrollDrawRef`, `ScrollAnimateRef`, `ScrollCounterRef`, `ScrollVideoRef`,
`ScrollFramesRef` (2.26.0+), `ScrollTextRef`. No `@angular/core` dependency.

- `new ScrollFramesRef().init(canvas, { frames, count, triggerElement, trigger })` from `ngAfterViewInit`, `update(options)` from `ngOnChanges` (a new film only when the URLs or another option changed; callbacks live), `destroy()` from `ngOnDestroy`; the canvas in your template needs `role="img"` and an `aria-label`

### `svg-scroll-draw/astro`

`initScrollDraw(root?)`, `initScrollAnimate(root?)`, `initScrollCounter(root?)`,
`initScrollText(root?)`, `initAll(root?)` — scan `[data-scroll-draw]`,
`[data-scroll-animate]`, etc., reading JSON from `data-scroll-draw-options` /
`data-scroll-animate-options`. Return instance arrays. Safe (return `[]`) on the server.
From 2.19.0 each element keeps one engine per kind: editing its JSON attribute
rebuilds it, an equal value keeps it, and running an init again (e.g. on
`astro:page-load`) keeps the engine it started. `format` and callbacks cannot
come from JSON — use `"decimals"`, or call the core API in a script.

### `svg-scroll-draw/web-component` and the CDN build

`<scroll-draw>` reads only these attributes: `speed`, `easing`, `stagger`,
`direction`, `selector`, `fade`, and `once` (`once` from 2.10.2; earlier
versions ignore it). Anything else is ignored; use
`SvgScrollDraw.scrollDraw()` for other options. From 2.19.0 changing one of
these attributes after the element connects rebuilds the engine; setting an
equal value does not.

CDN global `SvgScrollDraw` (from `dist/cdn/svg-scroll-draw.global.js`, or
`svg-scroll-draw.dev.global.js` with dev warnings) contains the main entry only
and registers `<scroll-draw>`. For reveal/pin/snap/text/etc. without a bundler,
import `dist/<entry>/index.mjs` as an ES module; each file is self-contained.
