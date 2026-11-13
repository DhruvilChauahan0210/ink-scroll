import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { BROWSER_SUPPORT, CROSSING_RANGES, RANGES } from '@/data/cssdriven';
import { BlogArticle, Section, Code, Table, Figure, Closing } from '@/components/blog/BlogArticle';
import { TimelineFigure } from './TimelineFigure';

// Searches this post is for: "css scroll driven animations", "animation-timeline",
// "animation-timeline view", "animation-range", "scroll() vs view()". Every
// listing below was run in Chromium, Firefox and WebKit, and the fallbacks in
// Firefox with scroll timelines switched off.
const TITLE = 'CSS Scroll-Driven Animations: animation-timeline Explained';
const DESCRIPTION =
  'How animation-timeline and animation-range work: view() and scroll(), entry, exit, cover and contain, browser support, a fallback, and when you still need JS.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/css-scroll-driven-animations';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'css scroll driven animations',
    'scroll-driven animations',
    'animation-timeline',
    'animation-timeline view',
    'animation-timeline scroll',
    'animation-range',
    'view-timeline',
    'scroll timeline css',
    'animation-range entry exit',
  ],
  alternates: { canonical: '/blog/css-scroll-driven-animations' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'CSS scroll-driven animations: animation-timeline and animation-range explained',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const REVEAL_CSS = `@keyframes fade-up {
  from { opacity: 0; translate: 0 40px; }
  to   { opacity: 1; translate: 0 0; }
}

.reveal {
  animation: fade-up linear both;
  /* After the shorthand, which resets both of these. */
  animation-timeline: view();
  animation-range: entry 0% cover 50%;
}`;

const PROGRESS_CSS = `.progress {
  position: fixed;
  inset: 0 0 auto;
  height: 4px;
  background: currentColor;
  transform-origin: 0 50%;
  animation: grow linear both;
  animation-timeline: scroll(root);
}

@keyframes grow {
  from { scale: 0 1; }
  to   { scale: 1 1; }
}`;

const NAMED_CSS = `/* The section names a timeline; its heading animates on it. */
.section { view-timeline: --section; }

.section h2 {
  animation: fade-up linear both;
  animation-timeline: --section;
  animation-range: entry 0% entry 100%;
}`;

const IN_OUT_CSS = `/* Keyframes can name the range they belong to. */
@keyframes in-and-out {
  entry 0%   { opacity: 0; }
  entry 100% { opacity: 1; }
  exit 0%    { opacity: 1; }
  exit 100%  { opacity: 0; }
}

.card {
  animation: in-and-out linear both;
  animation-timeline: view();
}`;

const SUPPORTS_CSS = `/* Shown as written by default; animated only where scroll timelines
   exist, and only for readers who have not asked for less motion. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: fade-up linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 50%;
    }
  }
}`;

const IO_JS = `// No scroll timelines: reveal each element once, on a timer, instead.
if (!CSS.supports('animation-timeline: view()')) {
  document.documentElement.classList.add('io-reveal');
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}`;

const IO_CSS = `@media (prefers-reduced-motion: no-preference) {
  .io-reveal .reveal {
    opacity: 0;
    translate: 0 40px;
    transition: opacity 0.6s ease-out, translate 0.6s ease-out;
  }
  .io-reveal .reveal.is-in {
    opacity: 1;
    translate: 0 0;
  }
}`;

const ORDER_CSS = `.reveal {
  animation-timeline: view();
  /* Resets animation-timeline to auto: this now runs on the clock,
     for 0s, and the element just appears. */
  animation: fade-up linear both;
}`;

const OVERFLOW_CSS = `/* Makes .page a scroll container. view() follows it, it never
   scrolls, and every reveal inside sits still. */
.page { overflow-x: hidden; }

/* Clips the same, and is not a scroll container. */
.page { overflow-x: clip; }`;

const LIB_JS = `import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate('#card', {
  props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0px)'] },
  trigger: { start: 'top bottom', end: 'center center' }, // entry 0% → cover 50%
  once: true, // keeps the furthest point reached
});`;

export default function Page() {
  return (
    <BlogArticle
      slug="css-scroll-driven-animations"
      jsonLd={articleJsonLd}
      tags={['animation-timeline', 'animation-range', 'view()']}
      title={<>CSS scroll-driven animations, explained</>}
      lede={
        <>
          Two CSS properties turn any <code>@keyframes</code> animation into one that follows the scroll:{' '}
          <code>animation-timeline</code> says what drives it, and <code>animation-range</code> says which stretch of
          the scroll plays it. Here is what <code>view()</code> and <code>scroll()</code> measure, what every range
          name means, which browsers run it, the fallback, and the jobs CSS still cannot do.
        </>
      }
      facts={[
        ...BROWSER_SUPPORT.map((b) => ({ k: b.browser, v: `${b.since}+` })),
      ]}
      figure={
        <Figure n={1} caption="one page’s scroll and the timelines CSS builds from it: scroll(root) covers the whole page, while each card’s view() runs only while it crosses the viewport. The thin bar is card A with animation-range: entry 0% cover 50%.">
          <TimelineFigure />
        </Figure>
      }
      further={[
        { href: '/blog/native-css-svg-scroll-animations', label: 'Zero-JS SVG scroll animations', blurb: 'How svg-scroll-draw writes this CSS itself, and exactly when it does.' },
        { href: '/blog/svg-line-drawing-animation-css', label: 'How to animate an SVG line drawing with CSS', blurb: 'The same timelines driving a drawing, shape by shape.' },
      ]}
    >
      <Section id="timeline" k="the clock" title="From a clock to the scroll">
        <p>
          A CSS animation normally runs on the document’s clock: it starts, plays for its duration, and ends.{' '}
          <code>animation-timeline</code> swaps that clock for a scroll position. The keyframes are the same; their
          progress, 0% to 100%, now comes from how far something has scrolled, forwards or backwards.
        </p>
        <Code file="reveal.css">{REVEAL_CSS}</Code>
        <p>
          There is no duration: the scroll sets the pace, so the shorthand leaves it out. The order matters. The{' '}
          <code>animation</code> shorthand resets <code>animation-timeline</code> and <code>animation-range</code> to
          their defaults, so both go after it. <code>both</code> holds the first keyframe before the range starts and
          the last one after it ends, which is what keeps the card hidden until it arrives.
        </p>
      </Section>

      <Section id="view-scroll" k="two timelines" toc="view() or scroll()" title={<><code>view()</code> or <code>scroll()</code></>}>
        <p>
          <code>scroll()</code> follows a scroller’s position: 0% at the top, 100% at the bottom, the same for every
          element that uses it. That suits anything tied to the whole page, like a reading progress bar.
        </p>
        <Code file="progress.css">{PROGRESS_CSS}</Code>
        <p>
          <code>scroll()</code> takes the scroller and the axis: <code>nearest</code> (the default, the closest
          scrolling ancestor), <code>root</code> (the page) or <code>self</code>, and <code>block</code>,{' '}
          <code>inline</code>, <code>x</code> or <code>y</code>. The{' '}
          <Link href="/scroll-progress-bar-generator">scroll progress bar generator</Link> builds this bar on any edge,
          or as a ring, for the page or a single article.
        </p>
        <p>
          <code>view()</code> follows one element’s trip through its scroller, from the first pixel in to the last
          pixel out. Every element gets its own timeline, which is why it is the one for reveals. Fig. 1 shows both
          on the same page: one long bar for <code>scroll(root)</code>, and a short one per card for{' '}
          <code>view()</code>.
        </p>
        <p>
          When the element that moves is not the one that crosses the screen, name the timeline.{' '}
          <code>view-timeline</code> on a section makes a <code>view()</code> timeline that its descendants can use by
          name (<code>scroll-timeline</code> does the same for a scroller, and <code>timeline-scope</code> on a common
          ancestor lifts a name to elements outside it):
        </p>
        <Code file="named.css">{NAMED_CSS}</Code>
      </Section>

      <Section id="ranges" k="animation-range" title="animation-range, name by name">
        <p>
          A <code>view()</code> timeline has named stretches, and <code>animation-range</code> picks a start and an
          end on them, each a name and a percentage. For an element shorter than the viewport:
        </p>
        <Table
          head={['Range', '0% is when', '100% is when', 'svg-scroll-draw trigger']}
          rows={RANGES.map((r) => [r.name, r.at0, r.at100, <code key="t">{`'${r.trigger[0]}' → '${r.trigger[1]}'`}</code>])}
          caption={<>{CROSSING_RANGES.join(' and ')} also exist; they differ from entry and exit only for an element taller than the viewport.</>}
        />
        <p>
          With no <code>animation-range</code> at all, a <code>view()</code> animation runs over the whole of{' '}
          <code>cover</code>. The ends do not have to share a name: <code>entry 0% cover 50%</code> starts as the
          element appears and finishes when its centre reaches the centre of the screen, the thin bar in Fig. 1. The{' '}
          <Link href="/scroll-trigger-visualizer">scroll trigger visualizer</Link> shows the same arithmetic for the
          library’s edge-and-line triggers in the last column, with progress running 0 to 1 as you scroll.
        </p>
        <p>
          To fade something in as it arrives and out as it leaves, put the range names in the keyframes themselves.
          One animation covers both ends, so nothing has to decide which of two animations wins in the middle:
        </p>
        <Code file="in-and-out.css">{IN_OUT_CSS}</Code>
      </Section>

      <Section id="support" k="browsers" title="Browser support and a fallback">
        <Table
          head={['Browser', 'Since', 'Notes']}
          first="plain"
          rows={BROWSER_SUPPORT.map((b) => [b.browser, <code key="v">{b.since}</code>, b.note])}
        />
        <p>
          A browser without scroll timelines ignores <code>animation-timeline</code> and runs the animation on the
          clock, for no time at all, so the reveal above still ends up shown. A progress bar does not: it shows full
          from the start. Rather than rely on that, test for support and animate only when it is there:
        </p>
        <Code file="reveal.css">{SUPPORTS_CSS}</Code>
        <p>
          If older browsers should still get a reveal, the usual one plays on a timer when an{' '}
          <code>IntersectionObserver</code> sees the element. The script marks the page first, so the hidden state
          only exists where something will undo it:
        </p>
        <Code file="fallback.js">{IO_JS}</Code>
        <Code file="fallback.css">{IO_CSS}</Code>
        <p>
          The <Link href="/css-scroll-driven-animation-generator">CSS scroll-driven animation generator</Link> writes
          the <code>@supports</code> version of seven effects and tests your browser live. A scroll reveal that plays
          on a timer, step by step, is the subject of{' '}
          <Link href="/blog/text-animation-on-scroll">how to animate text on scroll</Link>.
        </p>
      </Section>

      <Section id="not-working" k="debugging" title="Why it is not working">
        <p>Four causes cover most scroll-driven animations that do nothing.</p>
        <p>
          <strong>The shorthand came last.</strong> <code>animation</code> after <code>animation-timeline</code>{' '}
          resets it, and the element simply appears:
        </p>
        <Code file="wrong-order.css">{ORDER_CSS}</Code>
        <p>
          <strong>An ancestor hides overflow.</strong> <code>overflow: hidden</code> on any axis makes an element a
          scroll container, even when it cannot scroll, and <code>view()</code> follows the nearest one. In all three
          engines the animation then never runs and the element sits at its own style. <code>overflow: clip</code>{' '}
          clips without making a scroller:
        </p>
        <Code file="overflow.css">{OVERFLOW_CSS}</Code>
        <p>
          <strong>A range name on <code>scroll()</code>.</strong> entry, exit, cover and contain belong to{' '}
          <code>view()</code>. A <code>scroll()</code> timeline has none of them, so the browser ignores them and plays
          over the whole scroll.
        </p>
        <p>
          <strong>No support.</strong> The <code>@supports</code> block is skipped, by design. Check with{' '}
          <code>{"CSS.supports('animation-timeline: view()')"}</code> in the console.
        </p>
      </Section>

      <Section id="javascript" k="limits" title="When you still need JavaScript">
        <p>
          A scroll timeline is a position, not an event, and that sets its limits. It cannot play once and stay: scroll
          back and it plays backwards. It cannot tell your code it finished, or hand its progress to a script that
          counts a number up. And it does nothing in a browser without support. For those, a library such as
          svg-scroll-draw runs the same animation on its own engine:
        </p>
        <Code file="card.js">{LIB_JS}</Code>
        <p>
          With <code>once</code>, a custom window or a callback, <code>scrollAnimate</code> runs on JavaScript. Leave
          them out, keep to properties and easings CSS can write, and where <code>view()</code> exists, it writes the CSS from this post itself:{' '}
          <code>@keyframes</code> on <code>animation-timeline: view()</code> over <code>cover 0% cover 100%</code>,
          and the JavaScript engine everywhere else. The{' '}
          <Link href="/blog/native-css-svg-scroll-animations">native CSS path</Link> post lists every condition, and
          the <Link href="/docs#native-css">reference</Link> has the option that turns it off.
        </p>
      </Section>

      <Closing
        title="Build one and copy the CSS"
        lede="Pick an effect, choose the range, scroll the preview, and copy the CSS with its @supports fallback, or the same animation as svg-scroll-draw code."
        links={[
          { href: '/css-scroll-driven-animation-generator', label: 'Scroll-driven animation generator →' },
          { href: '/scroll-trigger-visualizer', label: 'Scroll trigger visualizer' },
        ]}
      />
    </BlogArticle>
  );
}
