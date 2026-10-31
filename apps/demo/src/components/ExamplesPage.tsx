'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CodeBox } from './site/CodeBox';
import {
  SignatureInk, CheckoutInk, RouteInk, DiagramInk, AstroInk, TimelineInk,
  GroupInk, VueInk, SvelteInk, SolidInk, PresetsInk, SequenceInk,
} from './examples/ink/drawings';
import { CODES_D, DESCRIPTIONS_D, TAGS_D } from './examples/ink/drawings.codes';
import { PricingCardReveal as PricingInk } from './examples/ink/PricingCardReveal';
import { SocialProofStats as CounterInk } from './examples/ink/SocialProofStats';
import { HeadlineReveal as HeadlineInk } from './examples/ink/HeadlineReveal';
import { FeatureLinesDemo as FeatureLinesInk } from './examples/ink/FeatureLinesDemo';
import { AnimateGroupDemo as AnimateGroupInk } from './examples/ink/AnimateGroupDemo';
import { ScrollRevealDemo as RevealInk } from './examples/ink/ScrollRevealDemo';
import { StickyFeaturePanel as PinInk } from './examples/ink/StickyFeaturePanel';
import { HorizontalSnapCarousel as SnapInk } from './examples/ink/HorizontalSnapCarousel';
import { VideoScrubDemo as VideoInk } from './examples/ink/VideoScrubDemo';
import { CODES_A, DESCRIPTIONS_A } from './examples/ink/ui-a.codes';
import { CODES_B, DESCRIPTIONS_B } from './examples/ink/ui-b.codes';
import { SCENES } from './examples/scenes/data';
import { SHOWCASE } from '@/showcase';
import { ShowcaseMedia, LiveButton } from '@/showcase/ShowcaseShot';
import { ChartScene } from './examples/scenes/ChartScene';
import { LogoRevealScene } from './examples/scenes/LogoRevealScene';
import { SELF } from '@/data/competitors';
import './examples.css';
import { EXAMPLE_SEO } from '@/data/examples-seo';

function CodeBlock({ filename, children }: { filename: string; children: string }) {
  return <CodeBox file={filename}>{children}</CodeBox>;
}

/* ── The examples: each preview lives in examples/ink, drawn in the
      homepage's ink; its snippet and description sit beside it. ─────────── */

