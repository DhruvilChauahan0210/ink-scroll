import type { ReactNode } from 'react';
import { LiveStrip } from './LiveStrip';
import type { RecipeDef } from './recipes';
import { FigCount, FigFocus, FigLayers, FigSpeed, FigTravel } from './strip-figures';

/*
 * The case-study strip: the recipe on /blog/horizontal-scroll-sections, the
 * page that already targets the search. Its files are in
 * src/recipes/horizontal-scroll-sections/ and run by scripts/test-recipes.mjs.
 * Every number below is a measurement of that index.html in Chromium.
 *
 * Plain data, so the post (a server component) can read the counts; the parts
 * that render it are in StripRecipe.tsx.
 */

const C = ({ children }: { children: ReactNode }) => <code className="rc-c">{children}</code>;

export const STRIP_RECIPE: RecipeDef = {
  updated: '2026-11-05',
  steps: [
    {
      title: 'Give it a runway, a stage and a track',
      file: 'case-strip.css',
      body: (
        <>
          Three boxes. The runway, <C>.work</C>, is the scroll room. The stage inside it sticks to the top of
          the screen while the runway scrolls past. The track inside the stage is one row of cases, as wide as
          they are. Cases narrower than the stage leave the next one showing at the edge, which is how a
          reader knows the row goes on; sized in <C>cqw</C>, that holds in a page container as well as
          across the full screen.
        </>
      ),
      code: `.work {
  height: calc(var(--travel, 200vh) + 100svh);
}

.work-stage {
  position: sticky;
  top: 0;
  height: 100svh;
  padding: clamp(24px, 7vh, 72px) 6vw;
  overflow: clip;
  container-type: inline-size;
}

/* As wide as its cases, so it can be measured and moved. */
.work-track {
  display: flex;
  gap: 24px;
  width: max-content;
}

/* cqw: the stage's width, wherever the strip is placed. */
.work-case { width: min(78cqw, 520px); }`,
      note: (
        <>
          <C>clip</C>, not <C>hidden</C>: step 5 is why.
        </>
      ),
      caption: 'the three boxes',
      figure: <FigLayers />,
    },
    {
      title: 'Move it with one call',
      file: 'CaseStrip.tsx',
      body: (
        <>
          No distance and no trigger. <C>scrollHorizontal</C> walks up to the nearest{' '}
          <C>position: sticky</C> ancestor, takes the scroll window from that stage’s parent, the runway,
          and moves the track by its own width minus the stage’s content box. From 2.18.1 it measures
          again whenever the window, the page, the track or the runway changes size, so a phone turned
          sideways, or a cover image that loads late, does not leave the last case out of reach.
        </>
      ),
      code: `import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

useEffect(() => {
  if (!track.current) return;
  const strip = scrollHorizontal(track.current);
  return () => strip.destroy();
}, []);`,
      caption: 'what the track is moved by',
      figure: <FigTravel />,
    },
    {
      title: 'Make the runway as long as the strip',
      file: 'CaseStrip.tsx',
      body: (
        <>
          The stage stays stuck for the runway’s height minus one screen, and the strip crosses its whole
          travel in that time. A fixed <C>400vh</C> runway sets the speed by accident: measured on this strip,
          32.8 px sideways for every 100 px of scroll at 1440 wide and 31.6 px on a phone, so the strip crawls
          at a third of the page’s speed. Make the runway the travel plus one screen and every pixel of
          scroll moves it one pixel, at any width.
        </>
      ),
      code: `// A pixel of scroll moves the strip a pixel: the runway is the strip's
// travel plus the one screen the stage stays stuck for.
const fit = () => runway.style.setProperty('--travel', \`\${travelOf(st, tr)}px\`);
fit();
const ro = new ResizeObserver(fit);
ro.observe(tr);
ro.observe(st);`,
      note: (
        <>
          Call <C>fit()</C> Before <C>scrollHorizontal</C>, so its first measurement already sees the right
          runway. After that the observer keeps the height current, and the strip follows the runway’s
          new height on its own.
        </>
      ),
      caption: 'px sideways per 100 px of scroll',
      figure: <FigSpeed />,
    },
    {
      title: 'Show where you are',
      file: 'CaseStrip.tsx',
      body: (
        <>
          <C>onProgress</C> gives you 0 to 1 across the travel. The rail is that number as a scale. The count
          rounds it to the nearest case, so with four cases it ticks over at 1/6, 1/2 and 5/6, and it is
          written only when it changes. Both are <C>aria-hidden</C>: the list already tells a screen reader
          how many cases there are.
        </>
      ),
      code: `const strip = scrollHorizontal(tr, {
  onProgress: (p) => {
    if (fill.current) fill.current.style.transform = \`scaleX(\${p})\`;
    const i = Math.round(p * (n - 1));
    if (i !== shown && count.current) {
      count.current.textContent = String(i + 1).padStart(2, '0');
      shown = i;
    }
  },
});`,
      caption: 'where the count changes',
      figure: <FigCount />,
    },
    {
      title: 'Let the keyboard in',
      file: 'CaseStrip.tsx',
      body: (
        <>
          Every case has a link, and Tab reaches all four, including the ones still off to the right. With{' '}
          <C>overflow: hidden</C> the browser scrolls the stage itself to show a focused link, on top of the
          transform, and nothing scrolls it back: measured on this strip, tabbing to the fourth case left the
          stage scrolled 615 px, so the start of the strip opened on case 2. <C>overflow: clip</C> cannot be
          scrolled at all. The handler scrolls the page to the point where that case is in view, and the
          strip’s own transform does the rest.
        </>
      ),
      code: `const onFocus = (e: FocusEvent) => {
  const item = (e.target as Element).closest('li');
  if (!item) return;
  const travel = travelOf(st, tr);
  // How far into the track the case starts. Both boxes carry the same
  // translateX, so it cancels out.
  const at = item.getBoundingClientRect().left - tr.getBoundingClientRect().left;
  const p = travel > 0 ? Math.min(1, at / travel) : 0;
  const top = runway.getBoundingClientRect().top + window.scrollY + p * (runway.offsetHeight - window.innerHeight);
  requestAnimationFrame(() => window.scrollTo({ top }));
};
tr.addEventListener('focusin', onFocus);`,
      note: (
        <>
          Two things that look simpler and are not. The scroll waits a frame: the browser runs its own scroll
          to the focused link after <C>focusin</C> and undoes one made inside the handler. And{' '}
          <C>offsetLeft</C> would read 0: once the library writes a transform, the track becomes the
          case’s offset parent.
        </>
      ),
      caption: 'tab to case 4, back to the start · 1280 × 800',
      figure: <FigFocus />,
    },
  ],
  live: <LiveStrip />,
  liveLayout: 'full',
  filesIntro: (
    <>
      Two files, ready to paste into a React or Next.js project with <C>svg-scroll-draw</C> installed. The
      component takes the cases as a prop; the runway, the count and the keyboard are all in its one effect.
      The strip below them is this exact component, running.
    </>
  ),
  htmlIntro: (
    <>
      The same strip as one HTML file, importing the ES module from a CDN. Save it and open it in a browser.
    </>
  ),
  pitfalls: [
    {
      problem: 'Passing your own distance',
      body: (
        <>
          <C>track.scrollWidth - window.innerWidth</C> is the line most tutorials give, and this post gave it
          too. Measured on this strip at 1280 wide, it stops 154 px early, because the window’s width
          includes the stage’s padding, and 77 px of the last case never come on screen. Narrow the window
          to 800 px part-way down and the number is stale: the last case never appeared at all. Leave{' '}
          <C>distance</C> out. Since 2.18.1 the default is measured against the stage and measured again when
          the layout changes; a number you pass is used as given.
        </>
      ),
    },
    {
      problem: 'The stage scrolls away instead of sticking',
      body: (
        <>
          <C>html, body {'{'} overflow-x: hidden {'}'}</C> is a common fix for stray sideways scrolling. With
          both set, body becomes a scroll container that never scrolls, and the stage sticks to that instead
          of the screen: measured halfway along this strip, the stage had gone 513 px up off the screen while
          the strip kept moving inside it. <C>overflow-x: clip</C> stops sideways scrolling without making a
          scroll container.
        </>
      ),
    },
    {
      problem: 'Reduced motion shows the end first',
      body: (
        <>
          With <C>respectReducedMotion: true</C> and reduced motion asked for, an animation jumps to its
          final state, and here the final state is the far end of the strip: measured, the track sat at its end
          from the first pixel of scroll and the first case was never on screen. The default,{' '}
          <C>false</C>, keeps the scrub, which moves only as the reader scrolls, and every case stays
          reachable.
        </>
      ),
    },
    {
      problem: 'Reveals inside the strip do not wait for each case',
      body: (
        <>
          <C>scrollReveal</C> times each element by its height on the page, and every case in the stage is
          at the same height. Measured with <C>{"scrollReveal('.work-case')"}</C> on
          this strip: the cases on screen as the stage arrived faded in on the way up, and the fourth, off to
          the right at that point, came on screen already at full opacity. To reveal each case as it slides
          on, drive it from the strip’s own <C>onProgress</C>.
        </>
      ),
    },
    {
      problem: 'It goes wrong after the page has loaded (2.18.0 and older)',
      body: (
        <>
          Older versions measured the travel and the runway once, at load. On a test page with 2.18.0, a
          480 px hero image that loaded late, above the strip, had it a fifth of the way along before the
          stage pinned, and narrowing the window from 1280 to 800 px ran it 1,200 px past its last panel. On
          those versions, call <C>refresh()</C> after anything above or inside the strip changes size; 2.18.1
          does it for you.
        </>
      ),
    },
  ],
};
