import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/snap/snap.css';
import Link from 'next/link';
import { SELF, SELF_ENTRIES } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { SnapGenerator } from '@/components/snap/SnapGenerator';
import { SnapFigure } from '@/components/snap/SnapFigure';
import { DEFAULTS, OUTPUTS, PRESETS, SNAP_DEBOUNCE_MS, SNAP_DEFAULTS, SNAP_EASINGS, TOOL_SLUG, css } from '@/components/snap/snap-code';
import { C, Note, Sec, Toc } from '@/components/stack/parts';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { withSource } from '@/lib/tool-export';

// Searches this page is for: "css scroll snap", "scroll snap generator",
// "scroll-snap-type", "css carousel scroll snap". Every CSS listing on it is
// written by the generator's own css(), and every scrollSnap default is read
// from snap-code.ts, which copies packages/svg-scroll-draw/src/snap/index.ts.
const TITLE = 'CSS Scroll Snap Generator: Carousels, Sections & Grids';
const DESCRIPTION =
  'Make CSS scroll snap: axis, mandatory or proximity, start, center or end, padding and sizes. Swipe the live preview, copy the CSS, HTML and JS.';

const PROPS: { k: string; on: string; values: string; d: string }[] = [
  {
    k: 'scroll-snap-type',
    on: 'the scroll container',
    values: 'none, or an axis (x, y, block, inline, both) then mandatory or proximity',
    d: 'Turns snapping on for that axis. With no second word it is proximity.',
  },
  {
    k: 'scroll-padding',
    on: 'the scroll container',
    values: 'a length per side: scroll-padding-inline, -block, -top…',
    d: 'Insets the snapport from the edges of the box, so items line up clear of a sticky header or a peeking edge. It adds no space. scrollIntoView() and #anchor jumps use it too.',
  },
  {
    k: 'scroll-snap-align',
    on: 'each child',
    values: 'none, start, center, end: one value for both axes, or block then inline',
    d: 'Which edge of the child lands on the snap line. none, the default, never snaps.',
  },
  {
    k: 'scroll-snap-stop',
    on: 'each child',
    values: 'normal, always',
    d: 'With always, a scroll that would pass this child stops on it, so a fast swipe cannot skip it.',
  },
  {
    k: 'scroll-margin',
    on: 'each child',
    values: 'a length per side',
    d: 'Grows the child’s snap area by that much, so it lands that far from the line without the child moving.',
  },
];

const COMPARE: { k: string; css: string; lib: string }[] = [
  {
    k: 'Needs',
    css: 'Nothing but CSS: scroll-snap-type on the box, scroll-snap-align on its children.',
    lib: `A script: svg-scroll-draw/snap, ${SELF_ENTRIES.snap} KB gzipped. Until it runs, the page scrolls freely.`,
  },
  {
    k: 'The snap motion',
    css: 'The browser’s own. No property sets its speed or its curve.',
    lib: `A glide over duration (${SNAP_DEFAULTS.duration} ms) with easing ('${SNAP_DEFAULTS.easing}'), or any function of t.`,
  },
  {
    k: 'When it snaps',
    css: 'When the scroll ends, to the snap position the browser picks: after a fast swipe that can be several items along, unless scroll-snap-stop: always.',
    lib: `${SNAP_DEBOUNCE_MS} ms after the last scroll event: to the next or previous section once the scroll passed threshold (${SNAP_DEFAULTS.threshold}) of the current one, back to it otherwise. One section per gesture.`,
  },
  {
    k: 'What lines up',
    css: 'The start, centre or end of each child, with scroll-padding and scroll-margin.',
    lib: 'Each section’s start edge, on the start of the box or the window.',
  },
  {
    k: 'Item sizes',
    css: 'Any: cards narrower than the box, mixed sizes.',
    lib: 'Sections that fill the box. Smaller ones near the end can never reach its start.',
  },
  { k: 'Axes', css: 'x, y or both.', lib: `One: direction '${SNAP_DEFAULTS.direction}' (the default) or 'horizontal'.` },
  {
    k: 'Knowing where it is',
    css: 'scrollsnapchange in Chromium browsers (version 129 on); elsewhere scrollend and your own sums.',
    lib: 'onSnap(index) after every snap, and getCurrentIndex().',
  },
  {
    k: 'Keyboard',
    css: 'The arrow keys go to the next snap position.',
    lib: 'Page Down reaches the next section. An arrow press moves too little to pass the threshold, so it glides back.',
  },
  {
    k: 'Reduced motion',
    css: 'Up to the browser.',
    lib: `Jumps straight to the section instead of gliding (respectReducedMotion, ${SNAP_DEFAULTS.respectReducedMotion} by default).`,
  },
];

