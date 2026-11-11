import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/svg-tool/svg-tool.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { SvgPathViewer } from '@/components/svg-tool/SvgPathViewer';
import { DashFigure } from '@/components/svg-tool/DashFigure';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Bing keyword research (2026-11-11): "svg path" 526 and "svg path editor" 316
// searches in three months, with path tools among the top results.
const TITLE = 'SVG Path Viewer: Length, Commands & Draw Animation Code';
const DESCRIPTION =
  'Paste an SVG or a path’s d value: see every path’s length and commands, what stops it drawing, preview the line animation, copy the CSS or JS.';

const COMMANDS: { c: string; name: string; args: string; d: string }[] = [
  { c: 'M', name: 'Move to', args: 'x y', d: 'Lifts the pen and puts it down at x, y. Every path starts with one; a new M starts a new piece.' },
  { c: 'L', name: 'Line to', args: 'x y', d: 'A straight line to x, y.' },
  { c: 'H', name: 'Horizontal line', args: 'x', d: 'A straight line across to x, keeping y.' },
  { c: 'V', name: 'Vertical line', args: 'y', d: 'A straight line up or down to y, keeping x.' },
  { c: 'C', name: 'Cubic curve', args: 'x1 y1 x2 y2 x y', d: 'A curve to x, y, pulled toward two control points.' },
  { c: 'S', name: 'Smooth cubic', args: 'x2 y2 x y', d: 'A cubic curve whose first control point mirrors the last one, so the join is smooth.' },
  { c: 'Q', name: 'Quadratic curve', args: 'x1 y1 x y', d: 'A curve to x, y with one control point.' },
  { c: 'T', name: 'Smooth quadratic', args: 'x y', d: 'A quadratic curve whose control point mirrors the last one.' },
  { c: 'A', name: 'Arc', args: 'rx ry rotation large-arc sweep x y', d: 'Part of an ellipse to x, y: radii, a rotation in degrees, and two 0/1 flags that pick which of the four possible arcs.' },
  { c: 'Z', name: 'Close path', args: '—', d: 'A straight line back to where the piece started, joined cleanly.' },
];

const LENGTH_JS = `const path = document.querySelector('path');

// The length in the SVG's own units (its viewBox), before any transform.
const length = path.getTotalLength();

// The point at any distance along it, e.g. half way:
const { x, y } = path.getPointAtLength(length / 2);`;

const DRAW_CSS = `path {
  stroke-dasharray: 412;      /* the length: one dash as long as the path */
  stroke-dashoffset: 412;     /* pushed back by its whole length: hidden */
  animation: draw 2s ease forwards;
}

@keyframes draw {
  to { stroke-dashoffset: 0; } /* slide it into place: the line draws */
}`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is an SVG path?',
    a: 'A <path> element draws a shape from a list of commands in its d attribute: M moves the pen, L draws a line, C and Q draw curves, A draws an arc and Z closes the shape. Each command is a letter followed by numbers; a capital letter uses absolute coordinates and a lowercase one is relative to where the pen is.',
  },
  {
    q: 'How do I get the length of an SVG path?',
    a: 'Call getTotalLength() on the element in JavaScript: document.querySelector(\'path\').getTotalLength(). It works on path, line, polyline, polygon, rect, circle and ellipse, and returns the length in the SVG’s own units. The viewer above shows it for every shape you paste.',
  },
  {
    q: 'How do I animate an SVG path so it draws itself?',
    a: 'Set stroke-dasharray and stroke-dashoffset to the path’s length, then animate the offset to 0, so a single dash as long as the line slides into place. Adding pathLength="1" lets you write 1 instead of measuring. To tie the drawing to scroll instead of time, scrollDraw from svg-scroll-draw does the measuring and the scroll maths.',
  },
  {
    q: 'Why is my SVG line animation not working?',
    a: 'The usual reasons: the shape has no stroke (the drawing animates the stroke, so a fill-only icon shows nothing), a fill covers the line before it draws, the dash length is shorter than the path, or the stroke is set in a stylesheet the animation does not reach. The viewer checks each of these.',
  },
  {
    q: 'Can I edit an SVG path here?',
    a: 'No, this is a viewer and checker: it reads, measures, previews and writes the animation code. To change a shape, edit it in a drawing tool such as Figma, Illustrator or Inkscape, export the SVG, and paste it back here to check it.',
  },
  {
    q: 'Is it safe to paste my SVG here?',
    a: 'Yes. Nothing is uploaded: the SVG is read in your browser, and only drawing elements and drawing attributes are rebuilt from it, so a script, an event handler, an external image or a link inside it is left out instead of run.',
  },
];

