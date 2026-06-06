'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CopyButton } from './CopyButton';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenu } from './MobileMenu';

const GH  = 'https://github.com/DhruvilChauahan0210/ink-scroll';
const NPM = 'https://www.npmjs.com/package/svg-scroll-draw';

const NAV_GROUPS = [
  {
    label: 'Getting Started',
    items: [
      { id: 'installation', label: 'Installation' },
      { id: 'quick-start',  label: 'Quick Start' },
    ],
  },
  {
    label: 'Options',
    items: [
      { id: 'core-options', label: 'Core' },
      { id: 'trigger',      label: 'Trigger' },
      { id: 'visual',       label: 'Visual' },
      { id: 'callbacks',    label: 'Callbacks' },
      { id: 'advanced',     label: 'Advanced' },
    ],
  },
  {
    label: 'Instance',
    items: [{ id: 'instance-methods', label: 'Methods' }],
  },
  {
    label: 'Frameworks',
    items: [
      { id: 'react',         label: 'React' },
      { id: 'vue',           label: 'Vue 3' },
      { id: 'svelte',        label: 'Svelte' },
      { id: 'solid',         label: 'Solid.js' },
      { id: 'angular',       label: 'Angular' },
      { id: 'nuxt',          label: 'Nuxt' },
      { id: 'astro',         label: 'Astro' },
      { id: 'web-component', label: 'Web Component' },
      { id: 'vanilla',       label: 'Vanilla JS' },
    ],
  },
  {
    label: 'Multi-element',
    items: [
      { id: 'group-api',    label: 'Group API' },
      { id: 'sequence-api', label: 'Sequence API' },
    ],
  },
  {
    label: 'Hooks',
    items: [{ id: 'use-scroll-draw-progress', label: 'useScrollDrawProgress' }],
  },
  {
    label: 'v2.8.0',
    items: [
      { id: 'scroll-reveal',   label: 'scrollReveal' },
      { id: 'velocity-scale',  label: 'velocityScale' },
    ],
  },
  {
    label: 'v2.7.0',
    items: [
      { id: 'scroll-pin',       label: 'scrollPin' },
      { id: 'scroll-snap',      label: 'scrollSnap' },
      { id: 'scroll-callbacks', label: 'Scroll Callbacks' },
      { id: 'lenis-adapter',    label: 'Lenis Adapter' },
    ],
  },
  {
    label: 'v2.6.0',
    items: [
      { id: 'v2-vue',    label: 'Vue 3 v2' },
      { id: 'v2-svelte', label: 'Svelte v2' },
      { id: 'v2-solid',  label: 'Solid v2' },
    ],
  },
  {
    label: 'v2.0–2.2',
    items: [
      { id: 'scroll-animate',   label: 'scrollAnimate' },
      { id: 'scroll-counter',   label: 'scrollCounter' },
      { id: 'scroll-parallax',  label: 'scrollParallax' },
      { id: 'scroll-video',     label: 'scrollVideo' },
      { id: 'scroll-text',      label: 'scrollText' },
      { id: 'devtools',         label: 'DevTools' },
    ],
  },
  {
    label: 'v1.6.0',
    items: [
      { id: 'presets',  label: 'Presets' },
      { id: 'cli-init', label: 'CLI init' },
    ],
  },
  {
    label: 'v1.1.0',
    items: [
      { id: 'native-css', label: 'Native CSS' },
    ],
  },
  {
    label: 'v1.0.0',
    items: [
      { id: 'create-spring',      label: 'createSpring' },
      { id: 'create-bounce',      label: 'createBounce' },
      { id: 'create-elastic',     label: 'createElastic' },
      { id: 'timeline',           label: 'scrollDrawTimeline' },
      { id: 'css-custom-property', label: 'CSS Custom Prop' },
    ],
  },
  {
    label: 'TypeScript',
    items: [{ id: 'typescript', label: 'Types' }],
  },
];

// ── Primitives ────────────────────────────────────────────────────────────────

function CodeBlock({ file, children }: { file: string; children: string }) {
  return (
    <div className="rounded-xl border border-pitch-black overflow-hidden my-4">
      <div className="flex items-center justify-between bg-[#111] px-4 py-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#444]" />
          <span className="w-2 h-2 rounded-full bg-[#444]" />
          <span className="w-2 h-2 rounded-full bg-[#444]" />
        </div>
        <span className="text-[11px] text-[#888] font-mono">{file}</span>
        <CopyButton text={children} />
      </div>
      <pre className="bg-[#0d0d0d] text-[#e5e5e5] px-5 py-4 text-[12.5px] font-mono leading-[1.75] overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Opt({
  name, type, defaultVal, children,
}: {
  name: string; type: string; defaultVal?: string; children: React.ReactNode;
}) {
  return (
    <div className="py-5 border-b border-subtle-ash last:border-0">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <code className="font-mono text-[13px] font-semibold bg-subtle-ash/30 px-2 py-0.5 rounded-md">
          {name}
        </code>
        <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-creator-pink/10 text-pitch-black border border-creator-pink/30">
          {type}
        </span>
        {defaultVal && (
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-marketplace-gray border border-subtle-ash text-graphite-border">
            default: <strong className="text-pitch-black font-mono">{defaultVal}</strong>
          </span>
        )}
      </div>
      <p className="text-sm text-graphite-border leading-relaxed">{children}</p>
    </div>
  );
}

function DocSection({
  id, tag, heading, children,
}: {
  id: string; tag: string; heading: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-14 border-b border-pitch-black last:border-0">
      <p className="text-[11px] uppercase tracking-[0.22em] text-graphite-border mb-2 font-medium">
        {tag}
      </p>
      <h2 className="font-display font-extrabold text-[clamp(22px,2.5vw,32px)] tracking-[-0.03em] leading-tight mb-6">
        {heading}
      </h2>
      {children}
    </section>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-graphite-border mt-8 mb-2">
      {children}
    </h3>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 px-4 py-3 rounded-xl border border-sunshine-yellow/50 bg-sunshine-yellow/5 text-sm text-graphite-border leading-relaxed">
      <span className="font-semibold text-pitch-black">Note: </span>
      {children}
    </div>
  );
}

function OptGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-pitch-black overflow-hidden">
      <div className="px-4 sm:px-6 py-1">{children}</div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function DocsPage() {
  const [activeId, setActiveId] = useState('installation');

  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id); });
      },
      { rootMargin: '-15% 0% -75% 0%', threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-light-linen text-pitch-black min-h-screen">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-4 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight shrink-0">svg-scroll-draw</Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          <Link href="/docs" className="text-xs px-3.5 py-1.5 rounded-full bg-pitch-black text-light-linen font-medium whitespace-nowrap">Docs</Link>
          <Link href="/examples" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Examples</Link>
          <Link href="/blog" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">Blog</Link>
          <Link href="/playground" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium whitespace-nowrap">⚡ Playground</Link>
          <a href={NPM} target="_blank" rel="noopener noreferrer" className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-mono whitespace-nowrap">v2.8.0</a>
          <a href={GH} target="_blank" rel="noopener noreferrer" className="text-sm px-4 py-1.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium whitespace-nowrap">GitHub →</a>
        </div>

        {/* Mobile / tablet */}
        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </nav>

      {/* Mobile section nav — scrollable pill strip */}
      <div className="md:hidden border-b border-pitch-black bg-marketplace-gray px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
        {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`shrink-0 text-[11px] font-mono px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
              activeId === item.id
                ? 'bg-pitch-black text-light-linen border-pitch-black'
                : 'border-subtle-ash text-graphite-border hover:border-pitch-black'
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>

      <div className="max-w-7xl mx-auto flex">

        {/* Sidebar — desktop only */}
        <aside className="hidden md:block w-52 shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto border-r border-pitch-black py-8 pl-6 pr-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-graphite-border mb-1.5 px-2">
                {group.label}
              </p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={`block text-[13px] px-2 py-1 rounded-lg transition-colors ${
                        activeId === item.id
                          ? 'bg-creator-pink text-pitch-black font-semibold'
                          : 'text-graphite-border hover:text-pitch-black hover:bg-subtle-ash/40'
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-12 lg:px-16">

          {/* H1 — visible to crawlers, styled as a subtle lead-in */}
          <h1 className="sr-only">Animate SVG on Scroll — svg-scroll-draw API Reference</h1>

          {/* ── Installation ─────────────────────────────────── */}
          <DocSection id="installation" tag="Getting Started" heading="Installation">
            <p className="text-sm text-graphite-border leading-relaxed mb-5">
              Install via your package manager of choice, or drop in a CDN script tag — no build step required.{' '}
              Coming from GSAP DrawSVG?{' '}
              <Link href="/blog/gsap-drawsvg-alternative" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
                See the migration guide →
              </Link>
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { pm: 'npm',  cmd: 'npm i svg-scroll-draw' },
                { pm: 'pnpm', cmd: 'pnpm add svg-scroll-draw' },
                { pm: 'yarn', cmd: 'yarn add svg-scroll-draw' },
                { pm: 'bun',  cmd: 'bun add svg-scroll-draw' },
              ].map(({ pm, cmd }) => (
                <div
                  key={pm}
                  className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 rounded-xl border border-pitch-black bg-marketplace-gray font-mono text-[12px] sm:text-sm min-w-0"
                >
                  <span className="truncate">
                    <span className="text-graphite-border select-none">$ </span>
                    {cmd}
                  </span>
                  <CopyButton text={cmd} />
                </div>
              ))}
            </div>
            <Sub>CDN</Sub>
            <CodeBlock file="index.html">
              {`<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>`}
            </CodeBlock>
            <p className="text-sm text-graphite-border">
              Exposes <code className="font-mono text-pitch-black">window.SvgScrollDraw</code> globally.
              Use the <code className="font-mono text-pitch-black">&lt;scroll-draw&gt;</code> custom element or call{' '}
              <code className="font-mono text-pitch-black">SvgScrollDraw.scrollDraw()</code> directly.
            </p>
          </DocSection>

          {/* ── Quick Start ──────────────────────────────────── */}
          <DocSection id="quick-start" tag="Getting Started" heading="Quick Start">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Point <code className="font-mono text-pitch-black">scrollDraw()</code> at any element containing an SVG.
              All <code className="font-mono text-pitch-black">path</code>,{' '}
              <code className="font-mono text-pitch-black">line</code>,{' '}
              <code className="font-mono text-pitch-black">rect</code>, and{' '}
              <code className="font-mono text-pitch-black">circle</code> elements inside are animated automatically.
            </p>
            <CodeBlock file="main.js">
{`import { scrollDraw } from 'svg-scroll-draw';

const instance = scrollDraw('#hero-svg', {
  easing: 'ease-out',
  speed:  1.2,
  fade:   true,
  once:   true,
  onComplete: () => console.log('all paths drawn!'),
});

// Control playback later
instance.pause();
instance.resume();
instance.seek(0.5);   // jump to 50%
instance.replay();
instance.destroy();   // cleanup on unmount`}
            </CodeBlock>
            <Note>
              SVG elements must have a <code className="font-mono">stroke</code> attribute and{' '}
              <code className="font-mono">fill="none"</code>.
              In dev mode, a warning is logged if either condition is violated.
            </Note>
          </DocSection>

          {/* ── Core Options ─────────────────────────────────── */}
          <DocSection id="core-options" tag="Options" heading="Core Options">
            <OptGroup>
              <Opt name="preset" type="'sketch' | 'reveal' | 'typewriter' | 'cinematic' | 'spring'">
                Apply a named preset as the base configuration. User-supplied options always override the preset.
                See the <a href="#presets" className="underline underline-offset-2">Presets</a> section for the full option sets.
              </Opt>
              <Opt name="selector" type="string" defaultVal="'path, polyline, line, polygon, rect, circle'">
                CSS selector for elements to animate inside the container. Override to target specific paths by class or ID.
              </Opt>
              <Opt name="speed" type="number" defaultVal="1">
                Animation speed multiplier. Values above 1 complete the draw over a shorter scroll distance. Values below 1 slow it down.
              </Opt>
              <Opt name="easing" type="'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic' | (t: number) => number" defaultVal="'linear'">
                Easing curve applied to draw progress. Pass a custom function for full control — receives and returns a 0–1 value.
              </Opt>
              <Opt name="direction" type="'forward' | 'reverse'" defaultVal="'forward'">
                <code className="font-mono text-pitch-black">'forward'</code> draws the path as you scroll in.{' '}
                <code className="font-mono text-pitch-black">'reverse'</code> starts fully drawn and erases it — useful for "write then erase" effects.
              </Opt>
              <Opt name="stagger" type="number" defaultVal="0">
                Delay between each path starting, as a fraction of the total scroll range.{' '}
                <code className="font-mono text-pitch-black">0.1</code> means each path starts 10% of the range after the previous one.
              </Opt>
              <Opt name="once" type="boolean" defaultVal="false">
                Lock draw progress at its maximum once reached. Scrolling back up will not erase the paths.
              </Opt>
            </OptGroup>
          </DocSection>

          {/* ── Trigger ──────────────────────────────────────── */}
          <DocSection id="trigger" tag="Options" heading="Trigger">
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              Triggers define when the animation starts and ends relative to the scroll position.
              Both use an <code className="font-mono text-pitch-black">"element-anchor viewport-anchor"</code> string format,
              or a percentage like <code className="font-mono text-pitch-black">"20%"</code>.
            </p>
            <OptGroup>
              <Opt name="trigger.start" type="string" defaultVal="'top bottom'">
                When the animation begins.{' '}
                <code className="font-mono text-pitch-black">'top bottom'</code> means "when the top of the element
                hits the bottom of the viewport." Valid anchors:{' '}
                <code className="font-mono text-pitch-black">top | center | bottom</code>.
              </Opt>
              <Opt name="trigger.end" type="string" defaultVal="'bottom top'">
                When the animation completes.{' '}
                <code className="font-mono text-pitch-black">'bottom top'</code> means "when the bottom of the element
                reaches the top of the viewport."
              </Opt>
            </OptGroup>
            <CodeBlock file="triggers.js">
{`// Default — animates across the full scroll-through
scrollDraw('#svg', { trigger: { start: 'top bottom', end: 'bottom top' } });

// Tighter window — starts later, finishes earlier
scrollDraw('#svg', { trigger: { start: 'top 60%', end: 'bottom 40%' } });

// Percentage shorthand
scrollDraw('#svg', { trigger: { start: '20%', end: '80%' } });`}
            </CodeBlock>
          </DocSection>

          {/* ── Visual ───────────────────────────────────────── */}
          <DocSection id="visual" tag="Options" heading="Visual Effects">
            <OptGroup>
              <Opt name="fade" type="boolean" defaultVal="false">
                Fade the element opacity from 0→1 in sync with the draw. Combine with{' '}
                <code className="font-mono text-pitch-black">direction: 'reverse'</code> to fade out while erasing.
              </Opt>
              <Opt name="strokeColor" type="string | [string, string]">
                Static stroke color override, or interpolate between two colors as the path draws.
                Example: <code className="font-mono text-pitch-black">strokeColor={`['#ff90e8', '#ffc900']`}</code>.
              </Opt>
              <Opt name="strokeWidth" type="number | [number, number]">
                Static stroke width, or animate from one width to another as drawing progresses.
              </Opt>
              <Opt name="fillOpacity" type="number | [number, number]">
                Animate fill opacity. Pass <code className="font-mono text-pitch-black">[0, 1]</code> to flood-fill
                the shape in sync with the stroke draw — no callbacks or React state needed.
              </Opt>
              <Opt name="clip" type="boolean | 'left' | 'right' | 'top' | 'bottom' | 'center'">
                Reveal the container using CSS <code className="font-mono text-pitch-black">clip-path</code> instead
                of stroke animation. Works on any content — images, text, divs.{' '}
                <code className="font-mono text-pitch-black">true</code> defaults to{' '}
                <code className="font-mono text-pitch-black">'left'</code>.
              </Opt>
              <Opt name="morphTo" type="string">
                Target SVG <code className="font-mono text-pitch-black">d</code> attribute to morph toward as the
                animation progresses. Source and target paths must have compatible structures — same number of
                commands and coordinate pairs.
              </Opt>
            </OptGroup>
            <CodeBlock file="visual-effects.js">
{`// Color interpolation
scrollDraw('#svg', { strokeColor: ['#ff90e8', '#ffc900'] });

// Fill flood in sync with draw (logo reveal)
scrollDraw('#logo', { fillOpacity: [0, 1], easing: 'ease-out' });

// Clip-path reveal on an image or div
scrollDraw('#image-wrapper', { clip: 'left', speed: 0.8 });

// Path morphing
scrollDraw('#shape', { morphTo: 'M10 80 Q50 10 90 80', easing: 'spring' });`}
            </CodeBlock>
          </DocSection>

          {/* ── Callbacks ────────────────────────────────────── */}
          <DocSection id="callbacks" tag="Options" heading="Callbacks & Waypoints">
            <OptGroup>
              <Opt name="onProgress" type="(alpha: number) => void">
                Called on every animation frame with the current draw progress (0–1).
                Use it to drive any side effect in sync with the SVG draw.
              </Opt>
              <Opt name="onStart" type="() => void">
                Fires once when the animation begins — the first frame where progress &gt; 0.
              </Opt>
              <Opt name="onComplete" type="() => void">
                Fires once when all paths have reached full draw progress (alpha = 1).
              </Opt>
              <Opt name="waypoints" type="Record<number, () => void>">
                Fire callbacks at specific progress thresholds. Keys are 0–1 values.
                Each fires once per cycle and resets on <code className="font-mono text-pitch-black">replay()</code>.
              </Opt>
            </OptGroup>
            <CodeBlock file="callbacks.js">
{`scrollDraw('#svg', {
  onStart:    () => console.log('started'),
  onProgress: (p) => (label.style.opacity = p),
  onComplete: () => badge.classList.add('visible'),

  waypoints: {
    0.25: () => console.log('25% drawn'),
    0.5:  () => triggerConfetti(),
    1.0:  () => showNextSection(),
  },
});`}
            </CodeBlock>
          </DocSection>

          {/* ── Advanced ─────────────────────────────────────── */}
          <DocSection id="advanced" tag="Options" heading="Advanced Options">
            <OptGroup>
              <Opt name="native" type="boolean" defaultVal="true">
                Run the draw as a native CSS scroll-driven animation when the browser supports it and
                the config is eligible (default trigger, named easing, optional{' '}
                <code className="font-mono text-pitch-black">fade</code>, no callbacks or JS-only features).
                Falls back to the JS engine automatically when not eligible. Set{' '}
                <code className="font-mono text-pitch-black">false</code> to always use the JS engine.
                The full instance API works on both paths.
              </Opt>
              <Opt name="autoReverse" type="boolean" defaultVal="false">
                Automatically reverse the animation direction when scrolling back up. Overrides{' '}
                <code className="font-mono text-pitch-black">direction</code>.
              </Opt>
              <Opt name="axis" type="'x' | 'y'" defaultVal="'y'">
                Scroll axis to track. Use <code className="font-mono text-pitch-black">'x'</code> for
                horizontally-scrolling containers.
              </Opt>
              <Opt name="scrollContainer" type="string | Element">
                CSS selector or Element reference for a custom scroll container.
                Defaults to <code className="font-mono text-pitch-black">window</code>.
              </Opt>
              <Opt name="delay" type="number" defaultVal="0">
                Milliseconds to wait before the engine starts observing. Useful for staggering multiple
                instances on initial page load.
              </Opt>
              <Opt name="velocityScale" type="boolean | number" defaultVal="false">
                Scale animation speed by scroll velocity — faster scrolling draws faster.
                Pass a number to control sensitivity (default is 1).
              </Opt>
              <Opt name="repeat" type="number | 'infinite'" defaultVal="0">
                Repeat the animation N times after completion.
                Use <code className="font-mono text-pitch-black">'infinite'</code> to loop forever.
              </Opt>
              <Opt name="repeatDelay" type="number" defaultVal="0">
                Milliseconds to wait between animation repeats.
              </Opt>
              <Opt name="debug" type="boolean" defaultVal="false">
                Renders a visual overlay showing the start and end trigger zones.
                Stripped in production — dev only.
              </Opt>
              <Opt name="threshold" type="number" defaultVal="0">
                IntersectionObserver threshold (0–1). Controls what percentage of the element must be
                visible before the rAF loop activates.
              </Opt>
              <Opt name="rootMargin" type="string" defaultVal="'0px'">
                IntersectionObserver rootMargin. Adjusts the effective bounding box of the viewport
                for intersection detection.
              </Opt>
            </OptGroup>
          </DocSection>

          {/* ── Instance Methods ─────────────────────────────── */}
          <DocSection id="instance-methods" tag="Instance" heading="Instance Methods">
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              <code className="font-mono text-pitch-black">scrollDraw()</code> returns a{' '}
              <code className="font-mono text-pitch-black">ScrollDrawInstance</code> with full playback control.
            </p>
            <OptGroup>
              <Opt name="destroy()" type="() => void">
                Disconnects the IntersectionObserver, cancels the rAF loop, and removes all event listeners.
                Always call this on component unmount.
              </Opt>
              <Opt name="replay()" type="() => void">
                Resets to initial state and replays from the beginning.
                Clears the <code className="font-mono text-pitch-black">once</code> lock and waypoint history.
              </Opt>
              <Opt name="pause()" type="() => void">
                Pauses the rAF loop at the current progress. Scroll position is still tracked.
              </Opt>
              <Opt name="resume()" type="() => void">
                Resumes a paused animation from where it stopped.
              </Opt>
              <Opt name="seek(progress)" type="(progress: number) => void">
                Jump to a specific progress value (0–1) and pause. Useful for building scrubber controls.
              </Opt>
              <Opt name="getProgress()" type="() => number">
                Returns the current draw progress as a number between 0 and 1.
              </Opt>
            </OptGroup>
            <CodeBlock file="instance-control.js">
{`const instance = scrollDraw('#svg', { easing: 'spring' });

// Scrubber slider
slider.addEventListener('input', (e) => {
  instance.seek(e.target.value / 100);
});

// Pause on hover
svg.addEventListener('mouseenter', () => instance.pause());
svg.addEventListener('mouseleave', () => instance.resume());

// Cleanup
window.addEventListener('unload', () => instance.destroy());`}
            </CodeBlock>
          </DocSection>

          {/* ── React ────────────────────────────────────────── */}
          <DocSection id="react" tag="Frameworks" heading="React">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              The React wrapper is a drop-in component that handles lifecycle automatically.
              All options are passed as props.
            </p>
            <CodeBlock file="Hero.tsx">
{`import { ScrollDraw } from 'svg-scroll-draw/react';

export function Hero() {
  return (
    <ScrollDraw
      easing="ease-out"
      speed={1.2}
      fade
      once
      stagger={0.1}
      trigger={{ start: 'top 80%', end: 'center 20%' }}
      onComplete={() => console.log('done!')}
    >
      <svg viewBox="0 0 200 100" fill="none">
        <path d="M10 50 Q100 10 190 50" stroke="black" strokeWidth="2" />
        <circle cx="100" cy="50" r="30" stroke="black" strokeWidth="2" />
      </svg>
    </ScrollDraw>
  );
}`}
            </CodeBlock>
            <Note>
              The <code className="font-mono">ScrollDraw</code> component is SSR-safe — it uses{' '}
              <code className="font-mono">useEffect</code> internally and works in Next.js App Router
              without a <code className="font-mono">'use client'</code> wrapper on the consumer side.
            </Note>
          </DocSection>

          {/* ── Vue ──────────────────────────────────────────── */}
          <DocSection id="vue" tag="Frameworks" heading="Vue 3">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Two options: a <code className="font-mono text-pitch-black">&lt;ScrollDraw&gt;</code> component,
              or the <code className="font-mono text-pitch-black">useScrollDraw</code> composable for custom wrappers.
            </p>
            <Sub>Component</Sub>
            <CodeBlock file="Hero.vue">
{`<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue';
</script>

<template>
  <ScrollDraw easing="ease-out" :speed="1.2" fade once>
    <svg viewBox="0 0 200 100" fill="none">
      <path d="M10 50 Q100 10 190 50" stroke="black" stroke-width="2" />
    </svg>
  </ScrollDraw>
</template>`}
            </CodeBlock>
            <Sub>Composable</Sub>
            <CodeBlock file="useHeroAnim.ts">
{`import { useScrollDraw } from 'svg-scroll-draw/vue';

// Returns a ref — attach it to your container element
const containerRef = useScrollDraw({ easing: 'spring', speed: 0.9, once: true });`}
            </CodeBlock>
          </DocSection>

          {/* ── Svelte ───────────────────────────────────────── */}
          <DocSection id="svelte" tag="Frameworks" heading="Svelte">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              A Svelte action — apply it to any container with{' '}
              <code className="font-mono text-pitch-black">use:scrollDraw</code>.
              Options update reactively when props change.
            </p>
            <CodeBlock file="Hero.svelte">
{`<script>
  import { scrollDraw, createScrollDraw } from 'svg-scroll-draw/svelte';

  // For replay/pause control, use createScrollDraw
  const { action, getInstance } = createScrollDraw({ easing: 'ease-out', speed: 1.2 });
</script>

<!-- Simple action -->
<div use:scrollDraw={{ easing: 'spring', fade: true, once: true }}>
  <svg viewBox="0 0 200 100" fill="none">
    <path d="M10 50 Q100 10 190 50" stroke="black" stroke-width="2" />
  </svg>
</div>

<!-- With instance control -->
<div use:action>
  <svg>...</svg>
</div>
<button on:click={() => getInstance()?.replay()}>Replay</button>`}
            </CodeBlock>
          </DocSection>

          {/* ── Solid ────────────────────────────────────────── */}
          <DocSection id="solid" tag="Frameworks" heading="Solid.js">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              A ref-setter hook — pass it to any container element via the{' '}
              <code className="font-mono text-pitch-black">ref</code> prop.
            </p>
            <CodeBlock file="Hero.tsx">
{`import { useScrollDraw, createScrollDraw } from 'svg-scroll-draw/solid';

// Simple hook
function Hero() {
  const ref = useScrollDraw({ easing: 'ease-out', fade: true, once: true });
  return (
    <div ref={ref}>
      <svg viewBox="0 0 200 100" fill="none">
        <path d="M10 50 Q100 10 190 50" stroke="black" stroke-width="2" />
      </svg>
    </div>
  );
}

// With instance control
function HeroWithReplay() {
  const { ref, getInstance } = createScrollDraw({ easing: 'spring' });
  return (
    <>
      <div ref={ref}><svg>...</svg></div>
      <button onClick={() => getInstance()?.replay()}>Replay</button>
    </>
  );
}`}
            </CodeBlock>
          </DocSection>

          {/* ── Angular ──────────────────────────────────────── */}
          <DocSection id="angular" tag="Frameworks" heading="Angular">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              All v2 APIs are available as class-based <code className="font-mono text-pitch-black">Ref</code> objects
              that integrate with Angular&apos;s component lifecycle. No peer dependency on{' '}
              <code className="font-mono text-pitch-black">@angular/core</code> is required in the library.
            </p>

            <Sub>ScrollDrawRef — SVG path drawing (v1)</Sub>
            <CodeBlock file="hero.component.ts">
{`import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ScrollDrawRef } from 'svg-scroll-draw/angular';

@Component({
  selector: 'app-hero',
  template: \`<div #container><svg>...</svg></div>\`,
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLElement>;
  private draw = new ScrollDrawRef();

  ngAfterViewInit() {
    this.draw.init(this.containerRef.nativeElement, {
      easing: 'ease-out', speed: 1.2, fade: true, once: true,
    });
  }

  replay()      { this.draw.replay(); }
  ngOnDestroy() { this.draw.destroy(); }
}`}
            </CodeBlock>

            <Sub>ScrollAnimateRef — animate any CSS property (v2)</Sub>
            <CodeBlock file="card.component.ts">
{`import { ScrollAnimateRef } from 'svg-scroll-draw/angular';

@Component({
  selector: 'app-card',
  template: \`<div #el>...</div>\`,
})
export class CardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('el') elRef!: ElementRef<HTMLElement>;
  private animate = new ScrollAnimateRef();

  ngAfterViewInit() {
    this.animate.init(this.elRef.nativeElement, {
      props: {
        opacity:   [0, 1],
        transform: ['translateY(40px)', 'translateY(0)'],
      },
      easing: 'ease-out',
      once:   true,
    });
  }

  ngOnDestroy() { this.animate.destroy(); }
}`}
            </CodeBlock>

            <Sub>ScrollCounterRef — animated number (v2)</Sub>
            <CodeBlock file="stats.component.ts">
{`import { ScrollCounterRef } from 'svg-scroll-draw/angular';

@Component({
  selector: 'app-stats',
  template: \`<span #counter></span>\`,
})
export class StatsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('counter') counterRef!: ElementRef<HTMLElement>;
  private counter = new ScrollCounterRef();

  ngAfterViewInit() {
    this.counter.init(this.counterRef.nativeElement, {
      to:     1_250_000,
      format: n => '$' + Math.round(n).toLocaleString(),
      once:   true,
    });
  }

  ngOnDestroy() { this.counter.destroy(); }
}`}
            </CodeBlock>

            <Sub>ScrollTextRef — split text animation (v2)</Sub>
            <CodeBlock file="headline.component.ts">
{`import { ScrollTextRef } from 'svg-scroll-draw/angular';

@Component({
  selector: 'app-headline',
  template: \`<h2 #headline>Animate on scroll.</h2>\`,
})
export class HeadlineComponent implements AfterViewInit, OnDestroy {
  @ViewChild('headline') headlineRef!: ElementRef<HTMLElement>;
  private text = new ScrollTextRef();

  ngAfterViewInit() {
    this.text.init(this.headlineRef.nativeElement, {
      split:   'words',
      stagger: 0.05,
      from:    { opacity: 0, y: 24 },
      once:    true,
    });
  }

  ngOnDestroy() { this.text.destroy(); }
}`}
            </CodeBlock>
            <Note>
              All Ref classes expose the full instance API: <code className="font-mono">replay()</code>,{' '}
              <code className="font-mono">pause()</code>, <code className="font-mono">resume()</code>,{' '}
              <code className="font-mono">seek(p)</code>, <code className="font-mono">getProgress()</code>,{' '}
              <code className="font-mono">destroy()</code>. <code className="font-mono">ScrollVideoRef</code> follows the same pattern for{' '}
              <code className="font-mono">&lt;video&gt;</code> elements.
            </Note>
          </DocSection>

          {/* ── Nuxt ─────────────────────────────────────────── */}
          <DocSection id="nuxt" tag="Frameworks" heading="Nuxt">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              <code className="font-mono text-pitch-black">svg-scroll-draw/nuxt</code> re-exports all v1 and v2 Vue composables and components, plus a plugin factory that globally registers all of them at once.
            </p>

            <Sub>v2 composables — per-component import (recommended)</Sub>
            <CodeBlock file="pages/index.vue">
{`<script setup>
import { useScrollAnimate, useScrollText, useScrollCounter } from 'svg-scroll-draw/nuxt';

// Animate any CSS property
const card = useScrollAnimate({
  props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
  easing: 'ease-out',
  once:   true,
});

// Split text and stagger animate
const headline = useScrollText({ split: 'words', stagger: 0.05, once: true });

// Animated counter
const revenue = useScrollCounter({
  to:     1_250_000,
  format: n => '$' + Math.round(n).toLocaleString(),
  once:   true,
});
</script>

<template>
  <div :ref="card">...</div>
  <h2 :ref="headline">Animate on scroll.</h2>
  <span :ref="revenue" />
</template>`}
            </CodeBlock>

            <Sub>v2 components</Sub>
            <CodeBlock file="pages/index.vue">
{`<script setup>
import { ScrollAnimate, ScrollText, ScrollCounter } from 'svg-scroll-draw/nuxt';
</script>

<template>
  <ScrollAnimate :options="{ props: { opacity: [0,1] }, easing: 'ease-out', once: true }">
    <MyCard />
  </ScrollAnimate>

  <ScrollText :options="{ split: 'words', stagger: 0.05 }" tag="h2">
    Animate on scroll.
  </ScrollText>

  <ScrollCounter :to="1250000" :format="n => '$' + Math.round(n).toLocaleString()" :once="true" />
</template>`}
            </CodeBlock>

            <Sub>Global registration via Nuxt plugin</Sub>
            <CodeBlock file="plugins/svg-scroll-draw.ts">
{`import { createScrollDrawPlugin } from 'svg-scroll-draw/nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  // Registers <ScrollDraw>, <ScrollAnimate>, <ScrollCounter>,
  // <ScrollVideo>, <ScrollText> globally — no per-component imports.
  nuxtApp.vueApp.use(createScrollDrawPlugin());
});`}
            </CodeBlock>
          </DocSection>

          {/* ── Astro ────────────────────────────────────────── */}
          <DocSection id="astro" tag="Frameworks" heading="Astro">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Data-attribute APIs for all v2 animations — no framework runtime needed server-side.
              Options are passed as inline JSON; a single client script scans and initialises everything.
            </p>

            <Sub>initScrollDraw — SVG path drawing (v1)</Sub>
            <CodeBlock file="src/pages/index.astro">
{`<div
  data-scroll-draw
  data-scroll-draw-options='{"easing":"ease-out","fade":true,"once":true}'
>
  <svg viewBox="0 0 200 100" fill="none">
    <path d="M10 50 Q100 10 190 50" stroke="black" stroke-width="2" />
  </svg>
</div>

<script>
  import { initScrollDraw } from 'svg-scroll-draw/astro';
  initScrollDraw();
</script>`}
            </CodeBlock>

            <Sub>initScrollAnimate — animate any CSS property (v2)</Sub>
            <CodeBlock file="src/pages/index.astro">
{`<div
  data-scroll-animate
  data-scroll-animate-options='{
    "props": { "opacity": [0,1], "transform": ["translateY(40px)","translateY(0)"] },
    "easing": "ease-out",
    "once": true
  }'
>
  Fades and slides in on scroll.
</div>

<script>
  import { initScrollAnimate } from 'svg-scroll-draw/astro';
  initScrollAnimate();
</script>`}
            </CodeBlock>

            <Sub>initScrollText — split text animation (v2)</Sub>
            <CodeBlock file="src/pages/index.astro">
{`<h2
  data-scroll-text
  data-scroll-text-options='{"split":"words","stagger":0.05,"once":true}'
>
  Animate on scroll.
</h2>

<script>
  import { initScrollText } from 'svg-scroll-draw/astro';
  initScrollText();
</script>`}
            </CodeBlock>

            <Sub>initAll — run every init in one call</Sub>
            <CodeBlock file="src/pages/index.astro">
{`<!-- Mix any combination of data-scroll-* attributes on the page -->
<div data-scroll-draw data-scroll-draw-options='{"easing":"ease-out"}'><svg>...</svg></div>
<div data-scroll-animate data-scroll-animate-options='{"props":{"opacity":[0,1]},"once":true}'>...</div>
<h2  data-scroll-text  data-scroll-text-options='{"split":"words","stagger":0.05}'>..</h2>
<span data-scroll-counter data-scroll-counter-options='{"to":50000,"once":true}'></span>

<script>
  import { initAll } from 'svg-scroll-draw/astro';
  // Initialises scrollDraw + scrollAnimate + scrollText + scrollCounter in one call
  const { draw, animate, text, counter } = initAll();
</script>`}
            </CodeBlock>
            <Note>
              Pass a root element to any init function — e.g. <code className="font-mono">initAll(document.querySelector(&apos;main&apos;))</code> — to scope initialisation to a specific subtree.
            </Note>
          </DocSection>

          {/* ── Web Component ────────────────────────────────── */}
          <DocSection id="web-component" tag="Frameworks" heading="Web Component">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              A <code className="font-mono text-pitch-black">&lt;scroll-draw&gt;</code> custom element
              that works in plain HTML, any framework, or WordPress.
              Bundled into the CDN script — no additional imports needed.
            </p>
            <CodeBlock file="index.html">
{`<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>

<scroll-draw easing="ease-out" speed="1.2" fade once>
  <svg viewBox="0 0 200 100" fill="none">
    <path d="M10 50 Q100 10 190 50" stroke="black" stroke-width="2" />
  </svg>
</scroll-draw>`}
            </CodeBlock>
            <p className="text-sm text-graphite-border">
              String and number options map directly to HTML attributes. Boolean options like{' '}
              <code className="font-mono text-pitch-black">fade</code> and{' '}
              <code className="font-mono text-pitch-black">once</code> are presence-based (add the attribute to enable).
            </p>
          </DocSection>

          {/* ── Vanilla JS ───────────────────────────────────── */}
          <DocSection id="vanilla" tag="Frameworks" heading="Vanilla JS">
            <CodeBlock file="main.js">
{`import { scrollDraw } from 'svg-scroll-draw';

// Single element
const logo = scrollDraw('#logo', { easing: 'spring', once: true });

// Multiple elements with different configs
const chart  = scrollDraw('#chart',  { stagger: 0.08, speed: 0.8 });
const banner = scrollDraw('#banner', { clip: 'left', speed: 1.5 });

// Cleanup all on unload
window.addEventListener('unload', () => {
  [logo, chart, banner].forEach((i) => i.destroy());
});`}
            </CodeBlock>
          </DocSection>

          {/* ── Group API ────────────────────────────────────── */}
          <DocSection id="group-api" tag="Multi-element" heading="Group API">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Animate multiple SVG containers simultaneously with the same options.
              Each container tracks its own scroll position independently — useful for animating a grid of
              illustrations at once. Returns a single instance with unified control.
            </p>
            <CodeBlock file="group.js">
{`import { scrollDrawGroup } from 'svg-scroll-draw/group';

const group = scrollDrawGroup(
  ['#hero-svg', '#logo', '#diagram'],
  { easing: 'ease-out', stagger: 0.1, once: true }
);

// All instances controlled together
group.replay();
group.pause();
group.resume();
group.destroy();`}
            </CodeBlock>
          </DocSection>

          {/* ── Sequence API ─────────────────────────────────── */}
          <DocSection id="sequence-api" tag="Multi-element" heading="Sequence API">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Animate multiple containers one after another — each starts only after the previous reaches 100%.
              Perfect for step-by-step diagram or flowchart reveals.
            </p>
            <CodeBlock file="sequence.js">
{`import { scrollDrawSequence } from 'svg-scroll-draw/group';

const seq = scrollDrawSequence(
  ['#step-1', '#step-2', '#step-3'],
  {
    easing:     'spring',
    onComplete: () => console.log('all steps complete'),
  }
);

seq.replay();   // restarts from step 1
seq.destroy();  // tears down all instances`}
            </CodeBlock>
          </DocSection>

          {/* ── useScrollDrawProgress ────────────────────────── */}
          <DocSection id="use-scroll-draw-progress" tag="Hooks" heading="useScrollDrawProgress">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              A React hook that returns a reactive scroll progress value (0–1) for any element.
              Uses the same trigger/speed/easing semantics as{' '}
              <code className="font-mono text-pitch-black">scrollDraw()</code> — use it to drive any animation
              alongside or independent of an SVG draw.
            </p>
            <CodeBlock file="ParallaxSection.tsx">
{`import { useRef } from 'react';
import { useScrollDrawProgress } from 'svg-scroll-draw/react';

export function ParallaxSection() {
  const ref      = useRef<HTMLDivElement>(null);
  const progress = useScrollDrawProgress(ref, {
    speed:   1.2,
    easing:  'ease-out',
    trigger: { start: 'top 80%', end: 'center 20%' },
  });

  return (
    <div ref={ref}>
      <div
        style={{
          transform: \`translateY(\${(1 - progress) * 40}px)\`,
          opacity:   progress,
        }}
      >
        <h2>Fades and slides in as you scroll</h2>
      </div>
    </div>
  );
}`}
            </CodeBlock>
            <Sub>Options</Sub>
            <OptGroup>
              <Opt name="speed" type="number" defaultVal="1">Same speed multiplier as <code className="font-mono text-pitch-black">scrollDraw()</code>.</Opt>
              <Opt name="easing" type="EasingName | (t: number) => number" defaultVal="'linear'">Same easing curves as <code className="font-mono text-pitch-black">scrollDraw()</code>.</Opt>
              <Opt name="trigger" type="TriggerConfig">Same trigger syntax. Default: start <code className="font-mono text-pitch-black">'top bottom'</code>, end <code className="font-mono text-pitch-black">'bottom top'</code>.</Opt>
              <Opt name="axis" type="'x' | 'y'" defaultVal="'y'">Scroll axis.</Opt>
              <Opt name="scrollContainer" type="string | Element">Custom scroll container.</Opt>
              <Opt name="once" type="boolean" defaultVal="false">Lock at max progress once reached — never decreases on scroll back.</Opt>
            </OptGroup>
          </DocSection>

          {/* ── Native CSS rendering ─────────────────────────── */}
          <DocSection id="native-css" tag="v1.1.0" heading="Native CSS rendering">
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              For the common case, <code className="font-mono text-pitch-black">svg-scroll-draw</code> hands
              the animation to the browser&apos;s native{' '}
              <code className="font-mono text-pitch-black">animation-timeline: view()</code>.
              The draw runs on the compositor with{' '}
              <strong>zero per-frame JavaScript and no scroll or resize listeners.</strong>{' '}
              It falls back to the JS engine automatically when the browser lacks support, or when the config
              uses a feature CSS can&apos;t express declaratively.
            </p>
            <Sub>Eligible for native CSS (compositor path)</Sub>
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              Default trigger, a named easing, optional{' '}
              <code className="font-mono text-pitch-black">fade</code>, forward or reverse direction.
            </p>
            <Sub>Falls back to JS engine automatically</Sub>
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              <code className="font-mono text-pitch-black">onProgress</code> /{' '}
              <code className="font-mono text-pitch-black">onComplete</code> /{' '}
              <code className="font-mono text-pitch-black">waypoints</code>,{' '}
              <code className="font-mono text-pitch-black">stagger</code>,{' '}
              <code className="font-mono text-pitch-black">morphTo</code>,{' '}
              <code className="font-mono text-pitch-black">velocityScale</code>,{' '}
              <code className="font-mono text-pitch-black">autoReverse</code>,{' '}
              <code className="font-mono text-pitch-black">once</code>,{' '}
              <code className="font-mono text-pitch-black">repeat</code>,
              custom trigger, custom scroll container,{' '}
              <code className="font-mono text-pitch-black">speed ≠ 1</code>,{' '}
              <code className="font-mono text-pitch-black">spring</code> easing, animated color/width/fill.
            </p>
            <CodeBlock file="native.js">
{`// Uses animation-timeline: view() on supporting browsers
scrollDraw('#svg', { easing: 'ease-out', fade: true });

// Force JS engine regardless
scrollDraw('#svg', { native: false, easing: 'spring' });`}
            </CodeBlock>
            <Note>
              The full instance API —{' '}
              <code className="font-mono">pause</code>,{' '}
              <code className="font-mono">resume</code>,{' '}
              <code className="font-mono">seek</code>,{' '}
              <code className="font-mono">replay</code>,{' '}
              <code className="font-mono">destroy</code> — works on both paths.
            </Note>
          </DocSection>

          {/* ── createSpring ─────────────────────────────────── */}
          <DocSection id="create-spring" tag="v1.0.0" heading="createSpring">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Returns a custom spring easing function. The built-in{' '}
              <code className="font-mono text-pitch-black">'spring'</code> easing is hardcoded —{' '}
              <code className="font-mono text-pitch-black">createSpring</code> lets you tune it.
            </p>
            <OptGroup>
              <Opt name="tension" type="number" defaultVal="2.5">
                Oscillation frequency. Higher = more bouncy, faster oscillation.
              </Opt>
              <Opt name="friction" type="number" defaultVal="2.2">
                Damping strength. Higher = less bouncy, settles faster.
              </Opt>
            </OptGroup>
            <CodeBlock file="spring.js">
{`import { scrollDraw, createSpring } from 'svg-scroll-draw';

// Gentle bounce — close to the built-in 'spring'
scrollDraw('#svg', { easing: createSpring() });

// Tight, snappy spring
scrollDraw('#svg', { easing: createSpring({ tension: 4, friction: 3 }) });

// Slow, wobbly spring
scrollDraw('#svg', { easing: createSpring({ tension: 1.5, friction: 1.2 }) });`}
            </CodeBlock>
            <Note>
              <code className="font-mono">createSpring()</code> with no arguments produces the same curve as{' '}
              <code className="font-mono">easing: 'spring'</code>. Use it when you need to parameterize the bounce.
            </Note>
          </DocSection>

          {/* ── createBounce ─────────────────────────────────── */}
          <DocSection id="create-bounce" tag="v1.2.0" heading="createBounce">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Returns a bounce-out easing. The animation rises to 1 via ease-out, then makes{' '}
              <code className="font-mono text-pitch-black">bounces</code> dips below 1 that settle —
              like a ball landing. Output stays within [0, 1].
            </p>
            <OptGroup>
              <Opt name="bounces" type="number" defaultVal="3">
                Number of bounces after the initial approach. Higher = more dips before settling.
              </Opt>
              <Opt name="decay" type="number" defaultVal="0.5">
                Amplitude reduction per bounce (0–1). Lower = faster decay, shallower bounces.
              </Opt>
            </OptGroup>
            <CodeBlock file="bounce.js">
{`import { scrollDraw, createBounce } from 'svg-scroll-draw';

// Named string — default params (3 bounces, decay 0.5)
scrollDraw('#svg', { easing: 'bounce' });

// Lots of quick bounces
scrollDraw('#svg', { easing: createBounce({ bounces: 5, decay: 0.35 }) });

// Two slow, deep bounces
scrollDraw('#svg', { easing: createBounce({ bounces: 2, decay: 0.7 }) });`}
            </CodeBlock>
          </DocSection>

          {/* ── createElastic ────────────────────────────────── */}
          <DocSection id="create-elastic" tag="v1.2.0" heading="createElastic">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Returns an elastic-out easing. The animation overshoots past 1 and oscillates
              back before settling — like a rubber band snapping into place. Can produce values
              slightly outside [0, 1]; for SVG paths this appears as a brief over-draw.
            </p>
            <OptGroup>
              <Opt name="amplitude" type="number" defaultVal="1">
                Overshoot magnitude (≥1). Default overshoots to ~1.25; try 1.5 for a dramatic snap.
              </Opt>
              <Opt name="period" type="number" defaultVal="0.4">
                Oscillation period in scroll-time. Smaller = faster oscillations; larger = slow wobble.
              </Opt>
            </OptGroup>
            <CodeBlock file="elastic.js">
{`import { scrollDraw, createElastic } from 'svg-scroll-draw';

// Named string — default params (amplitude 1, period 0.4)
scrollDraw('#svg', { easing: 'elastic' });

// Big snap, fast oscillation
scrollDraw('#svg', { easing: createElastic({ amplitude: 1.5, period: 0.3 }) });

// Subtle, slow wobble
scrollDraw('#svg', { easing: createElastic({ amplitude: 1.1, period: 0.6 }) });`}
            </CodeBlock>
            <Note>
              Try both in the{' '}
              <a href="/playground" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
                ⚡ Playground
              </a>{' '}
              — the easing dropdown includes <code className="font-mono">bounce</code> and{' '}
              <code className="font-mono">elastic</code> with live parameter sliders.
            </Note>
          </DocSection>

          {/* ── scrollDrawTimeline ───────────────────────────── */}
          <DocSection id="timeline" tag="v1.0.0" heading="scrollDrawTimeline">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Animate multiple path groups with independent start/end windows within a single scroll range.
              Unlike <code className="font-mono text-pitch-black">stagger</code> (which offsets by time),
              each track defines its own <code className="font-mono text-pitch-black">from</code>/
              <code className="font-mono text-pitch-black">to</code> slice of the 0–1 progress range —
              and they can overlap freely.
            </p>
            <CodeBlock file="timeline.js">
{`import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';

const instance = scrollDrawTimeline('#diagram', {
  trigger: { start: 'top 80%', end: 'bottom 20%' },
  tracks: [
    // Axes draw first
    { selector: '.axis',    from: 0,    to: 0.3,  easing: 'ease-out' },
    // Bars stagger, each with its own window
    { selector: '.bar-q1',  from: 0.1,  to: 0.45, easing: 'ease-out' },
    { selector: '.bar-q2',  from: 0.28, to: 0.58, easing: 'ease-out' },
    { selector: '.bar-q3',  from: 0.45, to: 0.75, easing: 'ease-out' },
    { selector: '.bar-q4',  from: 0.6,  to: 0.88, easing: 'ease-out' },
    // Trend line traces last
    { selector: '.trend',   from: 0.75, to: 1.0,  easing: 'spring'   },
  ],
  onComplete: () => console.log('all tracks done'),
});

instance.seek(0.5);   // jump to 50% of total range
instance.destroy();`}
            </CodeBlock>
            <Sub>Track options</Sub>
            <OptGroup>
              <Opt name="selector" type="string">
                CSS selector for SVG elements to animate on this track — scoped to the container.
              </Opt>
              <Opt name="from" type="number">
                Progress value (0–1) within the overall range where this track starts drawing.
              </Opt>
              <Opt name="to" type="number">
                Progress value (0–1) within the overall range where this track finishes drawing.
              </Opt>
              <Opt name="easing" type="EasingName | function" defaultVal="'linear'">
                Easing applied to this track's local progress independently of other tracks.
              </Opt>
              <Opt name="fade" type="boolean" defaultVal="false">
                Fade opacity in sync with this track's draw progress.
              </Opt>
            </OptGroup>
            <Sub>Timeline-level options</Sub>
            <OptGroup>
              <Opt name="trigger" type="TriggerConfig">Same trigger syntax as <code className="font-mono text-pitch-black">scrollDraw()</code>.</Opt>
              <Opt name="speed" type="number" defaultVal="1">Overall speed multiplier applied to the full range.</Opt>
              <Opt name="once" type="boolean" defaultVal="false">Lock at max progress once reached.</Opt>
              <Opt name="axis" type="'x' | 'y'" defaultVal="'y'">Scroll axis.</Opt>
              <Opt name="onComplete" type="() => void">Fires when the overall progress reaches 1.</Opt>
              <Opt name="repeat" type="number | 'infinite'" defaultVal="0">
                Replay N times after completing (with <code className="font-mono text-pitch-black">once: true</code>).
                After completion + <code className="font-mono text-pitch-black">repeatDelay</code> ms, paths reset and animate again on next scroll-into-view.
              </Opt>
              <Opt name="repeatDelay" type="number" defaultVal="0">Milliseconds to wait before each repeat or loop iteration.</Opt>
              <Opt name="loop" type="boolean | number" defaultVal="false">
                After the scroll-driven animation completes, automatically replay as a time-driven loop — no further scroll needed.{' '}
                <code className="font-mono text-pitch-black">true</code> = loop forever,{' '}
                <code className="font-mono text-pitch-black">number</code> = loop N additional times.
                Each iteration plays over <code className="font-mono text-pitch-black">loopDuration</code> ms.
              </Opt>
              <Opt name="loopDuration" type="number" defaultVal="1500">Duration of each time-driven loop iteration in milliseconds.</Opt>
              <Opt name="debug" type="boolean" defaultVal="false">
                Inject a fixed HUD panel into <code className="font-mono text-pitch-black">document.body</code> showing each track&apos;s
                scroll window as a coloured progress bar with live fill and global progress. Removed on{' '}
                <code className="font-mono text-pitch-black">destroy()</code>. Useful for tuning{' '}
                <code className="font-mono text-pitch-black">from</code>/<code className="font-mono text-pitch-black">to</code> values.
              </Opt>
              <Opt name="label" type="string">Label shown in the debug panel header. Defaults to the target selector.</Opt>
            </OptGroup>
          </DocSection>

          {/* ── Presets ──────────────────────────────────────── */}
          <DocSection id="presets" tag="v1.6.0" heading="Presets">
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              Named option bags for common scroll-draw patterns. Pass{' '}
              <code className="font-mono text-pitch-black">preset</code> as a shorthand — user options always override preset values.
            </p>
            <CodeBlock file="presets.js">
{`import { scrollDraw } from 'svg-scroll-draw';

// One-liner for common patterns
scrollDraw('#logo',    { preset: 'reveal'     });
scrollDraw('#diagram', { preset: 'sketch'     });
scrollDraw('#text',    { preset: 'typewriter' });
scrollDraw('#hero',    { preset: 'cinematic'  });
scrollDraw('#icon',    { preset: 'spring'     });

// Override any preset value
scrollDraw('#logo', { preset: 'reveal', easing: 'spring' });

// Inspect presets directly
import { PRESETS } from 'svg-scroll-draw';
console.log(PRESETS.reveal);
// { easing: 'ease-out', fade: true, speed: 1.2, once: true }`}
            </CodeBlock>
            <Sub>Available presets</Sub>
            <OptGroup>
              <Opt name="'sketch'" type="preset">
                Staggered ease-in draw — paths trace in one by one. Pencil-drawing feel.
                Sets: <code className="font-mono text-pitch-black">easing: &apos;ease-in&apos;, stagger: 0.1, speed: 0.9</code>.
              </Opt>
              <Opt name="'reveal'" type="preset">
                Clean viewport reveal — fades and draws in once. Best for logos and hero graphics.
                Sets: <code className="font-mono text-pitch-black">easing: &apos;ease-out&apos;, fade: true, speed: 1.2, once: true</code>.
              </Opt>
              <Opt name="'typewriter'" type="preset">
                Fast mechanical draw — paths appear quickly one after another.
                Sets: <code className="font-mono text-pitch-black">easing: &apos;linear&apos;, stagger: 0.05, speed: 1.5</code>.
              </Opt>
              <Opt name="'cinematic'" type="preset">
                Slow dramatic entrance — long ease-in-out with a gentle fade.
                Sets: <code className="font-mono text-pitch-black">easing: &apos;ease-in-out&apos;, fade: true, speed: 0.75</code>.
              </Opt>
              <Opt name="'spring'" type="preset">
                Bouncy physics feel — spring easing gives a natural overshoot-and-settle.
                Sets: <code className="font-mono text-pitch-black">easing: &apos;spring&apos;, speed: 1.1</code>.
              </Opt>
            </OptGroup>
          </DocSection>

          {/* ── CLI init ─────────────────────────────────────── */}
          <DocSection id="cli-init" tag="v1.6.0" heading="CLI — npx svg-scroll-draw init">
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              An interactive scaffolder that generates a starter file for your framework — no manual copy-paste from the docs needed.
            </p>
            <CodeBlock file="terminal">
{`npx svg-scroll-draw init`}
            </CodeBlock>
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              The CLI asks for your framework, preset, easing, and SVG selector, then writes a ready-to-use file:
            </p>
            <Sub>Output by framework</Sub>
            <OptGroup>
              <Opt name="react" type="">Writes <code className="font-mono text-pitch-black">ScrollDraw.tsx</code> — a client component with <code className="font-mono text-pitch-black">&lt;ScrollDraw&gt;</code> and a sample SVG.</Opt>
              <Opt name="vue" type="">Writes <code className="font-mono text-pitch-black">ScrollDraw.vue</code> — a SFC with <code className="font-mono text-pitch-black">useScrollDraw</code> composable wired up.</Opt>
              <Opt name="svelte" type="">Writes <code className="font-mono text-pitch-black">ScrollDraw.svelte</code> — uses the <code className="font-mono text-pitch-black">use:scrollDraw</code> action.</Opt>
              <Opt name="solid" type="">Writes <code className="font-mono text-pitch-black">ScrollDraw.tsx</code> — uses <code className="font-mono text-pitch-black">createScrollDraw</code>.</Opt>
              <Opt name="vanilla" type="">Writes <code className="font-mono text-pitch-black">scroll-draw.js</code> — a plain <code className="font-mono text-pitch-black">scrollDraw()</code> call.</Opt>
            </OptGroup>
          </DocSection>

          {/* ── CSS Custom Property ──────────────────────────── */}
          <DocSection id="css-custom-property" tag="v1.0.0" heading="CSS Custom Property">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Every <code className="font-mono text-pitch-black">scrollDraw()</code> instance automatically
              sets <code className="font-mono text-pitch-black">--scroll-draw-progress</code> on the container
              element on every animation frame. Use it to drive CSS animations without any JS callbacks.
            </p>
            <CodeBlock file="custom-property.css">
{`/* Drive any CSS property directly from scroll progress */
.hero-text {
  opacity: var(--scroll-draw-progress);
  transform: translateY(calc((1 - var(--scroll-draw-progress)) * 24px));
}

.highlight {
  background-size: calc(var(--scroll-draw-progress) * 100%) 100%;
}

.counter {
  /* Combine with @property for smooth transitions */
  color: oklch(from var(--scroll-draw-progress) 60% 0.2 250);
}`}
            </CodeBlock>
            <CodeBlock file="custom-property.js">
{`import { scrollDraw } from 'svg-scroll-draw';

// No onProgress callback needed —
// --scroll-draw-progress is set automatically
scrollDraw('#hero-svg', { easing: 'ease-out', once: true });

// The CSS does the rest:`}
            </CodeBlock>
            <Note>
              The value is the progress of the <strong>first path</strong> (path index 0) in normal mode,
              and the overall alpha in clip mode. Use{' '}
              <code className="font-mono">onProgress</code> if you need per-path values.
            </Note>
          </DocSection>

          {/* ── v2 APIs ──────────────────────────────────────── */}
          {/* ── v2.6.0 — Vue 3 v2 ─────────────────────────── */}
          <DocSection id="v2-vue" tag="v2.6.0" heading="Vue 3 — v2 composables &amp; components">
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              All v2 APIs now have first-class Vue 3 support. Each API ships as a composable (returns a ref to bind to any element) and a convenience component wrapper. Imports from <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">svg-scroll-draw/vue</code>.
            </p>

            <Sub>useScrollAnimate + &lt;ScrollAnimate&gt;</Sub>
            <CodeBlock file="Hero.vue">
{`<script setup>
import { useScrollAnimate } from 'svg-scroll-draw/vue';

const el = useScrollAnimate({
  props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
  easing: 'ease-out',
  once: true,
});
</script>

<template>
  <div :ref="el">Animates on scroll.</div>
</template>

<!-- Or use the component wrapper: -->
<ScrollAnimate :options="{ props: { opacity: [0, 1] }, easing: 'ease-out', once: true }">
  <div>Animates on scroll.</div>
</ScrollAnimate>`}
            </CodeBlock>

            <Sub>useScrollCounter + &lt;ScrollCounter&gt;</Sub>
            <CodeBlock file="Stats.vue">
{`<script setup>
import { useScrollCounter } from 'svg-scroll-draw/vue';

const el = useScrollCounter({
  to: 1_250_000,
  format: n => '$' + Math.round(n).toLocaleString(),
  easing: 'ease-out',
  once: true,
});
</script>

<template>
  <span :ref="el" />
</template>

<!-- Or use the component: -->
<ScrollCounter
  :to="1250000"
  :format="n => '$' + Math.round(n).toLocaleString()"
  easing="ease-out"
  :once="true"
/>`}
            </CodeBlock>

            <Sub>useScrollVideo + &lt;ScrollVideo&gt;</Sub>
            <CodeBlock file="HeroVideo.vue">
{`<script setup>
import { useScrollVideo } from 'svg-scroll-draw/vue';

const vid = useScrollVideo({
  trigger: { start: 'top top', end: 'bottom top' },
});
</script>

<template>
  <video :ref="vid" src="/hero.mp4" muted playsinline preload="auto" />
</template>

<!-- Or use the component: -->
<ScrollVideo
  src="/hero.mp4"
  :options="{ trigger: { start: 'top top', end: 'bottom top' } }"
/>`}
            </CodeBlock>

            <Sub>useScrollText + &lt;ScrollText&gt;</Sub>
            <CodeBlock file="Headline.vue">
{`<script setup>
import { useScrollText } from 'svg-scroll-draw/vue';

const el = useScrollText({
  split: 'words',
  stagger: 0.05,
  from: { opacity: 0, y: 24 },
  once: true,
});
</script>

<template>
  <h2 :ref="el">Animate on scroll.</h2>
</template>

<!-- Or use the component (tag defaults to "p"): -->
<ScrollText :options="{ split: 'words', stagger: 0.05 }" tag="h2">
  Animate on scroll.
</ScrollText>`}
            </CodeBlock>
          </DocSection>

          {/* ── v2.6.0 — Svelte v2 ────────────────────────── */}
          <DocSection id="v2-svelte" tag="v2.6.0" heading="Svelte — v2 actions &amp; helpers">
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              All v2 APIs are available as Svelte <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">use:</code> actions. Each has a matching <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">create*</code> helper that exposes the live instance for imperative control. Imports from <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">svg-scroll-draw/svelte</code>.
            </p>

            <Sub>scrollAnimate action</Sub>
            <CodeBlock file="Hero.svelte">
{`<script>
  import { scrollAnimate } from 'svg-scroll-draw/svelte';

  const opts = {
    props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
    easing: 'ease-out',
    once: true,
  };
</script>

<div use:scrollAnimate={opts}>Animates on scroll.</div>`}
            </CodeBlock>

            <Sub>scrollCounterAction action</Sub>
            <CodeBlock file="Stats.svelte">
{`<script>
  import { scrollCounterAction } from 'svg-scroll-draw/svelte';
</script>

<span use:scrollCounterAction={{ to: 1250000, format: n => '$' + Math.round(n).toLocaleString(), once: true }} />`}
            </CodeBlock>

            <Sub>scrollTextAction action</Sub>
            <CodeBlock file="Headline.svelte">
{`<script>
  import { scrollTextAction } from 'svg-scroll-draw/svelte';
</script>

<h2 use:scrollTextAction={{ split: 'words', stagger: 0.05, once: true }}>
  Animate on scroll.
</h2>`}
            </CodeBlock>

            <Sub>createScrollAnimate — imperative control</Sub>
            <CodeBlock file="Hero.svelte">
{`<script>
  import { createScrollAnimate } from 'svg-scroll-draw/svelte';

  const { action, getInstance } = createScrollAnimate({
    props: { opacity: [0, 1] },
    easing: 'ease-out',
    once: true,
  });
</script>

<div use:action>...</div>
<button on:click={() => getInstance()?.replay()}>Replay</button>`}
            </CodeBlock>

            <Note>The same <code className="font-mono text-[0.85em]">create*</code> pattern is available for all v2 actions: <code className="font-mono text-[0.85em]">createScrollCounter</code>, <code className="font-mono text-[0.85em]">createScrollVideo</code>, <code className="font-mono text-[0.85em]">createScrollText</code>.</Note>
          </DocSection>

          {/* ── v2.6.0 — Solid v2 ─────────────────────────── */}
          <DocSection id="v2-solid" tag="v2.6.0" heading="Solid.js — v2 hooks">
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              All v2 APIs are available as SolidJS hooks. Each <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">use*</code> hook returns a ref setter. The matching <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">create*</code> variant returns <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">{'{ ref, getInstance }'}</code> for imperative control. Imports from <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">svg-scroll-draw/solid</code>.
            </p>

            <Sub>useScrollAnimate</Sub>
            <CodeBlock file="Hero.tsx">
{`import { useScrollAnimate } from 'svg-scroll-draw/solid';

function Hero() {
  const ref = useScrollAnimate({
    props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
    easing: 'ease-out',
    once: true,
  });
  return <div ref={ref}>Animates on scroll.</div>;
}`}
            </CodeBlock>

            <Sub>useScrollCounter</Sub>
            <CodeBlock file="Stats.tsx">
{`import { useScrollCounter } from 'svg-scroll-draw/solid';

function Revenue() {
  const ref = useScrollCounter({
    to: 1_250_000,
    format: n => '$' + Math.round(n).toLocaleString(),
    easing: 'ease-out',
    once: true,
  });
  return <span ref={ref} />;
}`}
            </CodeBlock>

            <Sub>useScrollText</Sub>
            <CodeBlock file="Headline.tsx">
{`import { useScrollText } from 'svg-scroll-draw/solid';

function Headline() {
  const ref = useScrollText({
    split: 'words',
    stagger: 0.05,
    from: { opacity: 0, y: 24 },
    once: true,
  });
  return <h2 ref={ref}>Animate on scroll.</h2>;
}`}
            </CodeBlock>

            <Sub>createScrollAnimate — imperative control</Sub>
            <CodeBlock file="Hero.tsx">
{`import { createScrollAnimate } from 'svg-scroll-draw/solid';

function Hero() {
  const { ref, getInstance } = createScrollAnimate({
    props: { opacity: [0, 1] },
    easing: 'ease-out',
    once: true,
  });
  return (
    <>
      <div ref={ref}>...</div>
      <button onClick={() => getInstance()?.replay()}>Replay</button>
    </>
  );
}`}
            </CodeBlock>

            <Note>The same <code className="font-mono text-[0.85em]">create*</code> pattern is available for all v2 hooks: <code className="font-mono text-[0.85em]">createScrollCounter</code>, <code className="font-mono text-[0.85em]">createScrollVideo</code>, <code className="font-mono text-[0.85em]">createScrollText</code>.</Note>
          </DocSection>

          {/* ── v2.8.0 — scrollReveal ───────────────────────── */}
          <DocSection id="scroll-reveal" tag="v2.8.0" heading="scrollReveal">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Reveal elements as they scroll into view. One-line replacement for AOS and ScrollReveal.js —
              no data attributes, fully typed, 7 named presets, stagger, and custom easing.
            </p>
            <CodeBlock file="index.js">
{`import { scrollReveal } from 'svg-scroll-draw/reveal';

// Default: fade up
scrollReveal('.card');

// Named preset
scrollReveal('.feature', { preset: 'scale' });

// Custom from state
scrollReveal('.item', {
  from:    { opacity: 0, y: 40, scale: 0.95 },
  stagger: 0.1,
  easing:  'ease-out',
  once:    true,
});

// Presets: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale' | 'flip' | 'flipX'

// Cleanup
const instance = scrollReveal('.card', { preset: 'fadeUp' });
instance.destroy();`}
            </CodeBlock>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-[13px] border border-subtle-ash rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-pitch-black text-light-linen text-[11px] uppercase tracking-wide">
                    <th className="text-left px-4 py-2 font-medium">Option</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Default</th>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['preset',   'ScrollRevealPreset', '"fadeUp"',    'Named start state. fadeUp | fadeDown | fadeLeft | fadeRight | scale | flip | flipX'],
                    ['from',     'ScrollRevealFrom',   '—',           'Custom start state: { opacity, x, y, scale, rotate, rotateX, rotateY }. Merges with preset.'],
                    ['stagger',  'number',             '0.08',        'Viewport-% offset per element — creates cascade for lists.'],
                    ['easing',   'EasingName | fn',    '"ease-out"',  'Animation easing.'],
                    ['once',     'boolean',            'true',        'Freeze at max progress — don\'t reverse on scroll back.'],
                    ['trigger',  'TriggerConfig',      'auto',        'Override trigger window. Default computed per element.'],
                    ['onEnter',  '() => void',         '—',           'Fires when the first element enters its trigger zone.'],
                    ['onLeave',  '() => void',         '—',           'Fires when the last element leaves its trigger zone.'],
                  ].map(([opt, type, def, desc]) => (
                    <tr key={opt} className="border-t border-subtle-ash">
                      <td className="px-4 py-2 font-mono font-semibold text-[12px]">{opt}</td>
                      <td className="px-4 py-2 font-mono text-graphite-border text-[11px]">{type}</td>
                      <td className="px-4 py-2 font-mono text-graphite-border text-[11px]">{def}</td>
                      <td className="px-4 py-2 text-graphite-border">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DocSection>

          {/* ── v2.8.0 — velocityScale on scrollAnimate ──────── */}
          <DocSection id="velocity-scale" tag="v2.8.0" heading="velocityScale">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Scale animation speed by scroll velocity — the faster the user scrolls, the faster the animation progresses.
              Available on <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">scrollAnimate</code>
              {' '}(and already on <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">scrollDraw</code>).
              Pass <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">true</code> for default sensitivity
              or a number to tune it.
            </p>
            <CodeBlock file="index.js">
{`import { scrollAnimate } from 'svg-scroll-draw';

// Default sensitivity (1) — moderate speed-up on fast scroll
scrollAnimate('#hero', {
  props: { opacity: [0, 1], transform: ['translateY(32px)', 'translateY(0)'] },
  velocityScale: true,
});

// High sensitivity (3) — very responsive to scroll speed
scrollAnimate('#kinetic-bg', {
  props: { transform: ['translateY(0px)', 'translateY(-200px)'] },
  velocityScale: 3,
  easing: 'linear',
});

// velocityScale is available on scrollDraw too:
scrollDraw('#logo', {
  easing:        'ease-out',
  velocityScale: 1.5,
});`}
            </CodeBlock>
            <Note>
              <code className="font-mono text-[0.85em]">velocityScale</code> forces the JS engine — the native CSS fast path
              is skipped because velocity requires per-frame measurement.
            </Note>
          </DocSection>

          {/* ── v2.7.0 — scrollPin ───────────────────────────── */}
          <DocSection id="scroll-pin" tag="v2.7.0" heading="scrollPin">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Pin any element at a viewport position while the page scrolls past it. Wrapper-based — inserts a spacer to prevent layout shift. Full lifecycle callbacks mirror GSAP ScrollTrigger&apos;s <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">pin: true</code>.
            </p>
            <CodeBlock file="index.js">
{`import { scrollPin } from 'svg-scroll-draw/pin';

// Pin at top of viewport for one viewport-height of scroll
const pin = scrollPin('#panel', {
  pinDistance: window.innerHeight,
  onEnter:     () => panel.classList.add('active'),
  onLeave:     () => panel.classList.remove('active'),
  onEnterBack: () => panel.classList.add('active'),
  onLeaveBack: () => panel.classList.remove('active'),
  onProgress:  (p) => console.log('progress', p), // 0–1 through pin zone
});

// Apple-style: pin image, scroll text past it
scrollPin('#product-image', {
  top:         80,    // pin 80px from viewport top (below a fixed nav)
  pinDistance: 800,   // hold for 800px of scroll
});

// Recalculate after layout change (accordion, dynamic content)
pin.refresh();

// Remove on unmount / route change
pin.destroy();`}
            </CodeBlock>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-[13px] border border-subtle-ash rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-pitch-black text-light-linen text-[11px] uppercase tracking-wide">
                    <th className="text-left px-4 py-2 font-medium">Option</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Default</th>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['pinDistance',  'number',           'window.innerHeight', 'Pixels of scroll to stay pinned.'],
                    ['top',          'number',           '0',                  'Viewport Y (px) to pin at. 0 = top of viewport.'],
                    ['scrollContainer', 'string|Element','—',                  'Custom scroll container. Default: window.'],
                    ['onEnter',      '() => void',       '—',                  'Fires when scroll enters the pin zone (scrolling down).'],
                    ['onLeave',      '() => void',       '—',                  'Fires when scroll exits the pin zone at the end.'],
                    ['onEnterBack',  '() => void',       '—',                  'Fires when scroll re-enters the pin zone (scrolling up).'],
                    ['onLeaveBack',  '() => void',       '—',                  'Fires when scroll exits the pin zone at the start.'],
                    ['onProgress',   '(p: number) => void', '—',               'Progress 0–1 through the pin zone, every frame.'],
                  ].map(([opt, type, def, desc]) => (
                    <tr key={opt} className="border-t border-subtle-ash">
                      <td className="px-4 py-2 font-mono font-semibold text-[12px]">{opt}</td>
                      <td className="px-4 py-2 font-mono text-graphite-border text-[11px]">{type}</td>
                      <td className="px-4 py-2 font-mono text-graphite-border text-[11px]">{def}</td>
                      <td className="px-4 py-2 text-graphite-border">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note>Instance API: <code className="font-mono text-[0.85em]">destroy()</code> restores the original DOM and removes all listeners. <code className="font-mono text-[0.85em]">refresh()</code> recalculates pin dimensions — call it after layout changes.</Note>
          </DocSection>

          {/* ── v2.7.0 — scrollSnap ──────────────────────────── */}
          <DocSection id="scroll-snap" tag="v2.7.0" heading="scrollSnap">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              JS-powered section snapping with custom easing and a configurable threshold. Works on vertical and horizontal axes with any scroll container. Unlike CSS <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">scroll-snap-type</code>, you get callbacks, programmatic control, and custom easing curves.
            </p>
            <CodeBlock file="index.js">
{`import { scrollSnap } from 'svg-scroll-draw/snap';

// Basic vertical snap between fullscreen sections
const snap = scrollSnap('.section', {
  duration:  600,
  easing:    'ease-in-out',
  threshold: 0.3,           // snap forward if user scrolled >30% of a section
  onSnap:    (index) => console.log('snapped to section', index),
});

// Horizontal snap (e.g. feature carousel)
scrollSnap('.card', {
  direction: 'horizontal',
  duration:  400,
  easing:    'ease-out',
  onSnap:    (i) => setActiveCard(i),
});

// Programmatic control
snap.snapTo(2);          // scroll to section index 2
snap.getCurrentIndex();  // → current snapped index

// Cleanup
snap.destroy();`}
            </CodeBlock>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-[13px] border border-subtle-ash rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-pitch-black text-light-linen text-[11px] uppercase tracking-wide">
                    <th className="text-left px-4 py-2 font-medium">Option</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Default</th>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['direction',       '"vertical" | "horizontal"', '"vertical"',    'Scroll axis.'],
                    ['duration',        'number',                    '600',           'Snap animation duration in ms.'],
                    ['easing',          'EasingName | fn',           '"ease-in-out"', 'Easing for the snap scroll animation.'],
                    ['threshold',       'number',                    '0.3',           'Fraction of a section size the user must scroll past to snap forward (0–1).'],
                    ['scrollContainer', 'string | Element',          '—',             'Custom scroll container. Default: window.'],
                    ['onSnap',          '(index: number) => void',   '—',             'Fires after each snap with the target section index.'],
                  ].map(([opt, type, def, desc]) => (
                    <tr key={opt} className="border-t border-subtle-ash">
                      <td className="px-4 py-2 font-mono font-semibold text-[12px]">{opt}</td>
                      <td className="px-4 py-2 font-mono text-graphite-border text-[11px]">{type}</td>
                      <td className="px-4 py-2 font-mono text-graphite-border text-[11px]">{def}</td>
                      <td className="px-4 py-2 text-graphite-border">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DocSection>

          {/* ── v2.7.0 — Scroll Callbacks ────────────────────── */}
          <DocSection id="scroll-callbacks" tag="v2.7.0" heading="Scroll Callbacks">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">onEnter</code>,{' '}
              <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">onLeave</code>,{' '}
              <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">onEnterBack</code>, and{' '}
              <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">onLeaveBack</code> are available on both <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">scrollAnimate</code> and <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">scrollDraw</code>. They fire exactly once per crossing — same semantics as GSAP ScrollTrigger.
            </p>
            <CodeBlock file="index.js">
{`import { scrollAnimate } from 'svg-scroll-draw';

// Activate/deactivate a section as it enters and leaves view
scrollAnimate('#feature-section', {
  props: { opacity: [0.4, 1] },
  trigger: { start: 'top center', end: 'bottom center' },
  onEnter:     () => nav.setActive('feature'),   // scrolling down, entering
  onLeave:     () => nav.clearActive('feature'),  // scrolling down, leaving
  onEnterBack: () => nav.setActive('feature'),   // scrolling up, re-entering
  onLeaveBack: () => nav.clearActive('feature'),  // scrolling up, leaving from top
});

// Lazy-load an image when it first enters view
scrollAnimate('#hero-img', {
  props: { opacity: [0, 1] },
  once: true,
  onEnter: () => {
    document.querySelector('#hero-img')
      .setAttribute('src', '/hero.webp');
  },
});`}
            </CodeBlock>
            <Note>
              Adding any of these callbacks forces the JS engine — the native CSS{' '}
              <code className="font-mono text-[0.85em]">animation-timeline</code> fast path is skipped because
              callbacks require per-frame JavaScript.
            </Note>
          </DocSection>

          {/* ── v2.7.0 — Lenis Adapter ───────────────────────── */}
          <DocSection id="lenis-adapter" tag="v2.7.0" heading="Lenis Adapter">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Lenis v2+ patches <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">window.scrollY</code> natively — no adapter needed, svg-scroll-draw works out of the box.
              For Lenis v1 (which uses a virtual scroll value), use <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">createLenisAdapter</code> to keep all engines in sync.
            </p>
            <CodeBlock file="index.js">
{`import Lenis from '@studio-freight/lenis'; // Lenis v1
import { createLenisAdapter } from 'svg-scroll-draw/lenis';
import { scrollAnimate } from 'svg-scroll-draw';

// 1. Create Lenis
const lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });

// 2. Patch window.scrollY so all svg-scroll-draw engines read the virtual scroll
const adapter = createLenisAdapter(lenis);

// 3. Use svg-scroll-draw as normal
scrollAnimate('#hero', {
  props: { opacity: [0, 1], transform: ['translateY(40px)', 'translateY(0)'] },
  once: true,
});

// 4. Drive Lenis with rAF
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// 5. Cleanup
adapter.destroy();
lenis.destroy();

// ── Lenis v2 (no adapter needed) ──────────────────────────────────
import Lenis from 'lenis'; // v2 patches window.scrollY natively

const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update); // optional if mixing with other libs

// svg-scroll-draw just works
scrollAnimate('#hero', { props: { opacity: [0, 1] }, once: true });`}
            </CodeBlock>
          </DocSection>

          <DocSection id="scroll-animate" tag="v2.0.0" heading="scrollAnimate">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Animate any CSS property on any DOM or SVG element driven by scroll position. The direct replacement for <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">gsap.to(el, {'{'} scrollTrigger {'}'})</code> for the 80% case.
            </p>
            <CodeBlock file="index.js">
{`import { scrollAnimate } from 'svg-scroll-draw';

// Fade + slide in
scrollAnimate('#hero-text', {
  props: {
    opacity:   [0, 1],
    transform: ['translateY(40px)', 'translateY(0px)'],
  },
  easing: 'ease-out',
  once: true,
});

// Color transition
scrollAnimate('#section', {
  props: {
    backgroundColor: ['#ffffff', '#0d0d0d'],
    color:           ['#000000', '#ffffff'],
  },
});

// React wrapper
import { ScrollAnimate } from 'svg-scroll-draw/react';

<ScrollAnimate
  props={{ opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0)'] }}
  easing="ease-out"
  once
>
  <div>Any content</div>
</ScrollAnimate>`}
            </CodeBlock>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-[13px] border border-subtle-ash rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-pitch-black text-light-linen text-[11px] uppercase tracking-wide">
                    <th className="text-left px-4 py-2 font-medium">Option</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Default</th>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['props', 'Record<string, …>', '—', 'CSS properties to animate. Value can be a single target or [from, to] tuple. Supports numbers, colors (hex/rgb), transform functions, and CSS units.'],
                    ['trigger', 'TriggerConfig', '{ start: "top bottom", end: "bottom top" }', 'Same trigger syntax as scrollDraw.'],
                    ['easing', 'EasingName | fn', '"ease-out"', 'Same easing system as scrollDraw.'],
                    ['speed', 'number', '1', 'Animation scale factor.'],
                    ['once', 'boolean', 'false', 'Freeze at max progress — does not reverse on scroll back.'],
                    ['axis', '"x" | "y"', '"y"', 'Scroll axis.'],
                    ['native', 'boolean', 'true', 'Use CSS animation-timeline: view() fast path when eligible.'],
                    ['onProgress',   '(n) => void', '—', 'Called every frame with alpha 0–1.'],
                    ['onComplete',   '() => void', '—', 'Fires when alpha reaches 1.'],
                    ['onEnter',      '() => void', '—', 'Fires when scroll enters the trigger zone (scrolling forward). Forces JS engine.'],
                    ['onLeave',      '() => void', '—', 'Fires when scroll exits the trigger zone at the end (scrolling forward).'],
                    ['onEnterBack',  '() => void', '—', 'Fires when scroll re-enters the trigger zone from the end (scrolling back).'],
                    ['onLeaveBack',  '() => void', '—', 'Fires when scroll exits the trigger zone at the start (scrolling back).'],
                  ].map(([opt, type, def, desc]) => (
                    <tr key={opt} className="border-t border-subtle-ash">
                      <td className="px-4 py-2 font-mono font-semibold text-[12px]">{opt}</td>
                      <td className="px-4 py-2 font-mono text-graphite-border text-[11px]">{type}</td>
                      <td className="px-4 py-2 font-mono text-graphite-border text-[11px]">{def}</td>
                      <td className="px-4 py-2 text-graphite-border">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DocSection>

          <DocSection id="scroll-counter" tag="v2.0.0" heading="scrollCounter">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Animate a number displayed in a DOM element from <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">from</code> to <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">to</code> as it scrolls into view.
            </p>
            <CodeBlock file="index.js">
{`import { scrollCounter } from 'svg-scroll-draw';

// Simple counter
scrollCounter('#user-count', { to: 50000 });

// Formatted with locale
scrollCounter('#revenue', {
  to:     1_250_000,
  format: n => '$' + Math.round(n).toLocaleString(),
  easing: 'ease-out',
  once:   true,
});

// Percentage with decimal
scrollCounter('#conversion', {
  from:     0,
  to:       94.7,
  decimals: 1,
  format:   n => n.toFixed(1) + '%',
});

// React
import { ScrollCounter } from 'svg-scroll-draw/react';
<ScrollCounter to={50000} format={n => n.toLocaleString()} once />`}
            </CodeBlock>
          </DocSection>

          <DocSection id="scroll-parallax" tag="v2.0.0" heading="scrollParallax">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Move any element at a different rate than scroll. <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">speed</code> is a multiplier relative to element size — <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">0.5</code> = half scroll speed, <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">-0.2</code> = opposite direction.
            </p>
            <CodeBlock file="index.js">
{`import { scrollParallax } from 'svg-scroll-draw';

scrollParallax('#hero-bg-image', { speed: 0.4 });
scrollParallax('#floating-element', { speed: -0.2 }); // moves opposite
scrollParallax('#side-badge', { speed: 0.3, axis: 'x' }); // horizontal`}
            </CodeBlock>
          </DocSection>

          <DocSection id="scroll-video" tag="v2.1.0" heading="scrollVideo">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Tie a <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">{'<video>'}</code> element&apos;s <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">currentTime</code> to scroll position. The Apple product page pattern — ships free.
            </p>
            <CodeBlock file="index.js">
{`import { scrollVideo } from 'svg-scroll-draw/video';

// Full scrub — plays as user scrolls through section
scrollVideo('#hero-video', {
  trigger: { start: 'top top', end: 'bottom top' },
});

// Scrub only the first 3 seconds
scrollVideo('#product-reveal', {
  from:    0,
  to:      3,
  trigger: { start: 'top 80%', end: 'top 20%' },
  easing:  'ease-in-out',
});

// React
import { ScrollVideo } from 'svg-scroll-draw/react';
<ScrollVideo src="/hero.mp4" trigger={{ start: 'top top', end: 'bottom top' }} />`}
            </CodeBlock>
            <p className="text-[12px] text-graphite-border mt-3">
              <strong>Video encoding tip:</strong> Use H.264 for broadest support. Add <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">muted playsinline preload=&quot;auto&quot;</code> attributes for smooth scrubbing.
            </p>
          </DocSection>

          <DocSection id="scroll-text" tag="v2.1.0" heading="scrollText">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Split any text element into chars, words, or lines and animate each piece on scroll. Free replacement for GSAP SplitText (which requires a $150+/yr Club GreenSock subscription).
            </p>
            <CodeBlock file="index.js">
{`import { scrollText } from 'svg-scroll-draw/text';

// Words fade up one by one
scrollText('#headline', {
  split:   'words',
  stagger: 0.05,
  from:    { opacity: 0, y: 24 },
  easing:  'ease-out',
  once:    true,
});

// Characters with rotation
scrollText('#tagline', {
  split:   'chars',
  stagger: 0.025,
  from:    { opacity: 0, y: 32, rotate: 8 },
  once:    true,
});

// React
import { ScrollText } from 'svg-scroll-draw/react';
<ScrollText split="words" stagger={0.05} from={{ opacity: 0, y: 24 }} once>
  Animate this headline.
</ScrollText>`}
            </CodeBlock>
            <p className="text-[12px] text-graphite-border mt-3">
              Accessibility: the original text is preserved in <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">aria-label</code> on the container. All split spans have <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">aria-hidden=&quot;true&quot;</code>. <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">destroy()</code> restores the original HTML.
            </p>
          </DocSection>

          <DocSection id="devtools" tag="v2.2.0" heading="DevTools Overlay">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Visual debug overlay that shows every active animation&apos;s trigger window, current progress, and type — color-coded in a fixed panel. Zero production bytes (tree-shaken away in production builds).
            </p>
            <CodeBlock file="main.js">
{`import { devtools } from 'svg-scroll-draw/devtools';

// Enable once — instruments all active instances
devtools.enable();

// Keyboard shortcut: Cmd+Shift+S / Ctrl+Shift+S to toggle
// Or toggle programmatically:
devtools.toggle();

// Highlight a specific element for 2 seconds
devtools.highlight('#my-animated-element');`}
            </CodeBlock>
            <p className="text-[12px] text-graphite-border mt-3">
              <strong>Note:</strong> The devtools panel only activates when <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">process.env.NODE_ENV !== &apos;production&apos;</code>. In production builds, the import resolves to a no-op.
            </p>
          </DocSection>

          {/* ── TypeScript ───────────────────────────────────── */}
          <DocSection id="typescript" tag="TypeScript" heading="Types Reference">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              All types are exported from the root package — import them alongside your runtime imports.
            </p>
            <CodeBlock file="types.ts">
{`import type {
  ScrollDrawOptions,
  ScrollDrawInstance,
  EasingName,
  TriggerConfig,
} from 'svg-scroll-draw';

type EasingName = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';

interface TriggerConfig {
  start?: string;
  end?:   string;
}

interface ScrollDrawInstance {
  destroy:     () => void;
  replay:      () => void;
  pause:       () => void;
  resume:      () => void;
  seek:        (progress: number) => void;
  getProgress: () => number;
}

interface ScrollDrawOptions {
  selector?:        string;
  speed?:           number;
  fade?:            boolean;
  easing?:          EasingName | ((t: number) => number);
  trigger?:         TriggerConfig;
  stagger?:         number;
  direction?:       'forward' | 'reverse';
  once?:            boolean;
  debug?:           boolean;
  axis?:            'x' | 'y';
  scrollContainer?: string | Element;
  autoReverse?:     boolean;
  delay?:           number;
  strokeColor?:     string | [string, string];
  strokeWidth?:     number | [number, number];
  fillOpacity?:     number | [number, number];
  clip?:            boolean | 'left' | 'right' | 'top' | 'bottom' | 'center';
  waypoints?:       Record<number, () => void>;
  velocityScale?:   boolean | number;
  threshold?:       number;
  rootMargin?:      string;
  repeat?:          number | 'infinite';
  repeatDelay?:     number;
  morphTo?:         string;
  onProgress?:      (alpha: number) => void;
  onStart?:         () => void;
  onComplete?:      () => void;
  native?:          boolean;
}`}
            </CodeBlock>
          </DocSection>

        </main>
      </div>
    </div>
  );
}
