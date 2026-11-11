import type { Metadata } from 'next';
import '@/components/stack/stack.css';
import '@/components/counter/counter.css';
import Link from 'next/link';
import { SELF } from '@/data/competitors';
import { COUNTER_DEFAULTS, COUNTER_EASINGS, COUNTER_LOCALES } from '@/data/counter';
import { seoTitle } from '../_lib/seo';
import { SiteShell } from '@/components/site/SiteShell';
import { jsonLd, SITE_URL } from '@/lib/json-ld';
import { CodeBox } from '@/components/site/CodeBox';
import { CopyCommand } from '@/components/home/CopyCommand';
import { CounterGenerator } from '@/components/counter/CounterGenerator';
import { CountFigure } from '@/components/counter/CountFigure';
import { C, Note, Sec, Toc } from '@/components/stack/parts';

// Searchers type "animated counter", "number counter animation", "count up
// animation on scroll" and "react count up", and the results are snippets and
// online builders. This is a builder, and its output counts on scroll.
const TITLE = 'Animated Counter Generator: Count Up on Scroll, JS & React';
const DESCRIPTION =
  'Make a number count up as it scrolls into view: set from, to, decimals, prefix and easing, preview it, copy the JavaScript or React code. Free, MIT.';

const DEFAULT_TRIGGER = `{ start: '${COUNTER_DEFAULTS.start}', end: '${COUNTER_DEFAULTS.end}' }`;

const OPTIONS: { k: string; def?: string; required?: boolean; d: string }[] = [
  { k: 'to', required: true, d: 'The number it counts to.' },
  { k: 'from', def: String(COUNTER_DEFAULTS.from), d: 'The number it starts from. One larger than to counts down; negative numbers work too.' },
  { k: 'format', def: 'String(Math.round(n))', d: 'A function from the current value to the text shown, called on every frame. Left out, the number is rounded and printed with no separators.' },
  { k: 'decimals', d: 'Prints the value with n.toFixed(decimals). It replaces format entirely, so with a format function, set the decimals inside it instead.' },
  { k: 'easing', def: `'${COUNTER_DEFAULTS.easing}'`, d: `${COUNTER_EASINGS.map((e) => `'${e}'`).join(', ')}, or any function of t. A name it does not know falls back to '${COUNTER_DEFAULTS.easing}'.` },
  { k: 'trigger', def: DEFAULT_TRIGGER, d: 'Element edge and window edge, as in ScrollTrigger: the count starts when the element’s top is 80% down the window and is done at 20%.' },
  { k: 'once', def: String(COUNTER_DEFAULTS.once), d: 'Hold the furthest the reader has scrolled, instead of counting back down when they scroll up. In 2.23.2 and earlier it held the highest eased value instead, so spring and elastic stopped past to and bounce lost its dips; fixed in 2.23.3, which holds the scroll progress and eases after it.' },
  { k: 'onComplete', d: 'Called the first time the eased count reaches to, which with spring, bounce or elastic comes before the end of the window; with once: false, again each time it gets back there. Under reduced motion, at once.' },
];

const HOW_JS = `import { scrollCounter } from 'svg-scroll-draw';

// 0 when the element's top is 80% down the window, 1 when it is at 20%.
const users = scrollCounter('#users', { to: 12400 });

// Driving it by hand, as the generator's Play button does:
users.seek(0.5);   // 6200: from + (to − from) × 0.5, no easing; stops following the scroll
users.resume();    // follows the scroll again
users.destroy();   // stops for good`;

const PROGRESS_CSS = `/* The counter writes its eased progress on its own element:
   0 to 1, and past 1 with spring or elastic. */
#users {
  opacity: calc(0.25 + 0.75 * var(--scroll-draw-progress, 1));
}`;