const TOC = [
  { id: 'viewer', label: 'The viewer' },
  { id: 'draw', label: 'How a line draws itself' },
  { id: 'length', label: 'Getting the length' },
  { id: 'commands', label: `Path commands · ${COMMANDS.length}` },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'svg path', 'svg path viewer', 'svg path editor', 'svg path length', 'getTotalLength',
    'svg path commands', 'svg line animation', 'svg draw animation', 'stroke-dasharray', 'svg path animation',
  ],
  alternates: { canonical: '/svg-path-viewer' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/svg-path-viewer` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'SVG path viewer',
      url: `${SITE_URL}/svg-path-viewer`,
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

export default function SvgPathViewerPage() {
  return (
    <SiteShell active="/svg-path-viewer" crumbs={[['SVG path viewer', '/svg-path-viewer']]} kicker="svg / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / svg path</span>
              <span>runs in your browser</span>
            </p>
            <h1 className="pg-title stk-title">SVG path viewer</h1>
            <p className="pg-lede">
              Paste an SVG, or just a path’s <C>d</C> value. See every shape’s length and commands, find out what would
              stop it drawing, watch it draw, and copy the animation as CSS, JavaScript or React.
            </p>
            <div className="pg-actions">
              <a href="#viewer" className="btn btn-solid" data-magnetic>Open the viewer ↓</a>
              <Link href="/examples" className="btn" data-magnetic>Drawings on scroll →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Shapes read</dt><dd>7</dd></div>
              <div><dt>Path commands</dt><dd>{COMMANDS.length}</dd></div>
              <div><dt>Output</dt><dd>4</dd></div>
              <div><dt>Uploads</dt><dd>0</dd></div>
            </dl>
          </div>
          <DashFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="viewer" title="Paste an SVG">
              <SvgPathViewer />
            </Sec>

            <Sec n={2} k="The trick" id="draw" title="How a line draws itself">
              <p className="stk-p">
                The stroke is turned into one dash exactly as long as the path, then pushed back by that whole length,
                so nothing shows. Animating <C>stroke-dashoffset</C> to 0 slides the dash into place and the line
                appears to draw (fig. 1). It needs a stroke to animate, and the length to be right.
              </p>
              <CodeBox file="draw.css">{DRAW_CSS}</CodeBox>
              <Note k="Scroll instead of time">
                To draw as the reader scrolls rather than over two seconds, the offset follows the scroll position
                instead of a clock. <Link href="/docs">scrollDraw</Link> measures every path and does that for you.
              </Note>
            </Sec>

            <Sec n={3} k="getTotalLength()" id="length" title="Getting a path’s length">
              <p className="stk-p">
                The browser measures any shape for you. The number is in the SVG’s own units, the ones its{' '}
                <C>viewBox</C> uses, which is also what <C>stroke-dasharray</C> counts in, so the two always agree.
              </p>
              <CodeBox file="measure.js">{LENGTH_JS}</CodeBox>
            </Sec>

            <Sec n={4} k={`${COMMANDS.length} commands`} id="commands" title="SVG path commands">
              <p className="stk-p">
                A path’s <C>d</C> is a list of these. A capital letter means absolute coordinates; the lowercase letter
                (<C>m</C>, <C>l</C>, <C>c</C>…) means relative to where the pen already is.
              </p>
              <div className="sv-scroll">
                <table className="sv-cmds">
                  <thead><tr><th>Command</th><th>Name</th><th>Takes</th><th>What it draws</th></tr></thead>
                  <tbody>
                    {COMMANDS.map((c) => (
                      <tr key={c.c}><td>{c.c} / {c.c.toLowerCase()}</td><td>{c.name}</td><td>{c.args}</td><td>{c.d}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Sec>

            <Sec n={5} k={`${FAQ.length} questions`} id="faq" title="SVG path questions">
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
                Drawing on scroll with svg-scroll-draw {SELF.version}: <Link href="/docs">the docs</Link>, or the{' '}
                <Link href="/text-animation-generator">text animation generator</Link> for words instead of lines.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
