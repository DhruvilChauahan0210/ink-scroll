import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/morph/morph.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { withSource } from '@/lib/tool-export';
import { MorphGenerator } from '@/components/morph/MorphGenerator';
import { FIG_POINTS, PairFigure } from '@/components/morph/PairFigure';
import { DEFAULT_PAIR, PRESETS, presetOf } from '@/components/morph/shapes';
import { COMMAND_LETTERS, arcToCubics, matchShapes, parsePath, pointOn, shapeLength, toD } from '@/components/morph/path-morph';
import { NAMED } from '@/data/easing';
import { SLUG, TAB_COUNT, TRIGGER } from '@/components/morph/code';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "svg morph", "svg path morph animation",
// "morph svg on scroll", "shape morphing css". Every path quoted below is
// written by the generator's own functions, never typed by hand.
const TITLE = 'SVG Morph Generator: Shape Morphing on Scroll, JS & CSS';
const DESCRIPTION =
  'Morph one SVG shape into another as the page scrolls: pick or paste two paths, match their points, preview it live, and copy morphTo, React or CSS code.';

/** A preset pair, matched and written at 0 decimals, for the examples. */
function pair(a: string, b: string): { from: string; to: string } {
  const pa = parsePath(presetOf(a).d);
  const pb = parsePath(presetOf(b).d);
  if (!pa.ok || !pb.ok) return { from: '', to: '' };
  const m = matchShapes(pa.shape, pb.shape);
  return { from: toD(m.from, 0, m.closed), to: toD(m.to, 0, m.closed) };
}
const ICON = pair('menu', 'close');
const SQUARE_TRIANGLE = (() => {
  const pa = parsePath(presetOf('square').d);
  const pb = parsePath(presetOf('triangle').d);
  const a = pa.ok ? pa.shape[0].segs.length : 1;
  const b = pb.ok ? pb.shape[0].segs.length : 1;
  return { a, b, n: pa.ok && pb.ok ? matchShapes(pa.shape, pb.shape).counts[0] : 1 };
})();

/** How far the default pair's end shape is drawn at the end, with the dash sized to the start shape. */
const DRAWN = (() => {
  const pa = parsePath(presetOf(DEFAULT_PAIR.from).d);
  const pb = parsePath(presetOf(DEFAULT_PAIR.to).d);
  if (!pa.ok || !pb.ok) return 0;
  const m = matchShapes(pa.shape, pb.shape);
  return Math.round((shapeLength(m.from) / shapeLength(m.to)) * 100);
})();

/** The highest a named easing goes, to two decimals. */
const peak = (name: 'spring' | 'elastic') => {
  let top = 0;
  for (let i = 0; i <= 2000; i++) top = Math.max(top, NAMED[name](i / 2000));
  return top.toFixed(2);
};

/** How far a quarter-turn cubic strays from its circle, as a fraction of the radius. */
const ARC_ERROR = (() => {
  const [c] = arcToCubics(1, 0, 1, 1, 0, 0, 1, 0, 1);
  let worst = 0;
  for (let i = 0; i <= 1000; i++) {
    const [x, y] = pointOn(1, 0, c, i / 1000);
    worst = Math.max(worst, Math.abs(Math.hypot(x, y) - 1));
  }
  return worst;
})();
const CIRCLE_R = (() => {
  const r = parsePath(presetOf('circle').d);
  return r.ok ? (r.shape[0].start[0] - r.shape[0].segs[1][4]) / 2 : 0;
})();

