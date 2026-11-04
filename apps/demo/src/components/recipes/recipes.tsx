import type { ReactNode } from 'react';
import { LogoReveal } from '@/recipes/logo-reveal/LogoReveal';
import { FigFlood, FigLayers, FigSelector, FigStagger } from './logo-figures';

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
  pitfalls: Pitfall[];
};

const C = ({ children }: { children: ReactNode }) => <code className="rc-c">{children}</code>;

export const RECIPES: Record<string, RecipeDef> = {
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
};
