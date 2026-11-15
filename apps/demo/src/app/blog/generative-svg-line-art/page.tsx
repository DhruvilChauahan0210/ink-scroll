import type { Metadata } from 'next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { seoTitle } from '../../_lib/seo';
import { BlogArticle, Section, Code, Callout, Figure, Closing } from '@/components/blog/BlogArticle';
import { PlotFigure } from './PlotFigure';
import { harmonograph } from './listings/harmonograph.js';
import { flowField } from './listings/flow-field.js';

// Searches this post is for: "generative svg", "svg line art animation",
// "flow field svg", "harmonograph javascript", "pen plotter svg", "draw svg on
// scroll". The listings are files in ./listings: the page prints them from
// disk and the figures import them, so the code shown is the code that draws.
// They were run in Chromium with the built library (scratch harness): no
// console errors, each drawing still unfinished with its centre at 65% of the
// screen and finished at 45%.
const TITLE = 'Generative SVG Line Art That Draws Itself on Scroll';
const DESCRIPTION =
  'A harmonograph and a flow field in plain JavaScript, drawn stroke by stroke as the reader scrolls and timed to finish as they reach the middle of the screen.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/generative-svg-line-art';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'generative svg',
    'svg line art animation',
    'flow field svg',
    'harmonograph javascript',
    'pen plotter svg',
    'draw svg on scroll',
    'generative art javascript',
    'svg stroke animation scroll',
  ],
  alternates: { canonical: '/blog/generative-svg-line-art' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Generative SVG line art that draws itself on scroll',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-15',
  dateModified: '2026-11-15',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const listing = (file: string) =>
  readFileSync(join(process.cwd(), 'src/app/blog/generative-svg-line-art/listings', file), 'utf8').trimEnd();

// Figures quoted in the text, computed from the listings at build time.
const HARMONOGRAPH = harmonograph(34);
const H_POINTS = HARMONOGRAPH.split('L').length;
const H_KB = Math.round(HARMONOGRAPH.length / 1024);
const LINES = flowField() as [number, number][][];
const STROKES = LINES.length;
// Engines differ by a few strokes (see #seed), so the text rounds the count.
const ABOUT = Math.round(STROKES / 10) * 10;
const FLOW_POINTS = LINES.reduce((n, l) => n + l.length, 0);
const kb = (thin: number) =>
  Math.round(
    LINES.reduce(
      (n, l) => n + 1 + l.filter((_, i) => i % thin === 0 || i === l.length - 1).map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L').length,
      0,
    ) / 1024,
  );
const FLOW_KB_ALL = kb(1);
const FLOW_KB_THIRD = kb(3);

export default function Page() {
  return (
    <BlogArticle
      slug="generative-svg-line-art"
      jsonLd={articleJsonLd}
      tags={['Generative art', 'SVG', 'scrollDraw']}
      title={<>Generative SVG line art that <span className="ba-nw">draws itself</span> on scroll</>}
      lede={
        <>
          Pen plotters draw with a real pen, one stroke after another, and the drawings they are known for are made by
          code: flow fields, harmonographs, contour maps. All of them are just lines, which makes them ideal for SVG,
          and for drawing in as the reader scrolls. This post builds two of them in plain JavaScript and times the
          drawing so it finishes as the reader gets to it, not before and not after.
        </>
      }
      facts={[
        { k: 'Harmonograph', v: `1 line, ${H_POINTS.toLocaleString('en')} points` },
        { k: 'Flow field', v: `about ${ABOUT} strokes` },
        { k: 'Dependencies', v: 'svg-scroll-draw only' },
        { k: 'Seeded', v: 'same numbers everywhere' },
      ]}
      figure={
        <Figure n={1} caption="the harmonograph from this post, seed 34: one unbroken line, drawn as you scroll, done when its centre reaches the middle of the screen">
          <PlotFigure kind="harmonograph" />
        </Figure>
      }
      further={[
        { href: '/blog/svg-line-drawing-animation-css', label: 'SVG line drawing animation in CSS', blurb: 'The stroke-dash trick underneath every drawing here, without a library.' },
        { href: '/blog/scroll-animation-performance', label: 'Scroll animation performance', blurb: 'What it costs to animate hundreds of paths, measured.' },
        { href: '/blog/reduced-motion-scroll-animations', label: 'Reduced motion for scroll animations', blurb: 'What a drawing should do for readers who ask for less.' },
      ]}
    >
      <Section id="seed" k="first" title="Seed it, so the drawing stays put">
        <p>
          Generative art uses randomness, but a page should not change every time it loads. A seeded generator gives
          the same sequence of numbers for the same seed, so the drawing is the same on every visit, and on the
          server if you render it there. <code>Math.random()</code> has no seed; this is mulberry32, small and fast
          enough for art:
        </p>
        <Code file="random.js">{listing('random.js')}</Code>
        <p>Keep the seed in the code, and change it until you find a drawing you like.</p>
        <Callout k="one caveat">
          The seed fixes the random numbers, not the arithmetic. JavaScript lets <code>Math.sin</code>,{' '}
          <code>Math.cos</code> and <code>Math.atan2</code> differ in their last digits from one engine to another,
          and a drawing that follows its own lines, like the flow field below, magnifies those differences. In our
          tests the same seed gave a few strokes more or fewer in Chromium, Firefox and WebKit. Every reader with the
          same browser sees the same drawing; readers on different browsers see the same picture with a line or two
          changed. If it has to match exactly everywhere, generate it once and ship the paths.
        </Callout>
      </Section>

      <Section id="harmonograph" k="one line" title="A harmonograph: one line that spirals in">
        <p>
          A harmonograph traces two pendulums swinging at right angles while they slow down. In code that is one
          formula: x and y are each the sum of two sines, both multiplied by a factor that shrinks over time.
        </p>
        <Code file="harmonograph.js">{listing('harmonograph.js')}</Code>
        <p>
          Two details decide whether it looks drawn or computed. Frequency ratios near whole numbers (2, 3, 3, 2, each
          nudged by up to 0.02) make the figure turn slowly as it shrinks, which is where the woven look comes from.
          And the loop stops once the swing is a fifth of its start: past that point the line keeps circling the
          middle until it is a solid blot. For seed 34 that is {H_POINTS.toLocaleString('en')} points, about {H_KB} KB
          of path data.
        </p>
      </Section>

      <Section id="draw" k="scroll" title="Draw it as the reader scrolls">
        <p>Put the line in an SVG and hand it to svg-scroll-draw:</p>
        <Code file="index.html">{`<svg id="art" viewBox="0 0 1000 1000" fill="none" stroke="currentColor" stroke-width="1"></svg>

<script type="module" src="./draw-one.js"></script>`}</Code>
        <Code file="draw-one.js">{listing('draw-one.js')}</Code>
        <p>
          The trigger reads as “from when the drawing&apos;s centre is 115% of the way down the screen (its top just
          coming into view) to when its centre is at 50%”. Measuring both ends from the centre means the drawing
          finishes in the same place on a phone and on a wide screen, whatever its height. <code>linear</code> keeps
          the pen in step with the scroll: an <code>ease-out</code> puts most of the line down in the first half, and
          the drawing looks finished long before it is.
        </p>
      </Section>

      <Section id="flow-field" k="hundreds of lines" title="A flow field: lines that never touch">
        <p>
          A flow field is a direction at every point of the page. Drop a pen anywhere, let it follow the directions,
          and you get a streamline. The plotter look comes from many streamlines that run side by side and never
          cross. The trick, from Jobard and Lefer&apos;s evenly-spaced streamlines, is to start each new line one
          spacing away from an old one, and stop it before it comes closer than half a spacing to anything drawn:
        </p>
        <Code file="flow-field.js">{listing('flow-field.js')}</Code>
        <p>
          The grid is what keeps this fast: each step only checks the points in the nine cells around it, not every
          point drawn so far. With a radius of 455 and a spacing of 7 the field fills the circle with about {ABOUT}
          strokes and {Math.round(FLOW_POINTS / 1000)} thousand points.
        </p>
        <Callout k="the seam">
          The first version of this field added the swirl&apos;s angle straight onto the drift&apos;s. On the left of
          the circle <code>atan2</code> jumps from π to −π, so the summed angle jumped too, and every line crossing that
          spot turned sharply: a straight, dashed seam through the middle of the art. Blending the two as directions
          (their sines and cosines) and taking <code>atan2</code> of the sum has no jump.
        </Callout>
        <Figure n={2} caption={`the flow field above: about ${ABOUT} strokes, plotted top to bottom as you scroll, the last one landing as the drawing reaches the middle of the screen`}>
          <PlotFigure kind="flow" />
        </Figure>
      </Section>

      <Section id="timing" k="timing" title="Timing hundreds of strokes">
        <p>
          With one path, the trigger alone decides when the drawing finishes. With hundreds you want them to land one
          after another, top to bottom, the way the plotter would draw them, and that is what{' '}
          <code>stagger</code> does. But each path still draws across the whole trigger; the stagger only starts
          each one later. So the last path finishes well after the trigger ends: with a spread of one, a whole range
          later, by which point the drawing is up near the top of the screen.
        </p>
        <p>
          The fix is to end the trigger early by exactly that much. Both ends are measured from the centre, so the
          range is a fixed share of the screen and the end can be solved for directly:
        </p>
        <Code file="draw-many.js">{listing('draw-many.js')}</Code>
        <Code file="index.html">{listing('index.html')}</Code>
        <p>
          With a spread of 1, the range runs from 115% to 82.5%, the first strokes draw as the drawing comes into
          view, and the last one lands as its centre reaches the middle. In our tests the field was 46% undrawn with
          its centre at 65% of the screen and finished by 45%, in Chromium, with no console errors.
        </p>
      </Section>

      <Section id="weight" k="weight" title="What to keep off the page">
        <p>
          A drawing like this is mostly numbers. Written out in full, the field&apos;s path data is about{' '}
          {FLOW_KB_ALL} KB. Two habits keep it small:
        </p>
        <ul>
          <li>
            <strong>Fewer points.</strong> At 1.6 units a step, every third point is still smoother than the eye can
            tell, and it brings the field to about {FLOW_KB_THIRD} KB. One decimal place is plenty for a 1000-unit box.
          </li>
          <li>
            <strong>Make it in the browser.</strong> Generate the paths after the page loads, as the figures here do,
            instead of rendering them into the HTML. The markup stays small and the server does nothing, and the
            seed keeps the drawing stable from one visit to the next.
          </li>
        </ul>
        <p>
          Readers who ask the system for reduced motion get the finished drawing: svg-scroll-draw shows the end state
          and draws nothing.
        </p>
      </Section>

      <Closing
        title="Sections drawn this way"
        lede={
          <>
            <a href="https://scrollfx-ui.vercel.app">scrollfx</a> is a folio of React sections built on these drawings
            (a flow-field hero, contour maps, a hatched chart, a harmonograph call to action), each installed with the
            shadcn CLI and timed to finish as the reader reaches it.
          </>
        }
        command="npm i svg-scroll-draw"
        links={[
          { href: 'https://scrollfx-ui.vercel.app', label: 'See scrollfx →' },
          { href: '/svg-line-drawing-generator', label: 'SVG line drawing generator' },
        ]}
      />
    </BlogArticle>
  );
}
