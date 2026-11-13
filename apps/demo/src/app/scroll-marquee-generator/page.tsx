import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/marquee/marquee.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { MarqueeGenerator } from '@/components/marquee/MarqueeGenerator';
import { MarqueeFigure } from '@/components/marquee/MarqueeFigure';
import { DEFAULTS, LIB, LIMITS, SEPARATORS, SLUG, TABS, TRIGGER } from '@/components/marquee/code';
import { C, Note, Sec, Toc, pad } from '@/components/stack/parts';

// Searches this answers: "marquee on scroll", "scrolling text on scroll",
// "infinite marquee css", "text moves horizontally on scroll", "scroll
// velocity marquee". The scroll shift is scrollAnimate with a px translateX
// and a one-screen trigger; every default and behaviour quoted here is read
// from packages/svg-scroll-draw/src/animate/engine.ts (buildAnimateEngine).
const TITLE = 'Scroll Marquee Generator: Text That Moves on Scroll';
const DESCRIPTION =
  'Make rows of big text slide sideways as the page scrolls, in opposite directions, with an infinite CSS drift on top. Preview it, then copy CSS, JS or React.';

const D = DEFAULTS.distance;

const MINIMAL = `<div class="mq-row">            <!-- clips: overflow: clip -->
  <div class="mq-shift">          <!-- follows the scroll -->
    <div class="mq-track">        <!-- drifts: 0 → −50%, forever -->
      <ul class="mq-set">…</ul>
      <ul class="mq-set" aria-hidden="true">…</ul>
    </div>
  </div>
</div>`;

const CALL = `import { scrollAnimate } from 'svg-scroll-draw';

// ${D}px to the left for every screen of scroll.
scrollAnimate('.mq-shift', {
  props: { transform: ['translateX(0px)', 'translateX(-${D}px)'] },
  trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' },
  easing: 'linear',
});`;

const NATIVE = `.mq-shift {
  animation: mq-shift linear both;
  animation-timeline: view();
  /* the row's top at the window's bottom → its top at the window's top */
  animation-range: entry 0% exit 0%;
}`;

/** What the code passes to scrollAnimate, and why it is not the default. */
const OPTIONS: { k: string; def: string; set: string; d: string }[] = [
  {
    k: 'props',
    def: 'required',
    set: `{ transform: ['translateX(0px)', 'translateX(-${D}px)'] }`,
    d: 'The two ends of the shift, in px, reversed for a row that runs right. The engine interpolates each number in the first value’s unit, so both ends carry px: translateX(0) would come out unitless and be dropped.',
  },
  {
    k: 'trigger',
    def: `{ start: '${LIB.start}', end: '${LIB.end}' }`,
    set: `{ start: '${TRIGGER.start}', end: '${TRIGGER.end}' }`,
    d: 'The default window runs until the row’s bottom leaves the top, one screen plus the row’s height. Ending at the row’s top makes the window exactly one screen, so the distance is per screen, whatever the text size.',
  },
  {
    k: 'easing',
    def: `'${LIB.easing}'`,
    set: "'linear'",
    d: 'scrollAnimate eases out by default, which would slow each row down as it nears the top. Linear keeps a pixel of scroll worth the same shift everywhere.',
  },
  {
    k: 'respectReducedMotion',
    def: String(LIB.respectReducedMotion),
    set: 'left as it is',
    d: 'Under reduced motion it sets each row at its end and does not animate. The marquee’s CSS then holds the shift at none, wraps the items and hides the copy, so nothing moves and nothing is cut off.',
  },
  {
    k: 'scrollContainer',
    def: 'the window',
    set: 'only in the preview',
    d: 'A selector or an element that scrolls instead of the page. The preview passes its box, so a box’s height of scroll is one screen there.',
  },
];

