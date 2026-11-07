import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { BlogArticle, Section, Code, Callout, Table } from '@/components/blog/BlogArticle';

const TITLE = 'Reduced Motion for Scroll Animations: What Each Should Do';
const DESCRIPTION =
  'What prefers-reduced-motion should do to each scroll effect: reveals finish at once, snapping jumps, and scrubbing that follows the scroll can stay.';
const URL = 'https://svg-scroll-draw.vercel.app/blog/reduced-motion-scroll-animations';

export const metadata: Metadata = {
  title: seoTitle(TITLE),
  description: DESCRIPTION,
  keywords: [
    'prefers-reduced-motion scroll animation',
    'reduced motion scroll',
    'prefers-reduced-motion javascript',
    'accessible scroll animations',
    'scroll animation vestibular',
    'reduced motion parallax',
    'reduced motion scroll snap',
    'emulate reduced motion playwright',
  ],
  alternates: { canonical: '/blog/reduced-motion-scroll-animations' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: URL },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Reduced motion for scroll animations: what each effect should do',
  description: DESCRIPTION,
  url: URL,
  datePublished: '2026-11-06',
  dateModified: '2026-11-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: `${URL}/opengraph-image`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': URL },
};

const QUERY = `/* CSS: the same media query the scripts read. */
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}

// JavaScript
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
if (reduce.matches) {
  // show the finished state now
}`;

const FINAL = `function reveal(el) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.style.opacity = '1';
    el.style.transform = 'none';
    onRevealed(el);            // whatever waits for the reveal still runs
    return;
  }
  // ...otherwise animate from the hidden state as the element scrolls in
}`;

const SNAP = `function snapTo(top) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top, behavior: reduce ? 'instant' : 'smooth' });
}`;

const LIVE = `const reduce = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = reduce.matches;
reduce.addEventListener('change', (e) => {
  reduced = e.matches;     // a setting changed mid-visit applies now, not on reload
});`;

const TEST = `import { test, expect } from '@playwright/test';

test('reduced motion shows the cards finished', async ({ page }) => {
  // Before the page loads: the scripts read the setting when they start.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.card').first()).toHaveCSS('opacity', '1');
});`;

const LIBRARY = `import { scrollReveal } from 'svg-scroll-draw/reveal';
import { scrollSnap } from 'svg-scroll-draw/snap';
import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

scrollReveal('.card');           // reduced motion: every card shown, no transition
scrollSnap('.section');          // reduced motion: jumps instead of gliding
scrollHorizontal('.track');      // keeps scrubbing; { respectReducedMotion: true } holds it
// Turned on mid-visit, each one finishes at once (2.22.0+).`;

const ROWS: [string, string, string][] = [
  ['A path drawing itself, a fade-up, split text, a counter, parallax', 'Show the finished state at once', 'Decoration played at the reader'],
  ['A video scrubbed by the scroll', 'Show the end frame', 'The frames move on their own'],
  ['Snapping to the next section', 'Jump instead of glide', 'It moves the page itself'],
  ['A horizontal strip moved by the scroll', 'Keep it moving with the scroll', 'Follows the reader’s own input; holding it hides the panels'],
  ['A looping animation on a timer', 'Stop it', 'Motion with no input at all'],
];

