import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/horizontal/horizontal.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { EASING_NAMES } from '@/data/easing';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { HorizontalGenerator } from '@/components/horizontal/HorizontalGenerator';
import { TripFigure } from '@/components/horizontal/TripFigure';
import { LIB, TABS } from '@/components/horizontal/code';
import { C, Note, Sec, Toc, pad } from '@/components/stack/parts';

// Searches this answers: "horizontal scroll", "horizontal scroll section",
// "scroll horizontally on vertical scroll", "horizontal scroll animation".
// Every option, default and behaviour on the page is read from
// packages/svg-scroll-draw/src/horizontal/index.ts; the step-by-step build is
// the blog post, linked, not repeated.
const TITLE = 'Horizontal Scroll Section Generator: CSS, JS & React';
const DESCRIPTION =
  'Make a section that scrolls sideways as the page scrolls down: set panels, width, gap and scroll length, preview it, then copy HTML, CSS, JS or React.';

const OPTIONS: { k: string; def: string; d: string }[] = [
  {
    k: 'distance',
    def: 'measured',
    d: 'How far the track moves, in px. Left out, it is the track’s scrollWidth minus the width it is seen through: the sticky stage’s content box (with no stage, the scrollContainer’s width, or the window’s without its scrollbar), measured again whenever the layout changes. A number you pass is used as given.',
  },
  {
    k: 'trigger',
    def: `{ start: '${LIB.start}', end: '${LIB.end}' }`,
    d: 'The scroll window, measured on the trigger element: from its top at the window’s top to its bottom at the window’s bottom, which is the whole time the stage is pinned.',
  },
  {
    k: 'easing',
    def: `'${LIB.easing}'`,
    d: `How the movement is spread over the scroll: ${EASING_NAMES.map((n) => `'${n}'`).join(', ')}, or any function of t. linear keeps the strip in step with the scroll.`,
  },
  {
    k: 'scrollContainer',
    def: 'the window',
    d: 'A selector or an element that scrolls instead of the page, as the preview’s box does.',
  },
  {
    k: 'triggerElement',
    def: 'the stage’s parent',
    d: 'The element whose height is the scroll window. Left out, the parent of the track’s nearest position: sticky ancestor, which is the outer; with no sticky ancestor, the track itself.',
  },
  {
    k: 'respectReducedMotion',
    def: String(LIB.respectReducedMotion),
    d: 'true holds the track at its end for readers who ask for less motion. Off by default, unlike the library’s other APIs: the strip moves only as the reader scrolls, and its end state would leave every panel but the last out of reach.',
  },
  {
    k: 'onProgress',
    def: 'none',
    d: 'Called with the eased progress, 0 to 1 (past 1 with spring or elastic), on every frame while the strip is on screen. The generator’s progress bar is one line of it.',
  },
];

const MINIMAL = `/* The three boxes. */
.outer  { height: 400vh; }  /* one screen for the stage + 300vh of scroll */
.sticky { position: sticky; top: 0; height: 100vh; overflow: clip; }
.track  { display: flex; width: max-content; }`;

const CALL = `import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

// No distance, no trigger: it finds the sticky stage above the track,
// takes the scroll window from the stage's parent and measures the travel.
const strip = scrollHorizontal('.track');

strip.refresh(); // re-measure now (it already does after a resize)
strip.destroy(); // stop, and put the track's transform back`;

