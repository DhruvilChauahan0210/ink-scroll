import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/trigger/trigger.css';
import Link from 'next/link';
import { COMPETITORS, SELF } from '@/data/competitors';
import {
  EDGES, LINES, SYNTAX_SAMPLES, TRIGGER_DEFAULTS, defaultsOf, pairWords, readTrigger,
} from '@/data/trigger';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { TriggerVisualizer } from '@/components/trigger/TriggerVisualizer';
import { TriggerFigure } from '@/components/trigger/TriggerFigure';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this answers: "scrolltrigger start end", "scroll trigger explained",
// "scroll animation start end", "gsap scrolltrigger start top center". The
// trigger syntax is the same two words in GSAP and here, so the page explains
// the words, draws them, and says where the two libraries part.
const TITLE = 'Scroll Trigger Start & End Explained: Live Visualizer';
const DESCRIPTION =
  'See what start and end mean in a scroll trigger: pick the element edge and viewport line, scroll the preview, watch progress go 0 to 1, copy the code.';

const DRAW = defaultsOf('scrollDraw');
const TEXT = defaultsOf('scrollText');
const REVEAL = defaultsOf('scrollReveal');
const GSAP = COMPETITORS.gsapScroll;

const PROGRESS_JS = `// One element, worked by hand: a 900px-tall window,
// and the element's top 2000px down the page.
const vh = 900;
const top = 2000;

// start: 'top 85%' — its top meets the line 85% down the window.
const startAt = top - 0.85 * vh;   // 1235

// end: 'top 40%' — the same edge meets the line 40% down.
const endAt = top - 0.40 * vh;     // 1640

// In between, progress follows the scroll in a straight line.
const progress = Math.min(1, Math.max(0, (scrollY - startAt) / (endAt - startAt)));`;

const FROM_GSAP = `// GSAP ScrollTrigger
gsap.to('#chart', {
  opacity: 1,
  scrollTrigger: {
    trigger: '#chart',
    start: 'top center',
    end: 'bottom center',
    scrub: true,
  },
});

// svg-scroll-draw: the same two words, on the element itself
import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate('#chart', {
  props: { opacity: [0, 1] },
  trigger: { start: 'top center', end: 'bottom center' },
});`;