export const EXAMPLES = [
  {
    id: 'logo-reveal',
    label: SCENES['logo-reveal'].label,
    tag: SCENES['logo-reveal'].tag,
    description: SCENES['logo-reveal'].description,
    preview: <LogoRevealScene />,
    code: SCENES['logo-reveal'].code,
  },
  {
    id: 'line-chart',
    label: SCENES['line-chart'].label,
    tag: SCENES['line-chart'].tag,
    description: SCENES['line-chart'].description,
    preview: <ChartScene />,
    code: SCENES['line-chart'].code,
  },
  {
    id: 'signature',
    label: 'Contract Signature',
    tag: TAGS_D['signature'],
    description: DESCRIPTIONS_D['signature'],
    preview: <SignatureInk />,
    code: CODES_D['signature'],
  },
  {
    id: 'flowchart',
    label: 'Checkout Flow',
    tag: 'selector · stagger',
    description: DESCRIPTIONS_D['flowchart'],
    preview: <CheckoutInk />,
    code: CODES_D['flowchart'],
  },
  {
    id: 'map-route',
    label: 'Delivery Route',
    tag: TAGS_D['map-route'],
    description: DESCRIPTIONS_D['map-route'],
    preview: <RouteInk />,
    code: CODES_D['map-route'],
  },
  {
    id: 'network',
    label: 'API Architecture',
    tag: 'selector · ease-out',
    description: DESCRIPTIONS_D['network'],
    preview: <DiagramInk />,
    code: CODES_D['network'],
  },
  {
    id: 'astro',
    label: 'Astro Integration',
    tag: 'data-scroll-draw · initScrollDraw()',
    description: DESCRIPTIONS_D['astro'],
    preview: <AstroInk />,
    code: `// src/pages/index.astro
---
// No server-side imports needed
---

<div
  data-scroll-draw
  data-scroll-draw-options='{"easing":"ease-out","fade":true,"once":true}'
>
  <svg viewBox="0 0 200 80" fill="none">
    <path d="M10 40 Q100 5 190 40"
      stroke="currentColor" strokeWidth="2" />
  </svg>
</div>

<script>
  import { initScrollDraw } from 'svg-scroll-draw/astro';

  // Finds all [data-scroll-draw] on the page and
  // initialises each one — no React, no Vue needed.
  initScrollDraw();
</script>`,
  },
  {
    id: 'timeline-api',
    label: 'Timeline API',
    tag: 'scrollDrawTimeline · independent tracks',
    description: DESCRIPTIONS_D['timeline-api'],
    preview: <TimelineInk />,
    code: `import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';

// Each track owns its own from/to slice of the scroll range.
// Unlike stagger (time offset), windows can overlap freely.
scrollDrawTimeline('#chart', {
  trigger: { start: 'top 88%', end: 'top 25%' },
  tracks: [
    { selector: '.axis',  from: 0,    to: 0.28, easing: 'ease-out' },
    { selector: '.bar-1', from: 0.1,  to: 0.42, easing: 'ease-out' },
    { selector: '.bar-2', from: 0.26, to: 0.56, easing: 'ease-out' },
    { selector: '.bar-3', from: 0.42, to: 0.72, easing: 'ease-out' },
    { selector: '.bar-4', from: 0.58, to: 0.88, easing: 'ease-out' },
    // Trend line draws only after all bars are visible
    { selector: '.trend', from: 0.75, to: 1.0,  easing: 'spring'   },
  ],
});`,
  },
  {
    id: 'group-api',
    label: 'Group API',
    tag: 'scrollDrawGroup · synchronized',
    description: DESCRIPTIONS_D['group-api'],
    preview: <GroupInk />,
    code: `import { scrollDrawGroup } from 'svg-scroll-draw/group';

// All three containers share the same options and
// start drawing at exactly the same scroll position.
const group = scrollDrawGroup(
  [speedRef.current, sizeRef.current, frameworkRef.current],
  {
    easing: 'ease-out',
    speed:  1.1,
    fade:   true,
    once:   true,
    trigger: { start: 'top 88%', end: 'top 25%' },
  }
);

// One call controls all instances
group.replay();
group.pause();
group.destroy(); // cleanup on unmount`,
  },
  {
    id: 'vue',
    label: 'Vue 3',
    tag: 'ScrollDraw component · useScrollDraw composable',
    description: DESCRIPTIONS_D['vue'],
    preview: <VueInk />,
    code: `<!-- Option 1: <ScrollDraw> component -->
<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue';
</script>

<template>
  <ScrollDraw easing="ease-out" :speed="0.9" fade once>
    <svg viewBox="0 0 200 100" fill="none">
      <path d="M10 50 Q100 10 190 50"
        stroke="currentColor" stroke-width="2.5" />
    </svg>
  </ScrollDraw>
</template>

<!-- Option 2: useScrollDraw composable -->
<script setup>
import { useScrollDraw } from 'svg-scroll-draw/vue';

const containerRef = useScrollDraw({
  easing: 'spring',
  once:   true,
  trigger: { start: 'top 80%', end: 'center 20%' },
});
</script>

<template>
  <div :ref="containerRef">
    <svg viewBox="0 0 200 100" fill="none">
      <path d="M10 50 Q100 10 190 50"
        stroke="currentColor" stroke-width="2.5" />
    </svg>
  </div>
</template>`,
  },
  {
    id: 'svelte',
    label: 'Svelte',
    tag: 'use:scrollDraw action · createScrollDraw',
    description: DESCRIPTIONS_D['svelte'],
    preview: <SvelteInk />,
    code: `<!-- Option 1: use:scrollDraw action (simplest) -->
<script>
  import { scrollDraw } from 'svg-scroll-draw/svelte';
</script>

<div use:scrollDraw={{ easing: 'spring', fade: true, once: true }}>
  <svg viewBox="0 0 200 100" fill="none">
    <path d="M10 50 Q100 10 190 50"
      stroke="currentColor" stroke-width="2.5" />
  </svg>
</div>

<!-- Option 2: createScrollDraw for instance control -->
<script>
  import { createScrollDraw } from 'svg-scroll-draw/svelte';

  const { action, getInstance } = createScrollDraw({
    easing: 'spring',
    once:   true,
    speed:  1.2,
  });
</script>

<div use:action>
  <svg viewBox="0 0 200 100" fill="none">
    <path d="M10 50 Q100 10 190 50"
      stroke="currentColor" stroke-width="2.5" />
  </svg>
</div>
<button on:click={() => getInstance()?.replay()}>
  Replay
</button>`,
  },
  {
    id: 'solid',
    label: 'Solid.js',
    tag: 'useScrollDraw hook · createScrollDraw',
    description: DESCRIPTIONS_D['solid'],
    preview: <SolidInk />,
    code: `// Option 1: useScrollDraw hook (simplest)
import { useScrollDraw } from 'svg-scroll-draw/solid';

function Hero() {
  const ref = useScrollDraw({
    easing: 'ease-out',
    fade:   true,
    once:   true,
  });
  return (
    <div ref={ref}>
      <svg viewBox="0 0 200 80" fill="none">
        <path d="M10 40 Q100 5 190 40"
          stroke="currentColor" stroke-width="2.5" />
      </svg>
    </div>
  );
}

// Option 2: createScrollDraw — instance control
import { createScrollDraw } from 'svg-scroll-draw/solid';

function HeroWithReplay() {
  const { ref, getInstance } = createScrollDraw({
    easing: 'spring',
    once:   true,
  });
  return (
    <>
      <div ref={ref}>
        <svg viewBox="0 0 200 80" fill="none">
          <path d="M10 40 Q100 5 190 40"
            stroke="currentColor" stroke-width="2.5" />
        </svg>
      </div>
      <button onClick={() => getInstance()?.replay()}>
        Replay
      </button>
    </>
  );
}`,
  },
  {
    id: 'presets',
    label: 'Presets',
    tag: 'preset option · one-liner setup',
    description: DESCRIPTIONS_D['presets'],
    preview: <PresetsInk />,
    code: `import { scrollDraw } from 'svg-scroll-draw';

// One-liner for each common pattern
scrollDraw('#logo',    { preset: 'reveal'     }); // fade + ease-out, once
scrollDraw('#diagram', { preset: 'sketch'     }); // staggered ease-in
scrollDraw('#text',    { preset: 'typewriter' }); // fast linear stagger
scrollDraw('#hero',    { preset: 'cinematic'  }); // slow fade ease-in-out
scrollDraw('#icon',    { preset: 'spring'     }); // spring easing

// Override any preset value
scrollDraw('#logo', { preset: 'reveal', easing: 'spring' });

// Inspect presets
import { PRESETS } from 'svg-scroll-draw';
console.log(PRESETS.reveal);
// { easing: 'ease-out', fade: true, speed: 1.2, once: true }`,
  },
  {
    id: 'sequence-api',
    label: 'Sequence API',
    tag: 'scrollDrawSequence · one after another',
    description: DESCRIPTIONS_D['sequence-api'],
    preview: <SequenceInk />,
    code: `import { scrollDrawSequence } from 'svg-scroll-draw/group';

// Each container starts drawing only after
// the previous one fully completes.
const seq = scrollDrawSequence(
  [codeRef.current, buildRef.current, shipRef.current],
  {
    easing:     'ease-out',
    speed:      1.4,
    fade:       true,
    trigger:    { start: 'top 88%', end: 'top 25%' },
    onComplete: () => setStep((s) => s + 1),
  }
);

seq.replay();   // restart from step 1
seq.destroy();  // cleanup on unmount`,
  },

  // ── v2 examples ────────────────────────────────────────────────────────────

  {
    id: 'scroll-animate',
    label: 'Pricing Card Reveal',
    tag: 'v2 · scrollAnimate · staggered',
    description: DESCRIPTIONS_A['scroll-animate'],
    preview: <PricingInk />,
    code: CODES_A['scroll-animate'],
  },

  {
    id: 'scroll-counter',
    label: 'Social Proof Strip',
    tag: 'v2 · scrollCounter · formatted',
    description: DESCRIPTIONS_A['scroll-counter'],
    preview: <CounterInk />,
    code: CODES_A['scroll-counter'],
  },

  {
    id: 'scroll-video',
    label: 'Product Video Scrub',
    tag: 'v2 · scrollVideo · currentTime',
    description: DESCRIPTIONS_B['scroll-video'],
    preview: <VideoInk />,
    code: CODES_B['scroll-video'],
  },

  {
    id: 'scroll-text-lines',
    label: 'Feature List Reveal',
    tag: 'v2 · scrollAnimate · staggered list',
    description: DESCRIPTIONS_A['scroll-text-lines'],
    preview: <FeatureLinesInk />,
    code: CODES_A['scroll-text-lines'],
  },

  {
    id: 'scroll-animate-group',
    label: 'Animate Group',
    tag: 'v2 · scrollAnimateGroup · fan-out',
    description: DESCRIPTIONS_A['scroll-animate-group'],
    preview: <AnimateGroupInk />,
    code: CODES_A['scroll-animate-group'],
  },

  {
    id: 'scroll-text',
    label: 'Hero Headline Reveal',
    tag: 'v2 · scrollText · words + chars',
    description: DESCRIPTIONS_A['scroll-text'],
    preview: <HeadlineInk />,
    code: CODES_A['scroll-text'],
  },
  {
    id: 'scroll-reveal',
    label: 'Card Cascade Reveal',
    tag: 'v2.8 · scrollReveal · stagger',
    description: DESCRIPTIONS_B['scroll-reveal'],
    preview: <RevealInk />,
    code: CODES_B['scroll-reveal'],
  },
  {
    id: 'scroll-pin',
    label: 'Sticky Feature Panel',
    tag: 'v2.7 · scrollPin · onEnter / onLeave',
    description: DESCRIPTIONS_B['scroll-pin'],
    preview: <PinInk />,
    code: CODES_B['scroll-pin'],
  },
  {
    id: 'scroll-snap',
    label: 'Horizontal Snap Carousel',
    tag: 'v2.7 · scrollSnap · horizontal',
    description: DESCRIPTIONS_B['scroll-snap'],
    preview: <SnapInk />,
    code: CODES_B['scroll-snap'],
  },
];

