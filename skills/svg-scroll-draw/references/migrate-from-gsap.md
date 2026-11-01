# Migrating scroll effects from GSAP ScrollTrigger

## Decide first

GSAP is free (including DrawSVG, SplitText and MorphSVG) since Webflow released
the full toolset at no charge in 2025, and it does far more than this library.
Cost is not a reason to migrate. Reasons that are real:

- **Size.** gsap 3.15.0 core + ScrollTrigger is 45.3 KB gzipped, 47.5 KB with
  DrawSVG. svg-scroll-draw's main entry is 10.7 KB; single entries are smaller
  (`/reveal` 4.5 KB, `/text` 2.5 KB, `/pin` 1.6 KB, `/snap` 1.7 KB).
- **Native CSS.** Simple `scrollDraw` / `scrollAnimate` configs compile to
  `animation-timeline: view()` and run with no per-frame JavaScript in Chrome/Edge
  115+, Safari 26+ and Firefox 159+.
- **License.** MIT, versus GSAP's own no-charge license.

**Keep GSAP** (or keep it for those parts) when the code uses: time-based
timelines (`gsap.timeline()` with durations, labels, `.add()` positions),
`scrub: <number>` lag smoothing, `toggleActions` that *play* a timed tween,
Flip, Draggable, MotionPath, Observer, ScrollSmoother, MorphSVG on arbitrary
shapes, pixel offsets in triggers (`'top+=100'`, `'+=500'`), element-percentage
anchors (`'50% 50%'`), or `containerAnimation`. Do not half-port those.

## Concept map

| ScrollTrigger concept | svg-scroll-draw |
|---|---|
| `gsap.registerPlugin(...)` | none; import the function you need |
| `trigger: el` | the target you pass is the trigger |
| `start: 'top 80%'`, `end: 'bottom top'` | `trigger: { start: 'top 80%', end: 'bottom top' }` (same anchor words; viewport side can be `N%`) |
| `scrub: true` | default behaviour: every API is progress-linked to scroll |
| `scrub: 1` (smoothing) | no equivalent |
| `once: true` / `toggleActions: 'play none none none'` | `once: true` latches at max progress (still scrubbed until then). For SVG paths that should play on a clock instead: `scrollDraw(el, { autoplay: true, duration: 1200, once: true })` |
| `pin: true`, `end: '+=600'` | `scrollPin(el, { pinDistance: 600 })` |
| `pinSpacing` | always on: a wrapper reserves `pinDistance` of scroll |
| `snap` | `scrollSnap(sections, { duration, easing, threshold })` |
| `markers: true` | `debug: true` on `scrollDraw` / `scrollDrawTimeline`, or `devtools.enable()` from `svg-scroll-draw/devtools` |
| `onEnter / onLeave / onEnterBack / onLeaveBack` | same names on `scrollDraw`, `scrollAnimate`, `scrollPin` |
| `onUpdate: self => self.progress` | `onProgress: (p) => ...` |
| `ScrollTrigger.refresh()` | `instance.refresh?.()` |
| `scroller: '#container'` | `scrollContainer: '#container'` |
| `horizontal: true` | `axis: 'x'` |
| `ctx.revert()`, `useGSAP()` cleanup | `instance.destroy()` |
| `ease: 'power1.out'` | `easing: 'ease-out'` (also `ease-in`, `ease-in-out`, `linear`, `spring`, `bounce`, `elastic`, or `(t) => number`) |

## Snippet by snippet

### DrawSVG on scroll

```js
// GSAP
gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
gsap.from('#logo path', {
  drawSVG: 0, ease: 'none', stagger: 0.1,
  scrollTrigger: { trigger: '#logo', start: 'top 80%', end: 'bottom 20%', scrub: true },
});

// svg-scroll-draw — pass the container, not the paths
import { scrollDraw } from 'svg-scroll-draw';
scrollDraw('#logo', { stagger: 0.1, trigger: { start: 'top 80%', end: 'bottom 20%' } });
```

### Fade/slide in, scrubbed

```js
// GSAP
gsap.fromTo('.hero-title', { opacity: 0, y: 40 }, {
  opacity: 1, y: 0, ease: 'power1.out',
  scrollTrigger: { trigger: '.hero-title', start: 'top 85%', end: 'top 40%', scrub: true },
});

// svg-scroll-draw
import { scrollAnimate } from 'svg-scroll-draw';
scrollAnimate('.hero-title', {
  props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] },
  trigger: { start: 'top 85%', end: 'top 40%' },
  easing: 'ease-out',
});
```

`scrollAnimate` takes one element (the first match of a selector). For many
elements use `scrollReveal`, `scrollAnimateGroup` or a loop.

### Batch reveal (`ScrollTrigger.batch`, or AOS)

```js
// GSAP
ScrollTrigger.batch('.card', { onEnter: (els) => gsap.from(els, { opacity: 0, y: 32, stagger: 0.1 }) });

// svg-scroll-draw — scroll-scrubbed over a short window, latched with once (default)
import { scrollReveal } from 'svg-scroll-draw/reveal';
scrollReveal('.card', { preset: 'fadeUp', stagger: 0.1 });
```