const GSAP_ROWS: { k: string; gsap: string; ours: string }[] = [
  { k: 'Order of the words', gsap: 'The trigger element’s edge, then the scroller’s line.', ours: 'The same: the element’s edge, then the viewport’s line.' },
  { k: 'Keywords', gsap: 'top, center, bottom, left, right.', ours: 'top, center, bottom. On axis: ‘x’ they measure across: top is the left edge, bottom the right.' },
  { k: 'Percentages', gsap: 'On either word: ‘80% bottom’ is 80% down the element.', ours: 'On the viewport word only. An element percentage reads as top.' },
  { k: 'Pixels, += and -=', gsap: '‘top 100px’, ‘top bottom-=100px’, and an end of ‘+=500’ counted from the start.', ours: 'Not read: such a viewport word falls back to bottom, such an element word to top.' },
  { k: 'Other values', gsap: 'A number (an exact scroll position), a function, or clamp().', ours: 'Strings only.' },
  { k: 'Default window', gsap: '‘top bottom’ → ‘bottom top’; ‘top top’ when pinning.', ours: 'The same for scrollDraw, scrollAnimate and scrollProgress; scrollText, scrollReveal, scrollCounter and scrollVideo have their own (section 04).' },
  { k: 'End on another element', gsap: 'endTrigger measures the end on a second element.', ours: 'No: start and end measure one element. scrollAnimate and scrollVideo can measure another with triggerElement.' },
  { k: 'What progress does', gsap: 'With scrub, follows the scroll; without, start and end toggle a tween that plays on time.', ours: 'Always follows the scroll. scrollDraw’s autoplay: true is the timed option: it plays over its duration when the drawing comes into view, whatever the window. In 2.23.2 and earlier, autoplay left on the default window could take the browser’s native scroll timeline and follow the scroll after all (native: false avoided it); fixed in 2.23.3.' },
  { k: 'Seeing the lines', gsap: 'markers: true.', ours: 'scrollDraw’s debug: true, in development builds. In 2.23.2 and earlier, with the default window in a browser that has native scroll timelines, it could take the native path and draw no lines (native: false avoided it); fixed in 2.23.3.' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What do start and end mean in a scroll trigger?',
    a: "Each is two words: an edge of the element (top, center or bottom), then a line across the viewport (top, center, bottom or a percentage, counted from the viewport's top). start: 'top 85%' is the scroll position at which the element's top reaches 85% of the way down the viewport, and there the animation's progress is 0. end names the position where progress is 1. In between, progress follows the scroll in a straight line, and the easing shapes the motion on top.",
  },
  {
    q: "What does start: 'top center' mean?",
    a: "The animation begins when the top of the element reaches the middle of the viewport. It means the same in GSAP ScrollTrigger and in svg-scroll-draw, because both read the element's word first and the viewport's second. Paired with end: 'bottom center', the animation runs while the element passes through the middle of the screen and finishes as its bottom crosses it.",
  },
  {
    q: 'What are the default start and end of a scroll trigger?',
    a: `In GSAP ScrollTrigger, start is 'top bottom' ('top top' when pinning) and end is 'bottom top'. In svg-scroll-draw it depends on the function: scrollDraw, scrollAnimate and scrollProgress use '${DRAW.start}' to '${DRAW.end}', the whole time the element is on screen, while scrollText uses '${TEXT.start}' to '${TEXT.end}' and scrollReveal '${REVEAL.start}' to '${REVEAL.end}', so text and cards have arrived while they are still well in view.`,
  },
  {
    q: "Can I use pixel offsets like 'top 100px' or 'top+=100'?",
    a: "Not in svg-scroll-draw. The viewport word must be top, center, bottom or a percentage such as 85%; anything else, 100px or bottom-=100px, reads as bottom. An element word other than top, center or bottom, such as top+=100 or 50%, reads as top. Use a percentage of the viewport instead, which also keeps the timing the same on every screen height. GSAP ScrollTrigger does accept pixels and += or -= offsets.",
  },
  {
    q: 'Why is my scroll animation already part way through when the page loads?',
    a: "Progress comes from how far the page is scrolled, not from when the animation was created. An element on the first screen is often past its start position before anyone scrolls: with start: 'top bottom', any element whose top is above the bottom of the window at load begins part way. Move the start line up the viewport, to 'top center' or 'top top', so the element's top is still below it when the page loads, or for something on the first screen use scrollDraw's autoplay: true, which plays on a clock when it comes into view instead of following the scroll. In 2.23.2 and earlier, autoplay on the default window could take the browser's native scroll timeline and follow the scroll after all, unless you also set native: false; 2.23.3 fixes that.",
  },
  {
    q: 'Why does my scroll animation never finish?',
    a: "Its end position is further down than the page can scroll. Progress reaches 1 only when the scroll gets to the end position, so an element near the bottom of the page with end: 'bottom top' would need the page to carry it right off the top of the screen, and the page runs out first. Choose an end the page can always reach, such as 'bottom bottom' (the element's bottom on the window's bottom), or leave more room below the element.",
  },
  {
    q: 'What happens if end comes before start?',
    a: 'The animation runs backwards. Progress is (scroll − start) ÷ (end − start), clamped to 0–1, so when the end position is the smaller one progress is 1 before the element arrives and falls to 0 as you scroll on. With once on, as it is by default for scrollText, scrollReveal and scrollCounter, progress keeps the 1 it starts at and nothing moves. If start and end are the same position, the window has no length and progress stays 0. The visualizer warns about both.',
  },
];

