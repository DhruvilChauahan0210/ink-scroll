import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/progressbar/progressbar.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { CopyCommand } from '@/components/home/CopyCommand';
import { ProgressBarGenerator } from '@/components/progressbar/ProgressBarGenerator';
import { ProgressFigure } from '@/components/progressbar/ProgressFigure';
import { DEFAULTS, LIB_DEFAULTS, OUTPUTS, SCOPES, STYLES, TRIGGER, css } from '@/components/progressbar/code';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searchers ask for "scroll progress bar", "reading progress bar", "scroll
// indicator css" and "react scroll progress"; the results are snippets and
// small generators. This one writes both answers: pure CSS on a scroll
// timeline, and scrollProgress for every browser and for React.
const TITLE = 'Scroll Progress Bar Generator: Reading Bar in CSS & React';
const DESCRIPTION =
  'Make a reading progress bar: top, bottom, side or a ring, for the whole page or one article. Preview it, then copy pure CSS or the JS and React code.';

const SLUG = '/scroll-progress-bar-generator';

/** The model, in effect: what scrollProgress works out for the page on each frame. */
const IN_EFFECT_JS = `// What scrollProgress(document.documentElement, {
//   trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' },
// }) works out on every frame, in effect:
const page = document.documentElement.getBoundingClientRect().height;
const start = 0;                    // the page's top at the window's top
const end = page - innerHeight;     // the page's bottom at the window's bottom
const progress = Math.min(1, Math.max(0, (scrollY - start) / (end - start)));

document.documentElement.style.setProperty('${LIB_DEFAULTS.variable}', String(progress));`;

const BAR_CSS = `.progress-bar {
  transform-origin: 0 50%;       /* grow from the left edge */
  transform: scaleX(var(${LIB_DEFAULTS.variable}, 0));
}`;

const HOOK_TSX = `'use client';

import { useScrollDrawProgress } from 'svg-scroll-draw/react';

/** The progress as a number in React, for a label rather than the bar. */
export function ReadingPercent() {
  const progress = useScrollDrawProgress('html', {
    trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' },
  });
  return <p className="reading-percent">{Math.round(progress * 100)}% read</p>;
}`;

const CONTAINER_JS = `import { scrollProgress } from 'svg-scroll-draw/progress';

// A panel that scrolls on its own: measure what is inside it, against it.
scrollProgress('.panel-content', {
  scrollContainer: '.panel',
  trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' },
  easedVariable: null,
});`;

const OPTIONS: { k: string; def: string; d: string }[] = [
  { k: 'variable', def: `'${LIB_DEFAULTS.variable}'`, d: 'The custom property the raw progress, 0 to 1, is written to, on the target element. Everything inside the element inherits it.' },
  { k: 'easedVariable', def: `'${LIB_DEFAULTS.easedVariable}'`, d: 'A second property holding the eased value. null skips it, which the generator does: a bar only reads the raw one.' },
  {
    k: 'trigger',
    def: `{ start: '${LIB_DEFAULTS.start}', end: '${LIB_DEFAULTS.end}' }`,
    d: `Where progress is 0 and where it is 1, as element edge then window edge. The default runs while any part of the element is on screen; a reading bar wants '${TRIGGER.start}' to '${TRIGGER.end}'.`,
  },
  { k: 'easing', def: `'${LIB_DEFAULTS.easing}'`, d: "Applies to the eased value only: 'ease-in', 'ease-out', 'ease-in-out', 'spring', 'bounce', 'elastic', or a function of t." },
  { k: 'speed', def: String(LIB_DEFAULTS.speed), d: 'Multiplies the progress before it is held between 0 and 1, so 2 fills the bar over the first half of the scroll.' },
  { k: 'axis', def: `'${LIB_DEFAULTS.axis}'`, d: "'x' follows horizontal scrolling instead." },
  { k: 'scrollContainer', def: 'the window', d: 'An element, or a selector, that scrolls instead of the window: a modal, a side panel, the box in the preview above.' },
  { k: 'onProgress', def: 'none', d: 'Called with the raw and eased values when it starts and on every frame while the element is on screen.' },
];

