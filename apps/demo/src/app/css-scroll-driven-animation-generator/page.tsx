import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/cssdriven/cssdriven.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { BROWSER_SUPPORT, CROSSING_RANGES, EASING_KEYS, LIB, PRESETS, RANGES } from '@/data/cssdriven';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { CssDrivenGenerator } from '@/components/cssdriven/CssDrivenGenerator';
import { RangeFigure } from '@/components/cssdriven/RangeFigure';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searches this answers: "css scroll driven animations", "animation-timeline
// view", "animation-range", "scroll timeline css generator". The tool writes
// the CSS; the sections explain the ranges and where svg-scroll-draw fits.
const SLUG = '/css-scroll-driven-animation-generator';
const TITLE = 'CSS Scroll-Driven Animation Generator: animation-range';
const DESCRIPTION =
  'Build CSS scroll-driven animations: pick a preset, set animation-timeline view() or scroll() and animation-range, watch it run, copy the CSS with a fallback.';

const TIMELINES_CSS = `/* view(): this element’s own way through its nearest scroller. */
.card {
  animation: fade-up auto linear both;
  animation-timeline: view();          /* after the shorthand, which resets it */
  animation-range: entry 0% cover 50%;
}

/* scroll(): a scroller’s position, 0% at the top, 100% at the bottom.
   root is the page; nearest, the default, is the closest scrolling ancestor. */
.progress {
  animation: grow auto linear both;
  animation-timeline: scroll(root);
}

/* A named timeline, for when the element that moves is not the one that
   crosses the screen: the section names it, its children use it. */
.section { view-timeline: --section block; }
.section .title {
  animation: fade-up auto linear both;
  animation-timeline: --section;
  animation-range: entry 0% entry 100%;
}

/* timeline-scope lifts the name to an ancestor, so elements outside the
   section can use it too. */
.page { timeline-scope: --section; }`;

const DETECT_CSS = `/* The animation, only where the browser can run it. Everywhere else
   this block is skipped and the element shows as written. */
@supports (animation-timeline: view()) {
  .reveal {
    animation: fade-up auto linear both;
    animation-timeline: view();
    animation-range: entry 0% cover 50%;
  }
}`;

const DETECT_JS = `if (!CSS.supports('animation-timeline: view()')) {
  // No scroll timelines here: run the JavaScript version, or nothing.
}`;

const NATIVE_JS = `import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate('#card', {
  props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] },
});`;

const NATIVE_CSS = `/* What it writes in a browser with view() (one line in a <style>; formatted here). */
@keyframes ssd-a-1 {
  from { opacity: 0; transform: translateY(40px) }
  to   { opacity: 1; transform: translateY(0px) }
}
.ssd-a-1 {
  animation-name: ssd-a-1;
  animation-duration: auto;
  animation-timing-function: cubic-bezier(0.333333, 0.666667, 0.666667, 1);
  animation-fill-mode: both;
  animation-timeline: view();
  animation-range: cover 0% cover 100%;
}`;

