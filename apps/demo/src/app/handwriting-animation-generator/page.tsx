import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/handwriting/handwriting.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { HandwritingGenerator } from '@/components/handwriting/HandwritingGenerator';
import { HandwritingFigure } from '@/components/handwriting/HandwritingFigure';
import {
  DEFAULTS, FADE, HOLD, OUTPUTS, SCROLL_END, SCROLL_START, SLUG, buildOutput, plan, writeCss, OUT_NAME, type Settings,
} from '@/components/handwriting/code';
import { HERSHEY } from '@/components/handwriting/hershey-data';
import { FONTS } from '@/components/handwriting/layout';
import { C, Note, Sec, Toc } from '@/components/stack/parts';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { withSource } from '@/lib/tool-export';

// Searches this page is for: "handwriting animation", "signature animation
// svg", "animated signature", "text drawing animation css", "handwritten text
// animation". The CSS quoted below is written by the generator's own functions
// (components/handwriting/code.ts), from the same layout as the tool.
const TITLE = 'Handwriting Animation Generator: Animated Signature SVG';
const DESCRIPTION =
  'Type a name and get an SVG that writes itself stroke by stroke in a single-stroke font: CSS only, on scroll, or React. Free, nothing to install.';

const GLYPHS = HERSHEY.script.length;
const DEFAULT_PLAN = plan(DEFAULTS);
const ONE: Settings = { ...DEFAULTS, text: 'Ada' };
const ONE_CSS = withSource(writeCss(plan(ONE), ONE, OUT_NAME, OUT_NAME), SLUG, 'css');

