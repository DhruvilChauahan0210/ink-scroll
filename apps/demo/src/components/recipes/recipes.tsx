import type { ReactNode } from 'react';
import type { RecipeSlug } from '@/recipes/slugs';
import { LogoReveal } from '@/recipes/logo-reveal/LogoReveal';
import { FeatureTour } from '@/recipes/scroll-pin/FeatureTour';
import { FigFlood, FigLayers, FigSelector, FigStagger } from './logo-figures';
import { FigPinStates, FigStage, FigThirds, FigThirdsDrawn } from './pin-figures';
import { StatRow } from '@/recipes/scroll-counter/StatRow';
import { FigFormat, FigReach, FigThreeCopies, FigWidth } from './counter-figures';
import { FilmScrub } from '@/recipes/scroll-video/FilmScrub';
import { FigChapters, FigKeyframes, FigMeasure, FigTrack } from './video-figures';

/*
 * A recipe turns an example page into a build: numbered steps with a figure
 * each, the complete files (read from src/recipes/<slug>/ at build time, and
 * run in a browser by scripts/test-recipes.mjs), and where it goes wrong.
 * Every claim here was checked against the engine, not written from memory.
 */

export type RecipeStep = {
  title: string;
  file: string;
  body: ReactNode;
  code: string;
  note?: ReactNode;
  caption: string;
  figure: ReactNode;
};

export type Pitfall = { problem: string; body: ReactNode };

export type RecipeDef = {
  /** When the recipe was last checked, for the page's dateModified. */
  updated: string;
  steps: RecipeStep[];
  /** The complete React component, running — the same file the page lists. */
  live: ReactNode;
  /**
   * `side`: a plate beside the files (an element that draws in place).
   * `full`: across the page under them (a section that pins to the viewport).
   */
  liveLayout: 'side' | 'full';
  /** One line above the complete files. */
  filesIntro: ReactNode;
  /** One line above the no-build HTML file. */
  htmlIntro: ReactNode;
  pitfalls: Pitfall[];
};

const C = ({ children }: { children: ReactNode }) => <code className="rc-c">{children}</code>;

