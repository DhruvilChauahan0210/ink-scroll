import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/shape2path/shape2path.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ShapeToPath } from '@/components/shape2path/ShapeToPath';
import { PathFigure } from '@/components/shape2path/PathFigure';
import {
  SHAPE_TAGS, circlePath, ellipsePath, fmt, linePath, polyPath, rectPath, type Get, type ShapeResult,
} from '@/components/shape2path/convert';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "svg shape to path", "convert circle to path",
// "svg rect to path", "ellipse to path". Every path quoted below is written by
// the converter's own functions, never typed by hand.
const TITLE = 'SVG Shape to Path Converter: Circle, Rect & Ellipse to Path';
const DESCRIPTION =
  'Convert SVG rect, circle, ellipse, line, polyline and polygon to <path> with exact arcs. Paste an SVG, watch it draw, copy the result.';

const at = (o: Record<string, number | string>): Get => (n) => (n in o ? String(o[n]) : null);
const d = (r: ShapeResult) => (r.ok ? r.d : '');

const EX = {
  circle: d(circlePath(at({ cx: 50, cy: 50, r: 40 }))),
  rect: d(rectPath(at({ x: 10, y: 10, width: 80, height: 40 }))),
  rounded: d(rectPath(at({ x: 10, y: 10, width: 80, height: 40, rx: 8 }))),
  ellipse: d(ellipsePath(at({ cx: 60, cy: 40, rx: 50, ry: 25 }))),
  line: d(linePath(at({ x1: 10, y1: 10, x2: 90, y2: 70 }))),
  polyline: d(polyPath(at({ points: '10,10 50,50 90,10' }), false)),
  polygon: d(polyPath(at({ points: '10,10 90,10 50,80' }), true)),
  morphFrom: d(circlePath(at({ cx: 100, cy: 50, r: 50 }))),
  morphTo: d(ellipsePath(at({ cx: 100, cy: 50, rx: 50, ry: 30 }))),
};
// The clamping example: 120 × 40 with rx 30, so ry is 30 too, cut to 20.
const CLAMP = { width: 120, height: 40, rx: 30 };
const CLAMPED = rectPath(at({ x: 0, y: 0, ...CLAMP }));
const CLAMP_RY = CLAMPED.ok ? fmt(Number(CLAMPED.segments.find((s) => s[0] === 'A')?.[2] ?? 0), 'exact') : '';

const SHAPES: { el: string; d: string; start: string }[] = [
  { el: '<rect>', d: 'M x y H x+w V y+h H x Z', start: 'Its top-left corner.' },
  {
    el: '<rect rx ry>',
    d: 'M x+rx y H x+w−rx A rx ry 0 0 1 x+w y+ry V y+h−ry A rx ry 0 0 1 x+w−rx y+h H x+rx A rx ry 0 0 1 x y+h−ry V y+ry A rx ry 0 0 1 x+rx y Z',
    start: 'rx along the top edge, where the top-left corner’s curve ends.',
  },
  { el: '<circle>', d: 'M cx+r cy A r r 0 1 1 cx−r cy A r r 0 1 1 cx+r cy Z', start: 'Its rightmost point.' },
  { el: '<ellipse>', d: 'M cx+rx cy A rx ry 0 1 1 cx−rx cy A rx ry 0 1 1 cx+rx cy Z', start: 'Its rightmost point.' },
  { el: '<line>', d: 'M x1 y1 L x2 y2', start: 'x1, y1.' },
  { el: '<polyline>', d: 'M x0 y0 L x1 y1 L x2 y2 …', start: 'The first point.' },
  { el: '<polygon>', d: 'M x0 y0 L x1 y1 L x2 y2 … Z', start: 'The first point; Z closes it.' },
];

const BEFORE_AFTER = `<!-- before -->
<circle cx="50" cy="50" r="40"/>
<rect x="10" y="10" width="80" height="40"/>
<rect x="10" y="10" width="80" height="40" rx="8"/>
<polygon points="10,10 90,10 50,80"/>

<!-- after -->
<path d="${EX.circle}"/>
<path d="${EX.rect}"/>
<path d="${EX.rounded}"/>
<path d="${EX.polygon}"/>`;