const FORMAT_JS = `import { scrollCounter } from 'svg-scroll-draw';

// Make each formatter once: format is called on every frame with the raw value.
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
scrollCounter('#users', { to: 12400, format: (n) => whole.format(n) + '+' });   // 12,400+

const money = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
});
scrollCounter('#revenue', { to: 4200000, format: (n) => money.format(n) });     // $4.2M

// decimals alone is toFixed: no separators, and it replaces format entirely.
scrollCounter('#uptime', { to: 99.98, decimals: 2 });                          // 99.98`;

const A11Y_HTML = `<p class="stat">
  <!-- Read once, in full, by screen readers. -->
  <span class="sr-only">12,400+ users</span>
  <!-- What counts. It starts as the real number, so the HTML has it. -->
  <span aria-hidden="true"><span id="users">12,400+</span> users</span>
</p>

<style>
  .sr-only {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip-path: inset(50%); white-space: nowrap;
  }
  /* Every digit the same width, so the line does not shift as it counts. */
  #users { font-variant-numeric: tabular-nums; }
</style>`;

const SAMPLE = 1234567.891;
const COMPACT = 4200000;
const LOCALE_ROWS = COUNTER_LOCALES.map((l) => ({
  locale: l,
  full: new Intl.NumberFormat(l, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(SAMPLE),
  compact: new Intl.NumberFormat(l, { notation: 'compact', maximumFractionDigits: 1 }).format(COMPACT),
}));

const FAQ: { q: string; a: string }[] = [
  {
    q: 'How do I make a number count up when it scrolls into view?',
    a: "Put the number in an element and call scrollCounter('#users', { to: 12400 }) from svg-scroll-draw. It counts from 0 to 12400 as the element’s top moves from 80% to 20% of the window, so the count follows the scroll instead of a timer, and scrolling back up leaves it where it got to unless you set once: false. The generator above writes the call for you.",
  },
  {
    q: 'How do I format an animated counter with commas, a currency sign or a percent?',
    a: "Pass a format function. It is called on every frame with the raw value, so make an Intl.NumberFormat once and use it: format: (n) => nf.format(n) + '%'. Without format the number is rounded and printed with no separators (12400). The decimals option is toFixed, also without separators, and it replaces format entirely, so when you use a format function set the decimals in its Intl.NumberFormat options.",
  },
  {
    q: 'How do I make a count-up animation in React?',
    a: "Render <ScrollCounter to={12400} /> from svg-scroll-draw/react: it renders a span and takes the counter’s options as props. In the Next.js App Router a function such as format can only be passed from a client component, so put 'use client' at the top of the file that renders it. A new format arrow on every render does not rebuild the counter; changing a value such as to does.",
  },
  {
    q: 'Can the counter count down, or start from a number other than zero?',
    a: 'Yes. The number shown is from + (to − from) × the eased progress, so from: 2400, to: 180 counts down, and negative numbers work as well. from is 0 when you leave it out.',
  },
  {
    q: 'Are animated number counters accessible to screen readers?',
    a: 'scrollCounter rewrites the element’s text on every frame and adds no ARIA, so a screen reader that reaches it mid-count reads whatever number is showing. Put the final number in a visually hidden span and mark the counting element aria-hidden="true", so it is read once, in full. For readers who ask their system for reduced motion, the counter writes the final number at once.',
  },
  {
    q: 'Why does my counter stop before the final number?',
    a: "The end of its window was never reached. By default the count is done when the element’s top is 20% from the top of the window, and near the bottom of a page it may never scroll that high; with once on, it then stays where it stopped. End it sooner, for example trigger: { start: 'top bottom', end: 'bottom 90%' }, which finishes when the element’s bottom is 10% above the bottom of the window. In 2.23.2 and earlier, a spring or elastic easing with once on could also stop past the final number, on the top of its overshoot; 2.23.3 fixes that, and the count settles on the final number.",
  },
  {
    q: 'Can the counter run on a timer instead of the scroll?',
    a: 'It is made for the scroll, but every instance has seek(p), which sets the number to from + (to − from) × p, with p clamped to 0–1, and stops following the scroll. Calling seek from a requestAnimationFrame loop plays it over time, which is what the Play button above does. seek takes p as given, without the easing, so apply your own curve to it. Under reduced motion the counter has already written the final number, and seek does nothing.',
  },
];

const TOC = [
  { id: 'generator', label: 'The generator' },
  { id: 'how', label: 'How the number follows the scroll' },
  { id: 'format', label: 'Formatting the number' },
  { id: 'a11y', label: 'Screen readers' },
  { id: 'options', label: `Options · ${OPTIONS.length}` },
  { id: 'faq', label: `Questions · ${FAQ.length}` },
];

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'animated counter', 'animated number counter', 'number counter animation', 'count up animation on scroll',
    'count up animation', 'counter animation javascript', 'react count up', 'react number counter',
    'scroll counter', 'stats counter animation',
  ],
  alternates: { canonical: '/counter-animation-generator' },
  openGraph: { type: 'article', title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/counter-animation-generator` },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Animated counter generator',
      url: `${SITE_URL}/counter-animation-generator`,
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

export default function CounterAnimationGeneratorPage() {
  return (
    <SiteShell
      active="/counter-animation-generator"
      crumbs={[['Animated counter generator', '/counter-animation-generator']]}
      kicker="counter / your turn"
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(JSON_LD) }} />
      <div className="stk">

        <header className="pg-head stk-head">
          <div>
            <p className="pg-kicker">
              <span>tool / animated counter</span>
              <span>javascript · react</span>
            </p>
            <h1 className="pg-title stk-title">Animated counter generator</h1>
            <p className="pg-lede">
              Set where the number starts and ends, its decimals, a prefix or suffix and the easing, and watch it
              count. Then copy the code: plain JavaScript or a React component that counts up as the reader scrolls.
            </p>
            <div className="pg-actions">
              <a href="#generator" className="btn btn-solid" data-magnetic>Open the generator ↓</a>
              <CopyCommand />
            </div>
            <dl className="pg-facts">
              <div><dt>Options</dt><dd>{OPTIONS.length}</dd></div>
              <div><dt>Easings</dt><dd>{COUNTER_EASINGS.length}</dd></div>
              <div><dt>Locales</dt><dd>{COUNTER_LOCALES.length}</dd></div>
              <div><dt>Output</dt><dd>2</dd></div>
            </dl>
          </div>
          <CountFigure />
        </header>

        <div className="stk-body">
          <Toc label="On this page" items={TOC} />
          <div className="stk-main">

            <Sec n={1} k="The tool" id="generator" title="Make your counter">
              <CounterGenerator />
            </Sec>

            <Sec n={2} k="The model" id="how" title="How the number follows the scroll">
              <p className="stk-p">
                Behind the number is one value, its progress from 0 to 1: 0 when the element’s top crosses 80% of the
                window, 1 when it reaches 20% (fig. 1). The easing bends it, and the number shown is{' '}
                <C long>from + (to − from) × eased progress</C>, written again on every frame while the element is on
                screen. Scroll faster and it counts faster. Scroll back up and it stays where it got to, because{' '}
                <C>once</C> is on by default; with <C>once: false</C> it counts back down.
              </p>
              <CodeBox file="main.js">{HOW_JS}</CodeBox>
              <p className="stk-p ctr-after">
                The window is measured again when the page resizes or its layout moves. On each frame the counter also
                writes its eased progress to <C>--scroll-draw-progress</C> on the element, for anything else that
                should follow the count.
              </p>
              <CodeBox file="counter.css">{PROGRESS_CSS}</CodeBox>
              <Note k="Reduced motion">
                For readers who ask their system for less motion, the final number is written at once, with no count,
                and <C>onComplete</C> still runs; that holds when the setting is turned on while the page is open, too.
                On a page that loads that way the CSS variable is never written, so give <C>var()</C> a fallback of 1.
                Turned on mid-visit, the variable keeps the last value it had.
              </Note>
              <Note k="Already past">
                An element already above its window when the page loads shows its final number straight away, not{' '}
                <C>from</C>.
              </Note>
            </Sec>

            <Sec n={3} k="Intl.NumberFormat" id="format" title="Formatting the number">
              <p className="stk-p">
                Left alone, the counter rounds and prints the bare number: <C>12400</C>, not 12,400. The{' '}
                <C>format</C> option takes the raw value on every frame and returns the text, and the browser’s own{' '}
                <C>Intl.NumberFormat</C> does the rest: separators, decimals, currency and compact notation, in the
                reader’s language or yours. Make the formatter once, outside the function, and set{' '}
                <C>maximumFractionDigits</C>, or half way through a count it shows up to three decimals.
              </p>
              <CodeBox file="format.js">{FORMAT_JS}</CodeBox>
              <div className="ctr-scroll ctr-after">
                <table className="ctr-table">
                  <thead>
                    <tr><th>Locale</th><th>{SAMPLE}, 2 decimals</th><th>{COMPACT}, compact</th></tr>
                  </thead>
                  <tbody>
                    {LOCALE_ROWS.map((row) => (
                      <tr key={row.locale}><td>{row.locale}</td><td>{row.full}</td><td>{row.compact}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note k="decimals">
                <C>decimals</C> is the counter’s shortcut for <C>n.toFixed(decimals)</C>, and when it is set{' '}
                <C>format</C> is ignored. Use one or the other; the generator only writes <C>decimals</C> when nothing
                else about the number changes and the count stays on one side of zero.
              </Note>
              <Note k="Crossing zero">
                A count from below zero to above it passes values such as <C>-0.3</C>, which <C>toFixed</C> and{' '}
                <C>Intl.NumberFormat</C> both print as <C>-0</C>. The generator’s code formats those as 0.
              </Note>
            </Sec>

            <Sec n={4} k="Accessibility" id="a11y" title="A counter screen readers read once">
              <p className="stk-p">
                The counter replaces its element’s text on every frame and adds no role or live region, so a screen
                reader that lands on it mid-count reads the number showing at that moment, and nothing is announced
                as it changes. Give screen readers the final number in a visually hidden copy, and hide the counting
                one from them with <C>aria-hidden</C>. Write the real number into the HTML as well: search engines and
                anyone without JavaScript see it, and the counter writes over it when it starts. In React,{' '}
                <C>{'<ScrollCounter>'}</C> renders its span empty, so there the hidden copy is the only place the HTML
                has the number. The generator’s screen-reader copy setting adds the hidden copy and the aria-hidden to
                its code.
              </p>
              <CodeBox file="index.html">{A11Y_HTML}</CodeBox>
              <p className="stk-p ctr-after">
                The whole pattern, with the width held still while it counts: the{' '}
                <Link href="/examples/scroll-counter">stat row recipe</Link>.
              </p>
            </Sec>

            <Sec n={5} k={`${OPTIONS.length} options`} id="options" title="Every scrollCounter option">
              <div className="stk-faq">
                {OPTIONS.map((o) => (
                  <div key={o.k} className="stk-q">
                    <span className="stk-q-n">{o.k}</span>
                    <div>
                      <p className="stk-p">
                        {o.required ? 'Required. ' : o.def ? <><C>{o.def}</C> by default. </> : 'No default. '}
                        {o.d}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Sec>

            <Sec n={6} k={`${FAQ.length} questions`} id="faq" title="Animated counter questions">
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
                All of svg-scroll-draw {SELF.version}: <Link href="/docs#scroll-counter">scrollCounter in the docs</Link>,
                or the <Link href="/text-animation-generator">text animation generator</Link> for words instead of
                numbers.
              </p>
            </Sec>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
