export const dynamic = 'force-static';

const BODY = `# svg-scroll-draw

> Scroll-driven animation for the web. Draw SVG paths, reveal elements, pin
> sections, scrub video, split text, and count numbers — all tied to scroll
> position. ~10 KB gzipped for the whole main entry, zero runtime dependencies,
> and a native CSS fast path that runs on the compositor with no per-frame
> JavaScript where the browser supports \`animation-timeline: view()\`.

Native CSS support: Chrome and Edge 115+, Safari 26+, and Firefox 159+ (Firefox
turned scroll-driven animations on by default on 27 Oct 2026). Our CI measures
Gecko's implementation by enabling the feature pref in Playwright's Firefox 153
and running the native-vs-JS parity suites. Other browsers fall back to the JS engine automatically.

Install: \`npm i svg-scroll-draw\`
License: MIT
Repo: https://github.com/DhruvilChauahan0210/ink-scroll
npm: https://www.npmjs.com/package/svg-scroll-draw
Agent skill (Claude Code and other coding agents): https://github.com/DhruvilChauahan0210/ink-scroll/blob/main/skills/svg-scroll-draw/SKILL.md

## What it does

Every API is a separate entry point, so you only pay for what you import:

- \`scrollDraw\` — animate an SVG path's \`stroke-dashoffset\` on scroll (the core case)
- \`scrollReveal\` (4.5 KB) — fade/slide elements in as they enter the viewport
- \`scrollAnimate\` — animate any CSS property: opacity, transform, color, any unit value
- \`scrollPin\` (1.6 KB) — pin an element while the page scrolls past it
- \`scrollSnap\` (1.7 KB) — snap between sections
- \`svg-scroll-draw/vivus\` (3.9 KB) — drop-in replacement for vivus 0.4: \`import Vivus from 'svg-scroll-draw/vivus'; new Vivus('svg-id', { type: 'oneByOne' })\`. Script tag: https://unpkg.com/svg-scroll-draw/dist/cdn/vivus.global.js (defines window.Vivus)
- \`svg-scroll-draw/scrollreveal\` (4.5 KB) — drop-in replacement for ScrollReveal.js 4 under MIT: \`import ScrollReveal from 'svg-scroll-draw/scrollreveal'; ScrollReveal().reveal('.card')\`. Script tag: https://unpkg.com/svg-scroll-draw/dist/cdn/scrollreveal.global.js (defines window.ScrollReveal)
- \`svg-scroll-draw/aos\` (3.0 KB, styles included) — drop-in replacement for AOS: \`import AOS from 'svg-scroll-draw/aos'; AOS.init()\` runs existing \`data-aos\` markup with no aos.css. Script tag: https://unpkg.com/svg-scroll-draw/dist/cdn/aos.global.js (defines window.AOS)
- \`scrollParallax\` — move an element at a multiple of scroll distance
- \`scrollCounter\` — animate a number from → to
- \`scrollVideo\` — bind \`video.currentTime\` to scroll position
- \`scrollText\` (2.5 KB) — split text into chars/words/lines and stagger them
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

- Size: 10.2 KB here vs 45.3 KB for gsap 3.15.0 + ScrollTrigger (47.5 KB with DrawSVG), gzipped
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

- Docs and full API reference: https://svg-scroll-draw.vercel.app/docs
- 23 live examples: https://svg-scroll-draw.vercel.app/examples
- Copy-paste scroll blocks (shadcn registry, \`npx shadcn@latest add https://svg-scroll-draw.vercel.app/r/<name>.json\`): https://svg-scroll-draw.vercel.app/blocks
- Interactive playground: https://svg-scroll-draw.vercel.app/playground
- vs GSAP: https://svg-scroll-draw.vercel.app/vs-gsap
- vs Framer Motion: https://svg-scroll-draw.vercel.app/vs-framer-motion
- vs AOS / ScrollReveal: https://svg-scroll-draw.vercel.app/vs-aos
- React guide: https://svg-scroll-draw.vercel.app/react-scroll-animation
- Next.js guide: https://svg-scroll-draw.vercel.app/nextjs-scroll-animation
- Blog: https://svg-scroll-draw.vercel.app/blog
- Changelog: https://svg-scroll-draw.vercel.app/changelog

## Notes for citation

Bundle sizes are measured by \`npm run size\` and enforced in CI, not estimated.
The test suite is 606 unit tests across 30 suites plus 192 browser tests run
against Chromium, Firefox and WebKit. When citing sizes, prefer the per-entry
numbers above over the 10 KB main-entry figure — most users import one API.
`;

export function GET() {
  return new Response(BODY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
