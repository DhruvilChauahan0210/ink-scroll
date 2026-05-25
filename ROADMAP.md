# svg-scroll-draw — Roadmap

> What's next after v0.1.0. Organized by category, ordered by value/effort ratio.

---

## Library Features

### Quick wins (< 1 day each)

#### `stagger` option
Animate multiple paths sequentially with a configurable delay between each one starting.
```ts
scrollDraw('#logo', { stagger: 0.15 }) // 150ms between each path
```
- ~20 lines added to `engine.ts`
- Unlocks complex multi-path illustrations feeling "alive"

#### `direction: 'reverse'`
Draw backwards — erase/undraw animation by reversing the `dashoffset` direction.
```ts
scrollDraw('#path', { direction: 'reverse' })
```
- Enables "write then erase" loops and cleanup animations

#### `onProgress` callback
Fire on every animation frame with the current `0–1` alpha value.
```ts
scrollDraw('#path', {
  onProgress: (alpha) => {
    label.style.opacity = `${alpha}`
  }
})
```
- Unlocks custom side effects tied to draw progress
- Mirrors the `onComplete` API pattern

#### README badges
Add shields.io badges for npm version, weekly downloads, bundle size, and test coverage.
```md
![npm](https://img.shields.io/npm/v/svg-scroll-draw)
![downloads](https://img.shields.io/npm/dw/svg-scroll-draw)
![size](https://img.shields.io/bundlephobia/minzip/svg-scroll-draw)
```

---

### Medium effort (1–3 days each)

#### Percentage-based triggers
More intuitive trigger format using viewport percentages instead of anchor strings.
```ts
scrollDraw('#path', {
  trigger: { start: '20%', end: '80%' }
})
```
- `parseTrigger` needs to handle `"N%"` format
- Falls back to anchor strings for backwards compatibility

#### Vue wrapper — `/vue` subpath export
A native Vue 3 composable + component, mirroring the React wrapper.
```vue
<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue'
</script>

<template>
  <ScrollDraw :speed="1.2" easing="ease-out">
    <svg>...</svg>
  </ScrollDraw>
</template>
```
- New `src/vue/index.ts` entry
- New tsup entry in `tsup.config.ts`
- New `"./vue"` export in `package.json`

#### `rect` and `circle` support
`SVGRectElement` and `SVGCircleElement` don't implement `getTotalLength()`. Internally convert them to `<path>` equivalents before animating.
- Removes a sharp edge — designers often use `<rect>` and `<circle>` without thinking about it
- Update `selector` default to include `rect, circle`

---

### Larger effort (3–7 days)

#### Web Component — `<scroll-draw>`
A framework-agnostic custom element that works in plain HTML, any framework, or a CDN script tag.
```html
<scroll-draw speed="1.2" easing="ease-out">
  <svg>...</svg>
</scroll-draw>
<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>
```
- Zero framework dependency
- Ships as part of the existing IIFE/CDN bundle
- Doubles addressable market (WordPress, plain HTML sites, Webflow)

---

## Demo Site

### Quick wins (< 2 hours each)

#### Copy button on code blocks
A one-click copy button on every `<CodeBlock>` using the Clipboard API.
- Standard developer expectation — the most-visited devs will copy-paste immediately
- Single client component wrapping the existing `CodeBlock`

#### Install tabs — npm / pnpm / yarn / bun / CDN
Tabbed install command block in the hero section.
```
[ npm ]  [ pnpm ]  [ yarn ]  [ bun ]  [ CDN ]
$ npm i svg-scroll-draw
```
- Reduces friction for non-npm users
- CDN tab shows the full `<script>` tag example

#### Bundle size comparison chart
Visual horizontal bar chart (CSS only) comparing bundle sizes.

| Library | Size |
|---|---|
| svg-scroll-draw | 2.6 KB ✓ |
| Framer Motion | ~35 KB |
| GSAP DrawSVG | ~40 KB |

- Reinforces the <3KB story with immediate visual impact
- Pure CSS bars, no chart library needed

---

### Medium effort (1–2 days)

#### Framework quickstart tabs
Tabbed code examples covering React, Next.js App Router, Vue, and Vanilla JS in one block.
- Standard pattern on modern library landing pages
- Reduces the "how do I use this in my framework" question

#### More SVG demo examples
Additional demo sections showcasing:
- A logo being drawn (real-world use case)
- A technical diagram / infographic
- A signature / handwriting effect
- A map / geographic path

---

### Larger effort (3+ days)

#### Live SVG Playground
Paste any SVG code into a textarea and watch it animate live with the current easing/speed settings.
- The killer demo feature — nothing proves a library better than letting people use it instantly
- Monaco editor or plain `<textarea>` with live preview
- Share button that encodes SVG in the URL

---

## Marketing & Distribution

### Low effort, high impact

| Action | Notes |
|---|---|
| **Product Hunt launch** | One strong launch can drive hundreds of GitHub stars overnight. Prepare a GIF demo, a tagline, and a first-comment with the story. |
| **Twitter/X thread** | Show the before/after: "I replaced 40KB of GSAP with 2.6KB of this." Include the demo GIF. |
| **Submit to awesome lists** | awesome-react, awesome-animation, awesome-svelte, awesome-javascript — passive long-term discovery. |
| **Dev.to / Hashnode article** | "How I built a <3KB SVG scroll animation library" — technical story + benchmark data + demo. |

---

## Priority Order

Based on value / effort ratio:

1. **Copy button on code blocks** — takes 30 min, expected by every developer
2. **`stagger` option** — most-requested scroll animation feature, ~20 lines
3. **Install tabs** — reduces friction for pnpm/yarn/bun users
4. **`onProgress` callback** — rounds out the callbacks API
5. **Bundle comparison chart** — visual proof of the <3KB claim
6. **Product Hunt launch** — biggest real-world distribution impact
7. **Percentage triggers** — quality-of-life for library consumers
8. **Vue wrapper** — doubles the framework reach
9. **Framework quickstart tabs** — polish the onboarding experience
10. **Live SVG playground** — the flagship demo feature

---

*Last updated: v0.1.0 — svg-scroll-draw*