const COMMANDS: { c: string; as: string }[] = [
  { c: 'M m', as: 'Starts a new piece. Pairs after it are lines, as the spec reads them.' },
  { c: 'L l · H h · V v', as: 'A straight cubic: its controls a third and two thirds of the way along, so it draws the same line.' },
  { c: 'C c', as: 'Kept, in absolute numbers.' },
  { c: 'S s', as: 'A cubic whose first control mirrors the one before it, or sits on the pen when the one before is not a cubic.' },
  { c: 'Q q', as: 'The cubic that draws the same curve: controls two thirds of the way from each end to the quadratic’s one.' },
  { c: 'T t', as: 'The same, with the control mirrored from the quadratic before.' },
  { c: 'A a', as: 'One cubic for each quarter turn or less, controls 4/3 · tan(θ/4) along the tangents. Radii too small to reach are scaled up, a zero radius is a line, as the spec says.' },
  { c: 'Z z', as: 'A straight cubic back to the piece’s start when the pen is elsewhere; nothing when it is there already.' },
];

const MORPHTO: { k: string; d: string }[] = [
  {
    k: 'How it moves',
    d: 'Each frame, every number in the path’s d, as it was when scrollDraw started, is moved toward the number at the same place in morphTo by the progress, and kept to 4 decimals. The letters always come from the start shape; nothing is converted or matched for you.',
  },
  {
    k: 'When they differ',
    d: 'A development build warns once, at the start: the command sequence differs, or the coordinate count does. Extra numbers in morphTo are ignored and missing ones keep their start value, so the shape never arrives.',
  },
  {
    k: 'Easing',
    d: `The morph follows the same eased progress as the line. spring rises to ${peak('spring')} and elastic to ${peak('elastic')}, so with those the shape goes past the end shape and back. seek() clamps to 0–1, which is why the preview scrolls instead.`,
  },
  {
    k: 'The line',
    d: `The dash is measured once, from the start shape, with getTotalLength(). A longer end shape is left part drawn at the end: the star above stops at ${DRAWN}% of its outline in Chromium, Firefox and WebKit. A pathLength just under the start shape’s length keeps the dash in step; stroke-dasharray: none !important keeps the line whole.`,
  },
  {
    k: 'Elements',
    d: 'A <path> only. On a rect, circle, line or polygon morphTo is skipped, and a development build says so.',
  },
  {
    k: 'Native path',
    d: 'A morph always runs on the JavaScript loop: morphTo is one of the options that keep scrollDraw off the browser’s own scroll timeline.',
  },
  {
    k: 'once',
    d: 'Holds the furthest the scroll has been. In 2.23.2 and earlier it held the eased value, so spring or elastic stopped for good on the overshoot, a shape past the end shape; 2.23.3 holds the scroll progress and eases after.',
  },
  {
    k: 'Reduced motion',
    d: 'The path is given morphTo at once, drawn whole: the end shape, no animation.',
  },
  {
    k: 'destroy()',
    d: 'Leaves the path as it last was, mid-morph. A new instance on the same element reads that frame as its start shape, so set d back first (the React wrapper rebuilds when an option changes).',
  },
];

const SUPPORT: { engine: string; t: string; k: string; s: string; smil: string }[] = [
  { engine: 'Chromium', t: 'Morphs', k: 'Morphs', s: 'Morphs', smil: 'Morphs' },
  { engine: 'Firefox', t: 'Morphs', k: 'Morphs', s: 'Morphs', smil: 'Morphs' },
  { engine: 'WebKit (Safari)', t: 'No d in CSS', k: 'No d in CSS', s: 'The timeline runs; d does not', smil: 'Morphs' },
];

const HOVER_HTML = withSource(`<button class="menu-icon" aria-label="Menu" aria-expanded="false">
  <svg viewBox="0 0 200 200" width="32" height="32" aria-hidden="true">
    <path d="${ICON.from}" fill="none" stroke="currentColor" stroke-width="14" stroke-linecap="round" />
  </svg>
</button>`, SLUG, 'html');