/** When scrollAnimate and scrollDraw take the native path: nativeEligible() in animate/engine.ts and core/engine.ts. */
const NATIVE_WHEN: { c: string; d: string }[] = [
  { c: 'native is not false', d: 'It is on by default; native: false always runs the JavaScript engine.' },
  { c: 'The browser supports view()', d: 'Tested with CSS.supports(), as above. scrollDraw also needs named view timelines: it names one on the container you pass, so that box sets the range.' },
  { c: `easing is ${EASING_KEYS.join(', ')}`, d: 'Written as the curves the engine runs, not CSS’s keywords of the same name: ease-in and ease-out exactly, as t² and t(2 − t), and ease-in-out as linear() through 33 stops. The library writes no CSS for spring, bounce, elastic or a function, so those stay on the engine.' },
  { c: `The default trigger, '${LIB.start}' → '${LIB.end}'`, d: 'That is cover 0% → cover 100%. Any other window, like the generator’s default, runs on the engine over the same stretch.' },
  { c: 'once off, speed 1, axis y', d: 'CSS progress cannot latch at the furthest point reached, and the native path follows the vertical axis only.' },
  { c: 'No scrollContainer, no triggerElement', d: 'The CSS path measures the animated element (for scrollDraw, its container) in its nearest scroller, so a container you name, or scrollAnimate’s separate trigger element, keeps the engine.' },
  { c: 'No callbacks, no velocityScale', d: 'onProgress, onComplete, onEnter and the rest need a frame of JavaScript to fire from.' },
  { c: 'scrollAnimate: props CSS can animate', d: `${LIB.nativeProps.join(', ')}.` },
  { c: 'scrollDraw: plain drawing', d: 'None of stagger, clip, morphTo, waypoints, repeat, delay, autoReverse, or stroke and fill changes. From 2.23.3, no autoplay or debug either: in 2.23.2 and earlier, autoplay: true or debug: true on an otherwise plain drawing still took the CSS path, so an autoplay drawing followed the scroll instead of playing over its duration.' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'What are CSS scroll-driven animations?',
    a: 'Animations whose progress follows scrolling instead of a clock. You write ordinary @keyframes, set animation-timeline to view() (an element crossing its scroller) or scroll() (a scroller’s position), and animation-range to choose which stretch of the scroll plays them. The browser runs them with no JavaScript, and for transform and opacity it can keep them off the main thread.',
  },
  {
    q: 'What is the difference between view() and scroll()?',
    a: 'scroll() follows a scroller’s position, 0% at the top and 100% at the bottom, the same for every element that uses it: it suits progress bars and effects tied to the whole page. view() follows one element’s journey through its scroller, from its first pixel in to its last pixel out, so each element gets its own timeline: that is the one for reveals. Both find their scroller themselves; named timelines (scroll-timeline, view-timeline) point at a particular one.',
  },
  {
    q: 'How does animation-range work?',
    a: 'It sets where on the timeline the animation starts and ends. For view(), each end is a named range and a percentage: cover is the whole crossing, entry while the element comes in, exit while it goes out, contain while it is fully in view. entry 0% cover 50% starts as the element appears and finishes when its centre reaches the centre of the view. Without animation-range, a view() animation runs over all of cover.',
  },
  {
    q: 'Which browsers support animation-timeline?',
    a: `Chrome and Edge since 115, Safari since 26, and Firefox since 159, which turned it on by default in October 2026; before that Firefox kept it behind a preference. Older browsers ignore it. Rather than trust a table, test it: @supports (animation-timeline: view()) in CSS, or CSS.supports('animation-timeline: view()') in JavaScript. The generator above runs that test on your browser.`,
  },
  {
    q: 'Why is my scroll-driven animation not working?',
    a: 'The usual causes: animation-timeline comes before the animation shorthand, which resets it; an ancestor has overflow: hidden, which makes it a scroll container, so view() follows that box, which never scrolls (overflow: clip does not do this); a named range such as entry or exit is used with scroll(), whose timeline has none, so the browser ignores it and plays over the whole scroll; or the browser has no support and the @supports block is skipped. The generator’s reveal CSS is also off, on purpose, for readers who ask for reduced motion.',
  },
  {
    q: 'Can a CSS scroll-driven animation play only once?',
    a: 'No. Its progress is the scroll position, so scrolling back plays it backwards. To play once and stay, you need JavaScript: add a class with a time-based animation when the element enters, or use svg-scroll-draw’s once option, which keeps the furthest progress reached. once runs on the library’s JavaScript engine, since CSS cannot latch.',
  },
  {
    q: 'Does svg-scroll-draw use CSS scroll-driven animations?',
    a: 'Yes, when it can. scrollAnimate writes @keyframes with animation-timeline: view() and animation-range: cover 0% cover 100%, and scrollDraw the same on a view timeline named on its container, when the browser supports it and the options are ones CSS can express (the default trigger, an easing CSS can write, no once, no callbacks), and run their JavaScript engine everywhere else, to the same result. native: false turns the CSS path off.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'ranges', label: `animation-range · ${RANGES.length + CROSSING_RANGES.length} names` },
  { id: 'timelines', label: 'view() and scroll()' },
  { id: 'support', label: 'Support and the fallback' },
  { id: 'library', label: 'The same CSS, from the library' },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'css scroll driven animations', 'scroll-driven animations', 'animation-timeline', 'animation-timeline view',
    'animation-range', 'view timeline', 'scroll timeline css', 'scroll timeline css generator',
    'css scroll animation generator', 'view-timeline', 'animation-timeline scroll',
  ],
  alternates: { canonical: SLUG },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}${SLUG}` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'CSS scroll-driven animation generator',
      url: `${SITE_URL}${SLUG}`,
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

export default function CssScrollDrivenAnimationGeneratorPage() {
  return (
    <SiteShell
      active={SLUG}
      crumbs={[['CSS scroll-driven animation generator', SLUG]]}
      kicker="css / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / scroll-driven css</span>
              <span>view() · scroll() · animation-range</span>
            </p>
            <h1 className="pg-title stk-title cssd-title">CSS <span className="cssd-nowrap">scroll-driven</span> animation generator</h1>
            <p className="pg-lede">
              Pick an effect, choose the stretch of scroll it plays over with <C>animation-range</C>, and watch it run
              on <C>animation-timeline: view()</C> or <C>scroll()</C> in a box you scroll. Then copy the CSS, with a
              fallback for browsers that lack it, or the same animation as svg-scroll-draw code.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <Link href="/blog/native-css-svg-scroll-animations" className="btn" data-magnetic>The native path, in depth →</Link>
            </div>
            <dl className="pg-facts">
              <div><dt>Presets</dt><dd>{PRESETS.length}</dd></div>
              <div><dt>Ranges to pick</dt><dd>{RANGES.length}</dd></div>
              <div><dt>Easings</dt><dd>{EASING_KEYS.length}</dd></div>
              <div><dt>JS per frame</dt><dd>0</dd></div>
            </dl>
          </div>
          <RangeFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title={<>Make a <span className="cssd-nowrap">scroll-driven</span> animation</>}>
              <CssDrivenGenerator />
            </Sec>

            <Sec n={2} k={`${RANGES.length + CROSSING_RANGES.length} named ranges`} id="ranges" title={<>How <span className="cssd-nowrap">animation-range</span> works</>}>
              <p className="stk-p">
                A <C>view()</C> timeline follows one element through its scroller: 0% when its top reaches the bottom
                of the view, 100% when its bottom leaves the top (fig. 1). <C>animation-range</C> picks the stretch of
                that journey the animation plays over, as a named range and a percentage at each end.{' '}
                <C>entry 0% cover 50%</C> starts as the element appears and finishes as its centre reaches the centre
                of the view. Before the start it holds its first keyframe and after the end its last, which is what{' '}
                <C>animation-fill-mode: both</C> does.
              </p>
              <div className="cssd-scroll">
                <table className="cssd-table">
                  <thead>
                    <tr><th>Range</th><th>0% is when the element’s…</th><th>100% is when…</th><th>Scroll</th><th>svg-scroll-draw trigger</th></tr>
                  </thead>
                  <tbody>
                    {RANGES.map((r) => (
                      <tr key={r.name}>
                        <td>{r.name}</td>
                        <td data-k="0% is when the element’s…">{r.at0}</td>
                        <td data-k="100% is when…">{r.at100}</td>
                        <td data-k="Scroll" className="is-mono">{r.length}</td>
                        <td data-k="svg-scroll-draw trigger" className="is-mono">{`'${r.trigger[0]}' → '${r.trigger[1]}'`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="stk-p stk-more">
                H is the scroller’s height and h the element’s, for an element shorter than its scroller.{' '}
                {RANGES.map((r) => `${r.name[0].toUpperCase()}${r.name.slice(1)}: ${r.d}`).join(' ')}
              </p>
              <Note k="Taller elements">
                For an element taller than its scroller, contain flips: it runs while the element covers the whole
                view, from its top at the top to its bottom at the bottom. The other two names, <C>{CROSSING_RANGES[0]}</C>{' '}
                and <C>{CROSSING_RANGES[1]}</C>, differ from entry and exit only then: entry runs until the top reaches
                the top, entry-crossing until the bottom reaches the bottom.
              </Note>
              <Note k="Percentages">
                0% and 100% are the ends of the named range, but values past them (<C>cover 120%</C>) and lengths
                (<C>entry 40px</C>) work too, and the two ends can use different names: <C>entry 0% exit 100%</C> is
                the same stretch as <C>cover</C>.
              </Note>
            </Sec>

            <Sec n={3} k="Two timelines" id="timelines" title="view() and scroll()">
              <p className="stk-p">
                Both are anonymous timelines: they find their scroller themselves. <C>scroll()</C> is a scroller’s own
                position, 0% at the top and 100% at the bottom; <C>scroll(root)</C> is the page, and <C>scroll()</C> on
                its own the nearest scrolling ancestor. <C>view()</C> is one element’s way through its nearest scroller,
                which is why the same CSS works on a page and in the generator’s box. When the element that moves is
                not the one crossing the screen, name a timeline instead.
              </p>
              <CodeBox file="timelines.css">{TIMELINES_CSS}</CodeBox>
              <Note k="The shorthand">
                <C>animation</C> resets <C>animation-timeline</C>, so write the timeline after it, or use the
                longhands as the generator does.
              </Note>
              <Note k="overflow: hidden">
                It makes an element a scroll container. An ancestor with it becomes the scroller <C>view()</C>{' '}
                follows, and since that box never scrolls, nothing moves. <C>overflow: clip</C> clips without it.
              </Note>
            </Sec>

            <Sec n={4} k="Detect, then decide" id="support" title="Browser support and the fallback">
              <p className="stk-p">
                Test for the feature instead of the browser: <C>@supports (animation-timeline: view())</C> in CSS,{' '}
                <C long>{"CSS.supports('animation-timeline: view()')"}</C> in JavaScript, the same test svg-scroll-draw
                makes before its native path. Where it stands in November 2026:
              </p>
              <div className="cssd-scroll">
                <table className="cssd-table">
                  <thead><tr><th>Browser</th><th>Since</th><th>Notes</th></tr></thead>
                  <tbody>
                    {BROWSER_SUPPORT.map((b) => (
                      <tr key={b.browser}><td>{b.browser}</td><td data-k="Since" className="is-mono">{b.since}</td><td data-k="Notes">{b.note}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="stk-p stk-more">
                A browser without it skips the whole block, so the element shows as written: nothing hidden, nothing
                broken, just no motion. For most reveals that is the right fallback. When the motion matters, run the
                same animation in JavaScript only where the test fails: the generator’s fallback option writes that
                file, with svg-scroll-draw over the same stretch of scroll.
              </p>
              <CodeBox file="detect.css">{DETECT_CSS}</CodeBox>
              <CodeBox file="detect.js">{DETECT_JS}</CodeBox>
              <Note k="Reduced motion">
                The generated CSS sits inside <C long>@media (prefers-reduced-motion: no-preference)</C>, so readers
                who ask for less motion get no animation and see the element as written: for an effect that plays in,
                its end state. svg-scroll-draw skips the animation too, also when the setting changes while the page is
                open, but sets the end values, so a fade that plays out leaves scrollAnimate’s element hidden; its clip
                reveal shows in full either way. The progress bar is left alone: it only moves as the reader scrolls.
              </Note>
            </Sec>

            <Sec n={5} k="svg-scroll-draw" id="library" title="The same CSS, from the library">
              <p className="stk-p">
                scrollAnimate and scrollDraw have a native path. When the browser passes the test and the options are
                ones CSS can express, they write a <C>{'<style>'}</C> with <C>@keyframes</C> and a view timeline
                (<C>view()</C> for scrollAnimate, one named on the container for scrollDraw), add a class, and leave
                the scroll to the browser, with no JavaScript per frame. Otherwise they run their own engine, a frame loop
                that reads the scroll while the element is on screen, with the same curve over the same stretch of
                scroll.
              </p>
              <CodeBox file="main.js">{NATIVE_JS}</CodeBox>
              <CodeBox file="what it writes">{NATIVE_CSS}</CodeBox>
              <p className="stk-p stk-more">It takes that path only when all of these hold:</p>
              <div className="cssd-scroll">
                <table className="cssd-table">
                  <thead><tr><th>Condition</th><th>Why</th></tr></thead>
                  <tbody>
                    {NATIVE_WHEN.map((r) => <tr key={r.c}><td>{r.c}</td><td>{r.d}</td></tr>)}
                  </tbody>
                </table>
              </div>
              <Note k="The preview">
                In svg-scroll-draw mode the generator passes its box as <C>scrollContainer</C>, which keeps the
                library on its engine: you are watching the fallback, the code a browser without scroll timelines
                runs. One difference shows on entry: the engine wakes an element when its box comes into view, and a
                y offset or a small scale holds that box back, so it starts later than the CSS and catches up in one
                step.
              </Note>
              <Note k="Which to use">
                When the CSS alone does the job, use the CSS. The library is for what it cannot do: older browsers,
                playing once and staying, callbacks, staggered groups, line drawings with measured lengths, split text.
              </Note>
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Scroll-driven animation questions">
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
                The native path in depth: <Link href="/blog/native-css-svg-scroll-animations">zero-JS SVG scroll
                animations with native CSS</Link>. All of svg-scroll-draw {SELF.version}: <Link href="/docs">the docs</Link>, or the{' '}
                <Link href="/text-animation-generator">text animation generator</Link> for words and letters.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