const COMPARE: { k: string; css: string; js: string }[] = [
  { k: 'JavaScript', css: 'None', js: 'One property write a frame while the target is on screen; the whole page always is' },
  { k: 'Browsers', css: 'Chrome and Edge 115+, Safari 26+, Firefox 159+', js: 'Chrome and Edge 80+, Safari 14+, Firefox 75+: the library’s own floor' },
  { k: 'One article', css: 'A named view-timeline on it, animation-range: contain', js: `Target it, trigger '${TRIGGER.start}' → '${TRIGGER.end}'` },
  { k: 'A scrolling panel', css: 'A named scroll-timeline on it', js: 'The scrollContainer option' },
  { k: 'A callback', css: 'None', js: 'onProgress(raw, eased)' },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make a scroll progress bar with CSS only?',
    a: 'Give a fixed bar a CSS animation from scaleX(0) to scaleX(1), and set animation-timeline: scroll(root block) with animation-duration: auto and animation-fill-mode: both. The page’s scroll position then drives it with no JavaScript. Chrome and Edge 115+, Safari 26+ and Firefox 159+ support it. Give the bar transform: scaleX(0) as its own style too: on a page too short to scroll the timeline is inactive, the animation applies nothing, and the bar would show full. Wrap it all in @supports (animation-timeline: scroll()): a browser that ignores the timeline runs the keyframes as an ordinary animation of no length and also leaves the bar full.',
  },
  {
    q: 'How do I add a reading progress bar in React or Next.js?',
    a: `Write a client component that calls scrollProgress(document.documentElement, { trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' } }) in a useEffect and returns progress.destroy() as its cleanup, and renders a fixed div whose CSS is transform: scaleX(var(--scroll-progress, 0)). In the Next.js App Router, mark the file 'use client' and render it once in app/layout.tsx. The React tab of the generator writes the whole file.`,
  },
  {
    q: 'How do I show reading progress for one article, not the whole page?',
    a: `Measure the article instead of the page: scrollProgress('article', { trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' } }) is 0 when the article’s top reaches the top of the window and 1 when its bottom reaches the bottom of it. Put the bar inside the article, so it inherits the --scroll-progress written there. In CSS only, give the article view-timeline-name: --article and the bar inside it animation-timeline: --article with animation-range: contain 0% contain 100%. Either way the article has to be taller than the window.`,
  },
  {
    q: 'Why scale the bar with transform instead of changing its width?',
    a: 'Changing width makes the browser redo layout on every frame of scrolling. A transform scales a bar that is already full width, with no layout at all, so it stays smooth on long pages, and in the CSS-only version the browser can run it off the main thread.',
  },
  {
    q: 'Can I make a circular scroll progress indicator?',
    a: 'Yes: an SVG circle whose stroke-dasharray is its circumference, 2πr, and whose stroke-dashoffset goes from the circumference to 0 as you scroll, calc(C * (1 - var(--scroll-progress))). Rotate it -90° so it starts at twelve o’clock. Pick ring in the generator and it works out the numbers for your stroke.',
  },
  {
    q: 'How do I track scroll progress inside a scrolling div?',
    a: `Pass the div as scrollContainer and measure the element inside it that holds the content: scrollProgress('.panel-content', { scrollContainer: '.panel', trigger: { start: '${TRIGGER.start}', end: '${TRIGGER.end}' } }). Put the bar first inside .panel-content with position: sticky and top: 0, not fixed, so it inherits the variable and stays at the top of the panel. In CSS only, name the div’s timeline with scroll-timeline-name and set the bar’s animation-timeline to that name; keep the bar inside the div, since Chrome lets only an element’s descendants use the timeline it names.`,
  },
  {
    q: 'Should a reading progress bar be hidden from screen readers?',
    a: 'Yes. It repeats what the scrollbar already shows and has nothing useful to say aloud, so the generated markup marks it aria-hidden="true". It moves only while the reader scrolls, so it is never motion they did not start.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'how', label: 'How scroll becomes a bar' },
  { id: 'css', label: 'CSS only: scroll()' },
  { id: 'react', label: 'React and Next.js' },
  { id: 'options', label: `Options · ${OPTIONS.length}` },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'scroll progress bar', 'reading progress bar', 'scroll indicator css', 'react scroll progress',
    'reading progress indicator', 'scroll progress css', 'animation-timeline scroll()', 'progress bar on scroll',
    'nextjs reading progress bar', 'circular scroll progress',
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
      name: 'Scroll progress bar generator',
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

export default function ScrollProgressBarGeneratorPage() {
  return (
    <SiteShell
      active={SLUG}
      crumbs={[['Scroll progress bar generator', SLUG]]}
      kicker="progress / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / scroll progress</span>
              <span>css · javascript · react</span>
            </p>
            <h1 className="pg-title stk-title">Scroll progress bar generator</h1>
            <p className="pg-lede">
              A reading progress bar that fills as the page scrolls. Pick the edge, the thickness and whether it follows
              the whole page or one article, scroll the preview, then copy it as pure CSS, or as JavaScript and React
              that work where CSS scroll timelines do not.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <CopyCommand />
            </div>
            <dl className="pg-facts">
              <div><dt>Styles</dt><dd>{STYLES.length}</dd></div>
              <div><dt>Follows</dt><dd>{SCOPES.length}</dd></div>
              <div><dt>Outputs</dt><dd>{OUTPUTS.length}</dd></div>
              <div><dt>Licence</dt><dd>{SELF.license}</dd></div>
            </dl>
          </div>
          <ProgressFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make your progress bar">
              <ProgressBarGenerator />
            </Sec>

            <Sec n={2} k="The model" id="how" title="How scroll becomes a bar">
              <p className="stk-p">
                The bar has one number behind it, from 0 to 1: how far the window has travelled down the page, over how
                far it can travel (fig. 1). That is 0 with the page’s top at the window’s top and 1 with its bottom at
                the window’s bottom, which is the trigger <C>{`'${TRIGGER.start}'`}</C> to <C>{`'${TRIGGER.end}'`}</C>.
                scrollProgress writes it into <C>{LIB_DEFAULTS.variable}</C> on the element it measures.
              </p>
              <CodeBox file="in-effect.js">{IN_EFFECT_JS}</CodeBox>
              <p className="stk-p pbg-gap">
                The bar is full width from the start and the variable scales it. A transform never makes the browser redo
                layout, where changing <C>width</C> would on every frame.
              </p>
              <CodeBox file="progress.css">{BAR_CSS}</CodeBox>
              <Note k="One article">
                Measure the article instead, with the same trigger: 0 when its top reaches the top of the window, 1 when
                its bottom reaches the bottom. The variable is written on the article, so the bar goes inside it to
                inherit it, and stays fixed to the window from there.
              </Note>
              <Note k="Short articles">
                The article has to be taller than the window. A shorter one has its bottom reach the bottom of the window
                before its top reaches the top, so the trigger runs backwards: scrollProgress holds the bar full until the
                whole article is in view, then empties it as the article moves up. The CSS view timeline fills it only
                while the whole article is in view.
              </Note>
              <Note k="html height">
                If a stylesheet sets <C>html {'{ height: 100% }'}</C>, the page’s box is only as tall as the window and
                scrollProgress keeps the bar at 0. Measure the element that wraps your content instead. The CSS-only
                version reads the scroll position itself and is not affected.
              </Note>
            </Sec>

            <Sec n={3} k="animation-timeline" id="css" title="CSS only: animation-timeline: scroll()">
              <p className="stk-p">
                Browsers with scroll-driven animations can do all of it in CSS. <C>scroll(root block)</C> is the
                page’s own scroll position as an animation timeline; <C>animation-duration: auto</C> stretches the
                keyframes over the whole of it, and <C>animation-fill-mode: both</C> holds 0 before and 1 after.
                This is what the CSS only tab writes for a bar along the top:
              </p>
              <CodeBox file="progress.css">{css({ ...DEFAULTS }, 'css')}</CodeBox>
              <Note k="The fallback">
                A browser without scroll timelines ignores <C>animation-timeline</C> and plays the keyframes as an
                ordinary animation of no length, which leaves the bar full. The <C>@supports</C> block keeps it hidden
                there instead; the JavaScript version is the one that works in those browsers.
              </Note>
              <Note k="Nothing to scroll">
                On a page shorter than the window, <C>scroll(root)</C> has no distance to measure: the timeline is
                inactive and the animation applies nothing, so a bar with no transform of its own would show full. The
                generated CSS gives it the first keyframe as its own style, and it stays empty there.
              </Note>
              <Note k="The shorthand">
                <C>animation</C> resets <C>animation-timeline</C>, so a shorthand written after the timeline undoes it.
                Longhands, as here, avoid the trap.
              </Note>
              <div className="pbg-cmp-wrap">
                {/* Explicit roles: on a phone the rows become grids, and a changed display
                    can cost a table its semantics in some browsers. */}
                <table className="pbg-cmp" role="table">
                  <thead role="rowgroup">
                    <tr role="row">
                      <th role="columnheader" scope="col">Need</th>
                      <th role="columnheader" scope="col">{OUTPUTS[0]}</th>
                      <th role="columnheader" scope="col">scrollProgress</th>
                    </tr>
                  </thead>
                  <tbody role="rowgroup">
                    {COMPARE.map((r) => (
                      <tr key={r.k} role="row">
                        <th role="rowheader" scope="row">{r.k}</th>
                        <td role="cell" data-k={OUTPUTS[0]}>{r.css}</td>
                        <td role="cell" data-k="scrollProgress">{r.js}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Sec>

            <Sec n={4} k="Client component" id="react" title="React and Next.js">
              <p className="stk-p">
                The React tab writes a client component that starts scrollProgress in an effect and destroys it in the
                cleanup. It never sets state: the bar is CSS reading the variable, so the component renders once and
                scrolling costs React nothing.
              </p>
              <p className="stk-p">
                <C>svg-scroll-draw/react</C> also has a hook, <C>useScrollDrawProgress</C>, that returns the progress
                as a number. It suits a value you need in React, such as a percentage label, but it re-renders the
                component as the value changes, and for readers who ask for reduced motion it returns 1 at once, which
                for a reading bar would mean a full bar. The effect follows the scroll for everyone.
              </p>
              <CodeBox file="ReadingPercent.tsx">{HOOK_TSX}</CodeBox>
              <Note k="Next.js">
                Mark the file <C>{"'use client'"}</C> and render it once in <C>app/layout.tsx</C>. The effect only runs
                in the browser, and scrollProgress returns an inert instance where there is no window, so server
                rendering never reaches the DOM.
              </Note>
            </Sec>

            <Sec n={5} k={`${OPTIONS.length} options`} id="options" title="Every scrollProgress option">
              <div className="stk-faq pbg-opts">
                {OPTIONS.map((o) => (
                  <div key={o.k} className="stk-q">
                    <span className="stk-q-n">{o.k}</span>
                    <div>
                      <p className="stk-p"><C long>{o.def}</C> by default. {o.d}</p>
                    </div>
                  </div>
                ))}
              </div>
              <CodeBox file="panel.js">{CONTAINER_JS}</CodeBox>
              <Note k="The instance">
                scrollProgress returns an instance: <C>destroy()</C> stops it and removes both properties,{' '}
                <C>pause()</C> and <C>resume()</C> stop and restart it, <C>seek(p)</C> writes a value and pauses, and{' '}
                <C>replay()</C> measures the element again. It also measures again by itself when the window resizes
                or something in or above the element changes size, such as an image loading.
              </Note>
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Scroll progress bar questions">
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
                scrollProgress in svg-scroll-draw {SELF.version}: <Link href="/docs#scroll-progress">the docs</Link>.
                More tools: the <Link href="/text-animation-generator">text animation generator</Link> and the{' '}
                <Link href="/svg-path-viewer">SVG path viewer</Link>.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