Behaviour difference: GSAP's version plays a 0.5 s tween once triggered; this
one follows the scroll through its window, then stays revealed.

### Parallax

```js
// GSAP
gsap.to('.bg', { yPercent: -30, ease: 'none', scrollTrigger: { trigger: '.bg', scrub: true } });

// svg-scroll-draw — travel = speed × element height, upward; same default window
import { scrollParallax } from 'svg-scroll-draw';
scrollParallax('.bg', { speed: 0.3 });
```

### Pin

```js
// GSAP
ScrollTrigger.create({ trigger: '#panel', pin: true, start: 'top top', end: '+=800' });

// svg-scroll-draw
import { scrollPin } from 'svg-scroll-draw/pin';
scrollPin('#panel', { pinDistance: 800 });         // pins at viewport top
scrollPin('#panel', { pinDistance: 800, top: 80 }); // 'top 80px'
```

### Horizontal scroll section

```js
// GSAP
const track = document.querySelector('.track');
gsap.to(track, {
  x: () => -(track.scrollWidth - window.innerWidth), ease: 'none',
  scrollTrigger: { trigger: '.outer', pin: true, scrub: true, end: () => '+=' + track.scrollWidth },
});

// svg-scroll-draw: CSS sticky does the pinning, the library drives translateX
//   .outer { height: 400vh } .sticky { position: sticky; top: 0; height: 100vh; overflow: hidden }
//   .track { display: flex; width: max-content }
import { scrollHorizontal } from 'svg-scroll-draw/horizontal';
scrollHorizontal('.track');
```

### Snap between full-height sections

```js
// GSAP
ScrollTrigger.create({ snap: 1 / (sections.length - 1) /* … */ });

// svg-scroll-draw
import { scrollSnap } from 'svg-scroll-draw/snap';
const snap = scrollSnap('.section', { duration: 600, easing: 'ease-in-out' });
snap.snapTo(2);
```

### SplitText + stagger

```js
// GSAP (SplitText is 3.6 KB, plus core to animate the pieces)
const split = SplitText.create('#headline', { type: 'words' });
gsap.from(split.words, {
  opacity: 0, y: 24, stagger: 0.05,
  scrollTrigger: { trigger: '#headline', start: 'top 85%', end: 'top 40%', scrub: true },
});

// svg-scroll-draw (2.5 KB, splits and animates)
import { scrollText } from 'svg-scroll-draw/text';
scrollText('#headline', { split: 'words', stagger: 0.05, from: { opacity: 0, y: 24 } });
```

### Number counter

```js
// GSAP
const obj = { v: 0 };
gsap.to(obj, { v: 50000, scrollTrigger: { trigger: '#users', start: 'top 80%', end: 'top 20%', scrub: true },
  onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString(); } });

// svg-scroll-draw (default trigger is top 80% → top 20%)
import { scrollCounter } from 'svg-scroll-draw';
scrollCounter('#users', { to: 50000, format: (n) => Math.round(n).toLocaleString() });
```

### Video scrub

```js
// GSAP
gsap.to(video, { currentTime: video.duration, ease: 'none',
  scrollTrigger: { trigger: video, start: 'top top', end: 'bottom top', scrub: true } });

// svg-scroll-draw (waits for metadata itself)
import { scrollVideo } from 'svg-scroll-draw/video';
scrollVideo('#hero-video', { trigger: { start: 'top top', end: 'bottom top' } });
```

### Scroll-linked timeline of path groups

```js
// GSAP
const tl = gsap.timeline({ scrollTrigger: { trigger: '#chart', scrub: true } });
tl.from('.axis', { drawSVG: 0 }).from('.bar', { drawSVG: 0 }, '<0.2');

// svg-scroll-draw — explicit 0–1 windows per selector, overlap allowed
import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';
scrollDrawTimeline('#chart', {
  tracks: [
    { selector: '.axis', from: 0, to: 0.4, easing: 'ease-out' },
    { selector: '.bar', from: 0.2, to: 1, easing: 'ease-out' },
  ],
});
```

### React cleanup

```tsx
// GSAP
useGSAP(() => { gsap.from('.box', { opacity: 0, scrollTrigger: { trigger: '.box', scrub: true } }); }, { scope: ref });

// svg-scroll-draw
useEffect(() => {
  if (!ref.current) return;
  const inst = scrollAnimate(ref.current, { props: { opacity: [0, 1] } });
  return () => inst.destroy();
}, []);
```

## After migrating

- Remove `gsap` only if nothing else imports it.
- Check reduced motion: most svg-scroll-draw APIs jump to the final state under
  `prefers-reduced-motion: reduce` automatically. Remove any `gsap.matchMedia()`
  reduced-motion branches you were maintaining for these effects.
- Verify visually by scrolling; the engine's dev warnings (dev builds only) flag
  paths with no stroke, selectors matching nothing and zero-length trigger windows.
