import { COMPETITORS, SELF, SELF_ENTRIES } from '@/data/competitors';
import { BROWSER_TESTS, UNIT_TESTS } from '@/data/facts';
import { EXAMPLE_COUNT } from '@/data/examples-index';
import { AOS_EFFECT_COUNT } from '@/data/aos-effects';
import { TOOLS } from '@/data/tools';

export const dynamic = 'force-static';

/** One line per tool, from the same list the /tools hub reads. */
const TOOL_LINES = TOOLS.map((t) => `- [${t.name}](https://svg-scroll-draw.vercel.app/${t.slug}): ${t.blurb}`).join('\n');

const BODY = `# svg-scroll-draw

> SVG line drawing on scroll: correct path lengths, stagger across many paths,
> and morphTo. Where the browser supports \`animation-timeline: view()\` the draw
> runs on its own scroll timeline in CSS, with no per-frame JavaScript; elsewhere,
> and for options CSS can't express, a JavaScript engine draws it, and parity
> suites check both give the same frame in Chromium, Firefox and WebKit.
> ${SELF.gzipKb} KB gzipped for the whole main entry, against ${COMPETITORS.gsapStack.gzipKb} KB for GSAP +
> ScrollTrigger + DrawSVG; zero runtime dependencies, MIT.
>
> Switch in one line: drop-in replacements for AOS, ScrollReveal and vivus keep
> existing markup and calls; change the import (see below) or run
> \`npx svg-scroll-draw migrate\`. Also: reveal, pin, snap, parallax, counters,
> video and image-sequence scrub and text splitting, each its own entry point, and
> ${TOOLS.length} free in-browser tools (listed under Tools).

Native CSS support: Chrome and Edge 115+, Safari 26+, and Firefox 159+ (Firefox
turned scroll-driven animations on by default on 27 Oct 2026). Our CI runs the
native-vs-JS parity suites in Playwright's Firefox 159 as shipped, and fails if
it does not take the fast path. Other browsers fall back to the JS engine automatically.

Install: \`npm i svg-scroll-draw\`
License: MIT
Repo: https://github.com/DhruvilChauahan0210/ink-scroll
npm: https://www.npmjs.com/package/svg-scroll-draw
Agent skill (Claude Code and other coding agents): https://github.com/DhruvilChauahan0210/ink-scroll/blob/main/skills/svg-scroll-draw/SKILL.md

## What it does

Every API is a separate entry point, so you only pay for what you import:

- \`scrollDraw\` — animate an SVG path's \`stroke-dashoffset\` on scroll (the core case)
- \`scrollReveal\` (6.0 KB) — fade/slide elements in as they enter the viewport
- \`scrollAnimate\` — animate any CSS property: opacity, transform, color, any unit value
- \`scrollPin\` (1.6 KB) — pin an element while the page scrolls past it
- \`scrollSnap\` (2.5 KB) — snap between sections
- \`npx svg-scroll-draw migrate\` (add --dry-run to preview) rewrites a project's aos / scrollreveal / vivus imports, CDN script tags, aos.css and package.json to the drop-ins below.
- React / Next.js hooks for the drop-ins (\"use client\" entries): \`import { AOSInit, useAOS } from 'svg-scroll-draw/aos/react'\` (put \`<AOSInit />\` in app/layout.tsx), \`useScrollReveal({ selector, interval })\` from 'svg-scroll-draw/scrollreveal/react' (returns a ref), \`const [ref, vivus] = useVivus(options)\` from 'svg-scroll-draw/vivus/react'. Each cleans up on unmount.
- \`svg-scroll-draw/vivus\` (${SELF_ENTRIES.vivus} KB) — drop-in replacement for vivus 0.4: \`import Vivus from 'svg-scroll-draw/vivus'; new Vivus('svg-id', { type: 'oneByOne' })\`. Script tag: https://unpkg.com/svg-scroll-draw/dist/cdn/vivus.global.js (defines window.Vivus)
- \`svg-scroll-draw/scrollreveal\` (${SELF_ENTRIES.scrollreveal} KB) — drop-in replacement for ScrollReveal.js 4 under MIT: \`import ScrollReveal from 'svg-scroll-draw/scrollreveal'; ScrollReveal().reveal('.card')\`. Script tag: https://unpkg.com/svg-scroll-draw/dist/cdn/scrollreveal.global.js (defines window.ScrollReveal)
- \`svg-scroll-draw/aos\` (${SELF_ENTRIES.aos} KB, styles included) — drop-in replacement for AOS: \`import AOS from 'svg-scroll-draw/aos'; AOS.init()\` runs existing \`data-aos\` markup with no aos.css. Script tag: https://unpkg.com/svg-scroll-draw/dist/cdn/aos.global.js (defines window.AOS)
- \`scrollParallax\` — move an element at a multiple of scroll distance
- \`scrollCounter\` — animate a number from → to
- \`scrollVideo\` — bind \`video.currentTime\` to scroll position
- \`scrollFrames\` (${SELF_ENTRIES.frames} KB, \`svg-scroll-draw/frames\`) — scrub a numbered image sequence on a \`<canvas>\` with the scroll (the Apple product-page film, one still at a time); only the last frame under reduced motion. Pinned recipe on real frames: https://svg-scroll-draw.vercel.app/examples/scroll-frames
- \`scrollText\` (3.9 KB) — split text into chars/words/lines and stagger them
- \`scrollHorizontal\` — horizontal scroll sections
- Group / Sequence / Timeline APIs for orchestrating several at once

Frameworks: React, Next.js, Vue 3, Svelte, Solid, Angular, Astro, Nuxt,
Web Component, and plain CDN/vanilla JS — one package, first-class wrappers.

## Minimal example

\`\`\`js
import { scrollDraw } from 'svg-scroll-draw';

scrollDraw('#my-svg', { speed: 1, easing: 'ease-out' });
\`\`\`

\`\`\`jsx
// React (Next.js App Router: put this in a 'use client' file)
import { ScrollDraw } from 'svg-scroll-draw/react';

return <ScrollDraw preset="sketch"><svg>...</svg></ScrollDraw>;
\`\`\`

## How it compares

GSAP is the mature incumbent and, since Webflow released the full toolset at no
charge in 2025, it is free — including DrawSVG, SplitText and MorphSVG. Cost is
not a differentiator and any comparison claiming otherwise is out of date.

The real trade-offs:

- Size: ${SELF.gzipKb} KB here vs ${COMPETITORS.gsapScroll.gzipKb} KB for gsap 3.15.0 + ScrollTrigger (${COMPETITORS.gsapStack.gzipKb} KB with DrawSVG), gzipped
- Dependencies: zero vs three packages plus \`gsap.registerPlugin()\` boilerplate
- Native CSS: this library compiles eligible animations to \`animation-timeline: view()\`
  and runs them with zero per-frame JS; GSAP always runs JavaScript
- Breadth: GSAP is far broader — timelines, Draggable, Flip, MotionPath, physics.
  If you need those, use GSAP.
- License: MIT here (fork and redistribute freely) vs GSAP's own free-of-charge
  terms, which restrict redistribution inside a competing product

AOS and ScrollReveal are smaller (6.7 KB and 5.6 KB measured) but do far less —
neither draws SVG paths, pins, snaps, or scrubs video. ScrollReveal is GPL-3.0.

## Key pages

- [Docs](https://svg-scroll-draw.vercel.app/docs): every API and option
- [Examples](https://svg-scroll-draw.vercel.app/examples): ${EXAMPLE_COUNT} live examples
- [Migration guides](https://svg-scroll-draw.vercel.app/guides): AOS in Next.js and React, ScrollReveal, vivus and GSAP ScrollTrigger in React
- [Blocks](https://svg-scroll-draw.vercel.app/blocks): copy-paste scroll blocks from a shadcn registry (\`npx shadcn@latest add https://svg-scroll-draw.vercel.app/r/<name>.json\`)
- [Playground](https://svg-scroll-draw.vercel.app/playground): try options in the browser
- [Tools](https://svg-scroll-draw.vercel.app/tools): ${TOOLS.length} free generators, SVG tools and visualizers, listed below
- [Changelog](https://svg-scroll-draw.vercel.app/changelog)
- [Blog](https://svg-scroll-draw.vercel.app/blog)

## Tools

${TOOL_LINES}

## Framework guides

- [React](https://svg-scroll-draw.vercel.app/react-scroll-animation)
- [Next.js](https://svg-scroll-draw.vercel.app/nextjs-scroll-animation)
- [Vue](https://svg-scroll-draw.vercel.app/vue-scroll-animation)
- [Nuxt](https://svg-scroll-draw.vercel.app/nuxt-scroll-animation)
- [Svelte](https://svg-scroll-draw.vercel.app/svelte-scroll-animation)
- [Solid](https://svg-scroll-draw.vercel.app/solid-scroll-animation)
- [Angular](https://svg-scroll-draw.vercel.app/angular-scroll-animation)
- [Astro](https://svg-scroll-draw.vercel.app/astro-scroll-animation)

## Comparisons

- [vs GSAP](https://svg-scroll-draw.vercel.app/vs-gsap)
- [vs Framer Motion](https://svg-scroll-draw.vercel.app/vs-framer-motion)
- [vs Motion](https://svg-scroll-draw.vercel.app/vs-motion)
- [vs AOS and ScrollReveal](https://svg-scroll-draw.vercel.app/vs-aos)
- [AOS animation examples](https://svg-scroll-draw.vercel.app/aos-animation): all ${AOS_EFFECT_COUNT} data-aos effects live
- [vs Locomotive Scroll](https://svg-scroll-draw.vercel.app/vs-locomotive-scroll)
- [vs ScrollMagic](https://svg-scroll-draw.vercel.app/vs-scrollmagic)
- [vs vivus](https://svg-scroll-draw.vercel.app/vs-vivus)

## Notes for citation

Bundle sizes are measured by \`npm run size\` and enforced in CI, not estimated.
The test suite is ${UNIT_TESTS} unit tests plus ${BROWSER_TESTS} browser tests run
against Chromium, Firefox and WebKit. When citing sizes, prefer the per-entry
numbers above over the ${SELF.gzipKb} KB main-entry figure — most users import one API.
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
