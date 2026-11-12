import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/pathedit/pathedit.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { withSource } from '@/lib/tool-export';
import { PathEditor } from '@/components/pathedit/PathEditor';
import { AnatomyFigure } from '@/components/pathedit/AnatomyFigure';
import { SAMPLES } from '@/components/pathedit/samples';
import { SLUG, TAB_COUNT } from '@/components/pathedit/code';
import {
  ARG_NAMES, COMMAND_LETTERS, COMMAND_NAMES, convertAll, parsePath, reversePath, roundPath, writeD,
} from '@/components/pathedit/path-data';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "svg path editor", "edit svg path online",
// "svg path d editor", "svg path builder". Every path quoted below is read and
// written by the editor's own functions, never typed by hand.
const TITLE = 'SVG Path Editor Online: Edit d Visually and as Text';
const DESCRIPTION =
  'Edit an SVG path’s d by dragging points and handles or typing each command. Convert to absolute or relative, round, scale, reverse, and draw it on scroll.';

const read = (d: string) => writeD(parsePath(d).segs);
const sample = (key: string) => SAMPLES.find((s) => s.key === key)!.d;

const CLOCK = sample('clock');
const CLOCK_READ = read(CLOCK);
const CLOCK_COMMANDS = parsePath(CLOCK).segs.length;
const CLOCK_ABS = writeD(convertAll(parsePath(CLOCK).segs, false));
const HEART = sample('heart');
const HEART_REVERSED = writeD(reversePath(parsePath(HEART).segs));
const DRIFT = (() => {
  // A run of relative steps rounded one by one drifts; rounded from where the path has got to, it does not.
  const d = `M0 0${' l0.4 0'.repeat(10)}`;
  const naive = parsePath(d).segs.map((s) => ({ ...s, v: s.v.map((n) => Math.round(n)) }));
  const endOf = (segs: typeof naive) => segs.reduce((x, s, i) => (i === 0 ? s.v[0] : x + s.v[0]), 0);
  return { d, naive: endOf(naive), here: endOf(roundPath(parsePath(d).segs, 0)) };
})();

const COMMAND_ROWS: { c: string; canvas: string }[] = [
  { c: 'M', canvas: 'A point. Starts a new piece (subpath); its own numbers after it are lines.' },
  { c: 'L', canvas: 'Its end point.' },
  { c: 'H', canvas: 'Its end point, which moves across only.' },
  { c: 'V', canvas: 'Its end point, which moves up and down only.' },
  { c: 'C', canvas: 'Two square control points on arms, and its end point.' },
  { c: 'S', canvas: 'One control point. The first is implied (a dashed arm): the last cubic’s second control mirrored, or the start point after any other command.' },
  { c: 'Q', canvas: 'One control point, with an arm to each end.' },
  { c: 'T', canvas: 'Its end point. The control is implied (dashed): the last quadratic’s mirrored, or the start point after any other command.' },
  { c: 'A', canvas: 'Its end point. Select it and its ellipse, centre and radii are drawn.' },
  { c: 'Z', canvas: 'Nothing to drag: a straight line back to where the piece started.' },
];

const PARSE_ROWS: { w: string; why: string }[] = [
  { w: 'M0 0 10 10 20 0', why: 'Numbers after M with no letter of their own are lines, L.' },
  { w: 'm5 5 10 0 0 10', why: 'After m they are relative lines, l. A path’s first m is read as absolute, like M.' },
  { w: 'M0 0 C1 2 3 4 5 6 7 8 9 10 11 12', why: 'Any command repeats while numbers follow: six at a time for C.' },
  { w: 'M.5.5', why: 'A second dot starts a new number.' },
  { w: 'M-1-2', why: 'So does a sign.' },
  { w: 'M1e-3 2E2', why: 'Exponents, in either case.' },
  { w: 'M0 0a1 1 0 00 1 1', why: 'An arc flag is one character, so 00 is both flags.' },
  { w: 'M0 0a10 10 0 1020 0', why: 'A flag runs into what follows: 1, 0, then 20.' },
  { w: 'M10,10L20,20', why: 'A comma may stand between numbers, one at a time, with or without spaces.' },
  { w: 'M10 10 L20', why: 'A command short of numbers is not drawn; the browser draws everything before it.' },
  { w: 'M1. 2', why: 'A dot needs a digit after it.' },
  { w: 'M10 10 Z 5 5', why: 'Z takes no numbers, so nothing after it can repeat it.' },
  { w: 'L10 10', why: 'A path has to start with M or m.' },
];

