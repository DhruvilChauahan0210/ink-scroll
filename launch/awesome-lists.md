# Awesome List Submissions — svg-scroll-draw

Submit a PR to each repo below. One-liner entry text is provided for each.
Rules: read the repo's CONTRIBUTING.md before submitting. Most require alphabetical order within a section.

---

## 1. awesome-react
**Repo:** https://github.com/enaqx/awesome-react
**Section:** `Animation` (or `SVG` if present — check current structure)
**Entry:**
```
- [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll) - Scroll-driven SVG path animation with a React wrapper. Zero dependencies, ~4.4 KB gzipped, native CSS fast path.
```
**PR title:** `Add svg-scroll-draw to Animation section`
**Notes:** This repo is large and actively maintained. Check the existing `Animation` section — it currently lists react-spring, framer-motion, react-motion. The "zero deps, no GSAP license" angle is the differentiator.

---

## 2. awesome-vue
**Repo:** https://github.com/vuejs/awesome-vue
**Section:** `Animation` or `UI Components > Animation`
**Entry:**
```
- [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll) - Scroll-driven SVG path animation for Vue 3. `<ScrollDraw>` component and `useScrollDraw` composable. Zero dependencies, ~4.4 KB gzipped.
```
**PR title:** `Add svg-scroll-draw — scroll-driven SVG animation for Vue 3`
**Notes:** The Vue section tends to be stricter about demos. Link to https://svg-scroll-draw.vercel.app/examples in the PR description.

---

## 3. awesome-svg
**Repo:** https://github.com/willianjusten/awesome-svg
**Section:** `Animation` (this is where DrawSVG alternatives live)
**Entry:**
```
- [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll) - Scroll-driven SVG stroke animation. ~4.4 KB, zero dependencies, native CSS fast path with automatic JS fallback. Works in any framework.
```
**PR title:** `Add svg-scroll-draw to Animation section`
**Notes:** This is the highest-signal repo for this library — it's literally a list of SVG tools. The maintainer (willianjusten) is active. Make the PR description mention the native `animation-timeline: view()` angle — it's novel for this space.

---

## 4. awesome-javascript
**Repo:** https://github.com/sorrycc/awesome-javascript
**Section:** `Animation` (look for the CSS/JS animation section)
**Entry:**
```
- [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll) - Scroll-driven SVG path animation library. Zero dependencies, ~4.4 KB gzipped. React, Vue, Svelte, Solid, Angular, Nuxt, Astro and vanilla JS adapters.
```
**PR title:** `Add svg-scroll-draw to Animation`
**Notes:** This list is large. Check alphabetical placement within the Animation section. The broad framework support is the strongest angle here.

---

## 5. awesome-css-animation
**Repo:** https://github.com/awesome-css-group/awesome-css-animation
**Section:** `Libraries` or `Tools`
**Entry:**
```
- [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll) - Scroll-driven SVG path animation with native CSS scroll-driven animation support (`animation-timeline: view()`). ~4.4 KB gzipped, MIT.
```
**PR title:** `Add svg-scroll-draw — native CSS scroll animation library`
**Notes:** The `animation-timeline: view()` native CSS angle is the most relevant hook for this list specifically. Lead with it in the PR description.

---

## 6. awesome-nextjs
**Repo:** https://github.com/unicodeveloper/awesome-nextjs
**Section:** `Packages` or `UI Components`
**Entry:**
```
- [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll) - Scroll-driven SVG path animation. SSR-safe Next.js App Router compatible, ~4.4 KB gzipped, zero dependencies.
```
**PR title:** `Add svg-scroll-draw — SSR-safe SVG scroll animation for Next.js`
**Notes:** The "SSR-safe, App Router compatible" angle is the key differentiator vs existing animation libraries. Next.js devs specifically hit this pain point with other libraries.

---

## Submission checklist (do before each PR)

- [ ] Read the repo's `CONTRIBUTING.md` — most require a specific format or section
- [ ] Check that the link you're submitting is to the **GitHub repo** (`https://github.com/DhruvilChauahan0210/ink-scroll`), not the demo site
- [ ] Verify alphabetical placement within the section
- [ ] Include the demo site link (`https://svg-scroll-draw.vercel.app`) in the **PR description body** (not the entry itself — most guides prohibit multiple links in the entry)
- [ ] Star the repo before submitting — maintainers notice
- [ ] Don't batch-submit all PRs on the same day — spread over a week to avoid looking spammy

---

## PR description template (copy-paste, fill in the [SECTION] placeholder)

```
## Add svg-scroll-draw

Adding [svg-scroll-draw](https://github.com/DhruvilChauahan0210/ink-scroll) to the [SECTION] section.

**What it does:** Animates SVG paths as you scroll using stroke-dashoffset. Handles path discovery, length measurement, and IntersectionObserver lifecycle automatically.

**Why it belongs here:**
- ~4.4 KB gzipped, zero dependencies, MIT license
- Native CSS scroll-driven animation (`animation-timeline: view()`) with automatic JS fallback
- Works in React, Vue 3, Svelte, Solid.js, Angular, Nuxt, Astro, and vanilla JS
- 221 passing tests

**Demo:** https://svg-scroll-draw.vercel.app
**npm:** https://www.npmjs.com/package/svg-scroll-draw
```

---

## Priority order

1. **awesome-svg** — most topically relevant, highest signal-to-noise for this audience
2. **awesome-react** — largest audience, most traffic
3. **awesome-javascript** — broadest reach
4. **awesome-nextjs** — SSR-safe angle is genuinely useful for Next.js devs
5. **awesome-vue** — active Vue community
6. **awesome-css-animation** — native CSS angle fits perfectly