const COSTS: { k: string; js: string; css: string }[] = [
  { k: 'JavaScript', js: `The main entry, ${SELF.gzipKb} KB gzipped, for one scrollAnimate per row.`, css: 'None.' },
  {
    k: 'The drift',
    js: 'The same CSS animation, with the same pause control.',
    css: 'A CSS animation on the track, run by the browser off the main thread.',
  },
  {
    k: 'The scroll shift',
    js: 'A frame loop while each row is inside its window, writing its transform; outside the window it waits for the next scroll.',
    css: 'A view() timeline: the browser moves it, no script.',
  },
  {
    k: 'Browsers',
    js: 'All of them.',
    css: 'Where animation-timeline: view() works: Chrome and Edge 115+, Safari 26+, Firefox 159+. Elsewhere the rows only drift.',
  },
  {
    k: 'Reduced motion',
    js: 'scrollAnimate stops, and the CSS holds every row still and whole.',
    css: 'No animation is declared at all.',
  },
];

const A11Y: { k: string; d: string }[] = [
  {
    k: 'A pause control',
    d: 'Anything that moves on its own for more than five seconds next to other content needs a way to stop it (WCAG 2.2.2, Pause, Stop, Hide). The generated marquee has one: a Pause motion checkbox, and a rule that pauses every drift while it is checked, using :has(), so it works with no script at all. The scroll shift is not on that list: it moves only as the reader scrolls.',
  },
  {
    k: 'Screen readers hear it once',
    d: 'Each row holds its items twice, because the loop needs a copy to slide in behind the first. The copy carries aria-hidden="true", so a screen reader reads one list per row. The separators are CSS content with empty alt text, content: "✦" / "", so they are not read either.',
  },
  {
    k: 'Reduced motion',
    d: 'For readers whose system asks for less motion, nothing moves: no drift, no scroll shift. And because a still marquee would leave most of its words outside the row, the CSS hides the copy and wraps the items onto as many lines as they need, so all of the text is there to read.',
  },
  {
    k: 'Phones',
    d: 'Each row clips with overflow: clip, so however wide the track is, the page never scrolls sideways. clip, not hidden: hidden would make the row a scroll container, and the CSS version’s view() timeline would measure against it instead of the window.',
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make text move horizontally on scroll?',
    a: `Put the text in a row with overflow: clip and move an element inside it with translateX as the page scrolls. With svg-scroll-draw that is scrollAnimate(el, { props: { transform: ['translateX(0px)', 'translateX(-${D}px)'] }, trigger: { start: 'top bottom', end: 'top top' }, easing: 'linear' }): the row slides ${D}px left over the screen of scroll it takes its top to cross the window. Swap the two values for a row that runs right. In CSS alone, run the same keyframes on animation-timeline: view() with animation-range: entry 0% exit 0%.`,
  },
  {
    q: 'How do I make an infinite marquee in CSS?',
    a: 'Put the items in the track twice, make the track width: max-content, and animate it from translateX(0) to translateX(-50%) with linear timing and an infinite count. −50% is exactly one copy, so the second copy lands where the first started and the loop has no seam. Two details keep it seamless: give each copy half a gap of padding at each end, so the gap across the seam is a whole one, and make each copy at least as wide as the row (min-width: 100cqw, with the row as a container, and justify-content: space-around), so a short list never shows the row’s end.',
  },
  {
    q: 'What is a scroll velocity marquee, and can I make one?',
    a: 'A marquee that drifts on its own and runs faster while you scroll. Two nested elements do it: the inner one drifts with a CSS animation, the outer one moves with the scroll, and their transforms add up. Scroll quickly and the outer adds a lot of movement per second; stop and only the drift is left. The generator writes exactly that, with the scroll part in either scrollAnimate or a view() timeline.',
  },
  {
    q: 'Why does my marquee jump or show a gap at the end of each loop?',
    a: 'The usual causes: the two copies are not the same width (different items, or a gap set on the track between them rather than inside each copy), the loop moves by a fixed px value that is not the copy’s width, or the content is narrower than the row, so the track ends before the loop does. Animate to −50% of a track holding two identical copies, put the gap inside each copy as padding, and give each copy a min-width of the row’s width plus any scroll shift.',
  },
  {
    q: 'Is a scrolling marquee accessible?',
    a: 'It can be. Give the drift a pause control (WCAG 2.2.2), hide the duplicated copy from screen readers with aria-hidden="true", keep the separators out of the accessibility tree, and stop all motion under prefers-reduced-motion: reduce, showing every item instead. The generated code does all four.',
  },
  {
    q: 'How do I add a scroll marquee in React or Next.js?',
    a: 'Render the rows from an array, each with its two copies (the second with aria-hidden), import the CSS, and call scrollAnimate on each row’s shift element in a useEffect, destroying the instances in the cleanup. In the Next.js App Router the file needs \'use client\'. The generator’s React tab writes the whole component, and opens it as a project in StackBlitz.',
  },
  {
    q: 'Can I still use the <marquee> tag?',
    a: 'Browsers still run it, but it is obsolete in the HTML standard: it cannot be paused, ignores reduced motion and does not follow the scroll. A CSS animation does everything it did, and the scroll-linked part on top.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'how', label: 'Two motions, one row' },
  { id: 'costs', label: 'Script or CSS' },
  { id: 'a11y', label: 'Accessible marquees' },
  { id: 'options', label: `The call · ${OPTIONS.length} options` },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'marquee on scroll', 'scroll marquee', 'scrolling text on scroll', 'infinite marquee css', 'css marquee',
    'text moves horizontally on scroll', 'scroll velocity marquee', 'marquee generator', 'react marquee', 'scrollAnimate',
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
      name: 'Scroll marquee generator',
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

export default function ScrollMarqueeGeneratorPage() {
  return (
    <SiteShell
      active={`/${SLUG}`}
      crumbs={[['Scroll marquee generator', `/${SLUG}`]]}
      kicker="marquee / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / scroll marquee</span>
              <span>css · javascript · react</span>
            </p>
            <h1 className="pg-title stk-title">Scroll marquee generator</h1>
            <p className="pg-lede">
              Rows of big text that slide sideways as the page scrolls, alternate rows the other way, with an endless
              CSS drift underneath that the scroll adds to. Set the rows, the words, how far a screen of scroll moves
              them and how fast they drift, scroll the box to watch it, and copy the HTML, CSS and JavaScript, a React
              component, or a version in CSS alone.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/horizontal-scroll-generator" className="btn" data-magnetic>A whole section sideways →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Rows</dt><dd>up to {LIMITS.rows.max}</dd></div>
              <div><dt>Separators</dt><dd>{SEPARATORS.length}</dd></div>
              <div><dt>Code outputs</dt><dd>{TABS.length}</dd></div>
              <div><dt>Library</dt><dd>{SELF.version}</dd></div>
            </dl>
          </div>
          <MarqueeFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make your scroll marquee">
              <MarqueeGenerator version={SELF.version} />
              <Note k="The preview">
                The box stands in for the window. With scrollAnimate it runs the library on each row with the box as its{' '}
                <C>scrollContainer</C>; with CSS only it runs the generated <C>view()</C> timeline, which measures against
                the nearest scroll container, the box. Either way a box’s height of scroll moves each row the distance
                you set.
              </Note>
            </Sec>

            <Sec n={2} k="The model" id="how" title="Two motions, one row">
              <p className="stk-p">
                Each row is three boxes, one inside the other. The row clips. The shift inside it follows the scroll.
                The track inside that drifts on its own, forever. Because the shift and the drift are on different
                elements, their transforms add up: scroll and the rows move faster, stop and they keep drifting.
              </p>
              <CodeBox file="one-row.html">{MINIMAL}</CodeBox>
              <p className="stk-p">
                The drift is <C>translateX(0)</C> to <C>translateX(−50%)</C> on the track, which holds the items twice:
                −50% is one copy, so when the loop restarts the second copy is exactly where the first began. The
                gap goes inside each copy as padding, half at each end, so the gap across the seam is the same as
                the gaps between items.
              </p>
              <p className="stk-p">
                The shift is a px <C>translateX</C> spread over one screen of scroll: from the row’s top at the
                window’s bottom to its top at the window’s top (fig. 1). Rows that run left go from 0 to −distance;
                rows that run right from −distance back to 0. Both stay between −distance and 0, and each copy is at
                least the row’s width plus the distance, <C long>min-width: calc(100cqw + distance)</C>, so neither
                motion ever shows the row’s empty end.
              </p>
              <CodeBox file="main.js">{CALL}</CodeBox>
              <p className="stk-p">The same window in CSS, on the browser’s scroll timeline:</p>
              <CodeBox file="marquee.css">{NATIVE}</CodeBox>
              <Note k="Why not scrollParallax">
                <C>scrollParallax</C> with <C>axis: &apos;x&apos;</C> moves an element a share of its own width, and the
                track’s width is whatever its copies add up to. A marquee wants a distance you choose in px for a
                screen of scroll, which is <C>scrollAnimate</C> with a px transform and a one-screen trigger.
              </Note>
            </Sec>

            <Sec n={3} k="Two ways" id="costs" title="Script or CSS: what each costs">
              <p className="stk-p">
                The generator writes both, from the same HTML. The drift and the pause control are CSS in both; the
                difference is what moves the rows with the scroll. The preview runs either one: switch{' '}
                <C>preview with</C> above.
              </p>
              <div className="mqg-scroll" tabIndex={0} role="region" aria-label="What each approach costs">
                <table className="mqg-table">
                  <thead><tr><th scope="col">Cost</th><th scope="col">scrollAnimate</th><th scope="col">CSS only</th></tr></thead>
                  <tbody>
                    {COSTS.map((c) => (
                      <tr key={c.k}><th scope="row">{c.k}</th><td>{c.js}</td><td>{c.css}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="stk-p">
                Take the script when the rows must follow the scroll in every browser. Take CSS when no JavaScript is
                the point and rows that only drift are a good enough answer where scroll timelines are missing.
              </p>
            </Sec>

            <Sec n={4} k="Accessibility" id="a11y" title="A marquee everyone can read">
              <p className="stk-p">
                Moving text is hard on some readers and invisible to others. The generated code handles four of them.
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

            <Sec n={5} k={`${OPTIONS.length} options`} id="options" title="The scrollAnimate call, option by option">
              <div className="stk-faq">
                {OPTIONS.map((o, i) => (
                  <div key={o.k} className="stk-q">
                    <span className="stk-q-n">{pad(i + 1)}</span>
                    <div>
                      <h3 className="stk-q-t"><C>{o.k}</C></h3>
                      <p className="stk-p">
                        <C long>{o.def}</C> by default; the marquee sets <C long>{o.set}</C>. {o.d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="stk-p">
                Each call returns <C>destroy()</C>, <C>refresh()</C>, <C>seek(p)</C>, <C>pause()</C>,{' '}
                <C>resume()</C>, <C>replay()</C> and <C>getProgress()</C>; the React component destroys its rows on
                unmount.
              </p>
            </Sec>

            <Sec n={6} k="Next step" id="use" title="Use it in your project">
              <p className="stk-p">
                scrollAnimate is in the main entry, <C>svg-scroll-draw</C>, which the code above imports. The page the
                generator downloads loads that entry from jsDelivr as an ES module, pinned to {SELF.version}, and the
                React project on StackBlitz installs it from npm. The CSS-only version needs no package at all.
              </p>
              <ToolNextStep
                slug={SLUG}
                api="scrollAnimate"
                docs="/docs#scroll-animate"
                related={['horizontal-scroll-generator', 'parallax-scrolling-generator']}
              />
            </Sec>

            <Sec n={7} k={`${FAQ.length} questions`} id="faq" title="Scroll marquee questions">
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
                More: <Link href="/blog/css-scroll-driven-animations">CSS scroll-driven animations</Link> and{' '}
                <Link href="/blog/reduced-motion-scroll-animations">scroll animation and reduced motion</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