const EXAMPLE_FRAMEWORKS: Record<string, string[]> = {
  'logo-reveal':  ['react'],
  'line-chart':   ['react'],
  'signature':    ['react'],
  'flowchart':    ['react'],
  'map-route':    ['react'],
  'network':      ['react'],
  'astro':        ['vanilla'],
  'timeline-api': ['api'],
  'group-api':    ['api'],
  'vue':          ['vue'],
  'svelte':       ['svelte'],
  'solid':        ['solid'],
  'sequence-api':    ['api'],
  'scroll-animate':        ['react', 'vanilla'],
  'scroll-counter':        ['vanilla', 'react'],
  'scroll-video':          ['vanilla', 'react'],
  'scroll-text-lines':     ['vanilla', 'react'],
  'scroll-animate-group':  ['api', 'vanilla'],
  'scroll-text':           ['react', 'vanilla'],
  'presets':               ['api'],
  'scroll-reveal':         ['vanilla', 'react'],
  'scroll-pin':            ['vanilla', 'react'],
  'scroll-snap':           ['vanilla', 'react'],
};

const FILTERS = [
  { key: 'all',     label: 'All' },
  { key: 'react',   label: 'React' },
  { key: 'vue',     label: 'Vue 3' },
  { key: 'svelte',  label: 'Svelte' },
  { key: 'solid',   label: 'Solid' },
  { key: 'vanilla', label: 'Vanilla' },
  { key: 'api',     label: 'API' },
];

