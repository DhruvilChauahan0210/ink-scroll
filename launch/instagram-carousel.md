# Instagram Carousel — svg-scroll-draw

> **Format:** Portrait **1080 × 1350 px** (4:5 — takes the most vertical space in the feed, beats square).
> **Slides:** 8. **Build in:** Canva / Figma.
> **Golden rule:** Slide 1 must stop the scroll in <1s. Everything else is the payoff.

---

## 🎨 Visual system (apply to every slide)

- **Background:** near-black `#0B0B0F` (matches the dark dev aesthetic + makes strokes pop).
- **Primary accent:** electric pink/magenta `#FF6B9D` → `#FF90E8` (the brand stroke colors from your demos).
- **Secondary accent:** warm yellow `#FFC900` (for the "draw" gradient highlight).
- **Text:** off-white `#F5F5F7`. Muted text: `#8A8A93`.
- **Font:** a clean geometric sans — Inter, Satoshi, or Space Grotesk. Headings bold, body regular.
- **Code:** monospace (JetBrains Mono / Fira Code) in a rounded `#16161C` card with a soft border.
- **Consistency:** small `svg-scroll-draw` wordmark bottom-left on every slide. Slide number bottom-right (e.g. `01 / 08`).
- **Motif:** a half-drawn SVG stroke (dashed→solid line) running through slides as a visual thread — reinforces what the library *does*.

---

## SLIDE 1 — THE HOOK 🪝

**Layout:** Huge centered text. Behind it, a faint half-drawn squiggle stroke (left half solid pink, right half dashed/ghosted) — literally showing a path mid-draw.

```
I deleted 40 KB
of GSAP.

Replaced it with
4.4 KB.
```

- "40 KB" struck through or in muted gray. "4.4 KB" big, bold, in pink.
- Bottom: small text → `swipe to see how →`

**Why it works:** specific number + a loss/win contrast = pattern interrupt. No jargon on slide 1.

---

## SLIDE 2 — THE PROBLEM 😩

**Heading:** `Drawing an SVG on scroll used to mean…`

Three stacked cards, each with an ❌:

```
❌ GSAP DrawSVG
   ~40 KB + a paid license for commercial use

❌ Framer Motion
   ~35 KB, and React-only

❌ scroll-svg
   tiny, but abandoned & breaks in Next.js
```

**Footer:** `Every option had a catch.`

---

## SLIDE 3 — THE FIX ✨

**Centered, big:**

```
svg-scroll-draw
```

Below it, three quick badges/pills:

```
✅ ~4.4 KB gzipped
✅ Zero dependencies
✅ MIT — free forever
```

**Footer:** `npm i svg-scroll-draw`

---

## SLIDE 4 — WORKS EVERYWHERE 🌍

**Heading:** `One package. Every framework.`

Grid of framework logos (or text pills if logos are a hassle):

```
React · Next.js · Vue · Svelte
Solid · Angular · Nuxt · Astro
+ vanilla JS / Web Component
```

**Footer:** `Same API. Nine thin adapters.`

---

## SLIDE 5 — THE CODE 💻

**Heading:** `This is the whole setup:`

Monospace code card:

```tsx
import { ScrollDraw } from 'svg-scroll-draw/react';

<ScrollDraw easing="ease-out" fade once>
  <svg viewBox="0 0 200 100" fill="none">
    <path d="M10 50 Q100 10 190 50" stroke="#FF6B9D" />
  </svg>
</ScrollDraw>
```

**Footer:** `No config. It just draws on scroll.`

---

## SLIDE 6 — THE MAGIC TRICK 🪄

**Heading:** `On modern browsers, it uses ZERO JavaScript.`

Body:

```
When the browser supports
animation-timeline: view(),
the animation runs on the
compositor — GPU-driven.

No scroll listeners.
No requestAnimationFrame.
No JS per frame.

Falls back to the JS engine
automatically. You never
change your code.
```

**Visual:** a little "JS ❌ → GPU ✅" diagram, or a speedometer motif.

---

## SLIDE 7 — IT'S NOT JUST LINES 🎬

**Heading:** `Way more than stroke-dashoffset:`

Two-column list with tiny icons:

```
🎨 Stroke color lerp     🌊 Fill-opacity flood
🔀 Path morphing         ✂️ Clip-path reveal
⏱️ Stagger sequences     🚀 Velocity scaling
🎛️ pause / seek / replay  ⏳ Scroll timelines
```

**Footer:** `30+ options. Group, Sequence & Timeline APIs.`

---

## SLIDE 8 — CTA 🎯

**Heading (big):** `Try it free.`

```
🔗 svg-scroll-draw.vercel.app
📦 npm i svg-scroll-draw
⭐ Star it on GitHub

Live playground · 10 demos · full docs
```

**Footer:** `Save this for your next project 🔖`
**CTA line:** `Follow for more dev tools & open source →`

---

## 📝 CAPTION (paste into the post)

```
I got tired of importing 40 KB of GSAP just to draw an SVG on scroll — so I built the 4.4 KB version. 🪶

svg-scroll-draw is a zero-dependency, MIT-licensed library that animates SVG paths as you scroll. It works in React, Next, Vue, Svelte, Solid, Angular, Nuxt, Astro and plain JS — same API everywhere.

The part I'm proudest of: on modern browsers it hands the whole animation to the compositor using native CSS scroll-driven animations. Zero JavaScript per frame. It falls back to the JS engine automatically on older browsers — you never touch your code.

→ Stroke color animation, fill flood, path morphing, clip reveals, stagger, velocity scaling, and a full pause/seek/replay API.

Free playground + 10 copy-paste demos in the link. If you build with SVGs, this'll save you a dependency. 🤙

Save this 🔖 for your next project, and follow for more open-source dev tools.

npm i svg-scroll-draw

—
#webdevelopment #javascript #reactjs #frontend #coding #programming #webdesign #opensource #developer #softwaredeveloper #css #uidesign #codinglife #100daysofcode #typescript
```

> **Hashtag tip:** Instagram rewards a mix of sizes. The list above blends big (#javascript, #coding), mid (#webdevelopment, #frontend), and niche (#100daysofcode, #opensource). Don't exceed ~15–20 — packing all 30 looks spammy and can suppress reach. Put them at the END of the caption (or in the first comment) so the hook reads clean.

---

## 🎥 PRO MOVE — post the GIF as a Reel too

A carousel is great, but svg-scroll-draw is a *motion* library. Your `demo.gif` as a **Reel** (with the slide-1 hook as the text overlay) will out-reach the carousel 5–10× — Instagram pushes Reels far harder than carousels right now. Post both: carousel for the saves, Reel for the reach.
```
