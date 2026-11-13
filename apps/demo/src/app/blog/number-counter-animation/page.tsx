import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { SELF } from '@/data/competitors';
import { BlogArticle, Section, Code, Callout, Figure, Closing } from '@/components/blog/BlogArticle';
import { CurveFigure } from './CurveFigure';

// Searches this post is for: "number counter animation", "counter animation
// css", "count up animation javascript", "animated counter on scroll",
// "number animation". Every listing below was run in Chromium, Firefox and
// WebKit, and the CSS counter in Firefox with @property switched off.
const TITLE = 'How to Animate a Number Counter on Scroll (CSS and JS)';
const DESCRIPTION =
  'Count a number up as it scrolls into view: a pure-CSS @property counter, a requestAnimationFrame count-up with easing, Intl formatting, and no layout jitter.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/number-counter-animation';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'number counter animation',
    'counter animation css',
    'count up animation javascript',
    'animated counter on scroll',
    'number animation',
    'css @property counter',
    'animated number counter',
    'intl numberformat counter',
  ],
  alternates: { canonical: '/blog/number-counter-animation' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'How to animate a number counter on scroll (CSS and JavaScript)',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const CSS_HTML = `<p class="stat">
  <span class="visually-hidden">12,400 users</span>
  <span aria-hidden="true">
    <span class="css-count" style="--to: 12400"></span> users
  </span>
</p>`;

const CSS_COUNTER = `/* Register --n as a whole number, so the browser can animate it. */
@property --n {
  syntax: '<integer>';
  inherits: false;
  initial-value: 0;
}

.css-count {
  --n: var(--to);                    /* at rest: the final number */
  counter-reset: n calc(var(--n)) final var(--to);
  display: inline-grid;
  font-variant-numeric: tabular-nums;
}
/* Two layers in one cell: the final number, invisible, holds the width. */
.css-count::before,
.css-count::after {
  grid-area: 1 / 1;
  text-align: end;
}
.css-count::before { content: counter(final); visibility: hidden; }
.css-count::after  { content: counter(n); }

@media (prefers-reduced-motion: no-preference) {
  .css-count.is-waiting { --n: 0; }
  .css-count.is-in { animation: count-up 2s ease-out; }
}

/* No "to" keyframe: the count ends on the element's own --n. */
@keyframes count-up {
  from { --n: 0; }
}`;

const CSS_START_JS = `// Hold each counter at 0 until it is 20% above the bottom of the
// window, then let the CSS count. Once only.
const cssObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.replace('is-waiting', 'is-in');
    cssObserver.unobserve(entry.target);
  }
}, { rootMargin: '0px 0px -20% 0px' });

for (const el of document.querySelectorAll('.css-count')) {
  el.classList.add('is-waiting');
  cssObserver.observe(el);
}`;

const CSS_SCRUB = `/* Instead of the observer, no script at all: the count follows the scroll. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .css-count {
      animation: count-up ease-out both;
      animation-timeline: view();
      /* 0 when the whole number is on screen at the bottom,
         the final number when it reaches the middle */
      animation-range: entry 100% cover 50%;
    }
  }
}`;

const HTML = `<ul class="stats">
  <li>
    <span class="visually-hidden">12,400+ users</span>
    <span aria-hidden="true">
      <span class="count" id="users" data-to="12400" data-suffix="+">12,400+</span> users
    </span>
  </li>
  <li>
    <span class="visually-hidden">$86,500 raised</span>
    <span aria-hidden="true">
      <span class="count" data-to="86500" data-prefix="$">$86,500</span> raised
    </span>
  </li>
  <li>
    <span class="visually-hidden">Rated 4.8 out of 5</span>
    <span aria-hidden="true">
      Rated <span class="count" data-to="4.8" data-decimals="1">4.8</span> / 5
    </span>
  </li>
</ul>`;

const COUNT_JS = `// Fast at first, slow at the end: t × (2 − t), the curve
// svg-scroll-draw calls ease-out. Fig. 1 plots it against linear.
const easeOut = (t) => t * (2 - t);

function countUp(el, { from = 0, to, duration = 2000, format = Math.round }) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = format(to); // no count, just the final number
    return;
  }
  let start;
  function frame(now) {
    start ??= now; // the first frame's own clock, so t never goes below 0
    const t = Math.min(1, (now - start) / duration);
    el.textContent = format(from + (to - from) * easeOut(t));
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}`;

const FORMAT_JS = `// One formatter per counter, made once: it runs on every frame.
function formatterFor(el) {
  const decimals = Number(el.dataset.decimals ?? 0);
  const number = new Intl.NumberFormat(el.dataset.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const { prefix = '', suffix = '' } = el.dataset;
  return (n) => prefix + number.format(n) + suffix;
}`;

const INTL_JS = `new Intl.NumberFormat('en-US').format(1234567.5);  // "1,234,567.5"
new Intl.NumberFormat('de-DE').format(1234567.5);  // "1.234.567,5"
new Intl.NumberFormat('en-IN').format(1234567.5);  // "12,34,567.5"
new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(86500);  // "€86,500.00"
new Intl.NumberFormat('en-US', { style: 'percent' }).format(0.42);  // "42%"
new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(2480000);  // "2.5M"`;

const OBSERVE_JS = `const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    // Still below the line: wait. Above the window (the page opened
    // scrolled past it): count anyway, so it does not sit at 0.
    if (!entry.isIntersecting && entry.boundingClientRect.top > 0) continue;
    const el = entry.target;
    observer.unobserve(el); // count once
    countUp(el, { to: Number(el.dataset.to), format: formatterFor(el) });
  }
}, { rootMargin: '0px 0px -20% 0px' }); // once it is 20% above the bottom

// Under reduced motion, leave the number the HTML has.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  for (const el of document.querySelectorAll('.count')) {
    // Hold the width of the final number, which is in the HTML, then go to 0.
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    el.textContent = formatterFor(el)(0);
    observer.observe(el);
  }
}`;

const WIDTH_CSS = `.count {
  display: inline-block;               /* so min-width applies */
  text-align: end;                     /* digits grow to the left */
  font-variant-numeric: tabular-nums;  /* a 1 as wide as an 8 */
}`;

const VH_CSS = `.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}`;

const LIB_JS = `import { scrollCounter } from 'svg-scroll-draw';

const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

// 0 when the number's top is 80% of the way down the window,
// 12,400+ when it reaches 20%: the count follows the scroll.
scrollCounter('#users', {
  to: 12400,
  format: (n) => whole.format(n) + '+',
});`;

export default function Page() {
  return (
    <BlogArticle
      slug="number-counter-animation"
      jsonLd={articleJsonLd}
      tags={['counter', 'IntersectionObserver', 'Intl.NumberFormat']}
      title={<>How to animate a number counter on scroll (CSS and JavaScript)</>}
      lede={
        <>
          A number that counts up as it comes into view is a value that changes over time, a format for each step,
          and something that starts it when the reader gets there. CSS can now do the counting on its own; JavaScript
          does it anywhere, with separators and decimals. Here are both, the observer that starts them, the CSS that
          stops the width jumping, and what a screen reader should hear.
        </>
      }
      facts={[
        { k: 'Pure CSS', v: '@property · integer' },
        { k: 'JavaScript', v: 'requestAnimationFrame' },
        { k: 'scrollCounter', v: `in the ${SELF.gzipKb} KB main entry` },
      ]}
      figure={
        <Figure n={1} caption="the count-up below, counting to 12,400 over 2 s. With easeOut, t × (2 − t), the number is at 9,300 after one second, three quarters of the way, and spends the second second on the last quarter. Linear is the dashed line.">
          <CurveFigure />
        </Figure>
      }
      further={[
        { href: '/blog/css-scroll-driven-animations', label: 'CSS scroll-driven animations explained', blurb: 'view(), animation-range and the timeline behind the no-script counter here.' },
        { href: '/blog/reduced-motion-scroll-animations', label: 'Reduced motion for scroll animations', blurb: 'What prefers-reduced-motion asks for, and how each effect should answer it.' },
      ]}
    >
      <Section id="css" k="pure CSS" title="A number counter in CSS, with @property">
        <p>
          CSS cannot animate the text of an element, but it can print a counter, and since <code>@property</code> it
          can animate a number. Register a custom property as an <code>{'<integer>'}</code>, and the browser
          interpolates it between keyframes like any length or colour, in whole numbers (with one exception, below).
          Feed it to <code>counter-reset</code> and print the counter in <code>::after</code>, and the number on screen
          counts.
        </p>
        <Code file="index.html">{CSS_HTML}</Code>
        <Code file="counter.css">{CSS_COUNTER}</Code>
        <p>
          At rest <code>--n</code> is the final number, so a page without the script, and a reader who asks for
          reduced motion, sees 12400 straight away. A small observer holds it at 0 with one class, and swaps it for
          the class that runs the animation once the number is a fifth of the way up the window:
        </p>
        <Code file="counter.js">{CSS_START_JS}</Code>
        <p>
          Two details in the CSS are there for one engine each. WebKit, Safari’s engine, animates an{' '}
          <code>{'<integer>'}</code> property through fractions, 3096.9 and so on, and <code>counter-reset</code>{' '}
          rejects a fraction, so without the <code>calc()</code>, which rounds, Safari shows 0 for most of the count.
          And Firefox does not count towards
          a <code>var()</code> in a keyframe, it jumps, so the keyframes have no <code>to</code>: an animation
          without one ends on the element’s own value, which is <code>--to</code>.
        </p>
        <p>
          The two pseudo-elements keep the line still. Both sit in the same grid cell: <code>::before</code> prints
          the final number, invisibly, and so sets the width, and <code>::after</code> counts inside it, aligned to
          the right. With <code>tabular-nums</code> each digit keeps one width as it changes. The visually hidden
          copy and the <code>aria-hidden</code> are for screen readers, and come up again below.
        </p>
        <Callout k="browser support">
          <code>@property</code> is in Chrome and Edge 85+, Safari 16.4+ and Firefox 128+. A browser without it
          treats <code>--n</code> as plain text, which cannot be interpolated: instead of counting, the number jumps
          from 0 to the final one when the eased animation is half done, about 0.7 s into the 2 s. The final number
          is still right, and nothing breaks.
          What CSS cannot do is format: <code>counter()</code> prints whole numbers with no thousands separators and
          no decimals. For 12,400 or 4.8, use JavaScript.
        </Callout>
      </Section>

      <Section id="scrub" k="pure CSS, no script" title="Let the scroll run the CSS counter">
        <p>
          A scroll timeline can stand in for the observer. The count then follows the scroll instead of a clock: it
          runs as the number moves up the screen, and counts back down if the reader scrolls back.
        </p>
        <Code file="counter-scrub.css">{CSS_SCRUB}</Code>
        <p>
          Use this or the observer, not both. <code>view()</code> works in Chrome and Edge 115+, Safari 26+ and
          Firefox 159+; anywhere else the <code>@supports</code> block is skipped and the final number shows. How{' '}
          <code>entry</code> and <code>cover</code> ranges work is in{' '}
          <Link href="/blog/css-scroll-driven-animations">CSS scroll-driven animations explained</Link>.
        </p>
      </Section>

      <Section id="js" k="JavaScript" title="A count-up in JavaScript with requestAnimationFrame">
        <p>
          The JavaScript version writes the number into the element itself, so it can format each step. Start with
          the real numbers in the HTML: search engines and anyone without JavaScript see them, and the script
          measures them before it counts.
        </p>
        <Code file="index.html">{HTML}</Code>
        <p>
          The count is one function. On each frame it works out how far through the duration it is,{' '}
          <code>t</code> from 0 to 1, bends that with an easing, and writes{' '}
          <code>from + (to − from) × eased t</code>. The last frame has <code>t</code> at exactly 1, so the count ends
          on <code>to</code> itself, never on 12,399.
        </p>
        <Code file="count.js">{COUNT_JS}</Code>
        <p>
          Linear counting looks mechanical and seems to stop dead at the end; easing out slows the last few digits,
          which is how a counter settles (Fig. 1). Any function from 0 to 1 works: the{' '}
          <Link href="/easing-visualizer">easing visualizer</Link> plots the common ones, and copies them as code.
        </p>
      </Section>

      <Section id="format" k="Intl.NumberFormat" title="Separators, decimals, prefix and suffix">
        <p>
          <code>Math.round</code> prints 12400, not 12,400. <code>Intl.NumberFormat</code> adds the separators the
          reader’s language uses, and fixes the decimals. This reads the decimals, a prefix and a suffix from the
          element’s data attributes, and an optional <code>data-locale</code>; without one it formats in the
          reader’s own language.
        </p>
        <Code file="format.js">{FORMAT_JS}</Code>
        <p>
          Set both fraction digits. Left to its defaults, the formatter shows up to three decimals, and 600 ms into
          a count to 4.8 the number reads 2.448 instead of 2.4. The same formatter covers currency, percent
          and short forms:
        </p>
        <Code file="intl.js">{INTL_JS}</Code>
      </Section>

      <Section id="scroll" k="IntersectionObserver" title="Start it when it scrolls into view">
        <p>
          A counter below the fold that runs when the page loads has finished before anyone sees it. An{' '}
          <code>IntersectionObserver</code> starts each one when it is a fifth of the way up the window, then stops
          watching it, so it counts once.
        </p>
        <Code file="observe.js">{OBSERVE_JS}</Code>
        <p>
          Two cases are easy to miss. A page opened half way down, after a reload or from a link, has counters
          above the window that never cross into it, so the observer counts those at once rather than leaving them
          on 0. And everything that changes the number is behind the reduced-motion check, so for those readers the
          HTML’s own number stays put. To start the count as the number appears rather than a little later, drop
          the <code>rootMargin</code>.
        </p>
      </Section>

      <Section id="width" k="tabular-nums" title="Stop the width from jittering">
        <p>
          In most fonts a 1 is narrower than an 8, so as the digits change the number gets wider and narrower many
          times a second, and the word after it shakes. <code>font-variant-numeric: tabular-nums</code> gives every
          digit the same width. That still leaves the number growing from 0 to 12,400+, which is what the{' '}
          <code>min-width</code> line in the observer is for: it takes the width of the final number before the
          count replaces it.
        </p>
        <Code file="count.css">{WIDTH_CSS}</Code>
        <p>
          With both, the box is the same width on every frame, and <code>text-align: end</code> grows the digits
          from the right, the way a meter fills. If the counter uses a web font, the width is taken in whatever
          font has loaded at that moment, so let the font load before the script runs.
        </p>
      </Section>

      <Section id="a11y" k="Accessibility" title="Screen readers and reduced motion">
        <p>
          A counting element changes its text on every frame, sixty times a second on most screens. A screen reader that reaches it mid-count reads
          whichever number is showing, 3,871 users, and the HTML in both versions above avoids that: the counting part
          is <code>aria-hidden</code>, and a visually hidden copy of the whole sentence, with the final number, is
          what gets read, once.
        </p>
        <Code file="visually-hidden.css">{VH_CSS}</Code>
        <ul>
          <li>
            Do not put <code>aria-live</code> on a counter. It asks the screen reader to announce every change, and a
            count is a stream of them. The final number is not news; it only needs to be there when the reader
            arrives.
          </li>
          <li>
            An <code>aria-label</code> on the <code>span</code> is not a substitute. A plain <code>span</code> has
            no role, ARIA does not allow a name on it, and screen readers are free to ignore one.
          </li>
          <li>
            Reduced motion means no count, not a slower one. Every version here shows the final number at once: the
            CSS keeps its animation inside <code>prefers-reduced-motion: no-preference</code>, and the script checks{' '}
            <code>matchMedia</code> before it touches the number. More on what that setting asks for is in{' '}
            <Link href="/blog/reduced-motion-scroll-animations">reduced motion for scroll animations</Link>.
          </li>
        </ul>
      </Section>

      <Section id="library" k="svg-scroll-draw" title="The same with a library">
        <p>
          svg-scroll-draw’s <code>scrollCounter</code> is the count, the start and the reduced-motion check in one
          call. With the HTML above:
        </p>
        <Code file="users.js">{LIB_JS}</Code>
        <p>
          It is scrubbed rather than played: the number is a function of the scroll position, not of time, so it
          counts as fast as the reader scrolls. By default it is at <code>from</code> (0) when the element’s top
          passes 80% of the way down the window and reaches <code>to</code> at 20%, with the same ease-out as
          Fig. 1. <code>once</code> is on, so scrolling back up leaves it where it got to; with{' '}
          <code>once: false</code> it counts back down. <code>trigger</code> moves the window,{' '}
          <code>easing</code> takes a name or any function, and <code>onComplete</code> runs when it reaches the end.
        </p>
        <p>
          Left without <code>format</code>, it prints the rounded number with no separators. Its{' '}
          <code>decimals</code> option is <code>toFixed</code>, also without separators, and it replaces{' '}
          <code>format</code> entirely, so with a formatter, set the decimals in the formatter. Under reduced motion it
          writes the final number at once, also when the setting is turned on while the page is open. It adds no
          ARIA, so keep the hidden copy. The{' '}
          <Link href="/counter-animation-generator">animated counter generator</Link> sets all of this up with a
          preview and copies the code, plain JavaScript or a React component, and the{' '}
          <Link href="/examples/scroll-counter">scroll counter example</Link> is a whole stats row, running.
        </p>
      </Section>

      <Closing
        title="Set the numbers, copy the counter"
        lede="Pick where it starts and ends, the decimals, a prefix or suffix and the easing, watch it count, and copy the JavaScript or a React component."
        command="npm i svg-scroll-draw"
        links={[
          { href: '/counter-animation-generator', label: 'Animated counter generator →' },
          { href: '/easing-visualizer', label: 'Easing visualizer' },
        ]}
      />
    </BlogArticle>
  );
}
