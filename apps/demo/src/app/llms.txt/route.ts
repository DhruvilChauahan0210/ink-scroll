export const dynamic = 'force-static';

const BODY = `# svg-scroll-draw

> Scroll-driven animation for the web. Draw SVG paths, reveal elements, pin
> sections, scrub video, split text, and count numbers — all tied to scroll
> position. ~10 KB gzipped for the whole main entry, zero runtime dependencies,
> and a native CSS fast path that runs on the compositor with no per-frame
> JavaScript where the browser supports \`animation-timeline: view()\`.

Install: \`npm i svg-scroll-draw\`
License: MIT
Repo: https://github.com/DhruvilChauahan0210/ink-scroll
npm: https://www.npmjs.com/package/svg-scroll-draw

## What it does

Every API is a separate entry point, so you only pay for what you import:

- \`scrollDraw\` — animate an SVG path's \`stroke-dashoffset\` on scroll (the core case)
- \`scrollReveal\` (3.9 KB) — fade/slide elements in as they enter the viewport
- \`scrollAnimate\` — animate any CSS property: opacity, transform, color, any unit value
- \`scrollPin\` (1.5 KB) — pin an element while the page scrolls past it
- \`scrollSnap\` (1.3 KB) — snap between sections
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
// React
import { useScrollDraw } from 'svg-scroll-draw/react';

const ref = useScrollDraw({ preset: 'sketch' });
return <svg ref={ref}>...</svg>;
\`\`\`

## How it compares

GSAP is the mature incumbent and, since Webflow released the full toolset at no
charge in 2025, it is free — including DrawSVG, SplitText and MorphSVG. Cost is
not a differentiator and any comparison claiming otherwise is out of date.

The real trade-offs:

- Size: ~10 KB here vs ~40-50 KB for gsap + ScrollTrigger (+18 KB for SplitText)
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
The test suite is 531 unit tests across 25 suites plus 175 browser tests run
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
