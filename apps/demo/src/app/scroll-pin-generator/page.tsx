import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/pin/pin.css';
import Link from 'next/link';
import { SELF, SELF_ENTRIES } from '@/data/competitors';
import { BROWSER_SUPPORT } from '@/data/cssdriven';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { PinGenerator } from '@/components/pin/PinGenerator';
import { TrackFigure } from '@/components/pin/TrackFigure';
import { LIB_DEFAULTS, STEPS_MAX, STEPS_MIN, SLUG } from '@/components/pin/pin-code';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "pin section on scroll", "sticky scroll section",
// "scroll pin without gsap", "sticky scrolling feature section". Every option,
// default and state below is read from packages/svg-scroll-draw/src/pin/index.ts.
const TITLE = 'Scroll Pin Generator: Sticky Sections Without GSAP';
const DESCRIPTION =
  'Pin a section on scroll and change steps as it holds: set the pin distance, top and steps, scroll the preview, copy HTML, CSS, JS, React or CSS only.';

const PIN_KB = SELF_ENTRIES.pin;
const SUPPORT = BROWSER_SUPPORT.map((b) => `${b.browser} ${b.since}`).join(', ');

const OPTIONS: { k: string; type: string; def: string; what: string }[] = [
  {
    k: 'pinDistance',
    type: "number | '150vh' | '600px'",
    def: LIB_DEFAULTS.pinDistance,
    what: 'How much scroll it stays pinned for. A number or a px string is pixels and stays that. A vh string is measured as CSS measures vh, from an element 100vh tall: it follows rotation and window resizes, but not a phone’s address bar. The default is read again on every resize, address bar included; anything else warns in development builds and uses the default.',
  },
  {
    k: 'top',
    type: 'number',
    def: String(LIB_DEFAULTS.top),
    what: 'Where it pins, in px from the top of the window: the height of a fixed or sticky header. It is the window’s top even with a scrollContainer.',
  },
  {
    k: 'scrollContainer',
    type: 'string | Element',
    def: 'window',
    what: 'Whose scroll moves the pin: a selector or an element, listened to instead of the window. Everything is still measured on screen (section 03).',
  },
  { k: 'onEnter', type: '() => void', def: '—', what: 'Before → pinned: scrolling down into the pin.' },
  { k: 'onLeave', type: '() => void', def: '—', what: 'Pinned → after: scrolling down out of its end.' },
  { k: 'onEnterBack', type: '() => void', def: '—', what: 'After → pinned: scrolling back up into it.' },
  { k: 'onLeaveBack', type: '() => void', def: '—', what: 'Pinned → before: scrolling back up out of its start.' },
  {
    k: 'onProgress',
    type: '(progress) => void',
    def: '—',
    what: 'Progress through the pin, 0 to 1, on every update: each scroll frame, and after a resize or a change of layout. It is 0 before the pin and 1 after it, so it reports those too.',
  },
];

const STATES: { k: string; when: string; styles: string; enter: string }[] = [
  {
    k: 'Before',
    when: 'The wrapper’s top is below the pin line.',
    styles: 'Its own: the inline position, top, bottom, left, width and box-sizing it had before scrollPin.',
    enter: 'onLeaveBack, when it comes from pinned.',
  },
  {
    k: 'Pinned',
    when: 'Between the two: the wrapper’s top has passed the pin line and its last stretch, the element’s height, has not.',
    styles: 'position: fixed; top: your top; left: the wrapper’s left on screen; width: the wrapper’s width; box-sizing: border-box.',
    enter: 'onEnter from before, onEnterBack from after.',
  },
  {
    k: 'After',
    when: 'The wrapper’s bottom, less the element’s height, is at or above the pin line.',
    styles: 'position: absolute; bottom: 0; left: 0; width: 100%; box-sizing: border-box, inside the wrapper (position: relative).',
    enter: 'onLeave, when it comes from pinned.',
  },
];

