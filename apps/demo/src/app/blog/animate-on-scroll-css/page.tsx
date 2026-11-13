import type { Metadata } from 'next';
import Link from 'next/link';
import { seoTitle } from '../../_lib/seo';
import { SELF_ENTRIES } from '@/data/competitors';
import { BROWSER_SUPPORT } from '@/data/cssdriven';
import { BlogArticle, Section, Code, Callout, Table, Figure, Closing } from '@/components/blog/BlogArticle';
import { OnceFigure } from './OnceFigure';

// Searches this post is for: "animate on scroll css", "css animation on scroll",
// "scroll animation css only", "fade in on scroll css", "css scroll reveal".
// Every listing below was run in Chromium, Firefox and WebKit, under reduced
// motion, and in Firefox with scroll timelines switched off.
const TITLE = 'Animate on Scroll with CSS Only (No Library, No JavaScript)';
const DESCRIPTION =
  'Fade up, slide in, zoom, stagger and clip-path reveals on scroll in pure CSS, with an @supports fallback, reduced motion, and the one thing CSS cannot do.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/animate-on-scroll-css';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'animate on scroll css',
    'css animation on scroll',
    'scroll animation css only',
    'fade in on scroll css',
    'css scroll reveal',
    'reveal on scroll css',
    'slide in on scroll css',
    'stagger animation css',
    'clip-path reveal on scroll',
    'animation-timeline view',
  ],
  alternates: { canonical: '/blog/animate-on-scroll-css' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Animate on scroll with CSS only (no library, no JavaScript)',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-13',
  dateModified: '2026-11-13',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const REVEAL_HTML = `<section class="reveal">…</section>`;

const REVEAL_CSS = `/* Only the start. The end is the element as it is styled. */
@keyframes fade-up {
  from { opacity: 0; translate: 0 2rem; }
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: fade-up linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 40%;
    }
  }
}`;

const MORE_HTML = `<img class="reveal from-left" src="team.jpg" alt="…">
<blockquote class="reveal from-right">…</blockquote>
<figure class="reveal zoom">…</figure>`;

const MORE_CSS = `@keyframes slide-in {
  from { opacity: 0; translate: var(--from-x, -4rem) 0; }
}

@keyframes zoom-in {
  from { opacity: 0; scale: 0.8; }
}

/* Same .reveal rule as above; these only swap the keyframes. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal.from-left  { animation-name: slide-in; }
    .reveal.from-right { animation-name: slide-in; --from-x: 4rem; }
    .reveal.zoom       { animation-name: zoom-in; }
  }
}`;

const OVERFLOW_CSS = `/* Something waiting 4rem to the right widens the page, and a phone
   scrolls sideways. clip, not hidden: hidden makes main a scroll
   container, and view() would follow it instead of the page. */
main { overflow-x: clip; }`;

const STAGGER_HTML = `<ul class="cards">
  <li class="reveal">…</li>
  <li class="reveal">…</li>
  <li class="reveal">…</li>
  <li class="reveal">…</li>
  <li class="reveal">…</li>
  <li class="reveal">…</li>
</ul>`;

const STAGGER_CSS = `.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

/* Each card's place in its row of three: 0, 1 or 2. */
.cards > :nth-child(3n + 2) { --i: 1; }
.cards > :nth-child(3n + 3) { --i: 2; }

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .cards > .reveal {
      /* entry 0% is cover 0%. Card i plays 8% of the crossing later. */
      animation-range:
        cover calc(var(--i, 0) * 8%)
        cover calc(40% + var(--i, 0) * 8%);
    }
  }
}`;

const SIBLING_CSS = `/* In place of the two nth-child rules. sibling-index() counts from 1. */
@supports (order: sibling-index()) {
  .cards > * { --i: calc(sibling-index() - 1); }
}`;

const CLIP_HTML = `<figure class="wipe">
  <img src="harbour.jpg" alt="…">
</figure>`;

const CLIP_CSS = `/* The photo grows inside the frame; clip keeps it from widening the page. */
.wipe { overflow: clip; }

@keyframes wipe-in {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0 0 0); }
}

@keyframes settle {
  from { scale: 1.15; }
}

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .wipe,
    .wipe img {
      animation: wipe-in linear both;
      animation-timeline: view();
      animation-range: entry 0% cover 45%;
    }
    /* The photo settles from 115% while the frame opens. */
    .wipe img { animation-name: settle; }
  }
}`;

const END_CSS = `/* Near the bottom of the page: done once all of it is on screen. */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal.near-end { animation-range: entry 0% entry 100%; }
  }
}`;

const ONCE_JS = `document.documentElement.classList.add('reveal-on');
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));`;

const ONCE_CSS = `/* Instead of the scroll-timeline rules, not as well as them. */
@media (prefers-reduced-motion: no-preference) {
  .reveal-on .reveal {
    transition: opacity 0.6s ease-out, translate 0.6s ease-out;
    transition-delay: calc(var(--i, 0) * 80ms);
  }
  .reveal-on .reveal:not(.is-in) {
    opacity: 0;
    translate: 0 2rem;
  }
}`;

const LIB_JS = `import { scrollReveal } from 'svg-scroll-draw/reveal';

// Follows the scroll on the way in; scroll back and it stays shown.
scrollReveal('.reveal', { preset: 'fadeUp', stagger: 0.15 });`;

const ONCE_LINES = ONCE_JS.split('\n').length;

export default function Page() {
  return (
    <BlogArticle
      slug="animate-on-scroll-css"
      jsonLd={articleJsonLd}
      tags={['animation-timeline', 'Scroll reveal', 'CSS only']}
      title={<>Animate on scroll with CSS only (no library, no JavaScript)</>}
      lede={
        <>
          Fading things in as they scroll into view used to need a library. Today it is one{' '}
          <code>@keyframes</code> rule on a <code>view()</code> timeline. Here are the recipes people reach for: fade
          up, slide in from either side, zoom, a staggered row of cards and an image wiped in with{' '}
          <code>clip-path</code>. Each one stays visible where it cannot run, and each one respects reduced motion. One
          job CSS cannot do yet, play once and stay shown, takes {ONCE_LINES} lines of JavaScript.
        </>
      }
      facts={[
        { k: 'Recipes', v: 'fade · slide · zoom · stagger · wipe' },
        { k: 'Unsupported browsers', v: 'shown as written' },
        { k: 'Play once', v: `${ONCE_LINES} lines of JS` },
      ]}
      figure={
        <Figure n={1} caption="one card, scrolled in, then out again. On a view() timeline the reveal is a position: it follows the scroll and plays backwards when the reader scrolls back. An observer that adds a class plays it once, on the clock, and leaves it shown.">
          <OnceFigure />
        </Figure>
      }
      further={[
        { href: '/blog/css-scroll-driven-animations', label: 'CSS scroll-driven animations explained', blurb: 'What view(), scroll() and every animation-range name measure.' },
        { href: '/blog/replace-aos-scrollreveal', label: 'Replace AOS and ScrollReveal.js', blurb: 'The library route: presets, stagger and once in one call.' },
        { href: '/blog/reduced-motion-scroll-animations', label: 'Reduced motion for scroll animations', blurb: 'What each kind of scroll effect should do for readers who ask for less.' },
      ]}
    >
      <Section id="pattern" k="the pattern" title="One pattern behind every recipe">
        <p>
          Give anything that should arrive the class <code>reveal</code>. The CSS describes only where it starts:
          transparent and 2rem low. A <code>view()</code> timeline plays the animation as the element crosses the
          screen, from the moment its top appears (<code>entry 0%</code>) until it is 40% of the way through its trip
          (<code>cover 40%</code>), which for a card is a little below the middle of the screen.
        </p>
        <Code file="index.html">{REVEAL_HTML}</Code>
        <Code file="reveal.css">{REVEAL_CSS}</Code>
        <p>
          The keyframes have no <code>to</code>, so the end is whatever the element already looks like, and the same
          animation works on a card, a heading or an image. <code>both</code> holds the start before the range begins,
          which is what keeps it hidden until it arrives. What every range name measures, and why the shorthand comes
          before <code>animation-timeline</code>, is in{' '}
          <Link href="/blog/css-scroll-driven-animations">CSS scroll-driven animations explained</Link>; this post sticks
          to recipes.
        </p>
        <Callout k="the two guards">
          The hidden state exists only inside the animation, and the animation exists only inside{' '}
          <code>@supports (animation-timeline: view())</code> and{' '}
          <code>@media (prefers-reduced-motion: no-preference)</code>. A browser without scroll timelines, and a reader
          who asked for less motion, get the page as it is written. Never put <code>opacity: 0</code> in the base styles
          and count on the animation to undo it.
        </Callout>
      </Section>

      <Section id="entrances" k="recipes" title="Slide in from the left or right, and zoom">
        <p>
          Other entrances are other keyframes on the same rule. Add a second class and swap the{' '}
          <code>animation-name</code>; the timeline and the range stay as they are. Sliding uses one set of keyframes
          for both sides, with the distance in a custom property:
        </p>
        <Code file="index.html">{MORE_HTML}</Code>
        <Code file="entrances.css">{MORE_CSS}</Code>
        <p>
          Anything that starts outside the page’s width needs one more line. An element waiting 4rem to the right makes
          the page wider than the screen, and on a phone the whole page then drags sideways:
        </p>
        <Code file="layout.css">{OVERFLOW_CSS}</Code>
        <p>
          Keep the distances small. A 2rem rise or a 4rem slide reads as arriving; a full screen width reads as a
          slideshow, and the reader has to wait for the text to stop moving before they can read it. The{' '}
          <Link href="/css-scroll-driven-animation-generator">CSS scroll-driven animation generator</Link> runs these
          and blur, rotate and a progress bar in a box you scroll, and copies the CSS with the same guards.
        </p>
      </Section>

      <Section id="stagger" k="lists" title="Stagger a row of cards">
        <p>
          A list that runs down the page needs no stagger: every item has its own <code>view()</code> timeline and
          crosses the screen at its own moment, so they arrive one after another by themselves. A row is different.
          Three cards side by side cross at the same moment and arrive as one block. To cascade them, give each card its
          place in the row and move its range later by that much:
        </p>
        <Code file="index.html">{STAGGER_HTML}</Code>
        <Code file="stagger.css">{STAGGER_CSS}</Code>
        <p>
          The <code>nth-child</code> rules count within each row, so the second row starts again at 0. Its place
          further down the page already makes it later. This works in every browser that has scroll timelines.
        </p>
        <p>
          The newer <code>sibling-index()</code> counts for you, with no rule per position. It returned the right
          numbers in Chromium, Firefox and WebKit in our tests, but it is younger than scroll timelines, so test for it
          separately. Where it is missing, <code>--i</code> falls back to 0 and the row arrives together, still shown:
        </p>
        <Code file="row.css">{SIBLING_CSS}</Code>
        <p>
          Use it for a single row or a short list. In a grid it keeps counting into the second row, which then waits
          for cards that are not beside it; the <code>nth-child</code> version stays the portable one.
        </p>
      </Section>

      <Section id="images" k="clip-path" title="Reveal an image with clip-path">
        <p>
          Fading a photo in looks like a slow network. Wiping it in, with <code>clip-path</code> opening from one edge,
          reads as deliberate. The frame animates the clip and the photo inside settles from 115% at the same time,
          on the same range:
        </p>
        <Code file="index.html">{CLIP_HTML}</Code>
        <Code file="wipe.css">{CLIP_CSS}</Code>
        <p>
          <code>clip-path</code> needs both ends written: from an <code>inset()</code> to nothing at all would jump
          rather than move. Change the side by changing which inset starts at 100%: <code>inset(0 0 0 100%)</code>{' '}
          opens from the right, <code>inset(100% 0 0 0)</code> from the bottom. Clipping does not change the layout,
          so the text around the image never shifts while it opens.
        </p>
      </Section>

      <Section id="once" k="the limit" title="Progress-linked or play once">
        <p>
          Everything above is progress-linked. A scroll timeline is a position, not an event: stop halfway and the card
          stays half revealed; scroll back up and it fades back out, as the middle track in Fig. 1 shows. That suits a
          page meant to be scrubbed. It is not what AOS taught everyone to expect, where a card animates once and then
          stays put.
        </p>
        <p>
          A scroll timeline cannot express “play once, stay shown”. Nothing in it remembers that an element was ever
          further along. Scroll-triggered animations, a separate CSS feature that starts a timed animation when an
          element crosses a line, are meant for exactly this, but in our tests only Chromium understood them. Until
          the other engines ship them, the smallest version is an observer that adds a class:
        </p>
        <Code file="once.js">{ONCE_JS}</Code>
        <Code file="once.css">{ONCE_CSS}</Code>
        <p>
          The script marks the page before it hides anything, so if it never loads, nothing is hidden. Each element gets{' '}
          <code>is-in</code> when its top passes a line 10% above the bottom of the screen, plays a 0.6-second
          transition, and is never watched again. The <code>--i</code> from the stagger section becomes a delay here, so the row of cards
          still cascades. Use these rules instead of the scroll-timeline ones, not alongside them: both set opacity
          and translate on the same element, and they fight.
        </p>
        <p>
          svg-scroll-draw’s <code>scrollReveal</code> is the in-between. It follows the scroll on the way in, like{' '}
          <code>view()</code>, and with <code>once</code>, on by default, keeps the furthest point reached, so
          scrolling back never hides anything again. It runs with or without scroll timelines, finishes at once under reduced motion,
          and staggers each row of a grid by reading the layout. It adds {SELF_ENTRIES.reveal.toFixed(1)} KB:
        </p>
        <Code file="reveal.js">{LIB_JS}</Code>
        <p>
          The <Link href="/scroll-reveal-generator">scroll reveal generator</Link> builds that call with presets, and
          the <Link href="/aos-animation">AOS animation examples</Link> show every <code>data-aos</code> effect,
          if that is the look you are matching.
        </p>
      </Section>

      <Section id="support" k="browsers" title="Browser support, and the end of the page">
        <Table
          head={['Browser', 'view() since', 'Notes']}
          first="plain"
          rows={BROWSER_SUPPORT.map((b) => [b.browser, <code key="v">{b.since}</code>, b.note])}
        />
        <p>
          Older versions skip the <code>@supports</code> block and show every element as written: no movement, nothing
          missing. That is the whole fallback. If older browsers should still see a reveal, use the observer version
          for everyone; it is the one that works everywhere.
        </p>
        <p>
          One case catches every scroll-timeline reveal: the last things on a page. A card near the bottom may never
          travel 40% of the way up the screen, because the page ends first, and it sits there half faded for good.
          End those ranges when the element is fully on screen, which the page can always reach:
        </p>
        <Code file="reveal.css">{END_CSS}</Code>
        <p>
          The same happens to an element in the lower half of the screen when the page loads: it shows part-way
          through its reveal until the reader scrolls. In our tests WebKit also drew it fully shown for its first
          frames, before its timeline caught up, so it visibly faded backwards. Leave the reveal off
          anything above the fold.
        </p>
      </Section>

      <Closing
        title="Build one and copy the CSS"
        lede="Pick an effect and a range, scroll the preview, and copy the CSS with its @supports and reduced-motion guards, or the same reveal as one scrollReveal call."
        links={[
          { href: '/css-scroll-driven-animation-generator', label: 'Scroll-driven animation generator →' },
          { href: '/scroll-reveal-generator', label: 'Scroll reveal generator' },
        ]}
      />
    </BlogArticle>
  );
}
