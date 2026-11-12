import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/keyframes/keyframes.css';
import Link from 'next/link';
import { SELF, SELF_ENTRIES } from '@/data/competitors';
import { BROWSER_SUPPORT } from '@/data/cssdriven';
import { GROUPS, LONGHANDS, PRESETS, TIMING_KINDS, presetOf, presetsIn } from '@/data/keyframes';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { ToolNextStep } from '@/components/tool-kit/ToolNextStep';
import { KeyframesGenerator } from '@/components/keyframes/KeyframesGenerator';
import { TimelineFigure } from '@/components/keyframes/TimelineFigure';
import {
  INITIAL, OUTPUTS, REVEAL_DEFAULTS, SCROLL_RANGE, keyframesCss, libMapOf, offsetCount, reducedCss, settingsFor,
  shorthandValue,
} from '@/components/keyframes/code';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this page is for: "css animation generator", "css keyframes
// generator", "css animation", "keyframe animation css". Every effect, count
// and code sample below is read from data/keyframes.ts and written by the
// generator's own functions (components/keyframes/code.ts), never typed here.
const TITLE = 'CSS Animation Generator: Keyframes, Presets & Code';
const DESCRIPTION = `Make a CSS keyframe animation: pick one of ${PRESETS.length} effects, set duration, delay, easing and fill, watch it run, and copy the @keyframes or the scroll version.`;

const MAPS = PRESETS.map((p) => ({ p, map: libMapOf(p) }));
const BY_REVEAL = MAPS.filter((m) => m.map.kind === 'reveal').length;
const BY_ANIMATE = MAPS.filter((m) => m.map.kind === 'animate').length;
const CSS_ONLY = MAPS.filter((m) => m.map.kind === 'none').length;
const ON_SCROLL = { reveal: 'scrollReveal', animate: 'scrollAnimate', none: 'CSS only' } as const;
// "Chrome and Edge 115, Safari 26 and Firefox 159", from the table the CSS scroll-driven generator keeps.
const SUPPORT = BROWSER_SUPPORT
  .map((b) => `${b.browser.replace(/ \(.*\)$/, '').replace(', ', ' and ')} ${b.since}`)
  .join(', ')
  .replace(/, ([^,]*)$/, ' and $1');

