import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/easing/easing.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import {
  EASING_APIS, EASING_NAMES, EXACT_CSS, FACTORIES, FACTORY_KEYS, NAMED, NAMED_INFO, NATIVE_EASINGS, curveStats, num,
  type CurveStats, type EasingName,
} from '@/data/easing';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { EasingVisualizer } from '@/components/easing/EasingVisualizer';
import { CurvesFigure } from '@/components/easing/CurvesFigure';
import { RemapFigure } from '@/components/easing/RemapFigure';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this answers: "easing functions", "easing visualizer", "spring
// easing", "bounce easing". Every curve, default and option on the page is
// read from data/easing.ts, which copies packages/svg-scroll-draw/src/core/easing.ts.
const TITLE = 'Easing Functions Visualizer: Spring, Bounce & Elastic';
const DESCRIPTION =
  'See easing curves plotted and moving, from linear and ease-in-out to spring, bounce and elastic. Tune them, compare two, copy JS, React or CSS.';

const STATS = Object.fromEntries(EASING_NAMES.map((n) => [n, curveStats(NAMED[n])])) as Record<EasingName, CurveStats>;
const SPRING = STATS.spring;
const ELASTIC = STATS.elastic;

const PER_FRAME = `// What scrollDraw's JavaScript engine does with one path, every frame:
const t = clamp((scroll - start) / (end - start), 0, 1); // progress in
const p = easing(t);                                      // eased progress out
path.style.strokeDashoffset = length * (1 - p);           // drawn to p`;

const CUSTOM = `import { scrollDraw, createSpring } from 'svg-scroll-draw';

// A named easing:
scrollDraw('#logo', { easing: 'ease-out' });

// A factory, with your own numbers:
scrollDraw('#logo', { easing: createSpring({ tension: 3, friction: 1.8 }) });

// Or any function of t, from 0 to 1:
scrollDraw('#logo', { easing: (t) => 1 - Math.pow(1 - t, 3) });`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is an easing function?',
    a: 'A function that takes the progress of an animation, from 0 at the start to 1 at the end, and returns the progress to show. It keeps 0 at 0 and 1 at 1 and changes the speed in between: ease-out moves quickly at first and slows to a stop, ease-in does the reverse. In a scroll animation the progress in comes from the scroll position, so the easing decides how much of the motion each stretch of scroll gets.',
  },
  {
    q: 'What is the difference between ease-in, ease-out and ease-in-out?',
    a: 'ease-in starts slow and speeds up (t²), ease-out starts fast and slows down (t(2 − t)), and ease-in-out is slow at both ends and fastest in the middle, passing exactly 0.5 at the half-way point. In svg-scroll-draw all three are quadratics, not the cubic-bézier curves of the CSS keywords with the same names: ease-in and ease-out differ from those by up to 0.069.',
  },
  {
    q: 'How do I make a spring easing?',
    a: `Pass easing: 'spring', or build your own with createSpring({ tension, friction }) from svg-scroll-draw. tension (default ${FACTORIES.spring.params[0].def}) sets how often it swings and friction (default ${FACTORIES.spring.params[1].def}) how quickly the swing dies away. At the defaults it overshoots to ${num(SPRING.max)} at ${num(SPRING.maxAt)} of the way through, then settles at 1.`,
  },
  {
    q: 'How do I make a bounce easing?',
    a: `Pass easing: 'bounce', or createBounce({ bounces, decay }). It rises to 1, falls back and lands again, and never goes past 1. bounces (default ${FACTORIES.bounce.params[0].def}) counts the first rise, so the default is a rise and two dips; each dip falls back to 1 − decay^i, which at the default decay of ${FACTORIES.bounce.params[1].def} is 0.5, then 0.75.`,
  },
  {
    q: 'What is overshoot, and why does my animation go past its end?',
    a: `Some easings return more than 1 on the way: spring reaches ${num(SPRING.max)} and elastic ${num(ELASTIC.max)}. A movement then passes its target and comes back, which is the springy feel. On a line drawing, progress past 1 pushes the dash beyond the end of the path, so the start of the line clears for a moment and fills back in. If nothing should pass its end, use ease-out or bounce.`,
  },
  {
    q: 'Can I use my own easing function?',
    a: 'Yes. easing takes any function of t, where t runs from 0 to 1, for example (t) => 1 - Math.pow(1 - t, 3) for a cubic ease-out. A custom function, like spring, bounce and elastic, keeps the animation on the JavaScript engine. Only linear, ease-in, ease-out and ease-in-out can be handed to the browser’s native scroll timeline, and only by scrollDraw and scrollAnimate when no other option needs the JavaScript engine.',
  },
  {
    q: 'Can I use these easings in CSS?',
    a: 'linear is the CSS keyword. The library’s ease-in and ease-out are cubic-béziers with their x controls at 1/3 and 2/3: cubic-bezier(0.333333, 0, 0.666667, 0.333333) and cubic-bezier(0.333333, 0.666667, 0.666667, 1) match them to within 0.0000003. ease-in-out, spring, bounce and elastic have no single cubic-bezier, but a CSS linear() function through enough points follows them closely, overshoot included. The visualizer’s CSS tab writes it, with how far it can be from the curve.',
  },
];