const COSTS: { k: string; js: string; css: string }[] = [
  { k: 'JavaScript', js: 'The svg-scroll-draw/horizontal entry, on its own.', css: 'None.' },
  {
    k: 'Each frame',
    js: 'While the strip is on screen, one requestAnimationFrame loop reads the scroll position and writes the track’s transform.',
    css: 'The browser moves the transform itself, and can do it off the main thread.',
  },
  {
    k: 'Browsers',
    js: 'All of them.',
    css: 'Where animation-timeline: view() works, Chrome and Edge 115+ and Safari 26+. Everywhere else, the fallback row.',
  },
  {
    k: 'Travel',
    js: 'Measured: the track’s width less the stage’s, again whenever the layout changes.',
    css: 'Written as translateX(calc(100cqw − 100%)): the same sum, at any width.',
  },
  {
    k: 'Easing',
    js: `Any of the ${EASING_NAMES.length} names, or a function.`,
    css: 'linear, ease-in and ease-out exactly; the rest as a linear() through the curve.',
  },
  {
    k: 'Progress',
    js: 'onProgress(p): a bar, a counter, anything.',
    css: 'A second animation on the same timeline. No callback.',
  },
  {
    k: 'Keyboard',
    js: 'A focusin handler scrolls the page to the panel.',
    css: ':has(:focus-visible) stops the slide, and the row scrolls to the panel.',
  },
  {
    k: 'Reduced motion',
    js: 'Keeps the scrub: it moves only as the reader scrolls.',
    css: 'Shows the fallback row.',
  },
];