const SAMPLE = `/* The generator's default: ${presetOf(INITIAL.preset).label.toLowerCase()}. */
.${INITIAL.cls} {
  animation: ${shorthandValue(INITIAL, INITIAL.preset)};
}`;
const HEARTBEAT = presetOf('heartbeat');
const STOPS = keyframesCss(HEARTBEAT, HEARTBEAT.key);
const REDUCED = reducedCss(settingsFor('pulse'));
const RESTART = `const el = document.querySelector('.${INITIAL.cls}');

el.classList.remove('${INITIAL.cls}');
void el.offsetWidth; // a forced layout: the browser sees the class gone
el.classList.add('${INITIAL.cls}');`;

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make a CSS animation?',
    a: `Write the motion as @keyframes: a name, then the property values at 0% (from), 100% (to) and any stops between. Then attach it to an element with the animation property: animation: ${shorthandValue(INITIAL, INITIAL.preset)}; names the keyframes, the duration, the easing and the fill mode. The generator writes both, with a reduced-motion rule, for any of its ${PRESETS.length} effects.`,
  },
  {
    q: 'What is the difference between a CSS transition and a CSS animation?',
    a: 'A transition animates a property from its old value to its new one when the value changes, on :hover or when a class is added: two ends, once per change. An animation runs @keyframes on its own as soon as it applies, with as many stops as you like, a delay, a repeat count and a direction, and it can loop. A transition suits a change of state; an animation suits motion with a shape of its own.',
  },
  {
    q: 'How do I keep a CSS animation on its last frame?',
    a: 'Set animation-fill-mode: forwards, or both. With the default, none, the keyframes stop applying when the animation ends and the element snaps back to its own style. forwards holds the frame it ended on, which is the 100% frame unless the last cycle ran backwards: with alternate and an even count it is the 0% frame. backwards does the same for the first frame during the delay.',
  },
  {
    q: 'How do I loop a CSS animation with a pause between loops?',
    a: 'animation-iteration-count: infinite repeats it for as long as it applies, and alternate makes every other cycle run backwards. CSS has no delay between cycles: animation-delay waits once, before the first. Build the pause into the keyframes instead: move from 0% to 60% and hold the same values from 60% to 100%, so a 2s cycle moves for 1.2s and rests for 0.8s.',
  },
  {
    q: 'How do I restart a CSS animation with JavaScript?',
    a: 'Take the class off, make the browser notice, and put it back: remove the class, read el.offsetWidth, add the class again. Reading offsetWidth forces a layout between the two; without it the browser only ever sees the class still there, and nothing restarts. Changing animation-name restarts it too. The generator’s Replay button does the first.',
  },
  {
    q: 'How do I trigger a CSS animation on scroll?',
    a: `In CSS, animation-timeline: view() ties the animation to the element’s place in its scroller, and animation-range picks the stretch, such as ${SCROLL_RANGE.in}; scrolling drives it forwards and back. It runs in ${SUPPORT} or later; inside @supports, other browsers simply show the element. In JavaScript, svg-scroll-draw’s scrollReveal ties the same from and to to the scroll in every browser, or scrollAnimate for values scrollReveal’s from cannot hold. The generator writes both.`,
  },
  {
    q: 'Why is my CSS animation not working?',
    a: 'Check, in this order: the name in animation matches the @keyframes name exactly; there is a duration, since without one it is zero and nothing shows; the element is not display: inline, which ignores transform (inline-block works); no later rule or animation shorthand overrides it; and the reader has not asked for less motion on a page that turns animation off then. Chrome’s DevTools Animations panel shows whether it ran at all.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'timeline', label: 'Delay, cycles, fill' },
  { id: 'keyframes', label: `Keyframes · ${PRESETS.length} effects` },
  { id: 'scroll', label: 'When it scrolls into view' },
  { id: 'motion', label: 'Reduced motion' },
  { id: 'use', label: 'Use it in your project' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'css animation generator', 'css keyframes generator', 'css animation', 'keyframe animation css', 'css keyframes',
    'css animation examples', 'animation-fill-mode', 'animation-timing-function', 'css animation on scroll',
    'animista alternative',
  ],
  alternates: { canonical: '/css-keyframes-animation-generator' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/css-keyframes-animation-generator` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'CSS keyframes animation generator',
      url: `${SITE_URL}/css-keyframes-animation-generator`,
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

export default function CssKeyframesAnimationGeneratorPage() {
  return (
    <SiteShell
      active="/css-keyframes-animation-generator"
      crumbs={[['CSS keyframes animation generator', '/css-keyframes-animation-generator']]}
      kicker="css / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / css animation</span>
              <span>@keyframes · on scroll</span>
            </p>
            <h1 className="pg-title stk-title">CSS keyframes animation generator</h1>
            <p className="pg-lede">
              Pick an entrance, an attention-seeker or an exit, set its duration, delay, repeats, direction, fill and
              easing, and watch it run on a card. Copy the <C>@keyframes</C> and the class, the one-line shorthand, or
              a version that plays as the element scrolls into view.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/css-scroll-driven-animation-generator" className="btn" data-magnetic>Scroll-driven CSS →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Effects</dt><dd>{PRESETS.length}</dd></div>
              <div><dt>Timing functions</dt><dd>{TIMING_KINDS.length}</dd></div>
              <div><dt>Code outputs</dt><dd>{OUTPUTS.length}</dd></div>
              <div><dt>scrollReveal, gzipped</dt><dd>{SELF_ENTRIES.reveal} KB</dd></div>
            </dl>
          </div>
          <TimelineFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make a CSS animation">
              <KeyframesGenerator version={SELF.version} />
            </Sec>

            <Sec n={2} k="The model" id="timeline" title="Delay, duration, cycles, fill">
              <p className="stk-p">
                An animation is a stretch of time. It waits for its <C>animation-delay</C>, then runs{' '}
                <C>animation-iteration-count</C> cycles of <C>animation-duration</C> each, every cycle carrying the
                element through the keyframes from 0% to 100%, or back, as <C>animation-direction</C> says. Outside
                those cycles the keyframes do not apply, unless <C>animation-fill-mode</C> holds the first frame through
                the delay (backwards) or the last one after the end (forwards), as fig. 1 draws.
              </p>
              <CodeBox file="fade-up.css">{SAMPLE}</CodeBox>
              <div className="stk-faq kfg-mt">
                {LONGHANDS.map((l, i) => (
                  <div key={l.prop} className="stk-q">
                    <span className="stk-q-n">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="stk-q-t"><C>{l.prop}</C></h3>
                      <p className="stk-p"><C>{l.initial}</C> by default. {l.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Note k="Per keyframe">
                The timing function runs again between every pair of keyframes, so <C>ease-out</C> on a five-stop
                bounce eases each of its four stretches, not the whole. A keyframe can set its own{' '}
                <C>animation-timing-function</C> for the stretch that starts there.
              </Note>
            </Sec>

            <Sec n={3} k={`${PRESETS.length} effects`} id="keyframes" title="@keyframes: from, to and the stops between">
              <p className="stk-p">
                A keyframes rule lists offsets and what the element looks like at each. <C>from</C> is 0% and{' '}
                <C>to</C> is 100%; any percentage between adds a stop, and several offsets can share one block. A
                property a keyframe leaves out is carried between the keyframes that do set it, and a missing 0% or 100%
                falls back to the element’s own style. Here the heartbeat’s rests share one line:
              </p>
              <CodeBox file={`${HEARTBEAT.key}.css`}>{STOPS}</CodeBox>
              <p className="stk-p kfg-mt">
                Every effect in the generator animates only <C>transform</C>, <C>opacity</C> and <C>filter</C>, which
                browsers can usually animate without laying the page out again on every frame. Animating{' '}
                <C>width</C>, <C>top</C> or <C>margin</C> works too, but moves everything around the element each frame.
                A pivot such as swing’s top edge is set with <C>transform-origin</C> on the element, outside the
                keyframes.
              </p>
              <div className="kfg-scroll" tabIndex={0} role="region" aria-label="Every effect">
                <table className="kfg-ref">
                  <thead><tr><th>Effect</th><th>What it does</th><th>Stops</th><th>On scroll in JS</th></tr></thead>
                  {GROUPS.map((g) => (
                    <tbody key={g.key}>
                      <tr><th colSpan={4}>{g.label} · {g.d}</th></tr>
                      {presetsIn(g.key).map((p) => (
                        <tr key={p.key}>
                          <td className="is-code">{p.key}</td>
                          <td>{p.d}</td>
                          <td className="is-num">{offsetCount(p)}</td>
                          <td className="is-code">{ON_SCROLL[libMapOf(p).kind]}</td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
            </Sec>

            <Sec n={4} k="On scroll" id="scroll" title="Run it when it scrolls into view">
              <p className="stk-p">
                The same keyframes can follow the scroll instead of a clock. In CSS, <C>animation-timeline: view()</C>{' '}
                ties the animation to where the element is in its scroller and <C>animation-range</C> picks the stretch:
                the generator plays entrances and attention effects over <C>{SCROLL_RANGE.in}</C>, from the moment the
                element’s top comes in at the bottom to 30% of the way across, and exits over{' '}
                <C>{SCROLL_RANGE.out}</C>, as it leaves at the top. The scroll sets the pace, so the duration, delay and
                count drop out, and scrolling back plays it backwards. It runs in {SUPPORT} or later, so it sits
                inside <C>@supports</C>, where older browsers simply show the element.
              </p>
              <p className="stk-p">
                svg-scroll-draw does the same in every browser, from one value to another.{' '}
                <C>scrollReveal</C> plays {BY_REVEAL} of the {PRESETS.length} effects with its own presets and{' '}
                <C>from</C> (opacity, x, y, scale and rotations, in px and degrees), from when the element’s top
                passes {REVEAL_DEFAULTS.start.split(' ')[1]} of the window to {REVEAL_DEFAULTS.end.split(' ')[1]}, and
                keeps it once played. <C>scrollAnimate</C> takes the CSS values themselves, so it plays {BY_ANIMATE}{' '}
                more: blurs, perspective flips, slides by a percentage, and the exits. The other {CSS_ONLY} have stops
                between their two ends, which a from and a to cannot hold; their scroll version is CSS only.
              </p>
              <Note k="once">
                <C>once: true</C>, on by default in scrollReveal, keeps an entrance in place after it has played. With a
                cubic-bezier that goes past 1, svg-scroll-draw 2.23.2 and earlier keep the highest eased value reached,
                so the element stops on the overshoot; 2.23.3 keeps the furthest scroll progress and eases it after, so
                it settles where it should. The generated code says so when your curve overshoots.
              </Note>
              <p className="stk-p stk-more">
                More on the CSS side: the <Link href="/css-scroll-driven-animation-generator">CSS scroll-driven animation
                generator</Link>. More on the library side: the <Link href="/scroll-reveal-generator">scroll reveal
                generator</Link>.
              </p>
            </Sec>

            <Sec n={5} k="Less motion" id="motion" title="Reduced motion, built in">
              <p className="stk-p">
                Every CSS output carries a <C>prefers-reduced-motion</C> rule. It does not remove the animation: it
                makes it one instant frame, so the element ends where it would have, an exit still hides it, and
                any script waiting for <C>animationend</C> still hears it. An infinite loop runs once.
              </p>
              <CodeBox file="reduced-motion.css">{REDUCED}</CodeBox>
              <Note k="On scroll">
                The scroll-driven CSS only applies under <C>prefers-reduced-motion: no-preference</C>, so the element is
                simply shown. scrollReveal and scrollAnimate show the end state at once; for an exit that end is hidden,
                so the generated JavaScript leaves an exit off for those readers.
              </Note>
            </Sec>

            <Sec n={6} k="Next step" id="use" title="Use it in your project">
              <p className="stk-p">
                The CSS, Shorthand and On scroll · CSS tabs need nothing installed. The On scroll · JS tab calls
                svg-scroll-draw: <C>scrollReveal</C>, from <C>svg-scroll-draw/reveal</C>, for {BY_REVEAL} of the
                entrances, and <C>scrollAnimate</C>, from the main entry, for {BY_ANIMATE} more effects:{' '}
                <Link href="/docs#scroll-animate">scrollAnimate in the docs</Link>. The row under the code saves the tab
                on show as a page that runs on its own: the CSS on a card with a Replay button, or a page to scroll for
                the scroll versions, where the JavaScript one loads the library from jsDelivr as an ES module, pinned to{' '}
                {SELF.version}.
              </p>
              <ToolNextStep
                slug="css-keyframes-animation-generator"
                api="scrollReveal"
                entry="reveal"
                docs="/docs#scroll-reveal"
                related={['css-scroll-driven-animation-generator', 'cubic-bezier-generator']}
              />
            </Sec>

            <Sec n={7} k={`${FAQ.length} questions`} id="faq" title="CSS animation questions">
              <div className="stk-faq">
                {FAQ.map((f, i) => (
                  <div key={f.q} className="stk-q">
                    <span className="stk-q-n">Q{i + 1}</span>
                    <div>
                      <h3 className="stk-q-t">{f.q}</h3>
                      <p className="stk-p">{f.a}</p>
                      {i === 4 && <CodeBox file="restart.js">{RESTART}</CodeBox>}
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