/* ── Page ─────────────────────────────────────────────────── */

export function ExamplesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const filtered = activeFilter === 'all'
    ? EXAMPLES
    : EXAMPLES.filter(ex => (EXAMPLE_FRAMEWORKS[ex.id] ?? []).includes(activeFilter));

  const frameworks = FILTERS.length - 1;

  return (
    <div className="examples">

      {/* ── Opening ──────────────────────────────────────── */}
      <header className="pg-head ex-head">
        <div>
          <p className="pg-kicker"><span>examples / {EXAMPLES.length} patterns</span><span>live on this page</span></p>
          <h1 className="pg-title">
            SVG scroll animations <span className="ex-dim">without GSAP.</span>
          </h1>
        </div>
        <div className="ex-head-r">
          <p className="pg-lede">
            {EXAMPLES.length} production-ready patterns — logo reveals, charts, signatures, video scrub,
            pinned panels, snapping carousels, and the Timeline, Group and Sequence APIs — each with the
            code to paste, in React, Vue 3, Svelte, Solid or vanilla JS. Scroll and they draw.
          </p>
          <div className="ex-filters" role="group" aria-label="Filter by framework">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className="pill"
                aria-pressed={activeFilter === f.key}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
                <span className="pill-n">
                  {f.key === 'all' ? EXAMPLES.length : EXAMPLES.filter((ex) => (EXAMPLE_FRAMEWORKS[ex.id] ?? []).includes(f.key)).length}
                </span>
              </button>
            ))}
          </div>
          <dl className="pg-facts">
            <div><dt>Patterns</dt><dd>{EXAMPLES.length}</dd></div>
            <div><dt>Frameworks</dt><dd>{frameworks}</dd></div>
            <div><dt>Gzipped</dt><dd>{SELF.gzipKb} KB</dd></div>
            <div><dt>Dependencies</dt><dd>0</dd></div>
          </dl>
        </div>
      </header>

      {/* ── The catalogue: every example a plate ─────────── */}
      <div className="ex-cat">
        {filtered.map((ex) => {
          const n = EXAMPLES.indexOf(ex) + 1;
          const fws = EXAMPLE_FRAMEWORKS[ex.id] ?? [];
          const lines = ex.code.replace(/\n+$/, '').split('\n').length;
          const site = SHOWCASE[ex.id];
          return (
            <article key={ex.id} id={ex.id} className={`ex-card${site ? ' is-site' : ''}`}>
              <header className="ex-card-cap">
                <span className="ex-card-n">fig. {String(n).padStart(2, '0')}</span>
                <span className="ex-card-tag">{ex.tag}</span>
                {fws.length > 0 && (
                  <span className="ex-card-fw">{fws.map((k) => FILTERS.find((f) => f.key === k)?.label ?? k).join(' · ')}</span>
                )}
                {EXAMPLE_SEO[ex.id] && (
                  <Link href={`/examples/${ex.id}`} className="ex-card-go">guide <span aria-hidden="true">→</span></Link>
                )}
              </header>
              {site ? <ShowcaseMedia site={site} /> : <div className="ex-card-plate">{ex.preview}</div>}
              <div className="ex-card-foot">
                {site ? (
                  <div className="ex-card-head">
                    <div>
                      <p className="ex-card-k">{site.what}</p>
                      <h2 className="ex-card-t">{site.brand}</h2>
                    </div>
                    <LiveButton site={site} />
                  </div>
                ) : (
                  <h2 className="ex-card-t">{ex.label}</h2>
                )}
                <p className="ex-card-d">{ex.description}</p>
                <details className="ex-code">
                  <summary>
                    <span>code</span>
                    <span className="ex-code-n">{lines} lines</span>
                  </summary>
                  <CodeBlock filename="Hero.tsx">{ex.code}</CodeBlock>
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
