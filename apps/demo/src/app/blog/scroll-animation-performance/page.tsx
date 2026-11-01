import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import { BlogArticle, Section, Code, Table, Mark, Notes, Figure } from '@/components/blog/BlogArticle';
import { ThreadFigure } from './ThreadFigure';

export const metadata: Metadata = {
  title: seoTitle('Scroll Animation Performance — Native CSS vs JavaScript'),
  description:
    'Native CSS animation-timeline: view() vs JavaScript scroll animation: when the native path wins, when JS wins, and how to keep scrolling smooth.',
  keywords: [
    'scroll animation performance',
    'animation-timeline view()',
    'scroll driven animation native css',
    'javascript scroll animation performance',
    'intersection observer performance',
    'css scroll animation 60fps',
    'native css scroll animation',
    'scroll animation jank',
    'scroll animation optimization',
  ],
  alternates: { canonical: 'https://svg-scroll-draw.vercel.app/blog/scroll-animation-performance' },
  openGraph: {
    title: 'Scroll Animation Performance — Native CSS vs JavaScript',
    description: 'Zero-JS scroll animations with CSS scroll timelines. How animation-timeline: view() works and when to use it.',
    url: 'https://svg-scroll-draw.vercel.app/blog/scroll-animation-performance',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'Scroll Animation Performance — Native CSS vs JavaScript',
  description: 'How svg-scroll-draw uses animation-timeline: view() for scroll animations with no per-frame JavaScript. When native CSS wins, when JS wins, and how to keep scroll animations smooth.',
  url: 'https://svg-scroll-draw.vercel.app/blog/scroll-animation-performance',
  datePublished: '2026-06-06',
  dateModified: '2026-06-06',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan', url: 'https://github.com/DhruvilChauahan0210' },
  publisher: { '@type': 'Organization', name: 'svg-scroll-draw', url: 'https://svg-scroll-draw.vercel.app' },
  image: 'https://svg-scroll-draw.vercel.app/opengraph-image',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://svg-scroll-draw.vercel.app/blog/scroll-animation-performance' },
};

/** The eligibility check, row by row: [condition, native path, JS engine]. */
const CONDITIONS: [string, string, string][] = [
  ['Browser supports animation-timeline: view()', '✓', 'fallback'],
  ['axis: "y" (vertical)', '✓', '✓'],
  ['No custom scrollContainer', '✓', '✓'],
  ['String easing (ease-out etc.)', '✓', '✓'],
  ['No callbacks (onEnter, onComplete…)', '✓', '✓'],
  ['Default trigger (top bottom → bottom top)', '✓', '✓'],
  ['speed: 1', '✓', '✓'],
  ['once: false', '✓', '✓'],
  ['Safe CSS prop (opacity, transform, color…)', '✓', '✓'],
];

const TIPS = [
  { t: 'Stick to native-eligible configs', d: 'opacity and transform are the properties browsers can composite: on the native CSS path they can run off the main thread entirely. Colours and SVG strokes still restyle and repaint on the main thread each frame — just without any JavaScript. Avoid animating layout-triggering properties (width, height, top, left) even in the JS engine.' },
  { t: 'Use once: true for reveal animations', d: 'Reveal animations that reverse on scroll back keep the rAF loop running. once: true freezes the final value and stops the loop after completion.' },
  { t: 'prefers-reduced-motion is respected automatically', d: 'svg-scroll-draw checks window.matchMedia("(prefers-reduced-motion: reduce)") and applies the final state immediately — no animation, full accessibility.' },
  { t: 'Trigger windows matter', d: 'A trigger from top-bottom to bottom-top means the animation is active the entire time the element is in view. Narrow triggers (e.g. top 80% to top 40%) run the rAF loop for less time.' },
];

const mark = (v: string) =>
  v === '✓' ? <Mark ok={true} /> : <span className="ba-cell"><Mark ok={null} /><span>{v}</span></span>;

export default function ScrollPerformancePage() {
  return (
    <BlogArticle
      slug="scroll-animation-performance"
      jsonLd={articleJsonLd}
      tags={['animation-timeline', 'scroll timeline', 'rAF']}
      title={<>Scroll animation performance. Native CSS vs JavaScript.</>}
      lede={
        <>
          Most scroll animation libraries run JavaScript on every scroll event. svg-scroll-draw takes a different approach:
          use the browser&apos;s native <code>animation-timeline: view()</code> when possible — no per-frame JavaScript —
          and fall back to a lean JS engine when it’s not.
        </>
      }
      facts={[
        { k: 'Native path', v: 'zero JS' },
        { k: 'JS engine', v: 'IO + rAF' },
        { k: 'Eligibility checks', v: String(CONDITIONS.length) },
        { k: 'Frame budget', v: `${(1000 / 60).toFixed(1)} ms` },
      ]}
      figure={
        <Figure n={1} caption="where the per-frame work runs for an opacity / transform animation, as a Performance-panel trace — three frames at 60 fps; block widths schematic. SVG strokes skip the script but still restyle and paint on the main thread.">
          <ThreadFigure />
        </Figure>
      }
      further={[
        { href: '/blog/native-css-svg-scroll-animations', label: 'Deep dive: native CSS', blurb: 'The same fast path, applied to SVG path drawing.' },
        { href: '/vs-gsap', label: 'vs GSAP performance', blurb: 'Measured sizes, and where GSAP is still the better call.' },
        { href: '/docs', label: 'API Reference', blurb: 'Every option of every API.' },
      ]}
    >
      <Section id="js-listeners" k="the problem" title="The problem with JS scroll listeners">
        <p>
          Traditional scroll animation libraries work by listening to the scroll event, reading the scroll position, and then
          updating element styles in response. This runs on the main thread, competing with layout, paint, and user input.
        </p>
        <p>
          Even with <code>passive: true</code> and <code>requestAnimationFrame</code>, any JS on the scroll path adds latency.
          On low-end mobile, this is the difference between smooth 60fps and visible jank.
        </p>
      </Section>

      <Section id="native-css" k="animation-timeline" title="The native CSS fast path">
        <p>
          CSS Scroll-Driven Animations (<code>animation-timeline: view()</code>) map scroll to the animation inside the
          browser, with <strong>zero JavaScript involvement</strong>: no scroll listeners, no rAF, no per-frame objects for
          the garbage collector. For <code>opacity</code> and <code>transform</code> the browser can also run the animation on
          the compositor, off the main thread. Other properties — colours, an SVG stroke’s <code>stroke-dashoffset</code>
          — still restyle and repaint on the main thread each frame, only without a script.
        </p>
        <p>Supported in Chrome and Edge 115+, Safari 26+, and Firefox 159+ (on by default since October 2026).</p>
        <Code file="native-css.css">{`/* What the browser generates under the hood */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(32px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate {
  animation-name:            fadeUp;
  animation-duration:        auto;         /* scroll-driven */
  animation-timing-function: ease-out;
  animation-fill-mode:       both;
  animation-timeline:        view();       /* tied to scroll */
  animation-range:           cover 0% cover 100%;
}`}</Code>
      </Section>

      <Section id="engine-choice" k="eligibility" title="How svg-scroll-draw picks the right engine">
        <p>
          svg-scroll-draw checks a set of eligibility criteria on every <code>scrollAnimate</code> call. If all pass, it
          injects a <code>&lt;style&gt;</code> tag and adds a class — no JS scroll listeners at all.
        </p>
        <Table
          first="plain"
          head={['Condition', 'Native path', 'JS engine']}
          rows={CONDITIONS.map(([cond, n, j]) => [cond, mark(n), mark(j)])}
        />
        <Code file="app.js">{`import { scrollAnimate } from 'svg-scroll-draw';

// ✅ Native CSS path — zero JS scroll listeners
scrollAnimate('#hero', {
  props:  { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
  easing: 'ease-out',
  // native: true is the default
});

// ⚡ Falls back to JS engine — callbacks require main-thread JS
scrollAnimate('#section', {
  props:   { opacity: [0, 1] },
  onEnter: () => nav.setActive('section'),  // needs JS
});

// Force JS engine explicitly
scrollAnimate('#card', {
  props:  { opacity: [0, 1] },
  native: false,
});`}</Code>
      </Section>

      <Section id="js-engine" k="fallback" title="The JS engine — when it runs">
        <p>
          When the native path isn&apos;t eligible, svg-scroll-draw uses an <code>IntersectionObserver</code> to start/stop a{' '}
          <code>requestAnimationFrame</code> loop only while the element is in the viewport. The rAF loop stops completely
          when the element scrolls out — no wasted work.
        </p>
        <p>
          CSS property updates are batched per frame via <code>el.style.setProperty()</code> — a single style recalc per
          element per frame.
        </p>
      </Section>

      <Section id="tips" k="checklist" title="Performance tips">
        <Notes items={TIPS} />
      </Section>
    </BlogArticle>
  );
}
