import type { Metadata } from 'next';
import { seoTitle } from '../../_lib/seo';
import {
  BlogArticle, Section, Code, Callout, Table, Mark, Checks, Cols, Figure, Closing,
} from '@/components/blog/BlogArticle';
import { NativePathFigure } from '@/components/blog/NativePathFigure';

export const metadata: Metadata = {
  title: seoTitle('Zero-JS SVG Scroll Animations with Native CSS'),
  description:
    'How animation-timeline: view() drives SVG path animations from the scroll position with no per-frame JavaScript. Chrome/Edge 115+, Safari 26+, Firefox 159+.',
  keywords: [
    'css animation-timeline view',
    'scroll driven animations css',
    'svg scroll animation native css',
    'animation-timeline svg',
    'scroll-driven animations without javascript',
    'css scroll animation path',
    'svg-scroll-draw native css',
    'css scroll timeline svg',
    'zero js animation scroll',
  ],
  alternates: { canonical: '/blog/native-css-svg-scroll-animations' },
  openGraph: {
    title: 'Zero-JS SVG Scroll Animations with Native CSS',
    description:
      'How svg-scroll-draw hands SVG path animations to the browser’s scroll timeline with animation-timeline: view() — no per-frame JavaScript, no scroll listeners.',
    url: 'https://svg-scroll-draw.vercel.app/blog/native-css-svg-scroll-animations',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zero-JS SVG Scroll Animations with Native CSS',
    description: 'Zero per-frame JS. SVG path animations driven by CSS scroll timelines.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Zero-JS SVG Scroll Animations with Native CSS',
  description:
    'How svg-scroll-draw uses animation-timeline: view() to run SVG path animations from the browser’s scroll timeline, with no per-frame JavaScript.',
  author: { '@type': 'Person', name: 'Dhruvil Chauhan' },
  datePublished: '2026-06-04',
  url: 'https://svg-scroll-draw.vercel.app/blog/native-css-svg-scroll-animations',
};

/**
 * Where the fast path engages. The versions are the ones the rest of the site
 * quotes (llms.txt, /vs-gsap, the performance post): Chrome and Edge 115+,
 * Safari 26+, Firefox 159+. Anything older takes the JS engine.
 */
const BROWSER_SUPPORT: { browser: string; version: string; native: boolean; note: string }[] = [
  { browser: 'Chrome',          version: '115+', native: true,  note: 'Full support since Jul 2023' },
  { browser: 'Edge',            version: '115+', native: true,  note: 'Same engine as Chrome' },
  { browser: 'Safari',          version: '26+',  native: true,  note: 'Scroll-driven animations shipped in Safari 26' },
  { browser: 'Firefox',         version: '159+', native: true,  note: 'On by default since 27 Oct 2026' },
  { browser: 'Chrome Android',  version: '115+', native: true,  note: 'Full mobile support' },
  { browser: 'Safari iOS',      version: '26+',  native: true,  note: 'Same engine as Safari 26' },
  { browser: 'Firefox Android', version: '159+', native: true,  note: 'Follows desktop Firefox' },
  { browser: 'Older versions',  version: '—',    native: false, note: 'JS fallback active — same result, no code changes' },
];

/** What has to be true for a scrollDraw() call to take the native path — mirrors nativeEligible() in core/engine.ts. */
const ELIGIBLE: { condition: string; detail: string }[] = [
  {
    condition: 'Browser supports animation-timeline: view()',
    detail: 'Chrome and Edge 115+, Safari 26+, Firefox 159+. Older browsers fall back automatically.',
  },
  {
    condition: 'No callbacks (onProgress, onStart, onComplete, onEnter, onLeave…)',
    detail: 'Callbacks require a JS frame to fire. Declaring any callback forces the JS engine.',
  },
  {
    condition: 'No stagger',
    detail: 'stagger offsets individual paths by time fractions — CSS can\'t express per-path delays within a single view() range.',
  },
  {
    condition: 'No morphTo, waypoints, velocityScale, repeat, autoReverse, delay or once',
    detail: 'These features need frame-by-frame state management that CSS can\'t provide.',
  },
  {
    condition: 'Named easing (not a custom function)',
    detail: 'linear, ease-in, ease-out and ease-in-out have exact CSS equivalents. Spring/bounce/elastic and custom functions require JS.',
  },
  {
    condition: 'speed === 1 (default)',
    detail: 'Non-1 speed values shift the effective trigger range. This is trivial in JS but requires a CSS calc() trick that isn\'t worth the complexity.',
  },
  {
    condition: 'The default trigger window',
    detail: 'Only top bottom → bottom top maps onto the CSS cover range. A custom start or end keeps the JS engine.',
  },
  {
    condition: 'Page scroll on the vertical axis, no clip reveal',
    detail: 'The generated view-timeline follows the block axis of the page. scrollContainer, axis: \'x\' and clip all stay on JS.',
  },
  {
    condition: 'No animated colors or widths',
    detail: 'strokeColor, strokeWidth, fillOpacity — all require per-frame interpolation.',
  },
];

const SCENARIOS: [string, string, string][] = [
  ['Heavy page load', 'The scroll handler and rAF callback queue behind other scripts, so frames run late', 'No script of ours runs per frame; a long task still delays the next paint'],
  ['React re-renders', 'Re-renders and the animation callback compete for the same main thread', 'Nothing of ours competes per frame; only the browser’s own restyle and repaint remain'],
  ['Many animated paths', 'One rAF loop recomputes every path in JavaScript each frame', 'The browser animates each path from its keyframes; no JavaScript per path per frame'],
];

export default function Page() {
  return (
    <BlogArticle
      slug="native-css-svg-scroll-animations"
      jsonLd={jsonLd}
      tags={['animation-timeline', 'view()', 'scroll timeline']}
      title={<>Zero-JS SVG scroll animations.</>}
      lede={
        <>
          Since v1.1.0, svg-scroll-draw automatically hands eligible animations to the browser&apos;s own scroll-driven
          animation engine using <code>animation-timeline: view()</code>. Zero per-frame JavaScript. No scroll listeners.
          No <code>requestAnimationFrame</code> loop.
        </>
      }
      facts={[
        { k: 'JS per frame', v: '0 bytes' },
        { k: 'Scroll listeners', v: 'none' },
        { k: 'Chrome · Safari · Firefox', v: '115 · 26 · 159' },
        { k: 'Opt-out', v: 'native: false' },
      ]}
      figure={
        <Figure n={1} caption="the engine's real code path: one eligibility check at setup, then a generated stylesheet the browser runs from the scroll timeline, or a rAF loop that runs JavaScript before every frame">
          <NativePathFigure />
        </Figure>
      }
      further={[
        { href: '/blog/scroll-animation-performance', label: 'Scroll animation performance', blurb: 'Native CSS vs JavaScript: when each engine runs, and performance tips for both.' },
        { href: '/docs', label: 'API Reference', blurb: 'Every option of every API, the native flag included.' },
      ]}
    >
      <Section id="animation-timeline" k="the CSS primitive" toc="What is view()?" title={<>What is <code>animation-timeline: view()</code>?</>}>
        <p>
          <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline/view" target="_blank" rel="noopener noreferrer">
            Scroll-Driven Animations
          </a>{' '}
          is a CSS spec that lets you tie a CSS <code>@keyframes</code> animation to the scroll position of an element in
          the viewport — without any JavaScript. The browser drives it from the scroll position itself; no script runs per frame.
        </p>
        <p>
          The key property is <code>animation-timeline: view()</code>. Combined with <code>animation-range</code>, you
          declare &ldquo;play this animation as the element travels from X to Y in the viewport&rdquo;. The browser scrubs
          the animation in sync with scroll — no rAF, no event listeners, no JavaScript execution per frame.
        </p>
        <Code file="native-css-raw.css">{`/* Pure CSS scroll-driven animation */
@keyframes draw-path {
  from { stroke-dashoffset: var(--path-length); }
  to   { stroke-dashoffset: 0; }
}

path {
  stroke-dasharray:  var(--path-length);
  stroke-dashoffset: var(--path-length);

  animation-name:           draw-path;
  animation-timing-function: ease-out;
  animation-fill-mode:      both;
  animation-duration:       1s; /* ignored — scroll drives it */

  animation-timeline: view();   /* scroll-driven */
  animation-range: entry 20% exit 80%;
}`}</Code>
        <p>
          The catch: you have to know the path length upfront (to set <code>--path-length</code>), and older browsers —
          Safari before 26, Firefox before 159 — don&apos;t support it. That&apos;s where svg-scroll-draw comes in — it
          measures the length, injects the CSS, and falls back to the JS engine seamlessly on unsupported browsers.
        </p>
      </Section>

      <Section id="under-the-hood" k="under the hood" title="How svg-scroll-draw activates the native path">
        <p>
          When you call <code>scrollDraw()</code>, the engine first checks whether the config is
          &ldquo;native-eligible&rdquo;. If it is and the browser supports <code>animation-timeline: view()</code>, it
          generates a <code>&lt;style&gt;</code> tag and injects the CSS keyframe animation — then returns. The JS rAF
          loop never starts.
        </p>
        <p>
          If the browser doesn&apos;t support it (Safari before 26, Firefox before 159, Chrome before 115), the engine falls
          back to the full JS path transparently. Your code doesn&apos;t change. The animation looks identical.
        </p>
        <Cols>
          <Checks
            title="Native CSS path"
            items={[
              'Driven by the browser’s scroll timeline',
              'Zero per-frame JavaScript',
              'No scroll event listeners',
              'No requestAnimationFrame',
              'Instant response to scroll direction changes',
            ].map((text) => ({ ok: true, text }))}
          />
          <Checks
            muted
            title="JS fallback path"
            items={[
              'IntersectionObserver gating',
              'requestAnimationFrame loop',
              'Runs only while visible',
              'Same visual result',
              'Full instance API works',
              'Activates automatically wherever view() is missing',
            ].map((text) => ({ ok: true, text }))}
          />
        </Cols>
        <Code file="engine.ts (simplified eligibility check)">{`function isNativeEligible(options) {
  if (options.native === false)      return false; // explicit opt-out
  if (!CSS.supports('animation-timeline: view()')) return false;
  if (typeof options.easing === 'function') return false; // custom fn = JS
  if (!['linear', 'ease-in', 'ease-out', 'ease-in-out'].includes(options.easing))
    return false;                                  // spring / bounce / elastic = JS
  if (options.stagger !== 0)         return false; // stagger needs JS timing
  if (options.speed !== 1)           return false; // non-1 speed shifts the range
  if (options.delay > 0)             return false;
  if (options.repeat || options.once || options.autoReverse) return false; // loop/once logic = JS
  if (options.morphTo || options.waypoints) return false; // path interpolation = JS only
  if (options.velocityScale)         return false; // needs live velocity
  if (options.clip || options.axis !== 'y' || options.scrollContainer) return false;
  if (options.onProgress || options.onStart || options.onComplete ||
      options.onEnter || options.onLeave ||
      options.onEnterBack || options.onLeaveBack) return false; // callbacks need JS frames
  if (options.strokeColor || options.strokeWidth || options.fillOpacity) return false;
  if (options.trigger.start !== 'top bottom' ||
      options.trigger.end   !== 'bottom top') return false; // only the default maps to CSS \`cover\`
  return true; // ✓ hand off to CSS
}`}</Code>
      </Section>

      <Section id="eligibility" k="eligibility" title="What triggers native vs JS?">
        <p>The native path activates when all of these are true:</p>
        <Checks
          items={ELIGIBLE.map(({ condition, detail }) => ({
            ok: true,
            text: <><strong>{condition}</strong> — {detail}</>,
          }))}
        />
        <Callout k="the 90% case">
          The vast majority of real-world scroll-draw animations — a logo tracing in, a line chart appearing, a hero
          illustration drawing — use the default options. No callbacks, no stagger, default speed, named easing. These all
          hit the native path automatically in Chrome, Edge, Safari 26+ and Firefox 159+.
        </Callout>
      </Section>

      <Section id="in-practice" k="in practice" title="Native vs JS — the code is identical">
        <p>
          You don&apos;t write different code for the native path. The engine decides. Here are examples that hit native,
          and examples that stay on JS:
        </p>
        <h3 className="ba-h3">Native path activated</h3>
        <Code file="logo.js">{`import { scrollDraw } from 'svg-scroll-draw';

// Simple logo reveal — native CSS wherever view() is supported
scrollDraw('#logo', {
  easing: 'ease-out',
  fade: true,
});
// → CSS animation-timeline injected, no JS loop`}</Code>
        <Code file="Logo.tsx">{`import { ScrollDraw } from 'svg-scroll-draw/react';

// React component — also hits native path
function Logo() {
  return (
    <ScrollDraw easing="ease-in-out" fade>
      <svg>…</svg>
    </ScrollDraw>
  );
}
// add once and it moves to the JS path (needs freeze logic)`}</Code>

        <h3 className="ba-h3">JS path (by necessity)</h3>
        <Code file="chart.js">{`// onProgress callback → JS path (needs frame-by-frame)
scrollDraw('#chart', {
  easing: 'ease-out',
  onProgress: (alpha) => {
    counter.textContent = Math.round(alpha * 1000);
  },
});

// stagger → JS path (per-path offset timing)
scrollDraw('#diagram', {
  stagger: 0.15,
  easing: 'ease-out',
});

// spring easing → JS path (not a CSS timing function)
scrollDraw('#path', {
  easing: 'spring',
});

// custom trigger window → JS path (only the default maps to CSS cover)
scrollDraw('#logo', {
  trigger: { start: 'top 80%', end: 'top 20%' },
});

// Opt out explicitly
scrollDraw('#path', {
  native: false, // always use JS engine
});`}</Code>
      </Section>

      <Section id="browser-support" k="browser support" title="Where native runs today">
        <Table
          head={['Browser', 'Version', 'Path', 'Notes']}
          first="plain"
          rows={BROWSER_SUPPORT.map((r) => [
            r.browser,
            <code key="v">{r.version}</code>,
            <span key="s" className="ba-cell"><Mark ok={r.native} /><span>{r.native ? 'native CSS' : 'JS fallback'}</span></span>,
            r.note,
          ])}
        />
        <Callout k="older browsers">
          Safari before 26 and Firefox before 159 do not support <code>animation-timeline: view()</code>. svg-scroll-draw
          detects this at runtime and activates the JS engine automatically — the animation looks and behaves
          identically. No code changes, no browser-specific branches.
        </Callout>
      </Section>

      <Section id="compositor" k="performance impact" title="What the native path saves">
        <p>
          JavaScript animations run on the main thread. When your main thread is busy — parsing JS, running React
          reconciliation, handling events — the scroll animation stutters. The scroll event fires, the rAF fires, but the
          frame is delayed. That&apos;s why even well-optimised JS scroll animations can drop frames during page load or
          heavy interaction.
        </p>
        <p>
          On the native path there is no JavaScript of ours in the frame at all: the browser maps the scroll position to
          the keyframes itself and redraws the stroke. That is less work than the JS path, and none of it competes with your
          own scripts. It is not free, though. Browsers composite <code>transform</code> and <code>opacity</code> off the
          main thread, but <code>stroke-dashoffset</code> is not one of those properties, so each frame still restyles and
          repaints the path on the main thread — a long task can still delay a frame, with no script of ours adding to it.
          <code>scrollAnimate</code>&apos;s native path for <code>opacity</code> and <code>transform</code> is the one that can
          run fully on the compositor.
        </p>
        <Table first="plain" head={['Scenario', 'JS', 'Native CSS']} rows={SCENARIOS} />
      </Section>

      <Section id="control" k="control" title="Opt-out and instance API">
        <p>
          If you need to force the JS engine — for testing, for a polyfill, or because you&apos;re debugging — set{' '}
          <code>native: false</code>:
        </p>
        <Code file="opt-out.js">{`scrollDraw('#logo', {
  easing: 'ease-out',
  native: false, // always use JS rAF engine
});`}</Code>
        <p>
          The full instance API — <code>pause()</code>, <code>resume()</code>, <code>seek()</code>,{' '}
          <code>replay()</code>, <code>destroy()</code> — works on both paths. The native path implements these by
          toggling <code>animation-play-state</code> and injecting inline offsets.
        </p>
        <Code file="instance-api.js">{`const instance = scrollDraw('#logo', { easing: 'ease-out' });

instance.pause();              // pauses wherever it is
instance.resume();             // continues from same point
instance.seek(0.5);            // jump to 50% drawn
instance.replay();             // restart from 0
instance.destroy();            // remove all styles + observers
instance.getProgress();        // → 0–1`}</Code>
      </Section>

      <Section id="tldr" k="summary" title="TL;DR">
        <ol>
          <li>svg-scroll-draw automatically uses the native CSS path on Chrome and Edge 115+, Safari 26+ and Firefox 159+.</li>
          <li>The native path runs zero JavaScript per frame — no scroll listeners, no rAF.</li>
          <li>The JS fallback activates automatically on older browsers — same visual result.</li>
          <li>Any config that needs JS (callbacks, stagger, spring easing, repeat, velocityScale, a custom trigger window) stays on the JS engine.</li>
          <li>The vast majority of real-world logo reveals and path animations hit the native path.</li>
          <li>You don&apos;t write different code. The engine decides.</li>
        </ol>
      </Section>

      <Closing
        title="Try it yourself"
        lede="Open DevTools → Performance while scrolling a svg-scroll-draw animation. On Chrome, you'll see zero main-thread JS per frame."
        links={[
          { href: '/playground', label: 'Playground →' },
          { href: '/blog', label: '← Blog' },
        ]}
      />
    </BlogArticle>
  );
}