export default function Page() {
  return (
    <BlogArticle
      slug="reduced-motion-scroll-animations"
      jsonLd={articleJsonLd}
      tags={['prefers-reduced-motion', 'accessibility', 'Scroll effects']}
      title={<>Reduced motion for scroll animations, effect by effect</>}
      lede={
        <>
          <code>prefers-reduced-motion: reduce</code> is a request for less motion, not for none. Turning every
          scroll effect off can hide content; leaving them all on ignores the reader. Each kind of effect has a
          right answer, and here they are, with the code and the tests.
        </>
      }
      facts={[
        { k: 'media query', v: 'prefers-reduced-motion' },
        { k: 'WCAG', v: '2.3.3 (AAA)' },
        { k: 'default here', v: 'finished state' },
      ]}
      further={[
        { href: '/blog/accessible-split-text-animation', label: 'Accessible split-text animation', blurb: 'The other half of animated text: what a screen reader is left with.' },
        { href: '/docs#scroll-reveal', label: 'scrollReveal reference', blurb: 'Every option, and what it shows under reduced motion.' },
      ]}
    >
      <Section id="setting" k="the request" title="What the setting asks for">
        <p>
          Operating systems let people ask for less motion, and browsers pass that on as the media query{' '}
          <code>prefers-reduced-motion</code>. For people with vestibular disorders, large movement tied to
          scrolling can bring on dizziness or nausea. WCAG 2.1 names it in success criterion 2.3.3, Animation
          from Interactions: motion that an interaction sets off can be turned off, unless it is essential.
        </p>
        <Code file="reduce.css / reduce.js">{QUERY}</Code>
        <p>
          The value is <code>reduce</code>, and that is the brief: take out motion that plays at the reader, and
          keep everything they came for. Below, effect by effect.
        </p>
        <Table head={['Effect', 'Under reduced motion', 'Why']} rows={ROWS} />
      </Section>

      <Section id="reveals" k="decoration" title="Reveals and drawings: show them finished">
        <p>
          A path drawing itself, a card fading up, a headline arriving word by word, a counter running to its
          number, a parallax layer: all decoration, played at the reader. Under reduced motion, show the
          finished state the moment the page loads, and run whatever was waiting for the animation to end.
        </p>
        <Code file="reveal.js">{FINAL}</Code>
        <Callout k="the trap">
          Skipping the animation without applying the end state leaves the element at its start: invisible, or
          half drawn. Hiding is the default in most reveal code, so reduced motion must set the end state, not
          just skip the steps in between.
        </Callout>
      </Section>

      <Section id="snapping" k="scroll-jacking" title="Snapping: jump instead of glide">
        <p>
          A snap that eases the page to the next section moves the whole viewport by itself. That is exactly the
          motion the setting is about. Keep the snap and drop the glide: go there in one step.
        </p>
        <Code file="snap.js">{SNAP}</Code>
      </Section>

      <Section id="scrubbing" k="direct input" title="Scrubbing that follows the scroll can stay">
        <p>
          Some effects move only while the reader scrolls, one pixel for one pixel: a horizontal strip of panels,
          a drawing scrubbed back and forth. That is closer to dragging something than to watching it, and
          freezing it has a cost. A horizontal strip shows its panels only through that movement; hold it still
          and every panel but the first is out of reach, for exactly the readers who asked for less motion.
        </p>
        <p>
          So this is a judgement, not a rule: keep scrubbing that maps directly to the reader’s own scroll,
          and make it easy to opt out where the page has another way to the same content. A loop that plays on a
          timer is different. It moves with no input at all, and it should stop.
        </p>
      </Section>

      <Section id="live" k="change" title="Read it live, not once">
        <p>
          The setting can change while the page is open. Reading <code>matchMedia</code> once at start-up misses
          that until the next load. Listen for the change, and apply it to anything still to come.
        </p>
        <Code file="live.js">{LIVE}</Code>
        <p>
          The two directions are not equal. Turned on, finish whatever is still moving, straight away: the reader
          may have turned it on because the page was making them unwell. Turned off, leave what is already shown
          alone and let motion come back on the next load; hiding content again so it can animate in is worse
          than one missing animation.
        </p>
      </Section>

      <Section id="test" k="verify" title="Test it in a real browser">
        <p>
          Playwright emulates the setting. Set it before the page loads, because most scripts read it once when
          they start, then check the finished state.
        </p>
        <Code file="reduced-motion.spec.ts">{TEST}</Code>
        <p>
          In Chrome’s DevTools, the Rendering panel has the same switch (Emulate CSS media feature{' '}
          <code>prefers-reduced-motion</code>) for checking by eye.
        </p>
      </Section>

      <Section id="library" k="svg-scroll-draw" title="What svg-scroll-draw does">
        <p>
          Every effect in the library follows the table above. Drawings, reveals, split text, counters and
          parallax show their finished state and still fire <code>onComplete</code>; a scrubbed video shows its
          end frame; <code>scrollSnap</code> jumps instead of animating; <code>scrollHorizontal</code> keeps
          scrubbing by default, with <code>respectReducedMotion: true</code> to hold it; a timeline keeps its
          scrubbing and stops its timed loop. Each behaviour is pinned by a test that emulates reduced motion:
          browser tests in Chromium, Firefox and WebKit for the reveals, text, counters, parallax, video,
          snapping, the horizontal strip and the timeline, and unit tests for the path drawing at start-up.
        </p>
        <p>
          Since 2.22.0 every effect also follows the setting live (2.23.0 for the AOS, ScrollReveal and vivus drop-ins), the way the section above describes. Turned
          on mid-visit, each one finishes at once, exactly as a page loaded under reduced motion shows it, and
          fires <code>onComplete</code> once if it had not finished. Turned off again, what finished stays
          finished until the next load; snapping and the timeline’s loop, which hide nothing either way, follow
          it in both directions. Browser tests turn the setting on after the page has loaded, mid-drawing,
          mid-video and mid-story, in all three engines.
        </p>
        <Code file="app.js">{LIBRARY}</Code>
      </Section>
    </BlogArticle>
  );
}
