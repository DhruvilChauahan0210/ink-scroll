import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPETITORS, SELF, SELF_ENTRIES } from '@/data/competitors';
import { BlogArticle, Section, Code, Table, Figure, Closing } from '@/components/blog/BlogArticle';
import { LandingFigure } from '@/components/blog/LandingFigure';

// Every size on this page comes from data/competitors.ts.
const APPROX = `~${Math.round(SELF.gzipKb)} KB`;
const kb = (n: number) => `${n.toFixed(1)} KB`;

export const metadata: Metadata = {
  title: 'Scroll Animations: The Complete 2026 Guide',
  description:
    'Every scroll animation pattern with copy-paste code: fade reveal, parallax, pin, snap, text split, video scrub, horizontal scroll and native CSS timelines.',
  keywords: [
    'scroll animation guide',
    'scroll animation javascript 2026',
    'web scroll animation tutorial',
    'scroll driven animation',
    'intersection observer animation',
    'scroll animation library',
    'fade in on scroll',
    'parallax scroll effect',
    'sticky scroll section',
    'scroll animation react',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/blog/complete-guide-scroll-animations-2026' },
  openGraph: {
    title: 'The Complete Guide to Scroll Animations in 2026',
    description: 'Every pattern, every technique, with code. Fade, parallax, pin, snap, text, video, horizontal — all in one place.',
    url: 'https://svg-scroll-draw.vercel.app/blog/complete-guide-scroll-animations-2026',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'The Complete Guide to Scroll Animations in 2026',
  description: 'Every scroll animation pattern explained: fade reveal, parallax, pin/sticky, section snap, text split, video scrub, horizontal scroll, CSS variables.',
  url: 'https://svg-scroll-draw.vercel.app/blog/complete-guide-scroll-animations-2026',
  datePublished: '2026-06-06',
  dateModified: '2026-10-30',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/complete-guide-scroll-animations-2026' },
};

/**
 * The twelve patterns, in section order: the figure's key, the section ids and
 * the closing parts list all read from here, so they cannot disagree.
 */
const PATTERNS = [
  { id: 'fade-reveal', name: 'Fade reveal', api: 'scrollReveal', from: 'svg-scroll-draw/reveal' },
  { id: 'parallax', name: 'Parallax', api: 'scrollParallax', from: 'svg-scroll-draw' },
  { id: 'any-css-property', name: 'Any CSS property', api: 'scrollAnimate', from: 'svg-scroll-draw' },
  { id: 'pin', name: 'Sticky / pin', api: 'scrollPin', from: 'svg-scroll-draw/pin' },
  { id: 'snap', name: 'Section snapping', api: 'scrollSnap', from: 'svg-scroll-draw/snap' },
  { id: 'text-split', name: 'Text split + reveal', api: 'scrollText', from: 'svg-scroll-draw/text' },
  { id: 'counters', name: 'Animated counters', api: 'scrollCounter', from: 'svg-scroll-draw' },
  { id: 'video-scrub', name: 'Video scrubbing', api: 'scrollVideo', from: 'svg-scroll-draw/video' },
  { id: 'horizontal', name: 'Horizontal sections', api: 'scrollHorizontal', from: 'svg-scroll-draw/horizontal' },
  { id: 'css-variable', name: 'CSS variable binding', api: 'scrollProgress', from: 'svg-scroll-draw/progress' },
  { id: 'callbacks', name: 'Scroll callbacks', api: 'onEnter / onLeave', from: 'svg-scroll-draw' },
  { id: 'native-css', name: 'Native CSS timelines', api: 'scrollDraw · scrollAnimate', from: 'svg-scroll-draw' },
];

const id = (n: number) => PATTERNS[n - 1].id;

/** "2026-10-30" → "October 2026". */
const UPDATED = new Date(`${articleJsonLd.dateModified}T00:00:00Z`).toLocaleDateString('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export default function CompletGuidePage() {
  return (
    <BlogArticle
      slug="complete-guide-scroll-animations-2026"
      jsonLd={articleJsonLd}
      tags={['Cornerstone', 'every pattern', 'copy-paste code']}
      title={<>The complete guide to scroll animations in 2026.</>}
      lede={
        <>
          Every scroll animation pattern — fade reveal, parallax, sticky pin, section snap, text split,
          video scrub, horizontal sections, and CSS variable binding — explained with copy-paste code.
          All examples use svg-scroll-draw, a single {APPROX} library that covers all of them.
        </>
      }
      facts={[
        { k: 'Patterns', v: PATTERNS.length },
        { k: 'Main entry', v: kb(SELF.gzipKb) },
        { k: 'Dependencies', v: 'zero' },
        { k: 'Updated', v: UPDATED },
      ]}
      figure={
        <Figure n={1} caption="one product landing page, every pattern in this guide marked where it is used — the key links to each section">
          <LandingFigure zones={PATTERNS} />
        </Figure>
      }
    >
      <Section id={id(1)} k="scrollReveal" title="Fade reveal — the universal pattern" toc="Fade reveal">
        <p>
          The most common scroll animation: elements fade up into view as the user scrolls past them.
          Every major website uses this. AOS and ScrollReveal.js popularised it. svg-scroll-draw
          does it in one call with <code>scrollReveal</code>.
        </p>
        <p>
          Every snippet in this guide runs in the browser. In the Next.js App Router, put it in a client
          component and keep the page on the server; the{' '}
          <Link href="/nextjs-scroll-animation">Next.js scroll animation guide</Link> has a complete App
          Router project to copy.
        </p>
        <Code file="app.js">{`import { scrollReveal } from 'svg-scroll-draw/reveal';

// Default: fade up (opacity 0→1, translateY 32→0)
scrollReveal('.card');

// Custom from state
scrollReveal('.feature', {
  from:    { opacity: 0, y: 40, scale: 0.96 },
  stagger: 0.1,
  easing:  'ease-out',
  once:    true,
});

// Named presets: fadeUp|fadeDown|fadeLeft|fadeRight|scale|flip|flipX
scrollReveal('.badge', { preset: 'scale' });`}</Code>
      </Section>

      <Section id={id(2)} k="scrollParallax" title="Parallax">
        <p>
          Move elements at a different rate than scroll. Background images, floating badges, decorative shapes.
          Negative speed = opposite direction.
        </p>
        <Code file="app.js">{`import { scrollParallax } from 'svg-scroll-draw';

scrollParallax('#hero-bg',       { speed: 0.4 });   // slower than scroll
scrollParallax('#floating-badge',{ speed: -0.2 });  // opposite direction
scrollParallax('#side-element',  { speed: 0.3, axis: 'x' }); // horizontal`}</Code>
      </Section>

      <Section id={id(3)} k="scrollAnimate" title="Animate any CSS property on scroll" toc="Any CSS property">
        <p>
          Not just opacity and transform — any CSS property can be driven by scroll position.
          Colors, backgrounds, borders, clip-paths, filter, font-size, anything.
        </p>
        <Code file="app.js">{`import { scrollAnimate } from 'svg-scroll-draw';

// Color transition (section background shifts as you scroll through)
scrollAnimate('#section', {
  props: {
    backgroundColor: ['#ffffff', '#0d0d0d'],
    color:           ['#000000', '#ffffff'],
  },
});

// Border radius morph
scrollAnimate('#card', {
  props: { borderRadius: ['0px', '24px'] },
});

// Blur reveal
scrollAnimate('#image', {
  props: { filter: ['blur(20px)', 'blur(0px)'], opacity: [0.3, 1] },
  easing: 'ease-out',
  once:   true,
});`}</Code>
      </Section>

      <Section id={id(4)} k="scrollPin" title="Sticky / pin sections">
        <p>
          The Apple product page pattern. An element stays fixed while content scrolls past it.
          Use <code>scrollPin</code> — it wraps the target in a spacer so the page layout doesn’t jump.
        </p>
        <Code file="app.js">{`import { scrollPin } from 'svg-scroll-draw/pin';

// Pin product image while feature text scrolls
scrollPin('#product-image', {
  top:         80,                     // 80px from viewport top (below nav)
  pinDistance: window.innerHeight * 3, // stay pinned for 3 viewport heights
  onEnter:     () => image.classList.add('active'),
  onLeave:     () => image.classList.remove('active'),
  onEnterBack: () => image.classList.add('active'),
  onLeaveBack: () => image.classList.remove('active'),
});`}</Code>
      </Section>

      <Section id={id(5)} k="scrollSnap" title="Section snapping">
        <p>
          Snap the viewport to the nearest section when the user stops scrolling.
          Custom easing, configurable threshold, programmatic control.
        </p>
        <Code file="app.js">{`import { scrollSnap } from 'svg-scroll-draw/snap';

const snap = scrollSnap('.section', {
  duration:  600,
  easing:    'ease-in-out',
  threshold: 0.3,            // snap if scrolled 30%+ past a section
  onSnap:    (index) => updateNav(index),
});

// Programmatic
snap.snapTo(2);              // smooth scroll to section 2
snap.getCurrentIndex();      // → active section index
snap.destroy();`}</Code>
      </Section>

      <Section id={id(6)} k="scrollText" title="Text split + reveal">
        <p>
          Split text into chars, words, or lines and stagger-animate each piece.
          A {kb(SELF_ENTRIES.text)} alternative to GSAP SplitText. SplitText is free and{' '}
          {kb(COMPETITORS.gsapSplitText.gzipKb)}, but it only splits — animating the pieces needs GSAP core (
          {kb(COMPETITORS.gsapCore.gzipKb)}) too.
        </p>
        <Code file="app.js">{`import { scrollText } from 'svg-scroll-draw/text';

// Word-by-word headline reveal
scrollText('#headline', {
  split:   'words',
  stagger: 0.07,
  from:    { opacity: 0, y: 32 },
  easing:  'ease-out',
  once:    true,
});

// Typewriter (char by char)
scrollText('#subtitle', {
  split:   'chars',
  stagger: 0.015,
  from:    { opacity: 0 },
  easing:  'linear',
  once:    true,
});`}</Code>
      </Section>

      <Section id={id(7)} k="scrollCounter" title="Animated counters">
        <p>
          Numbers that count up as they scroll into view. Stats sections, pricing, social proof.
        </p>
        <Code file="app.js">{`import { scrollCounter } from 'svg-scroll-draw';

scrollCounter('#users',      { to: 50000, format: n => Math.round(n).toLocaleString() + '+' });
scrollCounter('#revenue',    { to: 1250000, format: n => '$' + Math.round(n).toLocaleString() });
scrollCounter('#nps',        { to: 94.7, decimals: 1, format: n => n.toFixed(1) + '%' });
scrollCounter('#bundle',     { to: ${Math.round(SELF.gzipKb)}, format: n => '~' + Math.round(n) + ' KB' });`}</Code>
      </Section>

      <Section id={id(8)} k="scrollVideo" title="Video scrubbing">
        <p>
          Tie <code>&lt;video&gt;.currentTime</code> to scroll position.
          The Apple / Stripe product video pattern — free, no GSAP needed.
        </p>
        <Code file="app.js">{`import { scrollVideo } from 'svg-scroll-draw/video';

scrollVideo('#hero-video', {
  trigger: { start: 'top top', end: 'bottom top' },
});`}</Code>
      </Section>

      <Section id={id(9)} k="scrollHorizontal" title="Horizontal scroll sections">
        <p>
          Vertical scroll drives horizontal movement. Set up sticky CSS, one call drives the transform.
        </p>
        <Code file="app.js">{`import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

// CSS: .outer{height:400vh} .sticky{position:sticky;top:0;height:100vh;overflow:hidden}
// .track{display:flex;width:max-content}

scrollHorizontal('.track', {
  distance: document.querySelector('.track').scrollWidth - window.innerWidth,
  easing:   'linear',
});`}</Code>
        <p>
          The full layout, the React version and the progress dots are in{' '}
          <Link href="/blog/horizontal-scroll-sections">Horizontal scroll sections without GSAP</Link>.
        </p>
      </Section>

      <Section id={id(10)} k="scrollProgress" title="CSS variable binding">
        <p>
          Expose scroll progress as a CSS custom property. Then CSS <code>calc()</code> drives everything — color, size,
          position, filter — with zero extra JS.
        </p>
        <Code file="app.js">{`import { scrollProgress } from 'svg-scroll-draw/progress';

scrollProgress('#section', { easing: 'ease-in-out' });`}</Code>
        <Code file="styles.css">{`#section {
  /* Drive any CSS property from the variable */
  opacity: calc(var(--scroll-progress-eased));
  transform: translateY(calc((1 - var(--scroll-progress-eased)) * 40px));
  background: hsl(
    calc(240 + var(--scroll-progress) * 120),
    60%, 10%
  );
}`}</Code>
      </Section>

      <Section id={id(11)} k="onEnter · onLeave" title="Scroll callbacks (onEnter / onLeave)" toc="Scroll callbacks">
        <p>
          Fire code when scroll crosses the trigger zone — in either direction.
          Nav highlighting, lazy loading, analytics events, state updates.
        </p>
        <Code file="app.js">{`import { scrollAnimate } from 'svg-scroll-draw';

scrollAnimate('#section', {
  props: { opacity: [0.4, 1] },
  trigger: { start: 'top center', end: 'bottom center' },
  onEnter:     () => nav.setActive('section'),
  onLeave:     () => nav.clearActive('section'),
  onEnterBack: () => nav.setActive('section'),
  onLeaveBack: () => nav.clearActive('section'),
});`}</Code>
      </Section>

      <Section id={id(12)} k="animation-timeline" title="Native CSS scroll-driven animations" toc="Native CSS timelines">
        <p>
          When <code>animation-timeline: view()</code> is supported (Chrome and Edge 115+, Safari 26+, Firefox 159+),
          svg-scroll-draw automatically uses it — zero JS scroll listeners, zero rAF; for opacity and transform the browser can run it on the compositor. Falls
          back silently in older browsers.
        </p>
        <Code file="app.js">{`import { scrollAnimate } from 'svg-scroll-draw';

// native: true is the default — uses CSS fast path when eligible
scrollAnimate('#hero', {
  props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
  // native: true (default) — CSS scroll timeline when supported; opacity and transform can run on the compositor
});

// Force JS engine (needed for callbacks, velocity, custom easing fns)
scrollAnimate('#section', {
  props: { opacity: [0, 1] },
  native: false,
  onEnter: () => activate(),
});`}</Code>
        <p>
          What makes a config eligible, and what the native path saves, is in{' '}
          <Link href="/blog/native-css-svg-scroll-animations">Zero-JS SVG scroll animations with native CSS</Link>.
        </p>
      </Section>

      <Section id="all-apis" k="parts list" title="One library, all patterns." toc="All patterns, one table">
        <Table
          head={['API', 'Import from', 'Pattern']}
          rows={PATTERNS.map((p, i) => [
            p.api,
            <code key="f">{p.from}</code>,
            <a key="a" href={`#${p.id}`}>{String(i + 1).padStart(2, '0')} · {p.name}</a>,
          ]).concat([
            ['scrollDraw', <code key="f">svg-scroll-draw</code>, 'SVG path drawing — the library’s namesake'],
            ['devtools', <code key="f">svg-scroll-draw/devtools</code>, 'A development overlay of each instance’s trigger window'],
          ])}
        />
      </Section>

      <Closing
        title="One library, all patterns."
        lede={`Each pattern is its own entry point, so you ship only what you import — scrollPin alone is ${kb(SELF_ENTRIES.pin)}, scrollReveal ${kb(SELF_ENTRIES.reveal)}, the main entry ${kb(SELF.gzipKb)}. ${SELF.license}, zero dependencies.`}
        links={[
          { href: '/', label: 'Get started →' },
          { href: '/vs-gsap', label: 'vs GSAP →' },
          { href: '/docs', label: 'API Reference →' },
        ]}
      />
    </BlogArticle>
  );
}