const OPS: { k: string; does: string }[] = [
  {
    k: 'Drag, type, nudge',
    does: 'Rewrites the one command, then any relative command after it whose start moved, so every other point stays where it was. A drag rounds to a tenth, a hundredth or whichever step is just under one screen pixel.',
  },
  {
    k: 'Absolute · Relative',
    does: 'Every command written the other way, or one at a time with its letter. Numbers are worked out to the decimals the path already has, so 0.1 + 0.2 comes out 0.3 and nothing moves.',
  },
  {
    k: 'Round',
    does: `Every number to the decimals chosen. Relative numbers are rounded from where the rounded path has got to, so no point ends more than half a step from where it was: ten steps of l0.4 0 end at ${DRIFT.here}, where rounding each one alone ends at ${DRIFT.naive}. A radius is never rounded to 0, which would make its arc a line.`,
  },
  {
    k: 'Move',
    does: 'Absolute numbers move; relative ones are differences already, so they stay as they are. A path’s first m moves too, being read as absolute.',
  },
  {
    k: 'Scale · Flip',
    does: 'About the box’s centre or about 0, 0. Every coordinate scales; an arc gets new radii (and a new rotation when a turned ellipse is stretched one way), and its sweep flag flips when the scale mirrors.',
  },
  {
    k: 'Reverse',
    does: 'The pieces in reverse order, each from its end to its start; a closed piece keeps its start and goes round the other way. S and T become C and Q, an arc’s sweep flips, each command keeps its case, and a move that draws nothing is dropped.',
  },
  {
    k: 'Compact',
    does: 'A letter left out where a command repeats (and L after M), no leading zeros, no space before a sign, a second dot, or after an arc flag. It reads back to the same numbers.',
  },
];

const DRAW_JS = withSource(`import { scrollDraw } from 'svg-scroll-draw';

const drawing = scrollDraw('#drawing');

// What the preview does: stop following the scroll and draw 40% of the line.
drawing.seek(0.4);`, SLUG, 'js');

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I edit an SVG path online?',
    a: 'Paste the SVG, or just the path’s d value, into the editor above. Drag a point or a control handle on the canvas, or type new numbers into the command list, and the d string updates as you go; undo and redo step back through every change. Copy the d, the whole SVG, or the code that draws it on scroll. Nothing is uploaded: the path is read in your browser.',
  },
  {
    q: 'What is the difference between uppercase and lowercase SVG path commands?',
    a: 'An uppercase command (M, L, C, A…) takes absolute coordinates, measured from the SVG’s origin. A lowercase one (m, l, c, a…) takes coordinates relative to where the previous command ended, so l10 0 means 10 to the right of the pen. Z and z are the same. One exception: when a path starts with m, that first pair is read as absolute. Click a command’s letter in the editor to switch it without moving anything.',
  },
  {
    q: 'How do I convert an SVG path to absolute or relative coordinates?',
    a: `Press Absolute or Relative in the editor: every command is rewritten the other way and the drawing does not move. The arithmetic is done to the decimals the path already uses, so no 0.30000000000000004 creeps in. The clock sample, for one, ${CLOCK} written absolute is ${CLOCK_ABS}.`,
  },
  {
    q: 'How do I reverse the direction of an SVG path?',
    a: 'Press Reverse. Each piece is rewritten from its end to its start, the pieces in the opposite order, and a closed shape keeps its start point and goes round the other way. That is what makes a line drawing animate from the other end. In svg-scroll-draw, direction: \'reverse\' is something else: it starts with the line drawn and erases it as you scroll, from the end the path finishes at.',
  },
  {
    q: 'What do the large-arc and sweep flags mean in an SVG arc?',
    a: 'Through two points there are, in general, two ellipses with the given radii and rotation, and each gives a short arc and a long one: four in all. large-arc picks the long way round (1) or the short way (0); sweep picks the direction, 1 for increasing angles, which is clockwise on screen because SVG’s y axis points down. If the radii are too small to reach from one point to the other, the browser scales them up until they just do. The flags are single characters, so a minified path may write them run together, as in a10 10 0 1020 0.',
  },
  {
    q: 'Why is part of my SVG path missing?',
    a: 'Usually an error in the d string. A browser draws the path up to the command that holds the first error and stops there, so a missing number, a stray letter or a dot with no digit after it cuts the drawing short without any message. Paste the path into the editor: it marks the character where reading stopped and draws what the browser draws. Browsers also disagree in two places: a comma right before a command letter, which Chromium and Safari skip and Firefox stops at, and an e with no digits after it, which Firefox reads past and the others stop at.',
  },
  {
    q: 'How do I move or scale an SVG path without a transform?',
    a: 'Use Move and Scale in the editor. Moving changes only the absolute numbers, since relative ones are differences already; scaling changes them all, gives arcs new radii, and flips an arc’s sweep when the scale mirrors the drawing. The path keeps its commands, so it stays as easy to edit, and nothing depends on a transform attribute that a later tool might drop.',
  },
];