const CASES: { k: string; browser: string; here: string }[] = [
  { k: 'rx, no ry', browser: 'Uses rx for both radii (and ry for both when only ry is set).', here: 'The same, and says so.' },
  {
    k: 'rx > width ÷ 2',
    browser: 'Uses half the width. ry is cut to half the height on its own.',
    here: `The same: ${CLAMP.width} × ${CLAMP.height} with rx ${CLAMP.rx} has ${CLAMP.rx} × ${CLAMP_RY} corners.`,
  },
  { k: 'rx or ry 0', browser: 'Square corners.', here: 'Square corners, starting rx along the top edge as the spec says.' },
  { k: 'negative radius', browser: 'Ignored, as if it were not set.', here: 'The same.' },
  {
    k: 'width, height or r 0',
    browser: 'Draws nothing.',
    here: 'Left as it is: a path with those numbers could draw a line, or a dot with round caps.',
  },
  { k: 'mm, cm, in, pt, pc', browser: 'Converted at 96 px to the inch.', here: 'Converted the same way, into user units.' },
  { k: '%, em, vw', browser: 'Resolved from the page’s layout.', here: 'Left as it is: the layout is not here to read.' },
  { k: 'odd points', browser: 'Drops the last coordinate.', here: 'The same.' },
  {
    k: 'unreadable numbers',
    browser: 'Ignores a value it cannot read, such as width="40.", as if it were not set. Unreadable points draw nothing.',
    here: 'The same: a rect left with no width is left as it is, and so are unreadable points.',
  },
  {
    k: 'style, marker, <animate>',
    browser: 'A size in style="…", a marker on a rect, circle or ellipse (not drawn), SMIL changing r or width.',
    here: 'Left as it is: as a path it would lose the size or the animation, or gain the marker.',
  },
];

const SELECTOR_JS = `import { scrollDraw } from 'svg-scroll-draw';

// Or keep the <ellipse>: the default selector, plus ellipse.
scrollDraw('#drawing', {
  selector: 'path, polyline, line, polygon, rect, circle, ellipse',
});`;

const MORPH_JS = `// <div id="badge"><svg viewBox="0 0 200 100"><path d="${EX.morphFrom}" fill="none" stroke="currentColor"/></svg></div>

import { scrollDraw } from 'svg-scroll-draw';

// A circle and an ellipse converted with the same arcs setting share their
// commands (M A A Z), so one can morph into the other as it draws.
scrollDraw('#badge', {
  morphTo: '${EX.morphTo}',
});`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I convert an SVG circle to a path?',
    a: `Write it as two half arcs from its rightmost point: M cx+r cy A r r 0 1 1 cx−r cy A r r 0 1 1 cx+r cy Z. So <circle cx="50" cy="50" r="40"/> becomes <path d="${EX.circle}"/>. It takes two arcs because an arc that ends where it starts draws nothing. The converter above writes this for every circle you paste and keeps its other attributes.`,
  },
  {
    q: 'How do I convert an SVG rect to a path, with rounded corners?',
    a: `With square corners it is M x y H x+width V y+height H x Z. With rx and ry it is four straight sides and four quarter arcs, starting rx along the top edge: <rect x="10" y="10" width="80" height="40" rx="8"/> becomes ${EX.rounded}. If only rx is set, ry takes the same value; a radius over half its side is cut to half, as the browser does.`,
  },
  {
    q: 'How do I convert an ellipse to a path?',
    a: `The same way as a circle, with its two radii: M cx+rx cy A rx ry 0 1 1 cx−rx cy A rx ry 0 1 1 cx+rx cy Z. <ellipse cx="60" cy="40" rx="50" ry="25"/> becomes ${EX.ellipse}.`,
  },
  {
    q: 'Why does my SVG ellipse not animate with svg-scroll-draw?',
    a: "scrollDraw draws the elements its selector option matches, and the default is 'path, polyline, line, polygon, rect, circle', with no ellipse. The ellipse is left as it is, fully drawn, while the rest of the drawing animates. Convert it to a path here, or pass selector: 'path, polyline, line, polygon, rect, circle, ellipse'.",
  },
  {
    q: 'Does converting shapes to paths change how the SVG looks?',
    a: 'Not where browsers follow the spec. Each path is the outline the SVG 2 spec gives the shape, with the same fill, stroke, transform, id and class, starting at the same point and running the same way round, so dashes line up too. A few things could change it, and the converter checks for them: CSS that selects rect or circle by name or sets a size, a size in style="…", a marker (browsers draw markers on paths but not on a rect, circle or ellipse), and an animation of r, width or another attribute a path does not have. Where Chrome departs from the spec (rx="auto", or where a rect with one radius 0 starts its outline), the path matches Firefox and Safari, and the notes say so.',
  },
  {
    q: 'How do I convert a polygon or polyline to a path?',
    a: `A polyline is M to its first point, then L to each next one; a polygon is the same with Z at the end to close it. <polygon points="10,10 90,10 50,80"/> becomes ${EX.polygon}. With an odd number of coordinates the last one is dropped, as the browser does.`,
  },
  {
    q: 'Is it safe to paste my SVG here?',
    a: 'Yes. Nothing is uploaded: the SVG is read in your browser as data and never run. The previews are rebuilt from drawing elements only, so a script, an event handler or an outside link in it is left out of them, and the converted SVG you copy keeps everything else as you pasted it.',
  },
];