const A11Y: { k: string; d: string }[] = [
  {
    k: 'Keyboard',
    d: 'A panel off to the side is still in the tab order, but the browser cannot bring it into view: overflow: clip stops it scrolling the stage, and overflow: hidden would let it, then leave the strip shifted. main.js listens for focusin and scrolls the page, a frame later, to the point where the strip shows that panel. The CSS-only version stops the slide while a panel has keyboard focus, so the stage turns back into a row, and the browser brings the panel into view as it does in any row that scrolls sideways. Try both with Tab in the preview.',
  },
  {
    k: 'Reduced motion',
    d: 'scrollHorizontal keeps the movement for readers who ask for less motion: respectReducedMotion is false by default, because the strip only follows the reader’s own scroll, and holding it at its end would hide every panel but the last. Set it to true only when the layout shows every panel without the transform. The CSS-only version does honour the setting, because what it falls back to is exactly that layout.',
  },
  {
    k: 'Without the script',
    d: 'The script version’s CSS pins the section only once main.js adds .is-pinned. Until then, or if the script never runs, the stage is a row with overflow-x: auto, and every panel is in reach by touch, trackpad, Shift and the wheel, or Tab.',
  },
  {
    k: 'Screen readers',
    d: 'The panels are list items in reading order, and a transform moves what is painted, not the order it is read in. The progress bar is aria-hidden: the list already says how many panels there are.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make a section scroll horizontally on vertical scroll?',
    a: 'Use three boxes. A tall outer element holds the scroll; inside it, a stage with position: sticky, top: 0, one screen tall and overflow: clip stays on screen while the outer scrolls past; inside the stage, a track with display: flex and width: max-content holds the panels in one row. As the page scrolls through the outer, move the track left with translateX, from 0 to its own width minus the stage’s. scrollHorizontal(track) from svg-scroll-draw/horizontal does the measuring and the moving, and the generator above writes the CSS.',
  },
  {
    q: 'Can I make a horizontal scroll section with CSS only?',
    a: 'Yes, where the browser has scroll-driven animations: give the outer a view-timeline, run an animation on the track along it with animation-range: contain 0% contain 100%, and end it at translateX(calc(100cqw - 100%)) with the stage as the container. Chrome and Edge have supported it since 115 and Safari since 26. Put it inside @supports (animation-timeline: view()) so every other browser keeps a plain row that scrolls sideways. The generator’s CSS only tab writes all of it.',
  },
  {
    q: 'How do I change the speed of a horizontal scroll?',
    a: 'With the outer’s height. The stage stays pinned for the outer’s height minus one screen, and the track crosses its whole travel in that scroll, so the speed is the travel divided by the scroll length. When the two are equal, a pixel of scroll moves the strip a pixel; the generator’s 1:1 setting writes that height in CSS from the panel count, width and gap. The easing changes how the speed varies along the way, not the total.',
  },
  {
    q: 'Why is my horizontal scroll section not sticking or not moving?',
    a: 'The usual causes: overflow: hidden on html or body, which makes body a scroll container the stage sticks to instead of the window (use overflow-x: clip); overflow: hidden, auto or scroll on another ancestor of the stage; an outer no taller than the screen, so there is no scroll to pin through; a track no wider than the stage, so there is no travel; or a scroll window measured on the track, which the stage pins at one screen tall, so it has no length. scrollHorizontal measures it on the stage’s parent by default for that reason.',
  },
  {
    q: 'Is a horizontal scroll section accessible?',
    a: 'It can be. Keyboard users need the strip to follow focus, because a stage with overflow: clip cannot be scrolled to a focused panel; the generated code does that in a focusin handler, or in CSS with :has(:focus-visible). For readers who ask for less motion, scrollHorizontal keeps the scrub by default (respectReducedMotion: false), since it moves only as they scroll and its end state would hide every panel but the last; the CSS version shows a sideways-scrolling row instead.',
  },
  {
    q: 'How do I add a horizontal scroll section in React or Next.js?',
    a: 'Call scrollHorizontal on the track in a useEffect and destroy() it in the cleanup, in a client component (\'use client\' in the Next.js App Router). There is no ready-made component for it in svg-scroll-draw/react; the generator’s React tab writes the whole component, with the CSS file it imports.',
  },
  {
    q: 'Can the section scroll inside a container instead of the page?',
    a: 'Yes: pass scrollContainer, a selector or an element. The scroll window is then measured against that container’s scroll position and height instead of the window’s. The preview above is exactly that: a small box with the outer, the stage and the track inside it, driven by the box’s own scroll.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'how', label: 'How scroll moves it sideways' },
  { id: 'costs', label: 'Script or CSS' },
  { id: 'a11y', label: 'Every panel in reach' },
  { id: 'options', label: `Options · ${OPTIONS.length}` },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'horizontal scroll', 'horizontal scroll section', 'scroll horizontally on vertical scroll', 'horizontal scroll animation',
    'horizontal scroll generator', 'sticky horizontal scroll', 'css horizontal scroll', 'horizontal scroll react',
    'scroll driven horizontal animation', 'gsap horizontal scroll alternative',
  ],
  alternates: { canonical: '/horizontal-scroll-generator' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/horizontal-scroll-generator` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Horizontal scroll section generator',
      url: `${SITE_URL}/horizontal-scroll-generator`,
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

export default function HorizontalScrollGeneratorPage() {
  return (
    <SiteShell
      active="/horizontal-scroll-generator"
      crumbs={[['Horizontal scroll generator', '/horizontal-scroll-generator']]}
      kicker="horizontal / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / horizontal scroll</span>
              <span>css · javascript · react</span>
            </p>
            <h1 className="pg-title stk-title">Horizontal scroll section generator</h1>
            <p className="pg-lede">
              Scroll down, move sideways. Set the panels, their width, the gap and how much scroll the trip takes,
              watch it run in a box you scroll, and copy the HTML, CSS and JavaScript, a React component, or a version
              in CSS alone.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/blog/horizontal-scroll-sections" className="btn" data-magnetic>Build one step by step →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Options</dt><dd>{OPTIONS.length}</dd></div>
              <div><dt>Easings</dt><dd>{EASING_NAMES.length}</dd></div>
              <div><dt>Code outputs</dt><dd>{TABS.length}</dd></div>
              <div><dt>Every API, gzipped</dt><dd>{SELF.gzipKb} KB</dd></div>
            </dl>
          </div>
          <TripFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Build a horizontal scroll section">
              <HorizontalGenerator />
            </Sec>

            <Sec n={2} k="The model" id="how" title="How vertical scroll moves it sideways">
              <p className="stk-p">
                Three boxes do it (fig. 1). The outer is the scroll room: one screen tall, plus the scroll the trip
                should take. The stage inside it is <C>position: sticky</C> at <C>top: 0</C> and one screen tall, so
                it stays on screen while the outer scrolls past. The track inside the stage is one row of panels, as
                wide as they are, cut off at the stage’s edges by <C>overflow: clip</C>.
              </p>
              <CodeBox file="minimal.css">{MINIMAL}</CodeBox>
              <p className="stk-p">
                <C>scrollHorizontal</C> moves the track. It walks up from the track to the nearest sticky ancestor,
                the stage, and takes the scroll window from that stage’s parent, the outer: progress 0 when the
                outer’s top reaches the window’s top, 1 when its bottom reaches the window’s bottom. Over that window
                it moves the track by <C>translateX</C> from 0 to minus the travel, the track’s width less the
                stage’s, and it measures both again when the layout changes. It always runs on the library’s
                JavaScript engine, never the browser’s scroll timeline.
              </p>
              <CodeBox file="main.js">{CALL}</CodeBox>
              <Note k="Speed">
                The stage stays pinned for the outer’s height minus one screen, and the track crosses its whole travel
                in that scroll, so the speed is travel ÷ scroll length. The 400vh above is a guess that sets the speed
                by accident; the generator’s 1:1 setting makes the scroll exactly as long as the travel.
              </Note>
              <Note k="Step by step">
                A real strip of case studies built in five steps, with the ways it goes wrong measured in a browser:{' '}
                <Link href="/blog/horizontal-scroll-sections">horizontal scroll sections without GSAP</Link>.
              </Note>
            </Sec>

            <Sec n={3} k="Two ways" id="costs" title="Script or CSS: what each costs">
              <p className="stk-p">
                The generator writes both, from the same HTML and the same fallback row. The preview runs either one:
                switch <C>preview with</C> above.
              </p>
              <div className="hz-scroll" tabIndex={0} role="region" aria-label="What each approach costs">
                <table className="hz-table">
                  <thead><tr><th scope="col">Cost</th><th scope="col">scrollHorizontal</th><th scope="col">CSS only</th></tr></thead>
                  <tbody>
                    {COSTS.map((c) => (
                      <tr key={c.k}><th scope="row">{c.k}</th><td>{c.js}</td><td>{c.css}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="stk-p">
                Take the script when the strip has to move in every browser, when something else follows its progress,
                or when it should be measured rather than written down. Take CSS when no JavaScript is the point and a
                row you scroll sideways is a good enough answer for older browsers. One limit applies to both: the 1:1
                scroll length is a <C>calc()</C> of the panel widths, so it holds for panels of a set width; for
                panels that size themselves, measure the travel and set the height from it, as the step-by-step post
                does.
              </p>
            </Sec>

            <Sec n={4} k="Accessibility" id="a11y" title="Every panel in reach">
              <p className="stk-p">
                A sideways strip hides most of its panels at any moment. Whoever reads it, by keyboard, with less
                motion, without the script or with a screen reader, must still get to all of them.
              </p>
              <div className="stk-faq">
                {A11Y.map((a, i) => (
                  <div key={a.k} className="stk-q">
                    <span className="stk-q-n">{pad(i + 1)}</span>
                    <div>
                      <h3 className="stk-q-t">{a.k}</h3>
                      <p className="stk-p">{a.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Sec>

            <Sec n={5} k={`${OPTIONS.length} options`} id="options" title="Every scrollHorizontal option">
              <div className="stk-faq">
                {OPTIONS.map((o, i) => (
                  <div key={o.k} className="stk-q">
                    <span className="stk-q-n">{pad(i + 1)}</span>
                    <div>
                      <h3 className="stk-q-t"><C>{o.k}</C></h3>
                      <p className="stk-p"><C long>{o.def}</C> by default. {o.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="stk-p">
                It returns <C>destroy()</C>, <C>refresh()</C> (re-measure now; it already does 150 ms after the window,
                the page, the track or the outer changes size), <C>seek(p)</C>, <C>pause()</C>, <C>resume()</C>,{' '}
                <C>replay()</C> and <C>getProgress()</C>.
              </p>
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Horizontal scroll questions">
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
                Built step by step: <Link href="/blog/horizontal-scroll-sections">horizontal scroll sections without
                GSAP</Link>. More scroll-driven CSS: the <Link href="/css-scroll-driven-animation-generator">CSS
                scroll-driven animation generator</Link>. All of svg-scroll-draw {SELF.version}:{' '}
                <Link href="/docs">the docs</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