const TOC = [
  { id: 'visualizer', label: 'The visualizer' },
  { id: 'model', label: 'From words to progress' },
  { id: 'syntax', label: `What the parser reads · ${SYNTAX_SAMPLES.length}` },
  { id: 'defaults', label: `Defaults · ${TRIGGER_DEFAULTS.length}` },
  { id: 'gsap', label: 'Next to GSAP' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'scroll trigger', 'scrolltrigger start end', 'scroll trigger explained', 'scroll animation start end',
    'gsap scrolltrigger start top center', 'scrolltrigger start top center', 'scroll trigger visualizer',
    'scroll progress', 'top bottom bottom top', 'scrolltrigger alternative',
  ],
  alternates: { canonical: '/scroll-trigger-visualizer' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/scroll-trigger-visualizer` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Scroll trigger visualizer',
      url: `${SITE_URL}/scroll-trigger-visualizer`,
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

const inWords = (start: string, end: string) =>
  `Starts when ${pairWords(readTrigger(start))}; done when ${pairWords(readTrigger(end))}.`;

export default function ScrollTriggerVisualizerPage() {
  return (
    <SiteShell
      active="/scroll-trigger-visualizer"
      crumbs={[['Scroll trigger visualizer', '/scroll-trigger-visualizer']]}
      kicker="trigger / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / scroll trigger</span>
              <span>start · end · progress</span>
            </p>
            <h1 className="pg-title stk-title">Scroll trigger visualizer</h1>
            <p className="pg-lede">
              <C>{"start: 'top 85%'"}</C> is two words: an edge of the element, and a line across the viewport. Pick both
              for start and end, scroll the preview, and watch where progress is 0, where it is 1, and the arithmetic in
              between. Then copy the trigger, or run it outside this page: download a page of its own, or open it in
              StackBlitz.
            </p>
            <div className="pg-actions">
              <a href="#visualizer" className="btn btn-solid" data-magnetic>Open the visualizer ↓</a>
              <Link href="/vs-gsap" className="btn" data-magnetic>Compared with GSAP →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Element edges</dt><dd>{EDGES.length}</dd></div>
              <div><dt>Viewport lines</dt><dd>{LINES.length} + %</dd></div>
              <div><dt>Defaults compared</dt><dd>{TRIGGER_DEFAULTS.length}</dd></div>
              <div><dt>Library</dt><dd>{SELF.version}</dd></div>
            </dl>
          </div>
          <TriggerFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="visualizer" title="Set a start and an end">
              <p className="stk-p">
                The box below is a small viewport. Scroll it, drag the slider or press Play: the element moves past the
                two lines, and the drawing inside it is scrollDraw itself, given your trigger and told to watch the box
                instead of the window.
              </p>
              <TriggerVisualizer version={SELF.version} />
            </Sec>

            <Sec n={2} k="The arithmetic" id="model" title="How start and end become progress">
              <p className="stk-p">
                Each pair becomes one scroll position: the place on the page where the element’s edge sits on the
                viewport’s line. That is the edge’s distance down the page minus the line’s distance down the viewport
                (fig. 1). An edge other than top adds part of the element’s height, half for <C>center</C> and all of
                it for <C>bottom</C>, so <C>bottom bottom</C> is the moment the element’s bottom edge comes into view: for an
                element shorter than the viewport, the moment all of it is on screen.
              </p>
              <p className="stk-p">
                Progress is how far the scroll has got from the start position to the end one, clamped to 0–1. Scroll
                back and it goes back down, unless the function keeps what it has reached (<C>once</C>).
              </p>
              <CodeBox file="progress.js">{PROGRESS_JS}</CodeBox>
              <Note k="Speed">
                scrollDraw, scrollAnimate, scrollProgress and useScrollDrawProgress multiply the fraction by{' '}
                <C>speed</C> before clamping, 1 by default: at <C>speed: 2</C> the animation is done half way through
                the window. scrollText, scrollReveal, scrollCounter and scrollVideo have no <C>speed</C>.
              </Note>
              <Note k="Measured">
                The two positions are measured when the animation is created and again when the window resizes or the
                page’s layout changes (useScrollDrawProgress: on a window resize only). After moving the element some
                other way, call <C>refresh()</C> on a scrollDraw instance.
              </Note>
              <Note k="Native path">
                Only the default window, <C>{DRAW.start}</C> to <C>{DRAW.end}</C>, lets scrollDraw and scrollAnimate
                hand the work to the browser’s own scroll timeline. Any other trigger keeps them on their JavaScript
                loop, which follows the same arithmetic.
              </Note>
            </Sec>

            <Sec n={3} k={`${SYNTAX_SAMPLES.length} forms`} id="syntax" title="Every form the trigger accepts">
              <p className="stk-p">
                The parser reads the first two words, split on spaces. The element’s word is <C>top</C>,{' '}
                <C>center</C> or <C>bottom</C>, and anything else is read as top. The viewport’s word is one of the
                same three or digits followed by <C>%</C>, decimals allowed (<C>85.5%</C>, not <C>.5%</C> or{' '}
                <C>-10%</C>), and anything else is read as bottom. A
                percentage on its own is the viewport’s line, for the element’s top. The parser does not warn when a word
                falls back, so the “read as” column is worth a look.
              </p>
              <div className="trg-scroll">
                <table className="trg-table">
                  <thead><tr><th>Written</th><th>Read as</th><th>Why</th></tr></thead>
                  <tbody>
                    {SYNTAX_SAMPLES.map((s) => {
                      const r = readTrigger(s.written);
                      return (
                        <tr key={s.written || 'empty'}>
                          <td className="is-code">{s.written ? `'${s.written}'` : "'' (empty)"}</td>
                          <td className="is-code">{`'${r.canonical}'`}</td>
                          <td>{[s.what, ...r.notes].filter(Boolean).join(' ')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Note k="Sideways">
                With <C>{"axis: 'x'"}</C> the same words measure across: <C>top</C> is the left edge, <C>bottom</C> the
                right. <C>left</C> and <C>right</C> are not words the parser knows, so <C>{"'left left'"}</C> reads as{' '}
                <C>{"'top bottom'"}</C>: the element’s left edge on the viewport’s right.
              </Note>
            </Sec>

            <Sec n={4} k={`${TRIGGER_DEFAULTS.length} functions`} id="defaults" title="The default window of each function">
              <p className="stk-p">
                Leave <C>trigger</C> out and each function uses its own window. scrollDraw, scrollAnimate and the
                progress ones run the whole time the element is on screen; text, reveals and counters finish while it
                is still well in view, where a reader is looking; scrollVideo scrubs from the moment its top reaches
                the top of the viewport.
              </p>
              <div className="trg-scroll">
                <table className="trg-table">
                  <thead><tr><th>Function</th><th>Import</th><th>start</th><th>end</th><th>In words</th></tr></thead>
                  <tbody>
                    {TRIGGER_DEFAULTS.map((d) => (
                      <tr key={d.fn}>
                        <td className="is-code">{d.fn}</td>
                        <td className="is-code">{d.entry}</td>
                        <td className="is-code">{`'${d.start}'`}</td>
                        <td className="is-code">{`'${d.end}'`}</td>
                        <td>{inWords(d.start, d.end)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="Reveal rows">
                scrollReveal also staggers a row, the elements whose tops line up: each one after the first has both
                lines moved a further <C>stagger</C> (0.15 by default) of the gap between the start and end lines up
                the viewport, never more than that whole gap, so a row of cards arrives one after another.
              </Note>
            </Sec>

            <Sec n={5} k="Next to GSAP" id="gsap" title="Compared with GSAP ScrollTrigger">
              <p className="stk-p">
                The two-word form is ScrollTrigger’s, so a trigger written with keywords and viewport percentages means
                the same in both: <C>{"'top center'"}</C> is <C>{"'top center'"}</C>. They part over everything else
                ScrollTrigger accepts. Described against GSAP {GSAP.version}.
              </p>
              <div className="trg-scroll">
                <table className="trg-table">
                  <thead><tr><th /><th>GSAP ScrollTrigger</th><th>svg-scroll-draw</th></tr></thead>
                  <tbody>
                    {GSAP_ROWS.map((r) => (
                      <tr key={r.k}>
                        <th scope="row" className="is-key">{r.k}</th>
                        <td>{r.gsap}</td>
                        <td>{r.ours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <CodeBox file="the same window, twice">{FROM_GSAP}</CodeBox>
              <Note k="Pixels">
                A pixel offset has no exact match here. A percentage moves with the window’s height: on a 900px window,{' '}
                <C>{"'top 85%'"}</C> is 135px above the bottom, on a 600px one 90px.
              </Note>
            </Sec>

            <Sec n={6} k="Next step" id="use" title="Use it in your project">
              <p className="stk-p">
                The visualizer’s drawing is scrollDraw, from the main entry. scrollText, scrollReveal and scrollProgress
                have entries of their own (<C>svg-scroll-draw/text</C>, <C>/reveal</C> and <C>/progress</C>), and the
                React tab’s ScrollDraw, ScrollText and useScrollDrawProgress come from <C>svg-scroll-draw/react</C>.
                The page Run it downloads loads the entry its code needs from jsDelivr as an ES module, pinned to{' '}
                {SELF.version}, and draws the two lines and the progress over it, worked from the element’s place on
                the page as in the preview.
              </p>
              <ToolNextStep
                slug="scroll-trigger-visualizer"
                api="scrollDraw"
                docs="/docs#trigger"
                related={['easing-visualizer', 'scroll-reveal-generator']}
              />
            </Sec>

            <Sec n={7} k={`${FAQ.length} questions`} id="faq" title="Scroll trigger questions">
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