const HOVER_CSS = withSource(`/* Chromium and Firefox. Safari keeps the menu icon. */
.menu-icon path {
  transition: d 0.3s ease;
}
.menu-icon[aria-expanded='true'] path {
  d: path('${ICON.to}');
}
@media (prefers-reduced-motion: reduce) {
  .menu-icon path { transition: none; }
}`, SLUG, 'css');

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I morph one SVG shape into another?',
    a: 'Write both shapes as paths with the same commands in the same order and the same count of numbers, then animate between them: scrollDraw’s morphTo as the page scrolls, CSS d: path() in Chromium and Firefox, or SMIL’s <animate attributeName="d"> in every browser. Each number moves in a straight line to its partner. The generator above rewrites any two paths into that form: every command as absolute cubics, segments split until both have as many, and the end shape’s start point chosen so the points travel least.',
  },
  {
    q: 'Why does my SVG morph twist or turn inside out?',
    a: 'Every point moves to the point at the same place in the other path. When the end path starts at a different place round the shape, points cross over and the shape twists; when one runs clockwise and the other anticlockwise, it turns inside out half way. Move the end shape’s start point and direction until the points travel least. The generator’s best fit tries every start point both ways round and keeps the one with the least travel, and its points view numbers each pair so you can see what goes where.',
  },
  {
    q: 'Do both SVG paths need the same number of points?',
    a: 'For a number-for-number morph, yes. morphTo pairs numbers by position: with a different count the extras are ignored and the missing ones keep their start value, so the morph never reaches the end shape, and a development build warns. In CSS, two path() values with different commands do not interpolate at all: in Chromium and Firefox the shape flips from one to the other half way through. Split segments of the shorter path, without changing its outline, until the counts match; the generator does that for you.',
  },
  {
    q: 'How do I morph an SVG on scroll?',
    a: `With svg-scroll-draw, put the start shape in the path’s d and the end shape in morphTo: scrollDraw('#morph', { morphTo: '…' }). By default it morphs while the drawing crosses the screen. For a drawing that stays in view while it changes, make the section taller than the screen, stick the SVG inside it, and set trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' }, which is what the generator writes. Without JavaScript, a view-timeline with animation-range: contain 0% contain 100% gives the same window in Chromium and Firefox.`,
  },
  {
    q: 'Can CSS animate the SVG path d attribute?',
    a: 'As the CSS d property, in Chromium and Firefox: d: path(\'…\') can be transitioned, put in @keyframes and driven by a scroll timeline, and linear() easing past 1 carries the shape past its end. Safari has no d property in CSS, so there the path keeps its d attribute and nothing morphs. SMIL’s <animate attributeName="d"> morphs in all three, on a clock or a click rather than the scroll.',
  },
  {
    q: 'Why does the line not finish drawing when the shape morphs?',
    a: `scrollDraw measures the dash once, from the start shape. When the end shape is longer, the dash is too short for it, and at the end the rest of the outline is left undrawn: from the circle to the star here, ${DRAWN}% of the star is drawn. Give the path a pathLength just under the start shape’s length, which the generator writes when “Keep the dash in step” is on: the browser then scales the dash to whatever length the outline has. Or keep the outline whole with stroke-dasharray: none !important and let only the shape change.`,
  },
  {
    q: 'Does morphTo work on a circle or a rect?',
    a: 'No: it only changes a <path>, and on any other element it is skipped (a development build warns). Convert the shape to a path first; the SVG shape to path converter writes a circle as two arcs, which this generator turns into four cubics.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'matching', label: 'Making two paths match' },
  { id: 'morphto', label: `What morphTo does · ${MORPHTO.length}` },
  { id: 'css', label: 'Morphing with CSS' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'svg morph', 'svg path morph animation', 'morph svg on scroll', 'shape morphing css', 'svg morph generator',
    'svg shape morphing', 'css d path animation', 'svg path interpolation', 'morphTo', 'svg morph scroll animation',
  ],
  alternates: { canonical: `/${SLUG}` },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/${SLUG}` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'SVG morph generator',
      url: `${SITE_URL}/${SLUG}`,
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

export default function SvgMorphGeneratorPage() {
  return (
    <SiteShell
      active={`/${SLUG}`}
      crumbs={[['SVG morph generator', `/${SLUG}`]]}
      kicker="morph / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / svg morph</span>
              <span>runs in your browser</span>
            </p>
            <h1 className="pg-title stk-title">SVG morph generator</h1>
            <p className="pg-lede">
              Pick two shapes, or paste two paths. The generator rewrites both as the same cubic curves, numbers the
              points so you can see which goes where, turns the end shape so it does not twist, and morphs it with
              scrollDraw as you scroll. Copy the <C>morphTo</C> code, a React component, a CSS version or the pair.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/blog/scroll-path-morphing" className="btn" data-magnetic>Path morphing, explained →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Shapes</dt><dd>{PRESETS.length}</dd></div>
              <div><dt>Commands read</dt><dd>{COMMAND_LETTERS.length}</dd></div>
              <div><dt>Code</dt><dd>{TAB_COUNT}</dd></div>
              <div><dt>Library</dt><dd>{SELF.version}</dd></div>
            </dl>
          </div>
          <PairFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Morph one shape into another">
              <p className="stk-p">
                On the left, both shapes as the generator matched them: the start shape solid, the end shape dashed,
                each point numbered and joined to its partner. Point 1 is where the end shape starts; move it with the
                matching controls. On the right, scrollDraw itself, in a small box that scrolls: the drawing sticks
                inside a section four boxes tall, as the generated code has it on a page.
              </p>
              <MorphGenerator version={SELF.version} />
            </Sec>

            <Sec n={2} k="The matching" id="matching" title="How two paths are made to match">
              <p className="stk-p">
                A morph moves numbers, so the two <C>d</C> strings need the same letters in the same order and as many
                numbers. Two shapes drawn apart almost never have that. The generator gets there in three steps, none
                of which changes how either shape looks.
              </p>
              <p className="stk-p">
                <b className="mph-b">Everything as cubics.</b> Each command, absolute or relative, implicit repeats and
                packed arc flags included (<C>a5 5 0 0110 10</C> is two flags, then 10), becomes absolute cubic Béziers.
                A cubic can draw every command exactly except an arc, which it follows to within{' '}
                {(ARC_ERROR * 100).toFixed(3)}% of the radius per quarter turn: {(ARC_ERROR * CIRCLE_R).toFixed(3)} units
                on the {CIRCLE_R}-unit circle here.
              </p>
              <div className="mph-scroll" tabIndex={0} role="region" aria-label="What each command becomes">
                <table className="mph-ref">
                  <thead><tr><th>Written</th><th>Becomes</th></tr></thead>
                  <tbody>
                    {COMMANDS.map((c) => (
                      <tr key={c.c}><td>{c.c}</td><td data-k="becomes">{c.as}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="stk-p">
                <b className="mph-b">As many segments.</b> Segments are cut with de Casteljau’s construction,
                which leaves the outline where it was, until each pair of pieces has the same count. Auto picks the
                fewest that keep the points evenly spaced on both: the square’s {SQUARE_TRIANGLE.a} sides and the
                triangle’s {SQUARE_TRIANGLE.b} meet at {SQUARE_TRIANGLE.n}, {SQUARE_TRIANGLE.n / SQUARE_TRIANGLE.a} segments
                to each side of the square and {SQUARE_TRIANGLE.n / SQUARE_TRIANGLE.b} to each of the triangle’s, rather
                than at {Math.max(SQUARE_TRIANGLE.a, SQUARE_TRIANGLE.b)} with one triangle side cut in two. Pieces
                (each M) pair in order; when one shape has more, the extra ones shrink to the nearest point of the other
                shape’s outline.
              </p>
              <p className="stk-p">
                <b className="mph-b">The least travel.</b> A closed outline can start anywhere along it and run either
                way round. The generator tries every start point of the end shape, both ways, and keeps the one whose
                points travel least: that is what stops a morph twisting, or turning inside out half way. The travel
                readout says how far, on average, and the controls let you pick another.
              </p>
              <Note k="Checked">
                Every preset here, rewritten and cut into 24 segments, was drawn over the original in Chromium and both
                were sampled with <C>getPointAtLength()</C>: the two outlines agree to within a thousandth of a unit.
              </Note>
            </Sec>

            <Sec n={3} k={`${MORPHTO.length} rules`} id="morphto" title="What morphTo does with the pair">
              <p className="stk-p">
                <C>morphTo</C> is an option of scrollDraw, the same call that draws the line, so the morph and the
                drawing share one progress. This is what it does, read from the library’s source and checked in
                Chromium, Firefox and WebKit. For when to reach for it, the{' '}
                <Link href="/blog/scroll-path-morphing">post on scroll path morphing</Link> has the use cases.
              </p>
              <div className="mph-scroll" tabIndex={0} role="region" aria-label="What morphTo does">
                <table className="mph-ref">
                  <thead><tr><th>Case</th><th>What scrollDraw does</th></tr></thead>
                  <tbody>
                    {MORPHTO.map((r) => (
                      <tr key={r.k}><td>{r.k}</td><td data-k="does">{r.d}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Fig. 1">
                The {FIG_POINTS} lines in the figure are those straight paths: the circle’s points, evenly spaced, each
                going to a tip, an inner corner or the middle of an edge of the star.
              </Note>
            </Sec>

            <Sec n={4} k="Without JavaScript" id="css" title="Morphing with CSS instead">
              <p className="stk-p">
                CSS can morph a path too, as the <C>d</C> property: two <C>path()</C> values with the same commands
                interpolate number by number, the way morphTo does, so the same matched pair works. Two with different
                commands do not interpolate; the shape flips half way. The CSS only tab writes the scroll version, on a
                view timeline. Here is what each engine did with it, tested in Playwright’s Chromium, Firefox and WebKit.
              </p>
              <div className="mph-scroll" tabIndex={0} role="region" aria-label="Which engines animate d">
                <table className="mph-ref">
                  <thead><tr><th>Engine</th><th>transition: d</th><th>@keyframes d</th><th>Scroll timeline</th><th>SMIL animate d</th></tr></thead>
                  <tbody>
                    {SUPPORT.map((r) => (
                      <tr key={r.engine}>
                        <td>{r.engine}</td>
                        <td data-k="transition">{r.t}</td>
                        <td data-k="keyframes">{r.k}</td>
                        <td data-k="scroll timeline">{r.s}</td>
                        <td data-k="SMIL">{r.smil}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="stk-p">
                For a morph on a click rather than the scroll, a transition is enough: toggle the button’s{' '}
                <C>aria-expanded</C> and the CSS does the rest. The menu and close icons, matched by the generator:
                three lines become two, and the third shrinks onto a line of the cross.
              </p>
              <CodeBox file="index.html">{HOVER_HTML}</CodeBox>
              <CodeBox file="icon.css">{HOVER_CSS}</CodeBox>
              <Note k="Safari">
                Where <C>d</C> is not a CSS property, the CSS morph does nothing and the path keeps the shape in its
                attribute. scrollDraw sets the attribute itself, so its morph runs in Safari too, and so does SMIL’s{' '}
                <C>{'<animate attributeName="d">'}</C>.
              </Note>
            </Sec>

            <Sec n={5} k="Next" id="use" title="Use it in your project">
              <ToolNextStep
                slug={SLUG}
                api="scrollDraw"
                docs="/docs#visual"
                related={['svg-shape-to-path-converter', 'easing-visualizer']}
              />
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="SVG morph questions">
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
                Morphing with svg-scroll-draw {SELF.version}: <Link href="/docs#visual">morphTo in the docs</Link>, the{' '}
                <Link href="/svg-shape-to-path-converter">SVG shape to path converter</Link> for shapes that are not
                paths yet, and the <Link href="/svg-path-viewer">SVG path viewer</Link> to check a path before it morphs.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
