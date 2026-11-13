import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { COMPETITORS, MEASURED_ON, SELF_ENTRIES } from '@/data/competitors';
import { BlogArticle, Section, Code, Callout, Figure, Closing, Table } from '@/components/blog/BlogArticle';
import { ScrollPathFigure } from './ScrollPathFigure';

// Searches this post is for: "locomotive scroll alternative", "locomotive
// scroll v5", "lenis vs locomotive scroll", "smooth scroll library",
// "locomotive scroll deprecated". Versions and dates are from the npm registry
// on 2026-11-13. Every listing below was run in Chromium, Firefox and WebKit,
// Locomotive Scroll 5.1.0 and Lenis 1.3.27 included.
const TITLE = 'Locomotive Scroll Alternatives in 2026: Lenis, CSS and More';
const DESCRIPTION =
  'What Locomotive Scroll v5 does, and what replaces each job in 2026: Lenis or native scrolling, CSS view() timelines, sticky, and data-scroll mapped to each.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/locomotive-scroll-alternatives';

const loco = COMPETITORS.locomotive;
const lenis = COMPETITORS.lenis;

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'locomotive scroll alternative',
    'locomotive scroll v5',
    'lenis vs locomotive scroll',
    'smooth scroll library',
    'locomotive scroll deprecated',
    'locomotive scroll replacement',
    'data-scroll-speed css',
    'lenis smooth scroll',
  ],
  alternates: { canonical: '/blog/locomotive-scroll-alternatives' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Locomotive Scroll alternatives in 2026: Lenis, native CSS and more',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const LOCO_HTML = `<h2 data-scroll data-scroll-repeat>Arrives each time it scrolls in</h2>
<div class="chapter" data-scroll data-scroll-css-progress></div>
<div class="layer" data-scroll data-scroll-speed="0.2"></div>`;

const LOCO_JS = `import LocomotiveScroll from 'locomotive-scroll';

// Lenis smooth scrolling, with the data-scroll detection on top.
const scroll = new LocomotiveScroll();`;

const NATIVE_CSS = `/* Anchor links glide instead of jumping, unless the reader asked
   for less motion. Wheel and touch scrolling are left as they are. */
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}

/* Land headings below a fixed header 5rem tall. */
h2[id] { scroll-margin-top: 5rem; }`;

const LENIS_JS = `import Lenis from 'lenis';

const lenis = new Lenis({
  autoRaf: true, // run its own requestAnimationFrame loop
  anchors: true, // ease same-page #links too, honouring scroll-margin-top
});`;

const INVIEW_CSS = `@media (prefers-reduced-motion: no-preference) {
  .will-reveal {
    transition: opacity 0.6s ease-out, translate 0.6s ease-out;
  }
  .will-reveal:not(.is-inview) {
    opacity: 0;
    translate: 0 2rem;
  }
}`;

const INVIEW_JS = `const io = new IntersectionObserver((entries) => {
  for (const { target, isIntersecting } of entries) {
    if (isIntersecting) {
      target.classList.add('is-inview');
      // Locomotive plays once by default; data-scroll-repeat kept watching.
      if (!target.hasAttribute('data-repeat')) io.unobserve(target);
    } else {
      target.classList.remove('is-inview');
    }
  }
});

for (const el of document.querySelectorAll('[data-inview]')) {
  el.classList.add('will-reveal'); // hidden only once the script runs
  io.observe(el);
}`;

const PROGRESS_CSS = `/* data-scroll-css-progress: --progress runs 0 to 1, from the moment the
   element's top enters at the bottom to the moment its bottom leaves
   at the top. That span is view()'s default range, cover. */
@property --progress {
  syntax: '<number>';
  inherits: true;
  initial-value: 0;
}

@supports (animation-timeline: view()) {
  [data-progress] {
    animation: progress linear both;
    animation-timeline: view();
  }
}

@keyframes progress {
  to { --progress: 1; }
}`;

const LIB_JS = `import { scrollReveal } from 'svg-scroll-draw/reveal';
import { scrollProgress } from 'svg-scroll-draw/progress';

// data-scroll plus your is-inview CSS: fades each card up 32px as it
// scrolls in, then stays. Pass { once: false } for data-scroll-repeat.
scrollReveal('.card');