const TOC = [
  { id: 'visualizer', label: 'The visualizer' },
  { id: 'how', label: 'Progress in, progress out' },
  { id: 'overshoot', label: 'Overshoot' },
  { id: 'named', label: `Every easing · ${EASING_NAMES.length} + ${FACTORY_KEYS.length}` },
  { id: 'apis', label: `Where easing goes · ${EASING_APIS.length}` },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'easing functions', 'easing visualizer', 'easing function generator', 'easing curves', 'spring easing',
    'bounce easing', 'elastic easing', 'ease-in-out', 'css linear() easing', 'scroll animation easing',
  ],
  alternates: { canonical: '/easing-visualizer' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/easing-visualizer` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Easing functions visualizer',
      url: `${SITE_URL}/easing-visualizer`,
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

export default function EasingVisualizerPage() {
  return (
    <SiteShell active="/easing-visualizer" crumbs={[['Easing visualizer', '/easing-visualizer']]} kicker="easing / your turn">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / easing</span>
              <span>progress in, progress out</span>
            </p>
            <h1 className="pg-title stk-title">Easing functions visualizer</h1>
            <p className="pg-lede">
              Pick an easing, or build a spring, bounce or elastic one with your own numbers. See its curve, watch a line
              draw and a marker move with it, set it beside another, and copy the code for scrollDraw, scrollAnimate,
              React or plain CSS.
            </p>
            <div className="pg-actions">
              <a href="#visualizer" className="btn btn-solid" data-magnetic>Open the visualizer ↓</a>
              <Link href="/docs#create-spring" className="btn" data-magnetic>createSpring in the docs →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Named easings</dt><dd>{EASING_NAMES.length}</dd></div>
              <div><dt>Factories</dt><dd>{FACTORY_KEYS.length}</dd></div>
              <div><dt>Code outputs</dt><dd>4</dd></div>
              <div><dt>Gzipped</dt><dd>{SELF.gzipKb} KB</dd></div>
            </dl>
          </div>
          <CurvesFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="visualizer" title="See an easing move">
              <EasingVisualizer version={SELF.version} />
            </Sec>

            <Sec n={2} k="The model" id="how" title="Progress in, eased progress out">
              <p className="stk-p">
                A scroll animation has one number behind it: how far the reader has scrolled through the trigger
                window, from 0 to 1. That is the progress in, and it is clamped, so it never leaves 0–1. The easing
                turns it into the progress the animation shows. With <C>linear</C> the two are the same; with{' '}
                <C>ease-out</C> the first half of the scroll does three quarters of the work (fig. 2).
              </p>
              <RemapFigure />
              <CodeBox file="per-frame.js">{PER_FRAME}</CodeBox>
              <Note k="Scrolling back">
                The easing is a function of the scroll position, not of time, so scrolling back runs the same curve
                backwards and stopping holds the frame. Scrolling faster plays it faster, along the same curve. The
                exception is <C>once</C> (on by default in scrollReveal, scrollCounter and scrollText), which keeps
                the furthest point reached.
              </Note>
            </Sec>

            <Sec n={3} k="Past 1" id="overshoot" title="Overshoot: past the end and back">
              <p className="stk-p">
                The progress in stays between 0 and 1, but the progress out does not have to. <C>spring</C> reaches{' '}
                {num(SPRING.max)} at {num(SPRING.maxAt)} of the way and <C>elastic</C> {num(ELASTIC.max)} at{' '}
                {num(ELASTIC.maxAt)}, then both settle at 1. The library does not clamp them on the way out, so
                whatever the progress drives goes past its end, unless the browser stops it there: opacity never goes
                above 1, and a video’s time stops at its last frame.
              </p>
              <div className="stk-faq">
                <div className="stk-q">
                  <span className="stk-q-n">move</span>
                  <div>
                    <p className="stk-p">
                      A transform or position runs past its target and swings back, the feel a spring is for. Leave it
                      room: in 2.23.3 and earlier, scrollAnimate stops updating an element once its own transform has
                      carried it wholly out of view, or out of an <C>overflow: hidden</C> parent, so an overshoot that
                      far leaves it there. Fixed in 2.23.4.
                    </p>
                  </div>
                </div>
                <div className="stk-q">
                  <span className="stk-q-n">draw</span>
                  <div>
                    <p className="stk-p">
                      A line drawing’s dash slides beyond the end of the path, so the start of the line clears by the
                      overshoot (a quarter of it at 1.25) and fills back in. Watch the start of the line in the
                      visualizer with <C>elastic</C>.
                    </p>
                  </div>
                </div>
                <div className="stk-q">
                  <span className="stk-q-n">dip</span>
                  <div>
                    <p className="stk-p">
                      <C>bounce</C> never passes 1. It reaches the end, falls back and lands again, so the end of a
                      line retracts and redraws.
                    </p>
                  </div>
                </div>
              </div>
              <Note k="once">
                With <C>once: true</C>, svg-scroll-draw 2.23.2 and earlier keep the highest eased value reached. In
                scrollDraw, scrollAnimate, scrollReveal, scrollCounter, scrollVideo and useScrollDrawProgress
                (scrollReveal and scrollCounter have <C>once</C> on by default) that freezes spring and elastic on
                their overshoot, so a counter to 100 stops near 127 with elastic, and it flattens bounce’s dips. Fixed
                in 2.23.3, which keeps the furthest scroll progress instead and eases it after, as scrollText already
                did, so the curve plays out and settles at 1.
              </Note>
            </Sec>

            <Sec n={4} k={`${EASING_NAMES.length} names · ${FACTORY_KEYS.length} factories`} id="named" title="Every easing, and how to write one">
              <p className="stk-p">
                A named easing is a string; a factory is a function from <C>svg-scroll-draw</C> that returns one with
                your numbers. <C>spring</C>, <C>bounce</C> and <C>elastic</C> are the three factories at their
                defaults. Only the four names marked native or JS can let scrollDraw and scrollAnimate hand the
                animation to the browser’s own scroll timeline, and only when no other option needs the JavaScript
                engine; the rest always run on the library’s JavaScript engine.
              </p>
              <div className="ez-scroll">
                <table className="ez-table">
                  <thead><tr><th>Name</th><th>Curve</th><th>Range</th><th>CSS</th><th>Engine</th></tr></thead>
                  <tbody>
                    {EASING_NAMES.map((n) => (
                      <tr key={n}>
                        <td className="is-code">{`'${n}'`}</td>
                        <td>{NAMED_INFO[n].formula}. {NAMED_INFO[n].d}</td>
                        <td className="is-code">{num(STATS[n].min)} – {num(STATS[n].max)}</td>
                        <td>{EXACT_CSS[n] ? (n === 'linear' ? 'linear' : 'exact cubic-bezier') : 'linear()'}</td>
                        <td>{NATIVE_EASINGS.includes(n) ? 'native or JS' : 'JS'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="stk-faq">
                {FACTORY_KEYS.map((k) => (
                  <div key={k} className="stk-q">
                    <span className="stk-q-n">{k}</span>
                    <div>
                      <h3 className="stk-q-t"><C long>{FACTORIES[k].fn}({`{ ${FACTORIES[k].params.map((p) => `${p.k} = ${p.def}`).join(', ')} }`})</C></h3>
                      <p className="stk-p">{FACTORIES[k].d}</p>
                      {FACTORIES[k].params.map((p) => (
                        <p key={p.k} className="stk-p"><C>{p.k}</C> {p.d}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <CodeBox file="main.js">{CUSTOM}</CodeBox>
            </Sec>

            <Sec n={5} k={`${EASING_APIS.length} APIs`} id="apis" title="Where easing goes, and its default">
              <p className="stk-p">
                Every API below takes the same <C>easing</C> option, a name or a function. The defaults differ: drawing
                and scrubbing default to <C>linear</C>, things that arrive default to <C>ease-out</C>. All of them ease
                the scroll progress, except scrollSnap, which eases its glide to the next section over time, and
                scrollDraw with <C>autoplay</C>, which runs on time too.
              </p>
              <div className="ez-scroll">
                <table className="ez-table">
                  <thead><tr><th>API</th><th>Import from</th><th>Default</th><th>Eases</th></tr></thead>
                  <tbody>
                    {EASING_APIS.map((a) => (
                      <tr key={a.api}>
                        <td className="is-code">{a.api}</td>
                        <td className="is-code">{a.entry}</td>
                        <td className="is-code">{`'${a.def}'`}</td>
                        <td>{a.drives}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="autoplay">
                In svg-scroll-draw 2.23.2 and earlier, a scrollDraw with <C>autoplay</C> whose other options CSS can
                express (linear or one of the three eases, no callbacks, no <C>once</C>, no <C>stagger</C>, the
                default trigger) is handed to the browser’s native scroll timeline where there is one, and follows the
                scroll instead of playing over its <C>duration</C>. Fixed in 2.23.3, which always plays it on time.
              </Note>
              <Note k="Reduced motion">
                For readers who ask their system for less motion, scrollDraw and scrollAnimate show the end state at
                once, whatever the easing.
              </Note>
            </Sec>

            <Sec n={6} k="Next step" id="use" title="Use it in your project">
              <p className="stk-p">
                createSpring, createBounce and createElastic are in the main entry, <C>svg-scroll-draw</C>, beside
                scrollDraw and scrollAnimate, and not in <C>svg-scroll-draw/react</C>, where the React tab’s{' '}
                <C>{'<ScrollDraw>'}</C> comes from. Run it, under the code, downloads a page with your easing on a
                scrollDraw line and a scrollAnimate dot over real page scroll, the library loaded from jsDelivr as an
                ES module, pinned to {SELF.version}.
              </p>
              <ToolNextStep
                slug="easing-visualizer"
                api="scrollDraw"
                entry=""
                docs="/docs#core-options"
                related={['cubic-bezier-generator', 'scroll-trigger-visualizer']}
              />
            </Sec>

            <Sec n={7} k={`${FAQ.length} questions`} id="faq" title="Easing questions">
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