export const RECIPES: Record<RecipeSlug, RecipeDef> = {
  'logo-reveal': {
    updated: '2026-11-04',
    steps: [
      {
        title: 'Split the logo into outline and colour',
        file: 'LogoReveal.tsx',
        body: (
          <>
            A path draws by its stroke, so the logo needs two layers: the outline as stroked paths with no
            fill, and the colour as separate shapes, hidden for now. Most exported logos are filled shapes
            with no stroke at all, and those have nothing to draw.
          </>
        ),
        code: `<svg viewBox="0 0 200 200">
  {/* the colour: hidden until the outline is done */}
  <path className="logo-fill logo-disc" d={ring(70)} />
  <path className="logo-fill logo-bean-fill" d={BEAN} />

  {/* the outline: drawn, in this order */}
  <path className="logo-line logo-outer" d={ring(86)} />
  <path className="logo-line logo-inner" d={ring(70)} />
  <path className="logo-line logo-bean" d={BEAN} />
  <path className="logo-line logo-crease" d={CREASE} />
</svg>`,
        caption: 'two layers',
        figure: <FigLayers />,
      },
      {
        title: 'Draw only the outline',
        file: 'LogoReveal.tsx',
        body: (
          <>
            Wrap the SVG in <C>{'<ScrollDraw>'}</C> and point <C>selector</C> at the outline. The colour
            shapes are left exactly as they are. Without it the library would take every path, colour
            included, and try to draw shapes that have no stroke.
          </>
        ),
        code: `<ScrollDraw selector=".logo-line">
  <svg viewBox="0 0 200 200">…</svg>
</ScrollDraw>`,
        caption: 'the selector',
        figure: <FigSelector />,
      },
      {
        title: 'Set when it draws, and in what order',
        file: 'LogoReveal.tsx',
        body: (
          <>
            <C>trigger</C> ties the drawing to the scroll: it starts when the logo’s top passes 85% of the
            way down the viewport and reaches the end at 35%. <C>stagger</C> starts each stroke a little
            after the one before, in the order the paths appear. Each is shifted by its share of the range,
            so the last stroke finishes after <C>end</C>: here, when the top reaches about 17%.
          </>
        ),
        code: `<ScrollDraw
  selector=".logo-line"
  trigger={{ start: 'top 85%', end: 'top 35%' }}
  easing="ease-out"
  stagger={0.12}
>`,
        caption: 'when each stroke draws',
        figure: <FigStagger />,
      },
      {
        title: 'Flood the colour at 100%',
        file: 'LogoReveal.tsx · logo-reveal.css',
        body: (
          <>
            <C>onComplete</C> fires when the last stroke is drawn. Flip a class there and let CSS fade the
            colour in. <C>once</C> holds the drawing once it is finished, so scrolling back up does not
            un-draw an outline that is already coloured.
          </>
        ),
        code: `const [inked, setInked] = useState(false);

<ScrollDraw
  className={inked ? 'logo is-inked' : 'logo'}
  once
  onComplete={() => setInked(true)}
  …
>

/* logo-reveal.css */
.logo-fill { opacity: 0; transition: opacity 0.7s ease; }
.is-inked .logo-fill { opacity: 1; }`,
        note: (
          <>
            Reduced motion needs nothing extra: the library shows the finished outline at once and calls{' '}
            <C>onComplete</C> straight away, so the colour still arrives.
          </>
        ),
        caption: 'the hand-off',
        figure: <FigFlood />,
      },
    ],
    live: <LogoReveal />,
    liveLayout: 'side',
    filesIntro: (
      <>
        Two files, ready to paste into a React or Next.js project with <C>svg-scroll-draw</C> installed. The
        plate beside them is this exact component, running.
      </>
    ),
    htmlIntro: <>The same logo as one HTML file, with the library from a CDN. Save it and open it in a browser.</>,
    pitfalls: [
      {
        problem: 'Nothing draws',
        body: (
          <>
            The paths are filled, not stroked, and only a stroke can be drawn. Give the outline paths{' '}
            <C>fill: none</C> and a stroke colour. The development build says so in the console: “Element
            has no stroke — path will not be visible.”
          </>
        ),
      },
      {
        problem: 'The colour is there from the start',
        body: (
          <>
            Either the colour shapes are visible, or <C>selector</C> matches them too. Keep them out of the
            selector and at <C>opacity: 0</C> until <C>onComplete</C>.
          </>
        ),
      },
      {
        problem: 'Scrolling back up un-draws the outline under the colour',
        body: (
          <>
            Without <C>once</C>, the outline follows the scroll both ways, but <C>onComplete</C> has no
            opposite, so the class stays on. Keep <C>once</C>. If the logo should rewind instead, drop{' '}
            <C>once</C> and take the class off in <C>onEnterBack</C>, which fires when the reader scrolls back
            into the range.
          </>
        ),
      },
      {
        problem: 'It is already drawn when the page loads',
        body: (
          <>
            A logo near the top of the page can be past <C>top 35%</C> before anyone scrolls, so it loads
            drawn. For a hero logo, draw it on load instead with <C>autoplay</C> and a{' '}
            <C>duration</C>, as the live Ferrow site does.
          </>
        ),
      },
      {
        problem: 'The strokes draw in the wrong order',
        body: (
          <>
            <C>stagger</C> follows the order of the paths in the SVG. Reorder the <C>{'<path>'}</C>{' '}
            elements, not the CSS.
          </>
        ),
      },
    ],
  },
  'scroll-pin': {
    updated: '2026-11-05',
    steps: [
      {
        title: 'Build a stage that fits one screen',
        file: 'feature-tour.css · FeatureTour.tsx',
        body: (
          <>
            The stage is what stays put: the drawings and the copy, side by side. While it is pinned it is
            fixed below your header, so anything taller than the screen can never be scrolled to. Size it to
            the viewport minus the header, and give CSS the header height from the same constant the script
            uses.
          </>
        ),
        code: `.tour-stage {
  height: calc(100vh - var(--header));
  height: calc(100svh - var(--header));
}

<div ref={stage} className="tour-stage"
  style={{ '--header': \`\${HEADER}px\` }}>`,
        caption: 'one screen',
        figure: <FigStage />,
      },
      {
        title: 'Pin it for two screens',
        file: 'FeatureTour.tsx',
        body: (
          <>
            <C>scrollPin</C> wraps the stage in a <C>div</C> as tall as the stage plus <C>pinDistance</C>. The
            stage scrolls in as usual, stays fixed at <C>top</C> while the wrapper scrolls past, then comes to
            rest at the wrapper’s bottom. Two screens of <C>pinDistance</C> give three features two-thirds of a
            screen each.
          </>
        ),
        code: `const pin = scrollPin(stage.current, {
  top: HEADER,
  pinDistance: \`\${(n - 1) * 100}vh\`,
  onProgress: (p) => { … },
});

return () => pin.destroy();`,
        caption: 'before · pinned · after',
        figure: <FigPinStates />,
      },
      {
        title: 'Let the progress pick the feature',
        file: 'FeatureTour.tsx',
        body: (
          <>
            <C>onProgress</C> reports 0 where the pin starts and 1 where it ends, on every frame in between.
            Cut it into thirds: <C>floor(p × 3)</C> is the feature to show. The copy and the drawing for that
            feature come forward; the others step back.
          </>
        ),
        code: `onProgress: (p) => {
  const i = Math.min(n - 1, Math.floor(p * n));
  setActive(i);
}`,
        caption: 'progress, in thirds',
        figure: <FigThirds />,
      },
      {
        title: 'Draw each feature in its third',
        file: 'FeatureTour.tsx',
        body: (
          <>
            Give each drawing its own <C>scrollDraw</C> and move it from the pin with <C>seek()</C> instead of
            its own position on the page: earlier features finished, later ones empty, and the current one at{' '}
            <C>p × 3 − i</C>, how far the reader is through its third.
          </>
        ),
        code: `const drawings = Array.from(stage.current.querySelectorAll('.tour-art'),
  (svg) => scrollDraw(svg));
drawings.forEach((d) => d.seek(0));

// inside onProgress
drawings.forEach((d, j) =>
  d.seek(j < i ? 1 : j > i ? 0 : p * n - i));`,
        note: (
          <>
            Under reduced motion each drawing is shown finished and <C>seek()</C> does nothing. The pin and the
            features keep working: pinning is not motion.
          </>
        ),
        caption: 'a third each',
        figure: <FigThirdsDrawn />,
      },
    ],
    live: <FeatureTour />,
    liveLayout: 'full',
    filesIntro: (
      <>
        Two files, ready to paste into a React or Next.js project with <C>svg-scroll-draw</C> installed. The
        section below them is this exact component, running: scroll through it.
      </>
    ),
    htmlIntro: (
      <>
        The same tour as one HTML file. <C>scrollPin</C> is not in the script-tag build, so this imports the
        ES modules from a CDN. Save it and open it in a browser.
      </>
    ),
    pitfalls: [
      {
        problem: 'Part of the stage is cut off on a phone',
        body: (
          <>
            A pinned stage taller than the screen keeps its bottom out of reach for as long as it is pinned.
            Keep it to <C>100svh</C> minus the header, and on a narrow screen show one feature at a time, as the
            CSS here does below 720px.
          </>
        ),
      },
      {
        problem: 'It drifts or scrolls away while pinned',
        body: (
          <>
            While pinned the stage is <C>position: fixed</C>, and an ancestor with a <C>transform</C>,{' '}
            <C>filter</C>, <C>perspective</C> or <C>contain: paint</C> turns fixed into “fixed to me”. Move the
            tour out of that ancestor, or drop the property from it.
          </>
        ),
      },
      {
        problem: 'The layout changes the moment it pins',
        body: (
          <>
            <C>scrollPin</C> moves the stage into a wrapper <C>div</C>. A selector like{' '}
            <C>{'.page > .tour-stage'}</C> stops matching, and in a grid or flex parent the wrapper becomes the
            item. Style the stage by its own class.
          </>
        ),
      },
      {
        problem: 'React: “The node to be removed is not a child of this node”',
        body: (
          <>
            The pinned element is the component’s root. React removes its root from where it put it, the
            stage has moved into the wrapper, and the whole app goes blank on unmount. Pin an element inside
            your root, as <C>{'<section className="tour">'}</C> does here.
          </>
        ),
      },
      {
        problem: 'The tour is the wrong length after the phone rotates',
        body: (
          <>
            <C>pinDistance: window.innerHeight * 2</C> is a number, measured once, so it keeps the old
            screen’s height. Write <C>{"'200vh'"}</C> instead (2.20.0): it is measured as CSS measures
            vh, so a rotation re-measures it and the address bar sliding in and out does not.
          </>
        ),
      },
    ],
  },
  'scroll-counter': {
    updated: '2026-11-05',
    steps: [
      {
        title: 'Write each number three times',
        file: 'StatRow.tsx',
        body: (
          <>
            One copy for screen readers, read once and in full. One invisible copy that holds the width. And
            the copy that counts, which also starts as the real number, so search engines and anyone without
            JavaScript see the figures; the counter overwrites it when it starts. The unit sits outside the
            counting span, because <C>scrollCounter</C> replaces everything inside it.
          </>
        ),
        code: `<dd>
  <span className="stat-sr">{final}{unit}</span>
  <span className="stat-num" aria-hidden="true">
    <span className="stat-hold">{final}</span>
    <span className="stat-run">{final}</span>
    {unit}
  </span>
</dd>`,
        caption: 'three copies',
        figure: <FigThreeCopies />,
      },
      {
        title: 'Keep the row still while it counts',
        file: 'stat-row.css',
        body: (
          <>
            In most fonts digits have different widths, and a number growing from 0 to 1,284,500 gets wider
            every frame, pushing its unit along. <C>tabular-nums</C> gives every digit the same width, and the
            hidden final value, sharing a grid cell with the counting one, holds the full width from the first
            frame.
          </>
        ),
        code: `.stat-num {
  display: inline-grid;
  grid-auto-flow: column;
  font-variant-numeric: tabular-nums;
}
.stat-hold, .stat-run { grid-row: 1; grid-column: 1; }
.stat-hold { visibility: hidden; }
.stat-run { justify-self: end; }`,
        caption: 'held width',
        figure: <FigWidth />,
      },
      {
        title: 'Count it, formatted like the final value',
        file: 'StatRow.tsx',
        body: (
          <>
            <C>scrollCounter</C> calls <C>format</C> on every frame with the raw value. Give it the formatter
            that wrote the final value, so the separators and decimals hold still all the way. Use{' '}
            <C>format</C> or <C>decimals</C>, not both: <C>decimals</C> replaces <C>format</C> entirely.
          </>
        ),
        code: `const nf = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});

scrollCounter(el, { to: value, format: (n) => nf.format(n) });`,
        caption: 'raw in, formatted out',
        figure: <FigFormat />,
      },
      {
        title: 'End where the row can reach',
        file: 'StatRow.tsx',
        body: (
          <>
            The default window runs from <C>top 80%</C> to <C>top 20%</C>, and near the end of a page the
            row’s top may never get that high. In a test with 200px of footer below it, the top stopped at 69%
            of the screen and the count stopped at 419,046 of 1,284,500. End on the row’s bottom instead:{' '}
            <C>bottom 90%</C> is reached once the row is fully in view, and needs only a tenth of a screen
            below it.
          </>
        ),
        code: `scrollCounter(el, {
  to: value,
  format,
  trigger: { start: 'top bottom', end: 'bottom 90%' },
});`,
        note: (
          <>
            <C>once</C> is already on for counters, so the number stays at its final value when the reader
            scrolls back. Under reduced motion the final value is written at once.
          </>
        ),
        caption: 'a reachable end',
        figure: <FigReach />,
      },
    ],
    live: <StatRow />,
    liveLayout: 'full',
    filesIntro: (
      <>
        Two files, ready to paste into a React or Next.js project with <C>svg-scroll-draw</C> installed. The row
        below them is this exact component, running.
      </>
    ),
    htmlIntro: (
      <>
        The same row as one HTML file, with the library from a CDN. Each number’s value and decimals are data
        attributes, so adding a stat is markup only.
      </>
    ),
    pitfalls: [
      {
        problem: 'The count stops short and stays there',
        body: (
          <>
            The window’s end is a point the row never reaches. Near the bottom of a page, a row’s top can
            only rise as far as the page lets it; measured with 200px below the row, the default window
            stopped at 419,046 of 1,284,500, and <C>top 45%</C> at 1,141,778. End on the row’s bottom:{' '}
            <C>bottom 90%</C>.
          </>
        ),
      },
      {
        problem: 'The unit or icon inside the number disappears',
        body: (
          <>
            <C>scrollCounter</C> writes <C>textContent</C>, which replaces everything inside the element. Put
            the unit beside the counting span, or inside <C>format</C>.
          </>
        ),
      },
      {
        problem: 'The format function is ignored',
        body: (
          <>
            <C>decimals</C> is set as well. When it is, it replaces <C>format</C> entirely. Do the decimals in
            the formatter, as <C>Intl.NumberFormat</C> does here.
          </>
        ),
      },
      {
        problem: 'The separators change between the server and the browser',
        body: (
          <>
            <C>toLocaleString()</C> with no locale uses the machine’s, so the server writes 1,284,500 and a
            browser in Germany counts to 1.284.500, and React reports a hydration mismatch on the copies it
            rendered. Name the locale.
          </>
        ),
      },
      {
        problem: 'A screen reader reads “0”',
        body: (
          <>
            It reached the counting span mid-count. Give screen readers their own copy with the final value
            and hide the counting one with <C>aria-hidden</C>, as step 1 does.
          </>
        ),
      },
    ],
  },
  'scroll-video': {
    updated: '2026-11-05',
    steps: [
      {
        title: 'Encode the film for scrubbing',
        file: 'terminal',
        body: (
          <>
            Every scroll frame is a seek, and a seek decodes from the last keyframe. Exports usually put one
            every few seconds; for scrubbing, put one every few frames. Measured in Chromium on the same
            5-second film: with a keyframe every 3 frames no seek took longer than 7.3 ms, with one keyframe
            for the whole clip seeks took up to 53.6 ms, three frames late. <C>-an</C> drops the audio, and{' '}
            <C>-auto-alt-ref 0</C> turns off alternate reference frames, which tripled seek times when the
            Aural film was encoded.
          </>
        ),
        code: `ffmpeg -i film.mov -an -c:v libvpx -cpu-used 1 -pix_fmt yuv420p \\
  -g 3 -auto-alt-ref 0 -b:v 2400k -crf 4 -qmin 0 -qmax 26 film.webm`,
        caption: 'what a seek costs',
        figure: <FigKeyframes />,
      },
      {
        title: 'Give the scroll room to a track',
        file: 'film-scrub.css',
        body: (
          <>
            The stage is <C>position: sticky</C> inside a track four screens tall, so it stays stuck for three
            screens of scroll, and that stretch is the film. Keep the stage to exactly one screen, so nothing
            in it is ever out of reach.
          </>
        ),
        code: `.film-track { position: relative; height: 400vh; }

.film-stage {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
}`,
        caption: 'track and stage',
        figure: <FigTrack />,
      },
      {
        title: 'Measure the track, not the video',
        file: 'FilmScrub.tsx',
        body: (
          <>
            <C>scrollVideo</C> measures the video unless told otherwise, and a video in a sticky stage moves
            with the scroll, so its window comes out wrong, and a resize mid-pin measures it wrong again.{' '}
            <C>triggerElement</C> (from 2.18.0) measures the track instead: <C>top top</C> to{' '}
            <C>bottom bottom</C> is exactly the stretch the stage is stuck.
          </>
        ),
        code: `const film = scrollVideo(video.current, {
  triggerElement: track.current,
  trigger: { start: 'top top', end: 'bottom bottom' },
  onProgress: (p) => setChapter(chapterAt(p)),
});

return () => film.destroy();`,
        caption: 'which box sets the window',
        figure: <FigMeasure />,
      },
      {
        title: 'Let the film pick the words',
        file: 'FilmScrub.tsx',
        body: (
          <>
            <C>onProgress</C> reports how far through the film the reader is, 0 to 1. Give each chapter the
            point it takes over from, and show the last one that has started. The copy follows the film, so
            moving a chapter is one number.
          </>
        ),
        code: `const CHAPTERS = [
  { from: 0,    title: 'Built to be worn all day', … },
  { from: 0.45, title: 'Taken apart', … },
  { from: 0.75, title: 'The part you hear', … },
];

const chapterAt = (p) =>
  CHAPTERS.reduce((at, c, i) => (p >= c.from ? i : at), 0);`,
        note: (
          <>
            Reduced motion shows the film’s last frame, so the chapters cannot be scrolled through; the CSS
            shows all of them instead.
          </>
        ),
        caption: 'chapters on the film',
        figure: <FigChapters />,
      },
    ],
    live: <FilmScrub src="/showcase/aural-fdc4222c.webm" to={4.98} />,
    liveLayout: 'full',
    filesIntro: (
      <>
        Two files, ready to paste into a React or Next.js project with <C>svg-scroll-draw</C> installed. The
        film below them is this exact component, running on the Aural product film, which has colourway stills
        after the film in the same file, so this page passes <C>to={'{4.98}'}</C>.
      </>
    ),
    htmlIntro: (
      <>
        The same film as one HTML file. <C>scrollVideo</C> is not in the script-tag build, so this imports
        the ES module from a CDN. Serve it with <C>film.webm</C> beside it, from a server that answers Range
        requests.
      </>
    ),
    pitfalls: [
      {
        problem: 'It stutters, and worse further into the film',
        body: (
          <>
            The film has few keyframes, so each seek decodes from far back. Re-encode with a keyframe every
            few frames (<C>-g 3</C>); measured, that kept every seek under 7.3 ms against up to 53.6 ms.
          </>
        ),
      },
      {
        problem: 'It does not scrub at all once deployed',
        body: (
          <>
            The server ignores Range requests. Measured in Chromium against such a server: asked for 3 s, the
            film stayed at 0 s with nothing seekable, though the whole file had arrived. Check that the video
            comes back as <C>206 Partial Content</C> with <C>Accept-Ranges: bytes</C>.
          </>
        ),
      },
      {
        problem: 'The film runs in the wrong stretch, or jumps after a resize',
        body: (
          <>
            It is measuring the video, which moves while the stage is stuck, and a phone’s address bar
            showing or hiding is a resize. Measure the track with <C>triggerElement</C>.
          </>
        ),
      },
      {
        problem: 'A phone shows an empty box',
        body: (
          <>
            That browser cannot play the file. Check <C>{'video.canPlayType(\'video/webm; codecs="vp8"\')'}</C>{' '}
            on the oldest phone you support; if it comes back empty, add an MP4 <C>{'<source>'}</C> encoded
            with the same short keyframe interval, and a <C>poster</C> so there is a picture either way.
          </>
        ),
      },
      {
        problem: 'The stage scrolls away instead of sticking',
        body: (
          <>
            An ancestor has <C>overflow: hidden</C>, <C>auto</C> or <C>Scroll</C>, and a sticky element sticks
            inside the nearest one of those, not the page. Remove it, or use <C>overflow: clip</C>, which does
            not create one.
          </>
        ),
      },
    ],
  },
};
