# X week plan — 16 to 22 November 2026

Account @CoDhruvil82870. Three posts a day at **10:00, 18:00 and 22:30 IST** (22:30 IST is US morning).
The story goes from the idea (a line that draws itself) to everything built on it, and ends where the
project is today: blocks, scrollfx and the benchmark. Each day has one theme.

**Media:** a short silent screen recording of the live site (8–20 s, 1080p, under 10 MB so it can be
attached from this Mac), recorded from the production build once the benchmark ends. Before anything is
scheduled, the owner sees every clip and approves the texts below; then each post is scheduled with X's
own scheduler. Any number in a post is checked against the code the day it is scheduled.

## Monday 16 — the idea

1. **00:20 — posted.** Launch video + pitch. https://x.com/CoDhruvil82870/status/2122037857875628288

2. **18:00 — the trick.** Clip: one path drawing itself, its dash length shown beside it.
   > Every "line that draws itself" is one CSS trick: set the stroke's dash to the path's length, then slide the dash offset from that length to zero.
   >
   > svg-scroll-draw ties that offset to the scrollbar, so the line draws as you read, and undraws when you scroll back.

3. **22:30 — one line.** Clip: the signature example drawing on scroll.
   > import { scrollDraw } from 'svg-scroll-draw'
   >
   > scrollDraw('#signature')
   >
   > It finds every path inside, measures each one, and draws them as the element moves through the screen.
   >
   > https://svg-scroll-draw.vercel.app/examples/signature

## Tuesday 17 — how it runs

4. **10:00 — native CSS.** Clip: a drawing with the browser's performance panel showing no script during scroll.
   > Where the browser supports CSS scroll-driven animations, a simple draw is handed to the browser itself: no JavaScript runs while you scroll.
   >
   > Everywhere else a small requestAnimationFrame engine takes over. Same API, same result.

5. **18:00 — stagger.** Clip: a many-path drawing inking in path by path.
   > Hundreds of paths? stagger draws them one after another instead of all at once, the way a pen would.
   >
   > scrollDraw('#map', { stagger: 0.05 })

6. **22:30 — reduced motion.** Clip: the same page twice, once with the OS "reduce motion" setting on.
   > If someone has asked their system for reduced motion, every effect shows its finished state instead of animating. Nothing to configure, and nothing hidden from them.

## Wednesday 18 — beyond lines

7. **10:00 — text.** Clip: a headline revealing word by word.
   > Not only SVG. scrollText splits a heading into words or letters and reveals them as you scroll, while screen readers still read the sentence as one.

8. **18:00 — counters.** Clip: a stats row counting up.
   > Numbers that count up as they scroll into view, then stay put:
   >
   > scrollCounter('#users', { to: 12500 })

9. **22:30 — video scrub.** Clip: a video scrubbed by the scrollbar.
   > Scrub a video with the scrollbar: scrollVideo for a <video>, scrollFrames for an image sequence drawn on a canvas.

## Thursday 19 — your framework

10. **10:00 — React.** Clip: the React page, a component drawing.
    > React: <ScrollDraw>, <ScrollAnimate>, <ScrollCounter> and hooks for each. Works in the Next.js App Router as a client island.
    >
    > https://svg-scroll-draw.vercel.app/react-scroll-animation

11. **18:00 — Vue and Nuxt.** Clip: a Vue block drawing.
    > Vue 3: components and composables. Nuxt: one line, and every one of them is auto-imported.
    >
    > modules: ['svg-scroll-draw/nuxt']
    >
    > The three Vue traps we hit, written up: https://svg-scroll-draw.vercel.app/blog/vue-scroll-animation-components

12. **22:30 — Svelte and the rest.** Clip: a Svelte block drawing.
    > Svelte: use:scrollDraw is an action, so there is no wrapper element.
    >
    > Solid, Angular and Astro have their own entry points too.
    >
    > https://svg-scroll-draw.vercel.app/blog/svelte-scroll-animation-components

## Friday 20 — things to use today

13. **10:00 — blocks.** Clip: /blocks, scrolling through the sections.
    > Ready-made scroll sections you install with the shadcn CLI and then own: a signature, reveal cards, a pinned feature tour, a video scrub and more. React, Vue and Svelte versions.
    >
    > https://svg-scroll-draw.vercel.app/blocks

14. **18:00 — free tools.** Clip: the SVG line drawing generator.
    > Free tools on the site, no sign-up: an SVG line drawing generator, a path editor, a cubic-bezier editor, a scroll trigger visualizer and more.
    >
    > https://svg-scroll-draw.vercel.app/tools

15. **22:30 — generative art.** Clip: the harmonograph from the post drawing in.
    > A harmonograph and a flow field in plain JavaScript, timed to finish drawing exactly as you reach them:
    >
    > https://svg-scroll-draw.vercel.app/blog/generative-svg-line-art

## Saturday 21 — scrollfx

16. **10:00 — scrollfx.** Clip: the flow-field hero plotting stroke by stroke.
    > scrollfx: page sections whose drawings plot themselves as you scroll. Flow fields, contour maps, hatched charts, a harmonograph.
    >
    > React, Vue and Svelte, installed with the shadcn CLI. Free and MIT.
    >
    > https://scrollfx-ui.vercel.app

17. **18:00 — timing.** Clip: a plate scrolling up with a line marking the middle of the screen.
    > Every drawing in scrollfx finishes as it reaches the middle of the screen: not before, not after. A check measures it on desktop and phone sizes before every release.

18. **22:30 — fingerprints.** Clip: the team cards, each fingerprint growing ring by ring. *(Only once the plate is live.)*
    > Each person on the team gets a fingerprint made from their name, the same every time, drawn ring by ring as their card arrives.
    >
    > https://scrollfx-ui.vercel.app/blocks/team-plotted

## Sunday 22 — where it stands

19. **10:00 — the benchmark.** Clip or image: the results page. **Text written from the published results**, GSAP's wins included, and sent for approval on its own.

20. **18:00 — size.** Image: the size table from the README.
    > 11.9 KB gzipped for every API at once, and each API is its own entry point, so you ship only what you import.
    >
    > Some libraries are smaller and do less; the table says which.
    >
    > https://github.com/DhruvilChauahan0210/ink-scroll#bundle-sizes

21. **22:30 — the week in one.** Clip: a fast cut of the week's clips.
    > A week of svg-scroll-draw: lines that draw themselves, text, counters, video, every framework, blocks, free tools, scrollfx and a benchmark.
    >
    > MIT, no dependencies. If it is useful to you, a star helps others find it:
    >
    > https://github.com/DhruvilChauahan0210/ink-scroll
