'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CodeBox } from './site/CodeBox';
import {
  SignatureInk, CheckoutInk, RouteInk, DiagramInk, AstroInk, TimelineInk,
  GroupInk, VueInk, SvelteInk, SolidInk, PresetsInk, SequenceInk,
} from './examples/ink/drawings';
import { PricingCardReveal as PricingInk } from './examples/ink/PricingCardReveal';
import { SocialProofStats as CounterInk } from './examples/ink/SocialProofStats';
import { HeadlineReveal as HeadlineInk } from './examples/ink/HeadlineReveal';
import { FeatureLinesDemo as FeatureLinesInk } from './examples/ink/FeatureLinesDemo';
import { AnimateGroupDemo as AnimateGroupInk } from './examples/ink/AnimateGroupDemo';
import { ScrollRevealDemo as RevealInk } from './examples/ink/ScrollRevealDemo';
import { StickyFeaturePanel as PinInk } from './examples/ink/StickyFeaturePanel';
import { HorizontalSnapCarousel as SnapInk } from './examples/ink/HorizontalSnapCarousel';
import { VideoScrubDemo as VideoInk } from './examples/ink/VideoScrubDemo';
import { SCENES } from './examples/scenes/data';
import { SHOWCASE } from '@/showcase';
import { ShowcaseMedia, LiveButton } from '@/showcase/ShowcaseShot';
import { ChartScene } from './examples/scenes/ChartScene';
import { LogoRevealScene } from './examples/scenes/LogoRevealScene';
import { SELF } from '@/data/competitors';
import './examples.css';
import { EXAMPLE_SEO } from '@/data/examples-seo';
import { RECIPE_SLUGS, hasRecipe } from '@/recipes/slugs';

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
    label: SCENES['signature'].label,
    tag: SCENES['signature'].tag,
    description: SCENES['signature'].description,
    preview: <SignatureInk />,
    code: SCENES['signature'].code,
  },
  {
    id: 'flowchart',
    label: SCENES['flowchart'].label,
    tag: SCENES['flowchart'].tag,
    description: SCENES['flowchart'].description,
    preview: <CheckoutInk />,
    code: SCENES['flowchart'].code,
  },
  {
    id: 'map-route',
    label: SCENES['map-route'].label,
    tag: SCENES['map-route'].tag,
    description: SCENES['map-route'].description,
    preview: <RouteInk />,
    code: SCENES['map-route'].code,
  },
  {
    id: 'network',
    label: SCENES['network'].label,
    tag: SCENES['network'].tag,
    description: SCENES['network'].description,
    preview: <DiagramInk />,
    code: SCENES['network'].code,
  },
  {
    id: 'astro',
    label: SCENES['astro'].label,
    tag: SCENES['astro'].tag,
    description: SCENES['astro'].description,
    preview: <AstroInk />,
    code: SCENES['astro'].code,
  },
  {
    id: 'timeline-api',
    label: SCENES['timeline-api'].label,
    tag: SCENES['timeline-api'].tag,
    description: SCENES['timeline-api'].description,
    preview: <TimelineInk />,
    code: SCENES['timeline-api'].code,
  },
  {
    id: 'group-api',
    label: SCENES['group-api'].label,
    tag: SCENES['group-api'].tag,
    description: SCENES['group-api'].description,
    preview: <GroupInk />,
    code: SCENES['group-api'].code,
  },
  {
    id: 'vue',
    label: SCENES['vue'].label,
    tag: SCENES['vue'].tag,
    description: SCENES['vue'].description,
    preview: <VueInk />,
    code: SCENES['vue'].code,
  },
  {
    id: 'svelte',
    label: SCENES['svelte'].label,
    tag: SCENES['svelte'].tag,
    description: SCENES['svelte'].description,
    preview: <SvelteInk />,
    code: SCENES['svelte'].code,
  },
  {
    id: 'solid',
    label: SCENES['solid'].label,
    tag: SCENES['solid'].tag,
    description: SCENES['solid'].description,
    preview: <SolidInk />,
    code: SCENES['solid'].code,
  },
  {
    id: 'presets',
    label: SCENES['presets'].label,
    tag: SCENES['presets'].tag,
    description: SCENES['presets'].description,
    preview: <PresetsInk />,
    code: SCENES['presets'].code,
  },
  {
    id: 'sequence-api',
    label: SCENES['sequence-api'].label,
    tag: SCENES['sequence-api'].tag,
    description: SCENES['sequence-api'].description,
    preview: <SequenceInk />,
    code: SCENES['sequence-api'].code,
  },

  // ── v2 examples ────────────────────────────────────────────────────────────

  {
    id: 'scroll-animate',
    label: SCENES['scroll-animate'].label,
    tag: SCENES['scroll-animate'].tag,
    description: SCENES['scroll-animate'].description,
    preview: <PricingInk />,
    code: SCENES['scroll-animate'].code,
  },

  {
    id: 'scroll-counter',
    label: SCENES['scroll-counter'].label,
    tag: SCENES['scroll-counter'].tag,
    description: SCENES['scroll-counter'].description,
    preview: <CounterInk />,
    code: SCENES['scroll-counter'].code,
  },

  {
    id: 'scroll-video',
    label: SCENES['scroll-video'].label,
    tag: SCENES['scroll-video'].tag,
    description: SCENES['scroll-video'].description,
    preview: <VideoInk />,
    code: SCENES['scroll-video'].code,
  },

  {
    id: 'scroll-text-lines',
    label: SCENES['scroll-text-lines'].label,
    tag: SCENES['scroll-text-lines'].tag,
    description: SCENES['scroll-text-lines'].description,
    preview: <FeatureLinesInk />,
    code: SCENES['scroll-text-lines'].code,
  },

  {
    id: 'scroll-animate-group',
    label: SCENES['scroll-animate-group'].label,
    tag: SCENES['scroll-animate-group'].tag,
    description: SCENES['scroll-animate-group'].description,
    preview: <AnimateGroupInk />,
    code: SCENES['scroll-animate-group'].code,
  },

  {
    id: 'scroll-text',
    label: SCENES['scroll-text'].label,
    tag: SCENES['scroll-text'].tag,
    description: SCENES['scroll-text'].description,
    preview: <HeadlineInk />,
    code: SCENES['scroll-text'].code,
  },
  {
    id: 'scroll-reveal',
    label: SCENES['scroll-reveal'].label,
    tag: SCENES['scroll-reveal'].tag,
    description: SCENES['scroll-reveal'].description,
    preview: <RevealInk />,
    code: SCENES['scroll-reveal'].code,
  },
  {
    id: 'scroll-pin',
    label: SCENES['scroll-pin'].label,
    tag: SCENES['scroll-pin'].tag,
    description: SCENES['scroll-pin'].description,
    preview: <PinInk />,
    code: SCENES['scroll-pin'].code,
  },
  {
    id: 'scroll-snap',
    label: SCENES['scroll-snap'].label,
    tag: SCENES['scroll-snap'].tag,
    description: SCENES['scroll-snap'].description,
    preview: <SnapInk />,
    code: SCENES['scroll-snap'].code,
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
    : activeFilter === 'recipes'
      ? EXAMPLES.filter((ex) => hasRecipe(ex.id))
      : EXAMPLES.filter((ex) => (EXAMPLE_FRAMEWORKS[ex.id] ?? []).includes(activeFilter));

  const frameworks = FILTERS.length - 1;

  return (
    <div className="examples">

      {/* ── Opening ──────────────────────────────────────── */}
      <header className="pg-head ex-head">
        <div>
          <p className="pg-kicker"><span>examples / {EXAMPLES.length} patterns</span><span>Live on this page</span></p>
          <h1 className="pg-title">
            SVG scroll animations <span className="ex-dim">without GSAP</span>
          </h1>
        </div>
        <div className="ex-head-r">
          <p className="pg-lede">
            {EXAMPLES.length} production-ready patterns — logo reveals, charts, signatures, video scrub,
            pinned panels, snapping carousels, and the Timeline, Group and Sequence APIs — each with the
            code to paste, in React, Vue 3, Svelte, Solid or vanilla JS. Scroll and they draw.
          </p>
          <div className="ex-filters" role="group" aria-label="Filter examples">
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
            {/* Not a framework, so not in FILTERS: the "Frameworks" count reads that list. */}
            <button
              type="button"
              className="pill"
              aria-pressed={activeFilter === 'recipes'}
              onClick={() => setActiveFilter('recipes')}
            >
              Recipes
              <span className="pill-n">{RECIPE_SLUGS.length}</span>
            </button>
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
                <span className="ex-card-n">Fig. {String(n).padStart(2, '0')}</span>
                <span className="ex-card-tag">{ex.tag}</span>
                {fws.length > 0 && (
                  <span className="ex-card-fw">{fws.map((k) => FILTERS.find((f) => f.key === k)?.label ?? k).join(' · ')}</span>
                )}
                {EXAMPLE_SEO[ex.id] && (
                  <Link href={`/examples/${ex.id}`} className="ex-card-go">
                    {hasRecipe(ex.id) ? 'recipe' : 'guide'} <span aria-hidden="true">→</span>
                  </Link>
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