const TOC = [
  { id: 'converter', label: 'The converter' },
  { id: 'shapes', label: `What each shape becomes · ${SHAPE_TAGS.length}` },
  { id: 'cases', label: 'rx, ry and edge cases' },
  { id: 'why', label: 'Why paths' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'svg shape to path', 'convert circle to path', 'svg rect to path', 'ellipse to path', 'svg circle to path',
    'rect to path rounded corners', 'polygon to path', 'polyline to path', 'convert svg shapes to paths', 'svg arc path',
  ],
  alternates: { canonical: '/svg-shape-to-path-converter' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/svg-shape-to-path-converter` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'SVG shape to path converter',
      url: `${SITE_URL}/svg-shape-to-path-converter`,
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

export default function SvgShapeToPathPage() {
  return (
    <SiteShell
      active="/svg-shape-to-path-converter"
      crumbs={[['SVG shape to path converter', '/svg-shape-to-path-converter']]}
      kicker="svg / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / svg shapes</span>
              <span>runs in your browser</span>
            </p>
            <h1 className="pg-title stk-title">SVG shape to path converter</h1>
            <p className="pg-lede">
              Paste an SVG. Every rect, circle, ellipse, line, polyline and polygon becomes the{' '}
              <C>{'<path>'}</C> it is equal to, with exact arcs and the same attributes. Watch both versions draw, see
              what changed, and copy the converted SVG.
            </p>
            <div className="pg-actions">
              <a href="#converter" className="btn btn-solid" data-magnetic>Open the converter ↓</a>
              <Link href="/svg-path-viewer" className="btn" data-magnetic>SVG path viewer →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Shapes</dt><dd>{SHAPE_TAGS.length}</dd></div>
              <div><dt>Arcs per circle</dt><dd>2 or 4</dd></div>
              <div><dt>Output</dt><dd>4</dd></div>
              <div><dt>Uploads</dt><dd>0</dd></div>
            </dl>
          </div>
          <PathFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="converter" title="Convert shapes to paths">
              <p className="stk-p">
                The sample is a camera drawn from all six shapes and one path. On the left it is drawn as pasted, on the
                right converted, both by scrollDraw with its default selector: watch the shutter button, an{' '}
                <C>{'<ellipse>'}</C>, and the rounded body.
              </p>
              <ShapeToPath />
            </Sec>

            <Sec n={2} k={`${SHAPE_TAGS.length} shapes`} id="shapes" title="What each shape becomes">
              <p className="stk-p">
                The SVG 2 spec defines every basic shape as a path, and these are those paths in absolute commands,
                with a circle or an ellipse as two half arcs (the spec writes four quarter arcs, which the 4 arcs
                setting gives). Each starts where the browser starts the shape: a rect, circle or ellipse runs
                clockwise, a line or poly shape in the order of its points. So a dash animation on the path begins at
                the same point as one on the shape (fig. 1).
              </p>
              <div className="s2p-scroll" tabIndex={0} role="region" aria-label="What each shape becomes">
                <table className="s2p-ref">
                  <thead><tr><th>Shape</th><th>Path</th><th>Starts at</th></tr></thead>
                  <tbody>
                    {SHAPES.map((s) => (
                      <tr key={s.el}><td>{s.el}</td><td className="is-d">{s.d}</td><td data-k="starts at">{s.start}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CodeBox file="before-after.svg">{BEFORE_AFTER}</CodeBox>
              <Note k="Why two arcs">
                An arc that ends at its own start point draws nothing, so a whole circle needs at least two. The ends of
                a half arc are a diameter apart, so either large-arc flag gives the same half; sweep 1 runs it
                clockwise. With rounded numbers a half arc’s radius is rounded down, never up: one a hair too big for
                its diameter would swing the arc off centre, while one too small is scaled up to fit by the browser.
                The 4 arcs setting writes the spec’s own four quarter arcs, for a tool that wants a point at each
                quarter.
              </Note>
            </Sec>

            <Sec n={3} k="The rules" id="cases" title="rx, ry and the edge cases">
              <p className="stk-p">
                A rect’s corners follow a few rules that are easy to get wrong by hand, and some shapes draw nothing at
                all. The converter reads each one the way the browser does, and the note below lists where browsers
                disagree.
              </p>
              <div className="s2p-scroll" tabIndex={0} role="region" aria-label="rx, ry and the edge cases">
                <table className="s2p-ref">
                  <thead><tr><th>Case</th><th>The browser</th><th>The converter</th></tr></thead>
                  <tbody>
                    {CASES.map((c) => (
                      <tr key={c.k}><td>{c.k}</td><td data-k="browser">{c.browser}</td><td data-k="converter">{c.here}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Browsers differ">
                With <C>{'rx="5" ry="0"'}</C> Firefox and Safari start the outline 5 along the top edge and Chrome at
                the corner. With <C>{'rx="auto"'}</C> Chrome draws a rect with square corners, and an ellipse not at
                all. In points, Firefox reads a second dot (<C>50.5.5</C>) as an error and draws nothing, where Chrome
                and Safari read 50.5 and 0.5. The converter follows the spec, or Chrome and Safari for the dot, and
                says so in its notes.
              </Note>
            </Sec>

            <Sec n={4} k="The reasons" id="why" title="Why convert shapes to paths">
              <p className="stk-p">
                <b className="s2p-b">To draw every shape.</b> scrollDraw animates what its <C>selector</C> option matches, and the
                default is <C long>{"'path, polyline, line, polygon, rect, circle'"}</C>. An <C>{'<ellipse>'}</C> is
                not in it, so it sits there fully drawn while the rest of the drawing animates. As a path it draws.
              </p>
              <p className="stk-p">
                <b className="s2p-b">To measure every shape the same way.</b> scrollDraw sizes the dash of a <C>{'<rect>'}</C> as 2 ×
                (width + height), which is longer than a rounded rect’s outline, so its line is whole before the scroll
                is done. A path is measured along its curves with <C>getTotalLength()</C>. The converter’s table shows
                both numbers.
              </p>
              <p className="stk-p">
                <b className="s2p-b">To morph.</b> <C>morphTo</C> moves a path’s <C>d</C> toward another, number by number, and only
                works on a <C>{'<path>'}</C>: on a shape it does nothing. A circle and an ellipse converted with the
                same arcs setting share their commands (M A A Z), as do two polygons with as many points, so one morphs
                into the other. A rect and a circle do not, and scrollDraw warns in development.
              </p>
              <p className="stk-p">
                <b className="s2p-b">For anything that takes path data.</b> CSS <C>offset-path: path()</C>, <C>clip-path: path()</C> and
                the path attribute of SMIL’s <C>{'<animateMotion>'}</C> take a <C>d</C> string. The Path data tab
                gives just those strings.
              </p>
              <CodeBox file="morph.js">{MORPH_JS}</CodeBox>
              <CodeBox file="selector.js">{SELECTOR_JS}</CodeBox>
            </Sec>

            <Sec n={5} k={`${FAQ.length} questions`} id="faq" title="Shape to path questions">
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
                Drawing the paths on scroll with svg-scroll-draw {SELF.version}: <Link href="/docs">the docs</Link>, or
                the <Link href="/svg-path-viewer">SVG path viewer</Link> to measure and check them.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
