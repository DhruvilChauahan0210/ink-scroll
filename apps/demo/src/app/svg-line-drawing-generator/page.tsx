import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/linedraw/linedraw.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { LineDrawingGenerator } from '@/components/linedraw/LineDrawingGenerator';
import { PathLengthFigure } from '@/components/linedraw/PathLengthFigure';
import {
  DEFAULTS, DRAWABLE, EASINGS, LOOPS, OUTPUTS, OUT_NAME, SCROLL_END, SCROLL_START, fmt, plan, scrollPlan, timeline,
  writeCss, type Measured, type Settings,
} from '@/components/linedraw/generate';
import { SAMPLE } from '@/components/linedraw/sample';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "svg line drawing animation", "animated svg
// generator", "svg line animation css", "svg stroke animation". The CSS quoted
// below is written by the generator's own functions (components/linedraw/
// generate.ts), and every browser result was measured in Playwright.
const TITLE = 'SVG Line Drawing Animation Generator: CSS Stroke Animation';
const DESCRIPTION =
  'Turn any SVG into an animated line drawing: one self-contained SVG file that draws itself with CSS, no JavaScript. Set the timing, copy or download it.';

const SAMPLE_TAGS = [...SAMPLE.matchAll(new RegExp(`<(?:${DRAWABLE.join('|')})\\b([^>]*)>`, 'g'))].map(([, attrs]) => attrs);
const SAMPLE_SHAPES = SAMPLE_TAGS.length;
/** The fill-opacity of each filled shape in the sample (its root has fill="none"). */
const SAMPLE_FILLS = SAMPLE_TAGS.filter((a) => /\sfill="(?!none)/.test(a)).map((a) => Number(/fill-opacity="([\d.]+)"/.exec(a)?.[1] ?? 1));

// The generator's output for one shape, with no stagger and no fill.
const ONE: Measured = { length: 1, stroked: true, filled: false, fillOpacity: 1, nonScaling: false, pieces: 1 };
const SINGLE: Settings = { ...DEFAULTS, stagger: 0, fill: 0 };
const SINGLE_T = plan([1], SINGLE);
const SINGLE_CSS = writeCss(SINGLE_T, [ONE], SINGLE, timeline(SINGLE_T, [ONE], SINGLE), OUT_NAME, OUT_NAME);
const SCROLL_DEFAULT = scrollPlan(SAMPLE_SHAPES, true, SAMPLE_FILLS, DEFAULTS);
const SCROLL_STAGGER = SCROLL_DEFAULT.options.stagger ?? 0;

const MEASURED_WAY = `// Without pathLength: measure every shape, then animate that length.
document.querySelectorAll('#drawing path').forEach((path) => {
  const length = path.getTotalLength();
  path.style.strokeDasharray = \`\${length} \${length * 2}\`;
  path.style.strokeDashoffset = length;
});
// It needs a script, it runs only once the SVG is in the page,
// it measures again whenever a path changes, and in an <img> it cannot run.`;

const CHECKS: { k: string; seen: string; does: string }[] = [
  {
    k: 'pathLength="1" on path, line, polyline, polygon, rect, circle, ellipse',
    seen: 'All three draw every shape whole at offset 0, half at 0.5 and not at all at 1, counted in pixels against the same shape with no dash.',
    does: 'Puts pathLength="1" on every shape. Nothing is measured.',
  },
  {
    k: 'stroke-dasharray: 1 at offset 1',
    seen: 'The next dash begins exactly where the line ends. WebKit draws it: a dot at the corner of a closed, round-capped triangle. Chromium and Firefox show nothing.',
    does: 'Writes 1 2, a gap twice the line, so the next dash is far past the end in every engine.',
  },
  {
    k: 'A closed shape’s first corner',
    seen: 'While the stroke is dashed, a closed shape can lose the join where its outline starts and ends, so a mitred corner loses its tip: a polygon in all three, a rect in WebKit.',
    does: 'Drops the dash at 99.9% (stroke-dasharray: none, a step at the very end), so the corner is whole once drawn.',
  },
  {
    k: 'vector-effect="non-scaling-stroke"',
    seen: 'The dash is then measured on screen, not along the path: at offset 1 part of the line still shows. In all three.',
    does: 'Takes it off, and says so. The stroke then scales with the drawing.',
  },
  {
    k: 'The file as an <img> or CSS background',
    seen: 'The CSS animation inside runs in all three, both ways, and currentColor is black. The reduced-motion rule inside applies under the browser’s own setting in Chromium and Firefox; WebKit could not be set to it here.',
    does: 'Puts the animation and the reduced-motion rule inside the file, with no script.',
  },
  {
    k: 'scrollDraw on a shape that keeps pathLength="1"',
    seen: 'scrollDraw sets the dash to the shape’s real length, which pathLength then scales up: the line is whole from the first moment of scroll.',
    does: 'Gives the scroll version its markup without pathLength.',
  },
];

const SCROLL_MAP: { k: string; css: string; scroll: string }[] = [
  { k: 'duration', css: 'animation-duration', scroll: `None: the scroll sets the pace. The drawing starts when its top is ${SCROLL_START}% down the window and its last line lands at ${SCROLL_END}%.` },
  { k: 'stagger', css: 'animation-delay, one stagger per place in the order', scroll: `stagger, as stagger ÷ duration of the trigger window: ${fmt(DEFAULTS.stagger)}s of ${fmt(DEFAULTS.duration)}s is ${SCROLL_STAGGER}.` },
  { k: 'easing', css: 'The CSS keyword', scroll: 'The library’s easing of the same name. Its ease-in and ease-out are quadratics, close to the CSS curves; CSS ease becomes ease-out, the nearest.' },
  { k: 'order', css: 'Any: --i is each shape’s place', scroll: 'Document order only.' },
  { k: 'loop', css: 'repeat or alternate', scroll: 'Scrolling back undraws it; once: true keeps it drawn.' },
  { k: 'fill fade-in', css: 'After each line, back to its own fill-opacity', scroll: `fillOpacity: [0, 1] as each line draws, or [0, x] when every fill has the same fill-opacity x. It sets one value on every shape, so fills that differ, like the sample’s door and sun (${SAMPLE_FILLS.join(' and ')}), are left as they are.` },
  { k: 'hand-drawn', css: 'Each shape its own duration', scroll: 'Not carried over: every line gets the same stretch of scroll.' },
  { k: 'pathLength', css: 'On every shape', scroll: 'Left off: scrollDraw measures every shape itself.' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make an SVG line drawing animation?',
    a: 'Give every shape pathLength="1", set stroke-dasharray: 1 2 and animate stroke-dashoffset from 1 to 0, with an animation-delay on each shape so they draw one after another. pathLength makes every line 1 long in dash units, so one CSS rule draws them all. The generator above writes that CSS into the SVG itself, so the file draws itself with no JavaScript.',
  },
  {
    q: 'How do I animate an SVG stroke with CSS only?',
    a: 'Animate stroke-dashoffset in a CSS @keyframes rule. The stroke is cut into one dash with a long gap after it, and the offset slides the dash along: pushed back by its whole length nothing shows, at 0 the whole line does. Without pathLength you need each shape’s length from getTotalLength() in a script; with pathLength="1" every length is 1 and the CSS needs no numbers from JavaScript.',
  },
  {
    q: 'Does pathLength work on circle, rect and the other shapes?',
    a: 'Yes. pathLength="1" on path, line, polyline, polygon, rect, circle and ellipse was checked in the Chromium, Firefox and WebKit engines: each shape draws whole at offset 0, half at 0.5 and not at all at 1. Two things break it: vector-effect="non-scaling-stroke", which measures the dash on screen, and a gap no longer than the line, which in WebKit shows a dot at the end. The generator removes the first and writes a gap of 2.',
  },
  {
    q: 'Will the animation play when the SVG is used as an <img> or a background image?',
    a: 'Yes. The animation is CSS inside the file, and CSS animations run in an SVG image; a script would not. Two differences from an inline SVG: currentColor is black, because an image does not take the page’s text colour, so choose a stroke colour for a file you use that way; and the reduced-motion rule inside follows the browser’s setting, which was checked in Chromium and Firefox.',
  },
  {
    q: 'How do I make an SVG line animation loop?',
    a: 'Choose repeat or alternate under loop. repeat draws the whole drawing, holds it, clears it and draws it again; alternate undraws it in reverse, last line first. Each shape gets its own @keyframes over the whole cycle, because with one shared rule and animation-delay every line would restart on its own schedule and the drawing would never clear at once.',
  },
  {
    q: 'Why is my SVG line drawing not animating?',
    a: 'The usual reasons: the shapes have no stroke, so there is nothing to draw; a fill covers the line before it draws; vector-effect="non-scaling-stroke" is on; the stroke was set in a class or a <style> block that did not come with the SVG; or pathLength is still on the shapes when a script such as scrollDraw sets the dash itself, which draws the whole line at once. The generator warns about the first four and leaves pathLength out of its scroll version.',
  },
  {
    q: 'How do I draw the SVG on scroll instead of over time?',
    a: 'Use the Scroll version tab: the same drawing as markup without pathLength, and one scrollDraw call from svg-scroll-draw that draws each line as the page scrolls, with the same overlap as the timed version. scrollDraw measures every shape itself, so the dash is in the SVG’s own units.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'how', label: 'How pathLength draws it' },
  { id: 'browsers', label: `What the browsers do · ${CHECKS.length}` },
  { id: 'scroll', label: 'On time or on scroll' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'svg line drawing animation', 'animated svg generator', 'svg line animation css', 'svg stroke animation',
    'svg draw animation', 'stroke-dasharray animation', 'stroke-dashoffset', 'pathLength', 'animated svg',
    'svg animation without javascript',
  ],
  alternates: { canonical: '/svg-line-drawing-generator' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/svg-line-drawing-generator` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'SVG line drawing generator',
      url: `${SITE_URL}/svg-line-drawing-generator`,
      description: DESCRIPTION,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any (runs in the browser)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      isPartOf: { '@id': `${SITE_URL}/#software` },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ],
};

export default function SvgLineDrawingGeneratorPage() {
  return (
    <SiteShell
      active="/svg-line-drawing-generator"
      crumbs={[['SVG line drawing generator', '/svg-line-drawing-generator']]}
      kicker="svg / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / svg line drawing</span>
              <span>css · no javascript</span>
            </p>
            <h1 className="pg-title stk-title">SVG line drawing generator</h1>
            <p className="pg-lede">
              Paste any SVG and get it back as one self-contained file that draws itself, line by line, with CSS and no
              JavaScript. Set the timing, the order, a loop and a hand-drawn feel, watch it play, then download the file,
              copy the CSS for a page, or take the scroll version.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/svg-path-viewer" className="btn" data-magnetic>SVG path viewer →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Shapes</dt><dd>{DRAWABLE.length}</dd></div>
              <div><dt>Easings</dt><dd>{EASINGS.length}</dd></div>
              <div><dt>Loops</dt><dd>{LOOPS.length}</dd></div>
              <div><dt>Outputs</dt><dd>{OUTPUTS.length}</dd></div>
            </dl>
          </div>
          <PathLengthFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make your line drawing">
              <p className="stk-p">
                The sample is a house on a hill drawn for this page from all {DRAWABLE.length} shapes, {SAMPLE_SHAPES} of
                them, with a door and a sun whose fills fade in once their lines are drawn. The preview is the file you
                download, playing in this page. Nothing is uploaded: the SVG is read in your browser, and only its
                drawing elements and attributes are kept.
              </p>
              <LineDrawingGenerator />
            </Sec>

            <Sec n={2} k="The technique" id="how" title="How pathLength draws it">
              <p className="stk-p">
                A line drawing animates the stroke’s dash. The stroke becomes one dash with a long gap after it, and{' '}
                <C>stroke-dashoffset</C> slides the pattern along: pushed back by the whole line, nothing shows; at 0,
                all of it (fig. 1). <C>{'pathLength="1"'}</C> tells the browser to treat the shape as 1 long when it
                reads dash values, and to scale them by the shape’s real length itself. So every shape, long or short,
                takes the same numbers, and one rule draws them all. This is what the generator writes for one shape:
              </p>
              <CodeBox file="drawing.css">{SINGLE_CSS}</CodeBox>
              <p className="stk-p ldg-after">
                Before <C>pathLength</C>, the numbers came from JavaScript: each shape measured with{' '}
                <C>getTotalLength()</C> and its own dash set from the result.
              </p>
              <CodeBox file="measure.js">{MEASURED_WAY}</CodeBox>
              <Note k="Stagger">
                In a single run each shape carries its place in the order as <C>--i</C>, and <C>animation-delay</C> multiplies it by the
                stagger, so changing one number in the CSS re-times the whole drawing. A hand-drawn feel adds{' '}
                <C>--d</C>, a seeded factor on each shape’s duration. A fill fades in from <C>fill-opacity: 0</C> to its
                own value once its line is drawn. A loop gives each shape its own keyframes instead, named in{' '}
                <C>--n</C>.
              </Note>
            </Sec>

            <Sec n={3} k={`${CHECKS.length} checks`} id="browsers" title="What the browsers do">
              <p className="stk-p">
                Each of these was measured in the three engines, Chromium, Firefox and WebKit (Safari’s engine), by
                drawing the shape and counting its pixels. They are why the output looks the way it does.
              </p>
              <div className="ldg-ref-scroll" tabIndex={0} role="region" aria-label="What the browsers do">
                <table className="ldg-ref">
                  <thead><tr><th>Case</th><th>In the browsers</th><th>The generator</th></tr></thead>
                  <tbody>
                    {CHECKS.map((c) => (
                      <tr key={c.k}><td>{c.k}</td><td data-k="browsers">{c.seen}</td><td data-k="generator">{c.does}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Checked">
                On 11 November 2026 in Playwright 1.65: Chromium 158, Firefox 159 and WebKit 27.2.
              </Note>
            </Sec>

            <Sec n={4} k="Time or scroll" id="scroll" title="On time or on scroll">
              <p className="stk-p">
                The file plays over time, when it loads. To draw as the reader scrolls instead, the Scroll version tab
                gives the same drawing to <Link href="/docs">scrollDraw</Link>: each line takes a stretch of the
                scroll, and the lines overlap as they do in the CSS. Here is how each setting carries over.
              </p>
              <div className="ldg-ref-scroll" tabIndex={0} role="region" aria-label="How each setting carries over">
                <table className="ldg-ref">
                  <thead><tr><th>Setting</th><th>The CSS file</th><th>scrollDraw</th></tr></thead>
                  <tbody>
                    {SCROLL_MAP.map((r) => (
                      <tr key={r.k}><td>{r.k}</td><td data-k="css file">{r.css}</td><td data-k="scrollDraw">{r.scroll}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CodeBox file="main.js">{SCROLL_DEFAULT.code}</CodeBox>
            </Sec>

            <Sec n={5} k={`${FAQ.length} questions`} id="faq" title="Line drawing questions">
              <div className="stk-faq">
                {FAQ.map((f, i) => (
                  <div key={f.q} className="stk-q">
                    <span className="stk-q-n">Q{i + 1}</span>
                    <div>
                      <h3 className="stk-q-t">{f.q}</h3>
                      <p className="stk-p">{f.a}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="stk-p stk-more">
                Measure and check the paths first in the <Link href="/svg-path-viewer">SVG path viewer</Link>, or turn
                shapes into paths with the <Link href="/svg-shape-to-path-converter">shape to path converter</Link>. All
                of svg-scroll-draw {SELF.version}: <Link href="/docs">the docs</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
