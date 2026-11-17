# X week plan — 23 to 29 November 2026 (draft, not approved)

Account @CoDhruvil82870, three posts a day at **10:00, 18:00 and 22:30 IST**, as in week 1
(`x-week-plan.md`). Week 1 told the library's story and ended on scrollfx's sections; week 2 launches
scrollfx's **component library** (published 17 Nov), then goes back to what is new in the library itself.
Nothing is recorded or scheduled until CD approves the texts. Every number is checked against the code
and the published pages the day it is scheduled. Clips come from the x-clips pipeline (1080×1080, 30 fps,
music bed), recorded from the live sites.

## Monday 23 — scrollfx components

1. **10:00 — launch.** Clip: the /components cover sheet, then a sheet plotting itself.
   > scrollfx now has components, not just sections.
   >
   > 14 of them: line, area, bar, pie, radar and scatter charts, sparklines, highlights, dividers, frames,
   > progress, stamps, a signature and arrows. Each one is drawn by a pen as you scroll.
   >
   > https://scrollfx-ui.vercel.app/components

2. **18:00 — charts.** Clip: the bar chart sheet plotting (axes, hatching, outlines), then Detail B re-plotting it horizontal.
   > Charts with no fills, only pen strokes: axes first, then the hatching, then the outline in the accent.
   >
   > Vertical, horizontal, grouped or stacked. Click a detail and the pen draws it again.

3. **22:30 — pens.** Clip: one chart re-plotted in the four pen colours.
   > Swap the pen, and the plotter draws it again.

## Tuesday 24 — ink pieces

4. **10:00 — highlights.** Clip: a paragraph with an underline, a circle and a box drawn round words, wrapping across lines.
   > Hand-drawn marks on real text: underline, circle, box, strike, hatch fill. A phrase that wraps gets one mark per line.

5. **18:00 — stamps and signatures.** Clip: the seal stamp and the signature writing a name.
   > A stamp with its text set round the rim, and a name written stroke by stroke in a script font. Both are plain SVG strokes.

6. **22:30 — progress.** Clip: a hatched bar, a ring and a gauge filling to their values.
   > Progress you can watch being drawn: a hatched bar, a ring and a gauge, each counting up to its value.

## Wednesday 25 — how it's shown

7. **10:00 — one command.** Clip: terminal `npx shadcn@latest add …/r/chart-bar.json`, then the chart in a fresh app.
   > npx shadcn@latest add https://scrollfx-ui.vercel.app/r/chart-bar.json
   >
   > The chart lands in your components folder as code you own.

8. **18:00 — the drawing office.** Clip: a sheet's title block, callouts and parts list.
   > Pen plotters were made to draw engineering drawings, so every scrollfx component is shown as a drawing sheet:
   > its props as dimension callouts, its variants as details, its install command in the title block.

9. **22:30 — blueprint.** Clip: the same sheet in light mode, then dark mode as a blueprint.
   > Dark mode is a blueprint.

## Thursday 26 — inside svg-scroll-draw

10. **10:00 — no flash.** Clip: page load with and without `no-flash.css`, slowed down.
    > A line that draws itself should never appear finished first. svg-scroll-draw 2.28 ships no-flash.css: strokes
    > stay hidden until the script has set their start.

11. **18:00 — faster reveals.** Image: before/after numbers from the 2.29.0 changelog.
    > 2.29: a 60-card scroll reveal went from 76 ms to 41 ms of main-thread time, by not writing a CSS variable nobody read.

12. **22:30 — subpaths.** Clip: one path with three subpaths drawing together, then split with stagger: 1 drawing in turn.
    > Asked this week: what happens to one path with several subpaths? Browsers restart the dash at each one, so they
    > draw together. Split them and add stagger: 1 to draw them in turn.

## Friday 27 — scroll techniques

13. **10:00 — pinning.** Clip: a section pinned while its drawing completes.
    > Pin a section while its drawing finishes, without GSAP.

14. **18:00 — horizontal.** Clip: a horizontal scroll section.
    > Vertical scroll, horizontal motion: a section that slides sideways as you scroll down.

15. **22:30 — smooth scroll.** Clip: the same drawing with Lenis smooth scrolling.
    > Works with Lenis smooth scroll out of the box: Lenis moves the real page, so there is nothing to wire up.

## Saturday 28 — tools

16. **10:00 — playground.** Clip: changing options in the playground and the drawing updating.
17. **18:00 — path editor.** Clip: editing an SVG path in the free path editor.
18. **22:30 — text fill.** Clip: the text fill scroll generator.

## Sunday 29 — where it stands

19. **10:00 — tested.** Image: the test counts **from `npm run check:claims` that day** (unit tests, browser tests per engine).
20. **18:00 — scrollfx so far.** Clip: fast scroll through the 16 sections and 14 components.
21. **22:30 — the week in one.** Clip: a fast cut of the week's clips.

## Notes

- Posts 1, 4, 7 and 20 replace the four drafts in `x-scrollfx-plan.md`.
- Post 11's numbers come from CHANGELOG 2.29.0; post 19's from check:claims on the day.
- Texts for 16–18 to be written with the clips (tool names checked against data/tools.ts).