// data-scroll-css-progress: writes --scroll-progress, 0 to 1, over the
// same span as Locomotive's --progress.
scrollProgress('.chapter');`;

const PARALLAX_CSS = `/* data-scroll-speed="0.2": 20% of the screen's height below its place as
   it enters, 20% above as it leaves, so it runs ahead of the page. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .layer {
      animation: speed-02 linear both;
      animation-timeline: view();
    }
  }
}

@keyframes speed-02 {
  from { translate: 0 20vh; }
  to   { translate: 0 -20vh; }
}`;

const PARALLAX_JS = `import { scrollParallax } from 'svg-scroll-draw';

// A scale of its own: speed is how far the element travels while it
// crosses the screen, as a share of its own height. 0.4 = 40% of it.
scrollParallax('.layer', { speed: 0.4 });`;

const STICKY_CSS = `/* data-scroll-sticky: the media holds at the top while the text beside
   it scrolls past, and leaves with the end of its section. */
.feature {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.feature .media {
  position: sticky;
  top: 0;
  align-self: start;
}`;

const PIN_JS = `import { scrollPin } from 'svg-scroll-draw/pin';

// Holds .stage at the top for one more screen of scrolling, then lets
// it go. The next section waits below it, as GSAP's pin spacing does.
scrollPin('.stage');`;

const HORIZONTAL_HTML = `<section class="outer">
  <div class="stage">
    <div class="track">
      <article class="panel">One</article>
      <article class="panel">Two</article>
      <article class="panel">Three</article>
    </div>
  </div>
</section>`;

const HORIZONTAL_CSS = `.outer { height: 300vh; }
.stage { position: sticky; top: 0; height: 100vh; overflow: clip; }
.track { display: flex; width: max-content; }
.panel { width: 100vw; }`;

const HORIZONTAL_JS = `import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

// Slides the track left as .outer scrolls past, measured from the layout.
scrollHorizontal('.track');`;

const TOGETHER_JS = `import Lenis from 'lenis';
import { scrollDraw } from 'svg-scroll-draw';
import { scrollReveal } from 'svg-scroll-draw/reveal';

new Lenis({ autoRaf: true });

// Lenis writes each eased step to the real scroll position, so these
// read it as they read native scrolling: no adapter, no shared loop.
scrollDraw('#route');
scrollReveal('.card');`;

const kb = (n: number) => `${n.toFixed(1)} KB`;

export default function Page() {
  return (
    <BlogArticle
      slug="locomotive-scroll-alternatives"
      jsonLd={articleJsonLd}
      tags={['Locomotive Scroll', 'Lenis', 'Migration']}
      title={<>Locomotive Scroll alternatives in 2026: Lenis, native CSS and more</>}
      lede={
        <>
          Locomotive Scroll does two jobs: it smooths the scroll, and it tells elements when they are on screen through{' '}
          <code>data-scroll</code> attributes. In 2026 each job has a replacement of its own, from Lenis to plain CSS.
          Here is what each attribute becomes, how Lenis and an animation library share one scroll, and what happens to
          keys, anchor links and reduced motion along the way.
        </>
      }
      facts={[
        { k: 'Locomotive v5', v: `${kb(loco.gzipKb)}, Lenis inside` },
        { k: 'Lenis alone', v: kb(lenis.gzipKb) },
        { k: 'CSS timelines', v: '0 KB' },
      ]}
      figure={
        <Figure n={1} caption="where Lenis sits. It eases wheel input and writes each step to the page’s real scroll position, so CSS timelines, observers and svg-scroll-draw all read one number. Keys, touch and the scrollbar stay the browser’s.">
          <ScrollPathFigure />
        </Figure>
      }
      further={[
        { href: '/vs-locomotive-scroll', label: 'svg-scroll-draw vs Locomotive Scroll', blurb: 'Feature by feature, measured sizes, and when Locomotive is the better pick.' },
        { href: '/lenis-scroll-animation', label: 'Lenis scroll animation', blurb: 'Lenis and svg-scroll-draw on one page, with what the pair costs.' },
      ]}
    >
      <Section id="what" k="the starting point" title="What Locomotive Scroll does, in v4 and v5">
        <p>
          Locomotive Scroll comes from the Montreal studio Locomotive. Its npm description sums it up: detection of
          elements in the viewport, and smooth scrolling with parallax. You mark elements with{' '}
          <code>data-scroll</code>, and it adds the class <code>is-inview</code> when they arrive, writes a{' '}
          <code>--progress</code> value, or moves them at their own speed.
        </p>
        <Code file="index.html">{LOCO_HTML}</Code>
        <Code file="main.js">{LOCO_JS}</Code>
        <p>
          There are two quite different versions. Version 4, last released as 4.1.4 on 3 February 2022, scrolled the
          page itself: in smooth mode it set <code>overflow: hidden</code> on the page, moved the content with
          transforms, drew its own scrollbar and handled the keyboard. Pages were built from{' '}
          <code>data-scroll-container</code> and <code>data-scroll-section</code> wrappers.
        </p>
        <p>
          Version 5 is a rewrite on top of Lenis. 5.0.0 came out on 15 January 2026 after a long beta, and 5.1.0 on 13
          November 2026; it depends on Lenis 1.3.27. The page scrolls natively, with the browser’s own scrollbar, and
          the detection runs on <code>IntersectionObserver</code>. The container and section wrappers are gone, and so
          is <code>data-scroll-sticky</code>.
        </p>
        <Callout k="is it deprecated?">
          No. Neither version is marked deprecated on npm, and v5 is the maintained line. Most of the
          “alternative” searches come from v4 sites, where the move to v5 is a rewrite of its own, so it is a good
          moment to check what each attribute still needs a library for. Lenis’s old package,{' '}
          <code>@studio-freight/lenis</code>, is the one that is deprecated: it was renamed to <code>lenis</code>.
        </Callout>
      </Section>

      <Section id="map" k="migration" title="Each data-scroll attribute, and what replaces it">
        <p>
          Every Locomotive feature is one of four jobs: smooth scrolling, in-view classes and progress, parallax, and
          sticky or horizontal sections. The browser now does most of them. The right-hand column is this site’s
          library, for when you want the JavaScript version or more than a class.
        </p>
        <Table
          head={['Locomotive Scroll', 'In the platform', 'In svg-scroll-draw']}
          rows={[
            ['new LocomotiveScroll()', <>Native scrolling, or Lenis on its own</>, '—, it does not smooth scrolling'],
            ['data-scroll + is-inview', <><code>IntersectionObserver</code> adding a class</>, <code key="r">scrollReveal()</code>],
            ['data-scroll-repeat', 'Remove the class when it leaves', <code key="r">{'{ once: false }'}</code>],
            ['data-scroll-offset, -position', <><code>rootMargin</code>; <code>animation-range</code></>, <code key="r">{'trigger: { start, end }'}</code>],
            ['data-scroll-css-progress', <><code>@property</code> on a <code>view()</code> timeline</>, <code key="r">scrollProgress()</code>],
            ['data-scroll-call, -event-progress', 'The observer’s callback', <code key="r">onEnter, onProgress</code>],
            ['data-scroll-speed', <><code>translate</code> on a <code>view()</code> timeline</>, <code key="r">scrollParallax()</code>],
            ['data-scroll-sticky (v4)', <code key="p">position: sticky</code>, <code key="r">scrollPin()</code>],
            ['horizontal (v4 direction, v5 Lenis orientation)', 'A sticky stage and a transform', <code key="r">scrollHorizontal()</code>],
            ['data-scroll-to', <><code>{'<a href="#id">'}</code> and <code>scroll-behavior</code></>, <>—, or Lenis’s <code>scrollTo()</code></>],
          ]}
          caption={`Locomotive attributes as of 5.1.0, plus the two v4 ones that have no v5 attribute. Sizes on this page are minified and gzipped, measured ${MEASURED_ON} on Locomotive Scroll ${loco.version} and Lenis ${lenis.version}.`}
        />
      </Section>

      <Section id="smooth" k="job 1" title="Smooth scrolling: Lenis, or the browser’s own">
        <p>
          If the eased, weighty feel is what you liked, use Lenis directly. It is the engine inside Locomotive v5, it
          is {kb(lenis.gzipKb)} against Locomotive’s {kb(loco.gzipKb)}, and its current release is 1.3.27 (15 October
          2026), with a 2.0 in development builds. Link its small stylesheet, <code>lenis/dist/lenis.css</code>, as
          well.
        </p>
        <Code file="smooth.js">{LENIS_JS}</Code>
        <p>
          Lenis takes over the mouse wheel only. It cancels each wheel event and moves the page about a tenth of the
          remaining distance per frame (<code>lerp: 0.1</code>), with <code>scrollTo</code>, so the page’s real
          position follows. Touch scrolling stays native unless you set <code>syncTouch</code>, and so do keys and the
          scrollbar, as Fig. 1 shows.
        </p>
        <p>
          Many teams now leave the wheel alone instead. Trackpads and phones already scroll with momentum, and on a
          phone Lenis is not easing anything by default. A wheel listener that cancels the event means each step waits
          for the main thread, so a busy page shows it as lag, where native scrolling can run off the main thread.
          Scrolling areas inside the page, such as a code block or a modal, need <code>data-lenis-prevent</code> or{' '}
          <code>allowNestedScroll: true</code> to get their wheel events back. And some readers simply notice that the
          page trails the wheel. Whether that is weight or lag is a matter of taste, and worth deciding on purpose.
        </p>
        <p>Without a library, the one smoothing most sites still want is on anchor links:</p>
        <Code file="smooth.css">{NATIVE_CSS}</Code>
      </Section>

      <Section id="in-view" k="job 2" title="In-view classes and a progress value">
        <p>
          <code>is-inview</code> is an <code>IntersectionObserver</code> and a class. The script below plays once, as
          Locomotive does by default, or keeps watching for elements marked <code>data-repeat</code>. It adds{' '}
          <code>will-reveal</code> before it observes, so if the script does not load, nothing stays hidden.
        </p>
        <Code file="inview.js">{INVIEW_JS}</Code>
        <Code file="inview.css">{INVIEW_CSS}</Code>
        <p>
          <code>data-scroll-css-progress</code> is a scroll timeline. Register <code>--progress</code> as a number so
          the browser can animate it, and run it on <code>view()</code>. Its default range, <code>cover</code>, is the
          same span as Locomotive’s default: from the element’s top entering at the bottom of the screen to its bottom
          leaving at the top. In our test the two values matched at every point we sampled, in Chromium, Firefox and
          WebKit.
        </p>
        <Code file="progress.css">{PROGRESS_CSS}</Code>
        <p>
          Use it in any property, for example <code>opacity: var(--progress)</code>. Browsers without scroll
          timelines skip the block and leave <code>--progress</code> at 0, so write the rule so that 0 is a fine
          resting state. How <code>view()</code> and its ranges work is in{' '}
          <Link href="/blog/css-scroll-driven-animations">CSS scroll-driven animations explained</Link>, and the{' '}
          <Link href="/scroll-trigger-visualizer">scroll trigger visualizer</Link> shows where a start and an end line
          fall as you scroll.
        </p>
        <p>
          With svg-scroll-draw, the same two jobs are a call each. <code>scrollReveal</code> is{' '}
          {kb(SELF_ENTRIES.reveal)} and <code>scrollProgress</code> {kb(SELF_ENTRIES.progress)}:
        </p>
        <Code file="reveal.js">{LIB_JS}</Code>
      </Section>

      <Section id="parallax" k="job 3" title="Parallax">
        <p>
          In v5, <code>data-scroll-speed</code> moves an element from <code>speed</code> × the screen’s height below its
          place to the same distance above it, while it crosses the screen. That is a <code>translate</code> keyframe
          pair on a <code>view()</code> timeline, and the same numbers give the same positions: in our test the CSS
          layer and Locomotive’s sat at the same pixel all the way through.
        </p>
        <Code file="parallax.css">{PARALLAX_CSS}</Code>
        <p>
          One difference: Locomotive handles an element that is already on screen when the page loads by starting it
          at its place, and this CSS starts it part of the way down. Keep layers like this below the first screen, or
          give the top one its own keyframes. <code>scrollParallax</code> does the same in JavaScript, on its own
          scale:
        </p>
        <Code file="parallax.js">{PARALLAX_JS}</Code>
        <p>
          Depth, layers and speeds are covered in{' '}
          <Link href="/blog/parallax-scrolling-css">parallax scrolling with CSS and JavaScript</Link>.
        </p>
      </Section>

      <Section id="sticky" k="job 4" title="Sticky, pinned and horizontal sections">
        <p>
          v4’s <code>data-scroll-sticky</code> existed because in smooth mode the page never really scrolled: the content
          was moved with transforms, so <code>position: sticky</code> had no scrolling to stick against. With native
          scrolling, under Lenis or not, sticky works again:
        </p>
        <Code file="sticky.css">{STICKY_CSS}</Code>
        <p>
          Sticky holds an element for as long as its parent scrolls past. To hold it for a set distance and push the
          rest of the page down meanwhile, as GSAP’s <code>pin</code> does, there is <code>scrollPin</code> (
          {kb(SELF_ENTRIES.pin)}); <Link href="/blog/scroll-pin-without-gsap">pin sections on scroll without GSAP</Link>{' '}
          covers it in full.
        </p>
        <Code file="pin.js">{PIN_JS}</Code>
        <p>
          v4 could scroll the whole page sideways, and v5 can through Lenis’s <code>orientation</code> option. A
          section that moves sideways while the page scrolls down is more common now: a tall outer box, a sticky stage
          inside it, and a track that slides left.
        </p>
        <Code file="index.html">{HORIZONTAL_HTML}</Code>
        <Code file="horizontal.css">{HORIZONTAL_CSS}</Code>
        <Code file="horizontal.js">{HORIZONTAL_JS}</Code>
        <p>
          The stage uses <code>overflow: clip</code>, not <code>hidden</code>, so tabbing to a panel off to the side
          cannot scroll the stage behind the script’s back. The details, and a CSS-only version, are in{' '}
          <Link href="/blog/horizontal-scroll-sections">horizontal scroll sections without GSAP</Link>.
        </p>
      </Section>

      <Section id="lenis" k="together" title="Lenis with svg-scroll-draw">
        <p>
          Keeping the smooth scroll and moving the animation to another library is the common middle path, and it needs
          nothing in between. Lenis moves the page’s real scroll position on every frame, so{' '}
          <code>window.scrollY</code>, <code>getBoundingClientRect()</code> and CSS scroll timelines all see the eased
          value. In our test, <code>window.scrollY</code> equalled <code>lenis.scroll</code> on every frame we sampled,
          in all three engines.
        </p>
        <Code file="main.js">{TOGETHER_JS}</Code>
        <p>
          svg-scroll-draw also ships <code>createLenisAdapter(lenis)</code> from <code>svg-scroll-draw/lenis</code>,
          which makes <code>window.scrollY</code> report the value from Lenis’s scroll event. With the{' '}
          <code>lenis</code> package scrolling the window, as here, the two numbers are already the same, so leave it
          out. The <Link href="/lenis-scroll-animation">Lenis scroll animation</Link> page has more on the pair, and
          the <Link href="/docs#lenis-adapter">docs</Link> list the adapter.
        </p>
      </Section>

      <Section id="a11y" k="accessibility" title="Reduced motion, keys and anchor links">
        <p>
          Lenis 1.3 respects <code>prefers-reduced-motion: reduce</code> by default, through its{' '}
          <code>respectReducedMotion</code> option. With it set, the wheel’s <code>lerp</code> goes from 0.1 to 1, so
          the page reaches where the wheel sends it in about a tenth of a second instead of about a second, and{' '}
          <code>lenis.scrollTo()</code> and anchor links jump. Locomotive v5 passes that on, and also turns its
          parallax off under reduced motion and on touch screens.
        </p>
        <p>
          Lenis does not listen to the keyboard. Arrow keys, Space, Page Up and Down, Home and End, and tabbing to a
          link further down all scroll the page natively, and Lenis picks up the new position. That is a real change
          from v4, which moved the page itself and had to handle keys on its own.
        </p>
        <p>
          Same-page links are the browser’s unless you set <code>anchors: true</code>. Then Lenis eases to the
          target, honours <code>scroll-margin-top</code>, and the address bar still gets the <code>#hash</code>. Without
          it, CSS <code>scroll-behavior</code> decides, which is why the native version above sits inside a
          reduced-motion query.
        </p>
        <p>
          The CSS replacements carry their own guard: the reveal and the parallax only animate inside{' '}
          <code>prefers-reduced-motion: no-preference</code>. The <code>--progress</code> value is not guarded, because
          it is only a number; guard whatever moves with it. svg-scroll-draw shows reveals and drawings finished under
          reduced motion, except <code>scrollHorizontal</code>, which keeps scrubbing by default because the panels are
          only reachable through it.{' '}
          <Link href="/blog/reduced-motion-scroll-animations">Reduced motion for scroll animations</Link> goes through
          every effect.
        </p>
      </Section>

      <Closing
        title="See where a trigger starts"
        lede="Moving data-scroll-offset and data-scroll-position over? Pick a start and an end line, scroll the preview, and watch progress run from 0 to 1."
        command="npm i svg-scroll-draw"
        links={[
          { href: '/scroll-trigger-visualizer', label: 'Scroll trigger visualizer →' },
          { href: '/vs-locomotive-scroll', label: 'Compare with Locomotive' },
        ]}
      />
    </BlogArticle>
  );
}