const OPTIONS: { k: string; def: string; d: string }[] = [
  { k: 'direction', def: `'${SNAP_DEFAULTS.direction}'`, d: "'vertical' or 'horizontal': the axis it watches and glides along." },
  { k: 'duration', def: String(SNAP_DEFAULTS.duration), d: 'How long the glide to a section takes, in milliseconds.' },
  {
    k: 'easing',
    def: `'${SNAP_DEFAULTS.easing}'`,
    d: `The glide’s curve: ${SNAP_EASINGS.map((e) => `'${e}'`).join(', ')}, or any function of t. A name it does not know falls back to '${SNAP_DEFAULTS.easing}'.`,
  },
  {
    k: 'threshold',
    def: String(SNAP_DEFAULTS.threshold),
    d: 'How far from the current section a scroll must end to move on, as a fraction of that section’s height or width. Less glides back.',
  },
  { k: 'scrollContainer', def: 'the window', d: 'A selector or an element to snap inside, instead of the page.' },
  { k: 'onSnap', def: 'none', d: 'Called with the section’s index after each snap.' },
  {
    k: 'respectReducedMotion',
    def: String(SNAP_DEFAULTS.respectReducedMotion),
    d: 'For readers who ask their system for less motion, jump to the section instead of gliding. It still snaps.',
  },
];

// Complete files a visitor would paste, so each starts with the source line.
const CAROUSEL_CSS = withSource(css(DEFAULTS), TOOL_SLUG, 'css');

const PAGE_SNAP = withSource(`html {
  scroll-snap-type: y mandatory;
}

section {
  height: 100vh;
  scroll-snap-align: start;
}`, TOOL_SLUG, 'css');

