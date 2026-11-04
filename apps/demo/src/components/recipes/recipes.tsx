import type { ReactNode } from 'react';
import type { RecipeSlug } from '@/recipes/slugs';
import { LogoReveal } from '@/recipes/logo-reveal/LogoReveal';
import { FeatureTour } from '@/recipes/scroll-pin/FeatureTour';
import { FigFlood, FigLayers, FigSelector, FigStagger } from './logo-figures';
import { FigPinStates, FigStage, FigThirds, FigThirdsDrawn } from './pin-figures';

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
  pinDistance: window.innerHeight * (n - 1),
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
            <C>pinDistance: window.innerHeight * 2</C> is measured once. Leave <C>pinDistance</C> out and the
            default, one viewport height, is measured again on every resize; a number you pass stays as it
            was.
          </>
        ),
      },
    ],
  },
};