/** The first two strokes of the sample's file, their path data cut short. */
const STYLE_SAMPLE = [
  '<!-- Each stroke: its own start (--at) and length of time (--for). -->',
  ...buildOutput(DEFAULTS).file.split('\n').filter((l) => l.trim().startsWith('<path')).slice(0, 2)
    .map((l) => l.trim().replace(/( d="M[\d.]+ [\d.]+L[\d.]+ [\d.]+)[^"]*"/, '$1 …"')),
].join('\n');

const TIMING: { k: string; css: string; scroll: string }[] = [
  { k: 'duration', css: 'The seconds of ink. Each stroke takes its share by length, so the pen keeps one speed: a long loop takes longer than a dot.', scroll: `None: the scroll sets the pace. The line starts when its top is ${SCROLL_START}% down the window and its last stroke lands at ${SCROLL_END}%.` },
  { k: 'letter stagger', css: 'Seconds the pen lifts between one letter and the next, added to the next letter’s --at.', scroll: 'stagger: 1, so each stroke starts as the one before it ends: the same order, an equal stretch of scroll each.' },
  { k: 'word pause', css: 'Seconds the pen lifts at a space, in place of the stagger.', scroll: 'Not carried over: every stroke gets the same stretch.' },
  { k: 'loop', css: `Write, hold ${HOLD}s, fade out over ${FADE}s, again: each stroke its own keyframes over the cycle.`, scroll: 'Scrolling back unwrites it; once: true keeps it written.' },
  { k: 'reduced motion', css: 'A media query in the file: no animation, no dash, the finished line.', scroll: 'scrollDraw shows the line written.' },
  { k: 'pathLength', css: 'pathLength="1" on every stroke, so one rule fits them all.', scroll: 'Left off: scrollDraw measures each stroke itself.' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make a handwriting animation with CSS?',
    a: 'Write the text as SVG paths that follow the pen, not as a font’s outlines, and animate each path’s stroke-dashoffset from its length to 0, one path after another. With pathLength="1" on every path the dash values are all 1, so one @keyframes rule draws any stroke, and each path only needs its own animation-delay and animation-duration. The generator above writes those paths from a single-stroke font and works out every delay from the pen’s speed.',
  },
  {
    q: 'Why does my text drawing animation draw double lines?',
    a: 'Because the font is an outline font, which is almost every font. Its letters are filled shapes, and a stroke animation follows the edge of the shape, so each line of the letter comes out as two parallel lines, the outline traced all the way round. Handwriting needs a single-stroke font, where each path is the centre line of the pen. This tool uses the Hershey fonts, made for pen plotters in the 1960s and in the public domain.',
  },
  {
    q: 'How do I animate a signature in SVG?',
    a: 'Type the name, choose the script font, and download the SVG: it carries its own CSS, so it writes itself when it loads, as an inline SVG or as an <img>. For a real scanned signature, trace it as one path per pen stroke and use the SVG line drawing generator, which times any SVG the same way.',
  },
  {
    q: 'Can the animated signature play when it scrolls into view, or with the scroll?',
    a: `The On scroll tab gives the same SVG to scrollDraw from svg-scroll-draw with stagger: 1, so the strokes write one after another as the page scrolls, starting when the line is ${SCROLL_START}% down the window, and unwrite when it scrolls back. The React tab is the same as a <ScrollDraw> component.`,
  },
  {
    q: 'Does the handwriting animation respect reduced motion?',
    a: 'Yes. The SVG file has a prefers-reduced-motion media query inside it that turns the animation off and the dash off, so the finished text shows at once; in Chromium and Firefox that holds even when the file is an <img>. The scroll version shows the text written too, because scrollDraw finishes the drawing when reduced motion is asked for.',
  },
  {
    q: 'Which characters and fonts are there?',
    a: `The ${GLYPHS} printable ASCII characters, in ${FONTS.length} fonts: ${FONTS.map(([, n]) => n).join(', ')}. Roman italic is the roman slanted. Letters with accents are written without them, curly quotes and dashes are straightened, and anything else is left out with a note.`,
  },
  {
    q: 'Can I use the generated SVG commercially?',
    a: 'Yes. The Hershey fonts were created by Dr. A. V. Hershey at the U.S. National Bureau of Standards and are in the public domain, and the code the generator writes is yours. Nothing is uploaded: the text is laid out in your browser.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'single-stroke', label: 'Why a single-stroke font' },
  { id: 'timing', label: 'How the pen is timed' },
  { id: 'scroll', label: 'On time or on scroll' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'handwriting animation', 'signature animation svg', 'animated signature', 'text drawing animation css',
    'handwritten text animation', 'svg handwriting animation', 'signature animation css', 'single stroke font',
    'hershey font', 'write on text animation',
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
      name: 'Handwriting animation generator',
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

export default function HandwritingAnimationGeneratorPage() {
  return (
    <SiteShell
      active={`/${SLUG}`}
      crumbs={[['Handwriting animation generator', `/${SLUG}`]]}
      kicker="svg / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / handwriting</span>
              <span>css · scroll · react</span>
            </p>
            <h1 className="pg-title stk-title">Handwriting animation generator</h1>
            <p className="pg-lede">
              Type a name or a short line and get an SVG that writes itself, stroke by stroke, in the order a pen
              would. The letters come from a single-stroke font, so every line is drawn once. Set the speed, the
              pauses and a loop, then download the file, take the scroll version, or copy it as React.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/svg-line-drawing-generator" className="btn" data-magnetic>SVG line drawing generator →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Fonts</dt><dd>{FONTS.length}</dd></div>
              <div><dt>Characters</dt><dd>{GLYPHS}</dd></div>
              <div><dt>Outputs</dt><dd>{OUTPUTS.length}</dd></div>
              <div><dt>Uploads</dt><dd>0</dd></div>
            </dl>
          </div>
          <HandwritingFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Write your line">
              <p className="stk-p">
                The sample is “{DEFAULTS.text}” in the script font: {DEFAULT_PLAN.laid.strokes.length} strokes
                and {DEFAULT_PLAN.laid.letters} letters, written in {DEFAULT_PLAN.run.toFixed(1)}s. The preview is the
                file you download, playing in this page. Nothing is uploaded: the text is laid out in your browser.
              </p>
              <HandwritingGenerator version={SELF.version} />
            </Sec>

            <Sec n={2} k="The font" id="single-stroke" title="Why a single-stroke font">
              <p className="stk-p">
                A line-drawing animation draws a path’s stroke. A normal font’s letter is a filled shape, and its
                path is the shape’s edge, so drawing the stroke traces round the outside of every line: the word
                comes out double (fig. 1, top). Handwriting needs paths that are the pen’s centre line, one per pen
                stroke, which is what a single-stroke font is.
              </p>
              <p className="stk-p">
                The fonts here are the Hershey fonts, drawn by Dr. A. V. Hershey at the U.S. National Bureau of
                Standards in 1967 for pen plotters, as lists of points the pen moves through. Each glyph is a few
                strokes in the order he drew them, and the script letters end where the next one starts, so a word
                joins up. Laid out left to right, the strokes are already in writing order.
              </p>
              <Note k="Credit">
                The Hershey Fonts were originally created by Dr. A. V. Hershey while working at the U. S. National
                Bureau of Standards. The format of the font data in this distribution was originally created by James
                Hurt, Cognition, Inc. The glyphs come from Kamal Mostafa’s hershey-fonts package; they are in the
                public domain.
              </Note>
            </Sec>

            <Sec n={3} k="The timing" id="timing" title="How the pen is timed">
              <p className="stk-p">
                Every stroke has <C>{'pathLength="1"'}</C>, so its dash is 1 long whatever its real length, and one
                rule draws them all: <C>stroke-dasharray: 1 2</C>, the offset from 1 to 0. What makes it handwriting is
                the timing. The pen moves at one speed, so each stroke takes time in proportion to its length; it
                lifts for the letter stagger between letters and for the word pause at a space. Each stroke carries
                its start and its length of time as two custom properties:
              </p>
              <CodeBox file="handwriting.svg">{STYLE_SAMPLE}</CodeBox>
              <p className="stk-p hwg-after">This is the whole stylesheet the generator writes for “{ONE.text}”:</p>
              <CodeBox file="handwriting.css">{ONE_CSS}</CodeBox>
              <Note k="Loop">
                With loop on, each stroke gets its own <C>@keyframes</C> over the whole cycle instead, named
                in <C>--n</C>. With one shared rule and a delay, every stroke would restart on its own schedule and
                the line would never clear at once.
              </Note>
            </Sec>

            <Sec n={4} k="Time or scroll" id="scroll" title="On time or on scroll">
              <p className="stk-p">
                The SVG file plays over time, when it loads. To write as the reader scrolls instead, the On scroll tab
                gives the same strokes to <Link href="/docs#core-options">scrollDraw</Link>, and the React tab wraps
                them in <C>{'<ScrollDraw>'}</C>. Here is how each setting carries over.
              </p>
              <div className="hwg-ref-scroll" tabIndex={0} role="region" aria-label="How each setting carries over">
                <table className="hwg-ref">
                  <thead><tr><th>Setting</th><th>The CSS file</th><th>scrollDraw</th></tr></thead>
                  <tbody>
                    {TIMING.map((r) => (
                      <tr key={r.k}><td>{r.k}</td><td data-k="css file">{r.css}</td><td data-k="scrollDraw">{r.scroll}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Sec>

            <Sec n={5} k="Next" id="use" title="Use it in your project">
              <ToolNextStep
                slug={SLUG}
                api="scrollDraw"
                docs="/docs#core-options"
                related={['svg-line-drawing-generator', 'text-animation-generator']}
              />
              <Note k="CSS only">
                The SVG file needs no package at all: only the scroll version imports scrollDraw.
              </Note>
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Handwriting animation questions">
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
                See a hand-traced signature written on scroll in the <Link href="/examples/signature">signature
                example</Link>, or read <Link href="/blog/svg-line-drawing-animation-css">how SVG line drawing works
                in CSS</Link>. All of svg-scroll-draw {SELF.version}: <Link href="/docs">the docs</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