const TOC = [
  { id: 'editor', label: 'The editor' },
  { id: 'commands', label: `The ${COMMAND_LETTERS.length} commands` },
  { id: 'reading', label: 'How a d string is read' },
  { id: 'operations', label: `What each operation does · ${OPS.length}` },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'svg path editor', 'edit svg path online', 'svg path d editor', 'svg path builder', 'svg path editor online',
    'svg path absolute to relative', 'reverse svg path', 'svg arc flags', 'svg path commands', 'scale svg path',
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
      name: 'SVG path editor',
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

export default function SvgPathEditorPage() {
  return (
    <SiteShell active={`/${SLUG}`} crumbs={[['SVG path editor', `/${SLUG}`]]} kicker="svg / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / svg path</span>
              <span>runs in your browser</span>
            </p>
            <h1 className="pg-title stk-title">SVG path editor</h1>
            <p className="pg-lede">
              Edit a path’s <C>d</C> on a canvas or as text. Drag its points and handles, type into any command, turn
              the whole path absolute or relative, round it, move it, scale it or reverse it, with undo all the way back.
              Then watch it draw and copy the SVG or the scroll code.
            </p>
            <div className="pg-actions">
              <a href="#editor" className="btn btn-solid" data-magnetic>Open the editor ↓</a>
              <Link href="/svg-path-viewer" className="btn" data-magnetic>SVG path viewer →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Commands read</dt><dd>{COMMAND_LETTERS.length * 2}</dd></div>
              <div><dt>Operations</dt><dd>{OPS.length}</dd></div>
              <div><dt>Code</dt><dd>{TAB_COUNT} + a page</dd></div>
              <div><dt>Library</dt><dd>{SELF.version}</dd></div>
            </dl>
          </div>
          <AnatomyFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="editor" title="Edit a path">
              <p className="stk-p">
                The sample uses every command once, absolute and relative mixed. The selected command is drawn in
                colour; its row in the list is marked. Below the editor, scrollDraw draws the path as it stands, moved
                with <C>seek()</C> instead of the page’s scroll.
              </p>
              <PathEditor version={SELF.version} />
            </Sec>

            <Sec n={2} k={`${COMMAND_LETTERS.length} commands`} id="commands" title="The commands, and what you can drag">
              <p className="stk-p">
                A <C>d</C> string is a list of commands, each a letter and its numbers. Uppercase takes absolute
                coordinates; lowercase takes them relative to where the last command ended. Each row below is one
                command as the editor shows it; for what each draws, the <Link href="/svg-path-viewer#commands">path
                viewer’s table</Link> goes through them one by one.
              </p>
              <div className="ped-scroll" tabIndex={0} role="region" aria-label="Table: each command, its numbers and its handles">
                <table className="ped-ref">
                  <thead><tr><th>Command</th><th>Takes</th><th>On the canvas</th></tr></thead>
                  <tbody>
                    {COMMAND_ROWS.map((r) => {
                      const U = r.c as (typeof COMMAND_LETTERS)[number];
                      return (
                        <tr key={r.c}>
                          <td>{r.c} / {r.c.toLowerCase()} · {COMMAND_NAMES[U]}</td>
                          <td data-k="takes" className="is-code">{ARG_NAMES[U].join(' ') || '—'}</td>
                          <td data-k="canvas">{r.canvas}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Note k="Fig. 1">
                The cubic’s two control points pull the curve toward them without lying on it. The arc names no
                centre at all: the browser finds the ellipse from the two end points, the radii and the rotation, and
                the two flags pick one of the four arcs it could draw.
              </Note>
            </Sec>

            <Sec n={3} k="The grammar" id="reading" title="How a d string is read">
              <p className="stk-p">
                Path data is terse, and browsers read it more loosely than it looks: letters can be left out, numbers
                run together, flags are single characters. The editor reads it as Chromium and Safari do, checked
                against both (and Firefox) on every form below. Each “read as” is the editor writing back what it read.
              </p>
              <div className="ped-scroll" tabIndex={0} role="region" aria-label="Table: forms of path data, and how they are read">
                <table className="ped-ref">
                  <thead><tr><th>Written</th><th>Read as</th><th>Why</th></tr></thead>
                  <tbody>
                    {PARSE_ROWS.map((r) => {
                      const p = parsePath(r.w);
                      const drawn = writeD(p.segs);
                      return (
                        <tr key={r.w}>
                          <td>{r.w}</td>
                          <td data-k="read as" className="is-code">
                            {p.error ? `${drawn || 'nothing'}, then stops at character ${p.error.at + 1}` : drawn}
                          </td>
                          <td data-k="why">{r.why}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="stk-p">
                The clock sample is written the way a minifier writes it. Read, it is {CLOCK_COMMANDS} commands, each
                with its letter back; written absolute, every number is a position on the grid.
              </p>
              <CodeBox file="clock.txt">{`${CLOCK}\n\n${CLOCK_READ}\n\n${CLOCK_ABS}`}</CodeBox>
              <Note k="Browsers differ">
                On two kinds of broken input. A comma right before a command letter (<C>L20 20,L0 0</C>): Chromium and
                Safari skip it, Firefox stops drawing there. An <C>e</C> with no digits after it (<C>L20 20e</C>):
                Chromium and Safari drop that command and stop, Firefox reads the number without the e and carries on.
                (Firefox also reads a number past about 3.4 × 10³⁸, where the others stop.) The editor reads all three
                as Chromium and Safari do, and names the first two when a path has them; the d it writes has none.
              </Note>
            </Sec>

            <Sec n={4} k={`${OPS.length} operations`} id="operations" title="What each operation does to the numbers">
              <p className="stk-p">
                Every operation leaves the path as commands, never as a transform, so it stays as easy to edit
                afterwards. And none of them moves a point it was not asked to move.
              </p>
              <div className="ped-scroll" tabIndex={0} role="region" aria-label="Table: each operation and what it does">
                <table className="ped-ref">
                  <thead><tr><th>Operation</th><th>What it does</th></tr></thead>
                  <tbody>
                    {OPS.map((o) => (
                      <tr key={o.k}><td>{o.k}</td><td data-k="does">{o.does}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="stk-p">
                The heart sample, reversed: it still starts at its bottom point, now going up the right side first,
                and each arc’s sweep flag has flipped.
              </p>
              <CodeBox file="heart.txt">{`${HEART}\n\n${HEART_REVERSED}`}</CodeBox>
              <Note k="Reverse or direction">
                To draw a line from its other end, reverse the path. scrollDraw’s <C>{"direction: 'reverse'"}</C> does
                not do that: it starts with the line drawn and takes it away as the page scrolls, from the end the
                path finishes at.
              </Note>
            </Sec>

            <Sec n={5} k="Next" id="use" title="Use it in your project">
              <p className="stk-p">
                scrollDraw measures each path with <C>getTotalLength()</C>, the length the editor shows, sets one
                dash that long and slides it into place as the drawing crosses the screen. The preview calls{' '}
                <C>seek()</C>, which stops following the scroll and draws that much of the line (0 to 1; under reduced
                motion the line is drawn whole and <C>seek()</C> does nothing).
              </p>
              <CodeBox file="seek.js">{DRAW_JS}</CodeBox>
              <div className="ped-next">
                <ToolNextStep
                  slug={SLUG}
                  api="scrollDraw"
                  docs="/docs#quick-start"
                  related={['svg-path-viewer', 'svg-shape-to-path-converter']}
                />
              </div>
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="SVG path editor questions">
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
                Drawing paths with svg-scroll-draw {SELF.version}: the <Link href="/svg-path-viewer">SVG path
                viewer</Link> to measure a path and find what stops it drawing, and the{' '}
                <Link href="/svg-shape-to-path-converter">SVG shape to path converter</Link> for a rect, circle or
                polygon that is not a path yet.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
