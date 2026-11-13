import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { SELF_ENTRIES } from '@/data/competitors';
import { SNAP_DEBOUNCE_MS, SNAP_DEFAULTS } from '@/components/snap/snap-code';
import { BlogArticle, Section, Code, Callout, Figure, Closing } from '@/components/blog/BlogArticle';
import { SnapportFigure } from './SnapportFigure';

// Searches this post is for: "css scroll snap", "scroll-snap-type", "scroll
// snap carousel", "full page scroll css", "scroll-snap-align". Every listing
// below was run in Chromium, Firefox and WebKit: where a scroll settles, what
// the buttons move, which slide is reported, reduced motion, and the keyboard.
const TITLE = 'CSS Scroll Snap: Carousels and Full-Page Sections';
const DESCRIPTION =
  'Build a scroll snap carousel and full-page sections with scroll-snap-type and scroll-snap-align: buttons, the current slide, the keyboard, and phone heights.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/css-scroll-snap';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'css scroll snap',
    'scroll-snap-type',
    'scroll-snap-align',
    'scroll snap carousel',
    'full page scroll css',
    'scroll snap mandatory vs proximity',
    'scroll-snap-stop',
    'scrollsnapchange',
  ],
  alternates: { canonical: '/blog/css-scroll-snap' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'CSS scroll snap: carousels and full-page sections',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const CAROUSEL_HTML = `<div class="carousel" tabindex="0" role="region" aria-label="Projects">
  <article class="slide">…</article>
  <article class="slide">…</article>
  <article class="slide">…</article>
  <article class="slide">…</article>
  <article class="slide">…</article>
</div>
<button type="button" class="carousel-prev">Previous</button>
<button type="button" class="carousel-next">Next</button>
<p class="carousel-status" aria-live="polite"></p>`;

const CAROUSEL_CSS = `.carousel {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-inline: 24px;
  scroll-padding-inline: 24px;
  scroll-snap-type: x mandatory;
}

.slide {
  flex: 0 0 80%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}`;

const SCROLLBAR_CSS = `/* Only with the buttons below: for a mouse without a
   sideways wheel, they are the way through. */
.carousel {
  scrollbar-width: none;
}`;

const BUTTONS_JS = `const carousel = document.querySelector('.carousel');
const slides = [...carousel.querySelectorAll('.slide')];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

// One slide plus the gap: the distance between two snap positions.
const step = () => slides[1].offsetLeft - slides[0].offsetLeft;

function go(by) {
  const index = Math.round(carousel.scrollLeft / step()) + by;
  carousel.scrollTo({
    left: index * step(),
    behavior: reduce.matches ? 'instant' : 'smooth',
  });
}

document.querySelector('.carousel-prev').addEventListener('click', () => go(-1));
document.querySelector('.carousel-next').addEventListener('click', () => go(1));`;

const CURRENT_JS = `const status = document.querySelector('.carousel-status');

function show(index) {
  status.textContent = 'Slide ' + (index + 1) + ' of ' + slides.length;
}
show(0);

if ('onscrollsnapchange' in window) {
  // Chromium 129 and later: the browser says which slide it snapped to.
  carousel.addEventListener('scrollsnapchange', (event) => {
    show(slides.indexOf(event.snapTargetInline));
  });
} else {
  // Elsewhere: the slide that is at least 60% inside the box.
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.intersectionRatio >= 0.6) show(slides.indexOf(entry.target));
    }
  }, { root: carousel, threshold: 0.6 });
  slides.forEach((slide) => observer.observe(slide));
}`;

const PAGE_CSS = `html {
  scroll-snap-type: y mandatory;
}

.panel {
  min-height: 100vh; /* for browsers without svh */
  min-height: 100svh;
  scroll-snap-align: start;
}

/* Under mandatory, what has no snap position is skipped:
   give the footer one, or it never fully comes into view. */
footer {
  scroll-snap-align: end;
}`;

const LIB_HTML = `<nav class="dots" aria-label="Sections">
  <a href="#intro" aria-current="true">Intro</a>
  <a href="#features">Features</a>
  <a href="#pricing">Pricing</a>
</nav>
<section class="panel" id="intro">…</section>
<section class="panel" id="features">…</section>
<section class="panel" id="pricing">…</section>`;

const LIB_JS = `import { scrollSnap } from 'svg-scroll-draw/snap';

const links = [...document.querySelectorAll('.dots a')];

// No scroll-snap-type on html: scrollSnap does the snapping.
const snap = scrollSnap('.panel', {
  duration: 800,
  easing: 'ease-out',
  threshold: 0.2,
  onSnap: (index) => {
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  },
});

links.forEach((link, i) => link.addEventListener('click', (event) => {
  event.preventDefault();
  snap.snapTo(i);
}));`;

export default function Page() {
  return (
    <BlogArticle
      slug="css-scroll-snap"
      jsonLd={articleJsonLd}
      tags={['scroll-snap-type', 'Carousel', 'Full-page sections']}
      title={<>CSS scroll snap: carousels and full-page sections</>}
      lede={
        <>
          Scroll snap makes a scroll come to rest on an item instead of wherever the swipe ran out. It takes two CSS
          properties, one on the box that scrolls and one on its children. Here is a carousel built with them, its
          Previous and Next buttons, how to know which slide is showing, full-height sections on the page, and the
          one thing <code>mandatory</code> does that surprises people.
        </>
      }
      facts={[
        { k: 'Needs', v: 'two CSS properties' },
        { k: 'snap change event', v: 'Chromium 129+' },
        { k: 'scrollSnap', v: `${SELF_ENTRIES.snap.toFixed(1)} KB` },
      ]}
      figure={
        <Figure n={1} caption="the carousel below at 360px wide. The snap line sits 24px in, after the scroll-padding; each slide’s snap position is the scrollLeft that puts its left edge on it. Slide 5 would need 1062.4, past the end of the scroll, so it is clamped and shares the last position.">
          <SnapportFigure />
        </Figure>
      }
      further={[
        { href: '/blog/horizontal-scroll-sections', label: 'Horizontal scroll sections without GSAP', blurb: 'A section that moves sideways as the page scrolls down, rather than a box you swipe.' },
        { href: '/blog/scroll-pin-without-gsap', label: 'Pin sections on scroll without GSAP', blurb: 'Hold a section in place while the reader scrolls through its steps.' },
      ]}
    >
      <Section id="carousel" k="the model" title="Two properties make a carousel">
        <p>
          <code>scroll-snap-type</code> goes on the element that scrolls and names the axis and how strict to be.{' '}
          <code>scroll-snap-align</code> goes on each child and says which of its edges should land on the snap line.
          Here the row scrolls sideways and every slide lines up by its start:
        </p>
        <Code file="index.html">{CAROUSEL_HTML}</Code>
        <Code file="carousel.css">{CAROUSEL_CSS}</Code>
        <p>
          The snap line is not the edge of the box but the edge of the snapport: the visible area minus{' '}
          <code>scroll-padding</code>. With <code>scroll-padding-inline: 24px</code> each slide lands 24px in from the
          left, as Fig. 1 draws. The <code>padding-inline</code> of the same 24px matters too: it puts the first slide
          on that line before any scroll, so every slide lands in the same place. Without it the first slide would
          want a scrollLeft of −24, which is clamped to 0, and it alone would sit flush against the edge.
        </p>
        <p>
          <code>flex: 0 0 80%</code> is 80% of the box inside its padding, so a fifth of the next slide shows and the
          reader can see there is more. <code>scroll-snap-stop: always</code> makes a fast swipe stop at the next
          slide instead of flying past three; leave it out for a row of small cards, where skipping is what people
          want. The <code>tabindex</code>, <code>role</code> and <code>aria-label</code> are for the keyboard,
          further down.
        </p>
        <p>
          The <Link href="/css-scroll-snap-generator">CSS scroll snap generator</Link> writes this CSS for any axis,
          alignment, padding and size, and draws the snap line and every snap position over a preview you can swipe.
        </p>
      </Section>

      <Section id="mandatory" k="strictness" title="Mandatory or proximity">
        <p>
          The second word of <code>scroll-snap-type</code> decides how hard the snap pulls.{' '}
          <code>mandatory</code> always comes to rest on a snap position when a scroll ends.{' '}
          <code>proximity</code> snaps only when the scroll ends near one, and how near is up to the browser.{' '}
          <code>scroll-snap-type: x</code> with no second word is proximity, which is why a carousel written that way
          sometimes stops between slides.
        </p>
        <p>
          A child taller (or wider) than the box does not trap anyone. In Chromium, Firefox and WebKit, a section
          twice the height of the window scrolls through as normal, and the snap only takes hold again past its
          end. What <code>mandatory</code> does trap is content with no snap position at all. We put 1,500px of
          ordinary text between two snapping sections and a 300px footer after them: in all three browsers every
          scroll came to rest on one section or the other, the text was never on screen when it stopped, and the
          footer never fully came into view, not even with the End key. With <code>proximity</code> both could be
          read.
        </p>
        <Callout k="the rule">
          With <code>mandatory</code>, give every part of the scroll a snap position, or use <code>proximity</code>.
          A carousel of equal slides is the clear case for mandatory; a long page with a few snapping sections is
          usually a case for proximity.
        </Callout>
      </Section>

      <Section id="buttons" k="buttons" title="Previous and next buttons">
        <p>
          A touch screen and a trackpad can swipe the row, but a mouse wheel scrolls up and down, so a carousel needs
          buttons. Each one scrolls one slide along, smoothly unless the reader has asked their system for less
          motion:
        </p>
        <Code file="carousel.js">{BUTTONS_JS}</Code>
        <p>
          Because the padding and the scroll-padding are equal, slide <em>i</em> snaps at exactly <em>i</em> ×{' '}
          <code>step</code>, so the script rounds the scroll position to find the slide it is on and scrolls to the
          next one’s position. Past the end, <code>scrollTo</code> is clamped to the furthest the box can scroll,
          which is where the last slide snaps anyway.
        </p>
        <p>
          The shorter version, <code>{'carousel.scrollBy({ left: step() })'}</code>, has a catch: the smooth scroll it
          starts is not snapped again in WebKit. From the last slide, whose position is clamped, Previous went back
          one step and stopped between two slides. Scrolling to a snap position directly does not depend on the
          browser fixing it. <code>{"'instant'"}</code> rather than <code>{"'auto'"}</code> for reduced motion means a{' '}
          <code>scroll-behavior: smooth</code> somewhere in your CSS cannot turn it back into a glide.
        </p>
      </Section>

      <Section id="current" k="current slide" title="Which slide is showing">
        <p>
          To say “Slide 2 of 5”, the script needs the snapped slide. Chromium 129 and later fire{' '}
          <code>scrollsnapchange</code> on the box when a scroll settles on a new snap target, with the element in{' '}
          <code>event.snapTargetInline</code> (or <code>snapTargetBlock</code> for a vertical one). Firefox and Safari
          do not have it yet, so the fallback is an <code>IntersectionObserver</code> on the slides, with the box as
          its root:
        </p>
        <Code file="carousel.js">{CURRENT_JS}</Code>
        <p>
          The 60% works because of the sizes: a slide is 80% of the box, so the current one is wholly inside it and
          the slide peeking in shows only about a quarter of itself. Change the slide width and check that still holds.
          The two paths differ in timing: the event fires once the scroll has settled, the observer while it is still
          moving, as the next slide passes 60%.
        </p>
        <p>
          The status line is a polite live region, so a screen reader announces the new slide after each move. The
          buttons are not disabled at the ends: a disabled button loses focus, and a keyboard user pressing Next
          would be dropped back at the top of the page. At the ends <code>go()</code> already scrolls nowhere.
        </p>
      </Section>

      <Section id="keyboard" k="accessibility" title="The keyboard and screen readers">
        <p>
          A scrolling box can only be scrolled from the keyboard if it can take focus, which is what{' '}
          <code>tabindex=&quot;0&quot;</code> gives it. Focused, the arrow keys move it one snap position at a time in
          all three engines. Once it can take focus it needs a name, so <code>role=&quot;region&quot;</code> and{' '}
          <code>aria-label</code> make it a landmark called “Projects” instead of an unnamed group. If the
          slides hold links, tabbing to one scrolls the row until the link is in view, and the row still comes to
          rest on a snap position rather than between slides. Safari skips links on Tab unless the reader turns that
          on; Option-Tab reaches them.
        </p>
        <p>
          Hiding the scrollbar is fine once the buttons exist, and not before: for someone with a mouse without a
          sideways wheel, the scrollbar is the only way along.
        </p>
        <Code file="carousel.css">{SCROLLBAR_CSS}</Code>
        <p>
          <code>scrollbar-width</code> works in Chromium, Firefox and Safari 18.2 and later; older Safari keeps the
          scrollbar, which does no harm. The row still scrolls by touch, trackpad, keyboard and buttons.
        </p>
      </Section>

      <Section id="sections" k="the page" title="Full-height sections on the page">
        <p>
          To snap the page itself, the snap type goes on <code>html</code>, the element that scrolls the page, not on{' '}
          <code>body</code>. Each section aligns by its start and is at least as tall as the window:
        </p>
        <Code file="page.css">{PAGE_CSS}</Code>
        <p>
          On phones, <code>100vh</code> is the height with the browser’s toolbars hidden. While they show, a section
          that tall is cut off at the bottom, and with every section snapped to its top, the cut part is the part
          nobody sees. <code>100svh</code> is the height with the toolbars showing, so the whole section fits.{' '}
          <code>100dvh</code> follows the toolbars as they slide in and out, which resizes every section, and moves
          every snap position, in the middle of a scroll. Desktop browsers have no toolbars that move, so there all
          three are the same.
        </p>
        <p>
          <code>min-height</code> rather than <code>height</code> lets a section with more in it grow. As above, a tall
          section scrolls through normally. The footer gets <code>scroll-snap-align: end</code>, so the bottom of the
          page is a snap position too and the End key reaches it.
        </p>
        <p>
          For a section that stays put while the page scrolls past, rather than a scroll that stops at each one, see
          the <Link href="/scroll-pin-generator">scroll pin generator</Link>; for a section that moves sideways as the
          page scrolls down, the <Link href="/horizontal-scroll-generator">horizontal scroll generator</Link>.
        </p>
      </Section>

      <Section id="library" k="svg-scroll-draw" title="When CSS is not enough: scrollSnap">
        <p>
          CSS scroll snap uses the browser’s own motion, and no property sets its speed or its curve. svg-scroll-draw’s{' '}
          <code>scrollSnap</code> snaps with a script instead: {SNAP_DEBOUNCE_MS} ms after the last scroll event it
          glides to the next or previous section if the scroll passed a threshold of the current one, and back if
          not, over a duration and easing you choose (by default {SNAP_DEFAULTS.duration} ms,{' '}
          <code>{`'${SNAP_DEFAULTS.easing}'`}</code>, threshold {SNAP_DEFAULTS.threshold}). It calls{' '}
          <code>onSnap(index)</code> after each snap in every browser, and <code>snapTo(index)</code> drives it from
          a menu:
        </p>
        <Code file="index.html">{LIB_HTML}</Code>
        <Code file="sections.js">{LIB_JS}</Code>
        <p>
          The panels keep their <code>min-height: 100svh</code> but lose <code>scroll-snap-type</code>: with both, the
          browser would pull toward its snap positions while the script glides toward its own. For readers who ask
          for reduced motion it jumps straight to the section instead of gliding, and still snaps; that follows the
          setting live, without a reload.
        </p>
        <p>
          It lines up each section’s start edge on one axis, in the window or in a box you pass as{' '}
          <code>scrollContainer</code>, and it moves one section per gesture. For slides narrower than the box, or
          centre alignment, CSS is the better tool. The generator has a scrollSnap mode that writes this call for the
          same layouts.
        </p>
      </Section>

      <Closing
        title="Swipe it, then copy it"
        lede="Pick the axis, mandatory or proximity, the alignment, padding and sizes, swipe the preview, and copy the HTML, CSS and button script."
        command="npm i svg-scroll-draw"
        links={[
          { href: '/css-scroll-snap-generator', label: 'CSS scroll snap generator →' },
          { href: '/horizontal-scroll-generator', label: 'Horizontal scroll' },
        ]}
      />
    </BlogArticle>
  );
}