const LIB_JS = withSource(`import { scrollSnap } from 'svg-scroll-draw/snap';

// Full-height <section>s on the page itself: no scrollContainer, so it
// snaps the window. No scroll-snap-type on html, and, for 2.23.3 and
// earlier, no scroll-behavior: smooth on it either.
const snap = scrollSnap('section', {
  duration: 800,
  easing: 'ease-out',
  onSnap: (index) => console.log('section', index),
});

// Drive it from a menu: glide to the third section.
document.querySelector('#to-pricing').addEventListener('click', () => snap.snapTo(2));

// snap.getCurrentIndex() is the section it last landed on, and
// snap.destroy() stops snapping and removes its listener.`, TOOL_SLUG, 'js');

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make a carousel with CSS scroll snap?',
    a: 'Give the row display: flex, overflow-x: auto and scroll-snap-type: x mandatory, and give each card a width (flex: 0 0 80% leaves a slice of the next one showing) and scroll-snap-align: start. A swipe, the wheel or the arrow keys then always come to rest with a card lined up. scroll-padding-inline moves the line they line up on. The carousel preset above writes all of it, with Previous and Next buttons.',
  },
  {
    q: 'What is the difference between mandatory and proximity?',
    a: 'mandatory always comes to rest on a snap position when a scroll ends. proximity snaps only when the scroll ends close to one and otherwise leaves it where it stopped; how close is up to the browser. scroll-snap-type: x on its own means x proximity, so write mandatory if every swipe should land on an item. In both, an item bigger than the box can still be scrolled through.',
  },
  {
    q: 'Why is my CSS scroll snap not working?',
    a: 'Most often scroll-snap-type is on an element that does not scroll. It belongs on the scroll container: the element with overflow: auto or scroll whose content is bigger than it, so a vertical one needs a height. Then check that each child has scroll-snap-align (its default, none, never snaps), that the axis matches the way it scrolls, and, to snap the whole page, that the snap type is on html rather than body.',
  },
  {
    q: 'How do I stop a fast swipe skipping items?',
    a: 'Give the children scroll-snap-stop: always. A scroll that would pass one stops on it instead, so a fling moves one item at a time. normal, the default, lets a fast swipe fly past several and land on a later one. Every current browser supports it.',
  },
  {
    q: 'Can I change the speed or easing of scroll snap?',
    a: `Not in CSS. The glide into place after a swipe is the browser’s own, and scroll-behavior: smooth only changes scrolls that a script or a link starts. For a snap with your own timing, scrollSnap from svg-scroll-draw/snap glides to each section over the duration (${SNAP_DEFAULTS.duration} ms by default) and with the easing you give it. The scrollSnap() mode of the generator shows it.`,
  },
  {
    q: 'How do I know which item is snapped in JavaScript?',
    a: 'In Chromium browsers (from version 129) the container fires scrollsnapchange when the snapped item changes, with event.snapTargetInline and event.snapTargetBlock. Elsewhere, wait for scrollend and find the item whose snap position equals the scroll offset, as the preview’s readout does. With scrollSnap, onSnap(index) fires after every snap.',
  },
  {
    q: 'How do I add previous and next buttons to a scroll snap carousel?',
    a: "Work out each item’s snap position (its edge minus the snap line, clamped to the scroll range) and scrollTo() the first one past the current offset, with behavior: 'smooth', or 'auto' for readers who ask for reduced motion. The generator’s snap.js does exactly that. Scrolling by one card’s width is shorter, but in our tests WebKit, Safari’s engine, did not snap a smooth scrollBy() and stopped it off by the scroll-padding.",
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'how', label: 'How scroll snap works' },
  { id: 'properties', label: `Every property · ${PROPS.length}` },
  { id: 'library', label: 'CSS or scrollSnap()' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'css scroll snap', 'scroll snap generator', 'scroll-snap-type', 'css carousel scroll snap', 'scroll-snap-align',
    'scroll-snap-stop', 'scroll-padding', 'scroll snap mandatory vs proximity', 'full page scroll snap', 'scroll snap javascript',
  ],
  alternates: { canonical: '/css-scroll-snap-generator' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/css-scroll-snap-generator` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'CSS scroll snap generator',
      url: `${SITE_URL}/css-scroll-snap-generator`,
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

export default function CssScrollSnapGeneratorPage() {
  return (
    <SiteShell
      active="/css-scroll-snap-generator"
      crumbs={[['CSS scroll snap generator', '/css-scroll-snap-generator']]}
      kicker="snap / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / css scroll snap</span>
              <span>no library needed</span>
            </p>
            <h1 className="pg-title stk-title">CSS scroll snap generator</h1>
            <p className="pg-lede">
              Pick the axis, how strict the snap is, which edge lines up, the padding and the sizes, then swipe the
              preview: it runs the CSS you copy. Take the HTML, the CSS and a few lines of JavaScript for Previous and
              Next buttons, or the same layout snapped by <C>scrollSnap()</C> with your own duration and easing.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/docs#scroll-snap" className="btn" data-magnetic>scrollSnap in the docs →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Properties</dt><dd>{PROPS.length}</dd></div>
              <div><dt>Layouts</dt><dd>{PRESETS.length}</dd></div>
              <div><dt>Files out</dt><dd>{OUTPUTS.length}</dd></div>
              <div><dt>scrollSnap</dt><dd>{SELF_ENTRIES.snap} KB</dd></div>
            </dl>
          </div>
          <SnapFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make a scroll snap container">
              <p className="stk-p">
                Start from a layout, then change anything. The hatched bands are the scroll-padding and the red line is
                the snap line; under the box, each item’s snap position along the scroll, with a marker where the box
                is now.
              </p>
              <SnapGenerator version={SELF.version} />
            </Sec>

            <Sec n={2} k="The model" id="how" title="How scroll snap works">
              <p className="stk-p">
                Two properties do the work. <C>scroll-snap-type</C> on the scroll container turns snapping on for an
                axis, and <C>scroll-snap-align</C> on each child says which of its edges should land on the snap line.
                That line is the start, centre or end of the snapport, the box’s visible area minus its{' '}
                <C>scroll-padding</C> (fig. 1). For each child the browser works out the scroll offset that puts its
                edge on the line, a snap position, clamped to what the box can actually scroll; when a scroll ends, it
                settles on one of them.
              </p>
              <CodeBox file="carousel.css">{CAROUSEL_CSS}</CodeBox>
              <Note k="Clamped">
                A position below 0 or past the end cannot be reached, so it is moved to the end it overshoots. That is
                why the first card cannot be centred, and why several items near the end can share the last position:
                the rulers in the generator show it.
              </Note>
              <Note k="The whole page">
                To snap the page itself, put the snap type on <C>html</C>, not <C>body</C>, and the alignment on
                sections as tall as the window.
              </Note>
              <CodeBox file="page.css">{PAGE_SNAP}</CodeBox>
            </Sec>

            <Sec n={3} k={`${PROPS.length} properties`} id="properties" title="Every scroll snap property">
              <p className="stk-p">
                Two go on the box that scrolls and three on its children. Each has longhands per side or per axis, such
                as <C>scroll-padding-top</C> or <C>scroll-margin-inline</C>.
              </p>
              <div className="snp-scroll" tabIndex={0} role="region" aria-label="Every scroll snap property">
                <table className="snp-ref">
                  <thead><tr><th>Property</th><th>Goes on</th><th>Values</th><th>What it does</th></tr></thead>
                  <tbody>
                    {PROPS.map((p) => (
                      <tr key={p.k}>
                        <td>{p.k}</td>
                        <td data-k="goes on">{p.on}</td>
                        <td data-k="values" className="is-code">{p.values}</td>
                        <td data-k="what it does">{p.d}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Sec>

            <Sec n={4} k="Honestly" id="library" title="CSS scroll snap or scrollSnap()">
              <p className="stk-p">
                CSS is the right default. It needs no script, it uses the browser’s own feel on touch screens, the
                arrow keys work, and it lines up any edge on either axis. svg-scroll-draw’s <C>scrollSnap</C> is for
                when the snap is part of the design: a glide of your length and curve, a threshold you choose, a
                callback when it lands, and <C>snapTo()</C> to drive it from buttons or a menu.
              </p>
              <div className="snp-scroll" tabIndex={0} role="region" aria-label="CSS scroll snap compared with scrollSnap">
                <table className="snp-ref">
                  <thead><tr><th>Aspect</th><th>CSS scroll snap</th><th>scrollSnap()</th></tr></thead>
                  <tbody>
                    {COMPARE.map((c) => (
                      <tr key={c.k}><td>{c.k}</td><td data-k="CSS scroll snap">{c.css}</td><td data-k="scrollSnap()">{c.lib}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="stk-p">
                Its options, each with its default. The instance it returns has <C>snapTo(index)</C>, which glides to a
                section (the index is kept within the sections), <C>getCurrentIndex()</C> and <C>destroy()</C>.
              </p>
              <div className="snp-scroll" tabIndex={0} role="region" aria-label="Every scrollSnap option">
                <table className="snp-ref">
                  <thead><tr><th>Option</th><th>Default</th><th>What it does</th></tr></thead>
                  <tbody>
                    {OPTIONS.map((o) => (
                      <tr key={o.k}><td>{o.k}</td><td data-k="default" className="is-code is-def">{o.def}</td><td data-k="what it does">{o.d}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CodeBox file="main.js">{LIB_JS}</CodeBox>
              <Note k="Not both">
                Do not give the container <C>scroll-snap-type</C> too: the browser would snap to its own positions
                while scrollSnap glides to its.
              </Note>
              <Note k="2.23.3 and earlier">
                Three things need working around in these versions, all fixed in 2.23.4. scrollSnap counts from the
                first section when it is made, wherever the page is, so make it with the page or box at the top: made
                further down, its first snap goes to the second section. A border on the scroll container moves every
                landing by the border’s width, so put the border on a wrapper. And it sets the scroll position every
                frame with no <C>behavior</C>, so <C>scroll-behavior: smooth</C> on the container (on <C>html</C> for
                the window) turns each frame into a glide of its own and <C>onSnap</C> fires long before it lands: keep{' '}
                <C>scroll-behavior: auto</C> there, as the generated <C>snap.css</C> does.
              </Note>
            </Sec>

            <Sec n={5} k="Next step" id="use" title="Use it in your project">
              <p className="stk-p">
                CSS scroll snap needs nothing installed: the three files are the whole of it, and the page the export
                row gives you for it loads no library. <C>scrollSnap</C> has an entry of its own,{' '}
                <C>svg-scroll-draw/snap</C>, which is not in the main entry or the script-tag build, so the scrollSnap
                page loads that entry from jsDelivr as an ES module, pinned to {SELF.version}.
              </p>
              <ToolNextStep
                slug={TOOL_SLUG}
                api="scrollSnap"
                entry="snap"
                docs="/docs#scroll-snap"
                related={['easing-visualizer', 'scroll-progress-bar-generator']}
              />
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Scroll snap questions">
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
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