const COMPARE: { k: string; css: string; pin: string }[] = [
  { k: 'Holding the stage', css: 'position: sticky, in every current browser.', pin: 'position: fixed, switched on and off by script as the page scrolls.' },
  { k: 'Changing the steps', css: `A view timeline on the tall wrapper and one animation-range per step: ${SUPPORT}. Elsewhere, a plain list.`, pin: 'onProgress, in any browser that runs the script.' },
  { k: 'JavaScript', css: 'None.', pin: `${PIN_KB} KB gzipped, the pin entry on its own.` },
  { k: 'Your code knows', css: 'Nothing: no events, no number.', pin: 'onEnter, onLeave, onEnterBack, onLeaveBack, and progress 0 → 1.' },
  { k: 'The wrapper', css: 'You give it its height: the stage plus the pin distance.', pin: 'Added and sized for you, and measured again on resize and when the layout changes.' },
  { k: 'What breaks it', css: 'An ancestor with overflow hidden, auto or scroll between the stage and the page’s scroller, or a parent no taller than the stage.', pin: 'An ancestor with transform, filter, perspective or contain: paint, which becomes the fixed stage’s containing block.' },
];

const STICKY_CSS = `/* The image holds still while the copy beside it scrolls.
   No script, every browser. */
.feature {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start; /* stretched to the row, it would have no room to stick */
}
.feature-media {
  position: sticky;
  top: 64px; /* under a 64px header */
}`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I pin a section on scroll?',
    a: `Two ways. In CSS, give the section position: sticky and a top, inside a wrapper taller than it: it sticks for the wrapper's height minus its own. In JavaScript, scrollPin from svg-scroll-draw/pin wraps the section in a div as tall as the section plus pinDistance, fixes it top px from the top of the window for that much scroll, and reports progress 0 to 1 through onProgress. Its defaults are top ${LIB_DEFAULTS.top} and one window height of scroll.`,
  },
  {
    q: 'How do I build a sticky scrolling feature section where the steps change?',
    a: 'Pin the stage for the whole tour and split the pin distance into equal shares, one per step: the current step is the progress times the number of steps, rounded down, and capped at the last. With scrollPin that is one line in onProgress. In CSS, a view timeline on the tall wrapper and one animation-range per step do the same, measured with exit-crossing from the moment the pin starts. The generator above writes both.',
  },
  {
    q: 'Can I pin a section on scroll without GSAP?',
    a: `Yes. position: sticky needs no library at all, and scrollPin is ${PIN_KB} KB gzipped on its own. It has GSAP ScrollTrigger's four callback names, onEnter, onLeave, onEnterBack and onLeaveBack, firing at the same two ends of the pin, and onProgress for the 0–1 in between. Where GSAP pins with pin: true and an end, scrollPin takes top and a pinDistance in px or vh. The blog post on pinning without GSAP goes through it.`,
  },
  {
    q: 'Why is position: sticky not working?',
    a: "Most often an ancestor between the element and the page has overflow set to hidden, auto or scroll: the element then sticks inside that box, which never scrolls, so it never seems to stick. overflow: clip does not do this. Next, the parent: sticky only holds while its parent is on screen, so a parent no taller than the element leaves no room, and a grid or flex item stretched to its row's height is as tall as its parent; align-self: start fixes that. And it needs a top (or bottom) to stick at.",
  },
  {
    q: 'Does scrollPin work inside a scroll container?',
    a: "Yes: scrollContainer makes it follow that element's scroll instead of the window's. But top is still measured from the top of the window and the pinned element is position: fixed, so it suits a container that stays put on screen, such as an app layout whose main area scrolls, with top set to where that area starts. If the container moves on screen, make the pin again with its new top, as this page's preview does. An ancestor with transform, filter, perspective or contain: paint moves a fixed element too.",
  },
  {
    q: 'Why did onEnter or onLeave not fire?',
    a: 'A callback fires only on a change to or from pinned. A jump across the whole pin in one frame, from an anchor link, the End key or scrollTo(), goes straight from before to after without being pinned, so none of the four fire; a page that loads already past the pin does the same. onProgress still reports 1, or 0, so take the current step from onProgress rather than from the callbacks. The preview logs such a jump: press Pin end before the pin starts.',
  },
  {
    q: 'What pinDistance should I use?',
    a: "The default is one window height, window.innerHeight, read again on every resize. A number or a px string is pixels and never changes; a vh string such as '300vh' is measured as CSS measures vh, so it follows rotation and window resizes but not a phone's address bar sliding in and out. For a tour, give each step enough scroll to read it: 75vh to 100vh a step is a good start.",
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'options', label: `Every option · ${OPTIONS.length}` },
  { id: 'states', label: `What it writes · ${STATES.length} states` },
  { id: 'css', label: 'The CSS version' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'pin section on scroll', 'sticky scroll section', 'scroll pin without gsap', 'sticky scrolling feature section',
    'scroll pin generator', 'sticky section generator', 'position sticky scroll steps', 'pin element on scroll',
    'gsap pin alternative', 'scrollPin', 'css sticky feature tour',
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
      name: 'Scroll pin generator',
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

export default function ScrollPinGeneratorPage() {
  return (
    <SiteShell
      active={`/${SLUG}`}
      crumbs={[['Scroll pin generator', `/${SLUG}`]]}
      kicker="pin / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / scroll pin</span>
              <span>pin · steps · progress</span>
            </p>
            <h1 className="pg-title stk-title">Scroll pin generator</h1>
            <p className="pg-lede">
              Pin a section while the page scrolls past it, and change what it shows as it holds: the feature tour.
              Set how long it stays pinned, how far down it pins and how many steps it shows, scroll the preview, and
              copy the HTML, CSS and JavaScript, a React component, or a version in CSS alone.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/examples/scroll-pin" className="btn" data-magnetic>The feature tour recipe →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Options</dt><dd>{OPTIONS.length}</dd></div>
              <div><dt>States</dt><dd>{STATES.length}</dd></div>
              <div><dt>scrollPin alone</dt><dd>{PIN_KB} KB</dd></div>
              <div><dt>Library</dt><dd>{SELF.version}</dd></div>
            </dl>
          </div>
          <TrackFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Build a pinned feature tour">
              <p className="stk-p">
                The box below is a small window. Scroll it, drag the slider or press Play: the stage pins under the pin
                line, the steps change as you scroll through it, and it lets go at the end. The pinning is scrollPin
                itself, told to follow the box, and every number beside it is what the instance reports. Pick from{' '}
                {STEPS_MIN} to {STEPS_MAX} steps.
              </p>
              <PinGenerator version={SELF.version} />
              <Note k="Recipe">
                For the same tour with a line drawing for each step, drawn by scrollDraw’s <C>seek()</C> from{' '}
                <C>onProgress</C>, see <Link href="/examples/scroll-pin" className="spn-a">the feature tour recipe</Link>;
                for the walkthrough, <Link href="/blog/scroll-pin-without-gsap" className="spn-a">pinning sections
                without GSAP</Link>.
              </Note>
            </Sec>

            <Sec n={2} k={`${OPTIONS.length} options`} id="options" title="Every scrollPin option">
              <p className="stk-p">
                <C>{"scrollPin(target, options)"}</C> takes a selector or an element and returns an instance. Leave an
                option out and it takes the default; the generator leaves out every option at its default.
              </p>
              <div className="spn-scroll" tabIndex={0} role="region" aria-label="Every scrollPin option">
                <table className="spn-table">
                  <thead><tr><th>Option</th><th>Type</th><th>Default</th><th>What it does</th></tr></thead>
                  <tbody>
                    {OPTIONS.map((o) => (
                      <tr key={o.k}>
                        <th scope="row" className="is-key">{o.k}</th>
                        <td className="is-code">{o.type}</td>
                        <td className="is-code">{o.def}</td>
                        <td>{o.what}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Instance">
                <C>destroy()</C> takes the listeners off, gives the element back its own inline styles and puts it back
                where the wrapper was. <C>refresh()</C> measures again. <C>getProgress()</C> returns the last progress.
                On the server, and for a selector that finds nothing, scrollPin returns an instance that does nothing.
              </Note>
              <Note k="Measured">
                The element’s height and the pin distance are measured when it is created, 150ms after the window
                resizes, and 100ms after the wrapper, the element or the page changes size, which a ResizeObserver
                watches for.
              </Note>
            </Sec>

            <Sec n={3} k={`${STATES.length} states`} id="states" title="Before, pinned, after: what scrollPin writes">
              <p className="stk-p">
                scrollPin puts the element in a <C>div</C> of its own, <C>data-ssd-pin-wrapper</C>, as tall as the
                element plus the pin distance. The wrapper stays in the page’s flow and keeps the room, so nothing
                below moves when the element pins. On each scroll frame it reads where the wrapper is on screen: progress
                is (top − the wrapper’s top) ÷ pinDistance, clamped to 0–1, and one of three states follows (fig. 1).
              </p>
              <div className="spn-scroll" tabIndex={0} role="region" aria-label="The three states">
                <table className="spn-table">
                  <thead><tr><th>State</th><th>When</th><th>The element’s inline styles</th><th>Callback on the way in</th></tr></thead>
                  <tbody>
                    {STATES.map((st) => (
                      <tr key={st.k}>
                        <th scope="row" className="is-key">{st.k}</th>
                        <td>{st.when}</td>
                        <td>{st.styles}</td>
                        <td>{st.enter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Jumps">
                A callback fires only on a change to or from pinned. A jump from before straight to after, or back, in
                one frame fires none of the four, while <C>onProgress</C> still reports 1 or 0. Take the step from
                progress, as the generated code does.
              </Note>
              <Note k="Containers">
                With <C>scrollContainer</C>, scrollPin follows that element’s scroll, but it still measures on screen:{' '}
                <C>top</C> is from the window’s top, and the pinned element is <C>position: fixed</C>. The preview
                above passes the box’s own top on screen plus your <C>top</C>, and makes the pin again whenever the box
                moves on screen. In a layout whose scrolling area stays put, set <C>top</C> to where the area starts,
                once.
              </Note>
              <Note k="Ancestors">
                A <C>transform</C>, <C>filter</C>, <C>perspective</C> or <C>contain: paint</C> on any ancestor makes
                that ancestor the containing block of a fixed element, and the pinned stage lands in the wrong place.
                Keep them off the stage’s ancestors, or use the CSS version below.
              </Note>
            </Sec>

            <Sec n={4} k="No script" id="css" title="The pure CSS version, and when it is enough">
              <p className="stk-p">
                <C>position: sticky</C> holds a stage in every current browser. Put it in a wrapper as tall as the stage
                plus the pin distance, give it the same <C>top</C>, and it sticks for exactly that much scroll: the same
                stretch scrollPin pins for. If the stage only has to hold still while copy beside it scrolls past,
                that is all it takes, and no script is the better answer.
              </p>
              <CodeBox file="sticky.css">{STICKY_CSS}</CodeBox>
              <p className="stk-p">
                Changing the steps is the part CSS needs scroll-driven animations for. The CSS only tab gives the tall
                wrapper a view timeline, measured from the pin line with <C>view-timeline-inset</C>. On that timeline{' '}
                <C>exit-crossing 0</C> is the moment the wrapper’s top reaches the pin line, where the pin starts, and a
                length after it is that much more scroll, so each step’s <C>animation-range</C> is its share of the
                pin distance, whatever the stage’s height. It sits inside <C>@supports</C>: where there are no
                scroll-driven animations the tour is a plain list, every step showing and nothing pinned.
              </p>
              <div className="spn-scroll" tabIndex={0} role="region" aria-label="CSS or scrollPin">
                <table className="spn-table">
                  <thead><tr><th /><th>CSS: sticky and a view timeline</th><th>scrollPin</th></tr></thead>
                  <tbody>
                    {COMPARE.map((r) => (
                      <tr key={r.k}>
                        <th scope="row" className="is-key">{r.k}</th>
                        <td>{r.css}</td>
                        <td>{r.pin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Enough">
                CSS alone is enough when nothing but the page needs to know where the reader is: a stage that holds
                still, steps that only change how it looks, and a plain list where timelines are missing. Use scrollPin
                when your code has to know: to start a video at <C>onEnter</C>, to keep the current step in React
                state, to draw a canvas or a scrollDraw drawing from the progress, or to count the steps someone saw.
              </Note>
              <Note k="Tested">
                The CSS only file was scrolled through in Playwright’s Chromium, Firefox and WebKit, and each showed the
                step the scrollPin version shows at the same scroll. In WebKit a backwards fill did not apply before its
                range began, so the first step and the undrawn lines are the rules’ own values, not a fill.
              </Note>
            </Sec>

            <Sec n={5} k="Next step" id="use" title="Use it in your project">
              <p className="stk-p">
                scrollPin has an entry of its own, <C>svg-scroll-draw/pin</C>, and the generated code imports it from
                there.
              </p>
              <ToolNextStep
                slug={SLUG}
                api="scrollPin"
                entry="pin"
                docs="/docs#scroll-pin"
                related={['scroll-trigger-visualizer', 'css-scroll-driven-animation-generator']}
              />
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Scroll pin questions">
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
                More on pinning with svg-scroll-draw {SELF.version}: <Link href="/blog/scroll-pin-without-gsap">scroll
                pin without GSAP</Link>, <Link href="/examples/scroll-pin">the feature tour recipe</Link> and{' '}
                <Link href="/docs#scroll-pin">scrollPin in the docs</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
