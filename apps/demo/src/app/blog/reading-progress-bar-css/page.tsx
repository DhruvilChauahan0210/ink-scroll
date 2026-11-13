import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { SELF_ENTRIES } from '@/data/competitors';
import { BROWSER_SUPPORT } from '@/data/cssdriven';
import { BlogArticle, Section, Code, Callout, Figure, Closing } from '@/components/blog/BlogArticle';
import { ReadingFigure } from './ReadingFigure';

// Searches this post is for: "reading progress bar", "scroll progress bar css",
// "scroll indicator css", "progress bar on scroll javascript". Every listing
// below was run in Chromium, Firefox and WebKit, and the fallback in Firefox
// with scroll timelines switched off.
const TITLE = 'How to Make a Reading Progress Bar with CSS';
const DESCRIPTION =
  'A reading progress bar in pure CSS with animation-timeline, one for a single article, a ring, a small JavaScript fallback, and what screen readers need.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/reading-progress-bar-css';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'reading progress bar',
    'scroll progress bar css',
    'scroll indicator css',
    'progress bar on scroll javascript',
    'reading progress indicator',
    'scroll progress bar',
    'circular scroll progress',
    'animation-timeline scroll()',
  ],
  alternates: { canonical: '/blog/reading-progress-bar-css' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'How to make a reading progress bar with CSS',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const HTML = `<div class="progress-bar" aria-hidden="true"></div>`;

const BAR_CSS = `/* No bar at all where the browser cannot drive it. */
@supports (animation-timeline: scroll()) {
  .progress-bar {
    position: fixed;
    inset: 0 0 auto;
    z-index: 1000;
    height: 4px;
    background: currentColor;
    transform-origin: 0 50%;     /* grow from the left edge */
    transform: scaleX(0);        /* empty while there is nothing to scroll */
    pointer-events: none;
    animation: progress-grow linear both;
    animation-timeline: scroll(root block);
  }
}

@keyframes progress-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}`;

const ARTICLE_HTML = `<article>
  <div class="article-progress" aria-hidden="true"></div>
  <h1>Your article</h1>
  <p>…</p>
</article>`;

const ARTICLE_CSS = `@supports (view-timeline-name: --article) {
  /* The article names its trip through the window… */
  article { view-timeline: --article block; }

  /* …and the bar inside it runs on that trip. */
  .article-progress {
    position: fixed;
    inset: 0 0 auto;
    z-index: 1000;
    height: 4px;
    background: currentColor;
    transform-origin: 0 50%;
    transform: scaleX(0);
    pointer-events: none;
    animation: progress-grow linear both;
    animation-timeline: --article;
    /* 0 with the article's top at the window's top,
       1 with its bottom at the window's bottom. */
    animation-range: contain 0% contain 100%;
  }
}`;

const RING_HTML = `<svg class="progress-ring" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
  <circle class="progress-ring-track" cx="24" cy="24" r="22" />
  <circle class="progress-ring-fill" cx="24" cy="24" r="22" pathLength="100" />
</svg>`;

const RING_CSS = `.progress-ring { display: none; }

@supports (animation-timeline: scroll()) {
  .progress-ring {
    display: block;
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 1000;
    rotate: -90deg;              /* start at twelve o'clock */
    pointer-events: none;
  }
  .progress-ring circle {
    fill: none;
    stroke: currentColor;
    stroke-width: 4;
  }
  .progress-ring-track { opacity: 0.15; }
  .progress-ring-fill {
    stroke-dasharray: 100;       /* pathLength="100": one dash, the whole circle */
    stroke-dashoffset: 100;      /* pushed all the way back: nothing drawn */
    animation: ring-fill linear both;
    animation-timeline: scroll(root block);
  }
}

@keyframes ring-fill {
  from { stroke-dashoffset: 100; }
  to   { stroke-dashoffset: 0; }
}`;

const FALLBACK_JS = `// Only where CSS cannot drive the bar: write the same number from a script.
if (!CSS.supports('animation-timeline: scroll()')) {
  const bar = document.querySelector('.progress-bar');
  const root = document.documentElement;
  let queued = false;

  function update() {
    queued = false;
    const max = root.scrollHeight - innerHeight; // how far the window can travel
    const progress = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bar.style.setProperty('--progress', progress);
  }

  // At most one update a frame, however many scroll events arrive.
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  bar.classList.add('is-js');
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  new ResizeObserver(queue).observe(document.body); // images, fonts, late content
  update();
}`;

const FALLBACK_CSS = `.progress-bar.is-js {
  position: fixed;
  inset: 0 0 auto;
  z-index: 1000;
  height: 4px;
  background: currentColor;
  transform-origin: 0 50%;
  transform: scaleX(var(--progress, 0));
  pointer-events: none;
}`;

const LIB_JS = `import { scrollProgress } from 'svg-scroll-draw/progress';

// 0 at the top of the page, 1 at the bottom, written to
// --scroll-progress on <html>; the bar's CSS reads it.
scrollProgress(document.documentElement, {
  trigger: { start: 'top top', end: 'bottom bottom' },
  easedVariable: null, // the bar only reads the raw value
});`;

const LIB_CSS = `.progress-bar {
  position: fixed;
  inset: 0 0 auto;
  z-index: 1000;
  height: 4px;
  background: currentColor;
  transform-origin: 0 50%;
  transform: scaleX(var(--scroll-progress, 0));
  pointer-events: none;
}`;

const firefox = BROWSER_SUPPORT.find((b) => b.browser === 'Firefox');
const safari = BROWSER_SUPPORT.find((b) => b.browser.startsWith('Safari'));
const chrome = BROWSER_SUPPORT.find((b) => b.browser.startsWith('Chrome'));

export default function Page() {
  return (
    <BlogArticle
      slug="reading-progress-bar-css"
      jsonLd={articleJsonLd}
      tags={['animation-timeline', 'scroll()', 'Accessibility']}
      title={<>How to make a reading progress bar with CSS</>}
      lede={
        <>
          A reading progress bar is one number, how far the page has scrolled over how far it can, drawn as the width
          of a line. CSS can now work that number out on its own with <code>animation-timeline</code>. Here is the
          bar, a version that follows one article instead of the whole page, a ring, a small script for browsers
          without scroll timelines, and what a screen reader should hear.
        </>
      }
      facts={[
        { k: 'CSS bar', v: 'no JavaScript' },
        { k: 'Fallback', v: '1 update a frame' },
        { k: 'scrollProgress', v: `${SELF_ENTRIES.progress.toFixed(1)} KB` },
      ]}
      figure={
        <Figure n={1} caption="one page 4000 px tall in an 800 px window. The window can travel 3200 px, and the bar’s scaleX is scrollY over that distance, so the bar is full when the window’s bottom reaches the end of the page, not its top.">
          <ReadingFigure />
        </Figure>
      }
      further={[
        { href: '/blog/css-scroll-driven-animations', label: 'CSS scroll-driven animations explained', blurb: 'scroll(), view() and every animation-range name, behind the CSS here.' },
        { href: '/blog/reduced-motion-scroll-animations', label: 'Reduced motion for scroll animations', blurb: 'Which scroll effects to turn off for readers who ask for less motion, and which to keep.' },
      ]}
    >
      <Section id="css" k="pure CSS" title="The bar in CSS only">
        <p>
          The bar is an empty element, fixed to the top of the window. It is full width from the start, and a{' '}
          <code>scaleX</code> from 0 to 1 decides how much of it shows. A transform never makes the browser lay the
          page out again, where animating <code>width</code> would on every frame of scrolling.
        </p>
        <Code file="index.html">{HTML}</Code>
        <Code file="progress.css">{BAR_CSS}</Code>
        <p>
          <code>scroll(root block)</code> is the page’s own vertical scroll position used as a timeline: 0% at the
          top, 100% when the window’s bottom reaches the end of the page. The keyframes have no duration, because the
          scroll sets the pace, and <code>both</code> holds the first frame before the start and the last one after
          the end. The timeline goes after the <code>animation</code> shorthand, which would reset it.{' '}
          <Link href="/blog/css-scroll-driven-animations">CSS scroll-driven animations explained</Link> covers{' '}
          <code>scroll()</code> and <code>view()</code> in general; this post stays on the bar.
        </p>
        <p>Two lines in it are there for the cases where the timeline is missing:</p>
        <ul>
          <li>
            <strong>The <code>@supports</code> block.</strong> A browser without scroll timelines ignores{' '}
            <code>animation-timeline</code> and plays the keyframes as an ordinary animation that lasts no time,
            which leaves the bar full from the first pixel. Inside <code>@supports</code>, those browsers get an empty
            element instead, which shows nothing.
          </li>
          <li>
            <strong><code>transform: scaleX(0)</code> on the bar itself.</strong> On a page too short to scroll,{' '}
            <code>scroll(root)</code> has no distance to measure, the timeline is inactive and the animation applies
            nothing. Without a transform of its own the bar would show full there too.
          </li>
        </ul>
        <p>
          It runs in {chrome?.browser} {chrome?.since}+, {safari?.browser.replace(/ \(.*\)/, '')} {safari?.since}+ and{' '}
          {firefox?.browser} {firefox?.since}+. The{' '}
          <Link href="/scroll-progress-bar-generator">scroll progress bar generator</Link> writes this stylesheet for
          any edge of the window and any thickness, with a faint track behind the fill if you want one.
        </p>
      </Section>

      <Section id="article" k="one article" title="Progress through one article, not the whole page">
        <p>
          On a blog, the page is more than the post. A header sits above it, and comments, related links and a footer
          below, so a bar on <code>scroll(root)</code> is still short of full when the reader finishes the last
          paragraph. To follow the article alone, give it a named view timeline and run the bar on that.
        </p>
        <Code file="index.html">{ARTICLE_HTML}</Code>
        <Code file="article-progress.css">{ARTICLE_CSS}</Code>
        <p>
          The <code>@keyframes progress-grow</code> rule is the one from the first stylesheet. The range is what makes
          it a reading bar. For an article taller than the window, <code>contain 0%</code> is the moment its top
          reaches the top of the window, and <code>contain 100%</code> the moment its bottom reaches the bottom: from
          the first line under the top edge to the last line on screen. The default range, <code>cover</code>, would
          start as soon as the article’s top appeared at the bottom of the window and only finish once it had scrolled
          off the top, so the bar would be part full before reading began and short of full at the end.
        </p>
        <Callout k="why the bar goes inside">
          A named view timeline is visible to the element that names it and to what is inside it, so the bar sits in
          the article; being fixed, it is still drawn at the top of the window. A plain <code>view()</code> on the bar
          would not do: it would follow the bar’s own trip through the window, and a fixed bar never makes one.
        </Callout>
        <p>
          The article has to be taller than the window. A shorter one is wholly in view for a stretch of scrolling,
          and the bar fills only during that stretch. The generator’s <em>article</em> setting writes this version,
          bar or ring, and the{' '}
          <Link href="/css-scroll-driven-animation-generator">CSS scroll-driven animation generator</Link> lets you
          try other ranges on a box you scroll, with the CSS beside it.
        </p>
      </Section>

      <Section id="ring" k="variant" title="A circular progress ring">
        <p>
          A ring in the corner says the same in less room. It is an SVG circle drawn as a single dash as long as the
          circle, pushed back by a <code>stroke-dashoffset</code> that shrinks to 0 as the page scrolls. Setting{' '}
          <code>pathLength=&quot;100&quot;</code> on the circle saves working out its circumference: whatever its
          radius, the browser treats it as 100 units long, and the dash and the offset are in those units.
        </p>
        <Code file="index.html">{RING_HTML}</Code>
        <Code file="ring.css">{RING_CSS}</Code>
        <p>
          A circle’s stroke starts at three o’clock, so the whole SVG is turned back a quarter to start the ring at
          the top. The ring is hidden by default here, unlike the bar, because an SVG with no styles is not empty: it
          would show two filled black circles where scroll timelines are missing. The radius, 22, leaves room for the
          4-unit stroke inside the 48-unit box.
        </p>
      </Section>

      <Section id="fallback" k="javascript" title="A JavaScript fallback for older browsers">
        <p>
          Where scroll timelines are missing, a few lines of script can write the same number into a custom property
          for the bar to read. It is Fig. 1’s arithmetic: <code>scrollY</code> over{' '}
          <code>scrollHeight − innerHeight</code>, held between 0 and 1.
        </p>
        <Code file="fallback.js">{FALLBACK_JS}</Code>
        <Code file="fallback.css">{FALLBACK_CSS}</Code>
        <p>
          It goes with the same markup and the CSS bar above: the script only runs where the <code>@supports</code>{' '}
          block was skipped, and it styles the bar through its own class, so the two never both apply. The listener is
          passive, which tells the browser it never cancels the scroll, so scrolling does not wait for it. Scroll
          events can arrive more often than the screen draws; <code>requestAnimationFrame</code> folds them into one
          update a frame. The <code>ResizeObserver</code> catches the page getting longer as images and fonts load,
          which moves the bar without any scroll.
        </p>
      </Section>

      <Section id="a11y" k="accessibility" title="Screen readers and reduced motion">
        <p>
          Mark the bar <code>aria-hidden=&quot;true&quot;</code>, as every listing here does. It is tempting to make
          it a <code>role=&quot;progressbar&quot;</code> with <code>aria-valuenow</code>, but that role is for a task
          the page is doing, like an upload. Here it would announce a number that changes on every frame of scrolling,
          or need a script to round it and write it back, and the CSS-only bar has no script at all. A screen-reader
          user already knows where they are in the article from the headings and the reading position itself, so the
          bar has nothing to add aloud.
        </p>
        <p>
          It can also stay for readers who ask for reduced motion. The bar moves only while the reader scrolls, in step
          with the scroll and as far as it, the same as the scrollbar; it never moves on its own. What does not belong
          under <code>prefers-reduced-motion: reduce</code> is anything added on top: a transition that makes the bar
          glide after the scroll has stopped, or a bounce at the end. Put those in a{' '}
          <code>prefers-reduced-motion: no-preference</code> query. Which other scroll effects to turn off is in{' '}
          <Link href="/blog/reduced-motion-scroll-animations">reduced motion for scroll animations</Link>.
        </p>
      </Section>

      <Section id="library" k="svg-scroll-draw" title="The same with a library">
        <p>
          svg-scroll-draw’s <code>scrollProgress</code> is the fallback above, in every browser, for any element. It
          writes the progress, 0 to 1, into <code>--scroll-progress</code> on the element it measures, and the bar’s
          CSS reads it.
        </p>
        <Code file="progress.js">{LIB_JS}</Code>
        <Code file="progress.css">{LIB_CSS}</Code>
        <p>
          The trigger reads as element edge, then window edge: progress is 0 when the page’s top is at the window’s
          top and 1 when its bottom is at the window’s bottom, Fig. 1 again. The default, <code>top bottom</code> to{' '}
          <code>bottom top</code>, runs while any part of the element is on screen, which suits an effect but not a
          reading bar. The <Link href="/scroll-trigger-visualizer">scroll trigger visualizer</Link> shows that
          arithmetic for any pair of edges, with progress running 0 to 1 as you scroll.
        </p>
        <p>
          For one article, pass the article instead, <code>{"scrollProgress('article', { … })"}</code> with the
          same trigger, and put the bar inside it so it inherits the property. It follows the scroll for every reader,
          reduced motion included, measures again when the window or the content changes size, and returns an
          instance whose <code>destroy()</code> stops it and removes the property. It is its own entry,{' '}
          <code>svg-scroll-draw/progress</code>, at {SELF_ENTRIES.progress.toFixed(1)} KB gzipped.
        </p>
      </Section>

      <Closing
        title="Pick an edge, copy the bar"
        lede="Choose top, bottom, side or a ring, the whole page or one article, scroll the preview, and copy pure CSS or the JavaScript and React code."
        links={[
          { href: '/scroll-progress-bar-generator', label: 'Scroll progress bar generator →' },
          { href: '/css-scroll-driven-animation-generator', label: 'Scroll-driven animation generator' },
        ]}
      />
    </BlogArticle>
  );
}
