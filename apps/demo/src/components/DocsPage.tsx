'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CopyButton } from './CopyButton';
import { ThemeToggle } from './ThemeToggle';

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
    label: 'v0.7.0',
    items: [
      { id: 'create-spring',      label: 'createSpring' },
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
        <span className="text-[11px] text-[#666] font-mono">{file}</span>
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
      <div className="px-6 py-1">{children}</div>
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
      <nav className="sticky top-0 z-50 bg-light-linen/95 backdrop-blur-sm border-b border-pitch-black flex items-center justify-between px-6 md:px-12 h-14">
        <Link href="/" className="font-display font-bold text-sm tracking-tight">
          svg-scroll-draw
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/docs"
            className="hidden sm:inline-flex text-xs px-3.5 py-1.5 rounded-full bg-pitch-black text-light-linen font-medium items-center"
          >
            Docs
          </Link>
          <Link
            href="/examples"
            className="hidden sm:inline-flex text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium items-center"
          >
            Examples
          </Link>
          <Link
            href="/playground"
            className="hidden sm:inline-flex text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-medium items-center"
          >
            ⚡ Playground
          </Link>
          <a
            href={NPM}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3.5 py-1.5 rounded-full border border-subtle-ash hover:border-pitch-black transition-colors font-mono"
          >
            v0.7.0
          </a>
          <a
            href={GH}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-1.5 rounded-full bg-pitch-black text-light-linen hover:bg-graphite-border transition-colors font-medium"
          >
            GitHub →
          </a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex">

        {/* Sidebar */}
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
        <main className="flex-1 min-w-0 px-6 md:px-12 lg:px-16">

          {/* ── Installation ─────────────────────────────────── */}
          <DocSection id="installation" tag="Getting Started" heading="Installation">
            <p className="text-sm text-graphite-border leading-relaxed mb-5">
              Install via your package manager of choice, or drop in a CDN script tag — no build step required.
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
                  className="flex items-center justify-between px-4 py-3 rounded-xl border border-pitch-black bg-marketplace-gray font-mono text-sm"
                >
                  <span>
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
              <Opt name="selector" type="string" defaultVal="'path, polyline, line, polygon, rect, circle'">
                CSS selector for elements to animate inside the container. Override to target specific paths by class or ID.
              </Opt>
              <Opt name="speed" type="number" defaultVal="1">
                Animation speed multiplier. Values above 1 complete the draw over a shorter scroll distance. Values below 1 slow it down.
              </Opt>
              <Opt name="easing" type="'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | (t: number) => number" defaultVal="'linear'">
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
              A <code className="font-mono text-pitch-black">ScrollDrawRef</code> class integrates with
              Angular's component lifecycle — no peer dependency on{' '}
              <code className="font-mono text-pitch-black">@angular/core</code> is required in the library.
            </p>
            <CodeBlock file="hero.component.ts">
{`import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ScrollDrawRef } from 'svg-scroll-draw/angular';

@Component({
  selector: 'app-hero',
  template: \`
    <div #container>
      <svg viewBox="0 0 200 100" fill="none">
        <path d="M10 50 Q100 10 190 50" stroke="black" stroke-width="2" />
      </svg>
    </div>
    <button (click)="replay()">Replay</button>
  \`,
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLElement>;
  private draw = new ScrollDrawRef();

  ngAfterViewInit() {
    this.draw.init(this.containerRef.nativeElement, {
      easing: 'ease-out',
      speed:  1.2,
      fade:   true,
      once:   true,
    });
  }

  replay()      { this.draw.replay(); }
  ngOnDestroy() { this.draw.destroy(); }
}`}
            </CodeBlock>
          </DocSection>

          {/* ── Nuxt ─────────────────────────────────────────── */}
          <DocSection id="nuxt" tag="Frameworks" heading="Nuxt">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Re-exports the Vue composable and component, plus a plugin factory for global registration.
            </p>
            <Sub>Per-component import (recommended)</Sub>
            <CodeBlock file="pages/index.vue">
{`<script setup>
import { ScrollDraw } from 'svg-scroll-draw/nuxt';
</script>

<template>
  <ScrollDraw easing="ease-out" :speed="1.2" fade once>
    <svg viewBox="0 0 200 100" fill="none">
      <path d="M10 50 Q100 10 190 50" stroke="black" stroke-width="2" />
    </svg>
  </ScrollDraw>
</template>`}
            </CodeBlock>
            <Sub>Global registration via Nuxt plugin</Sub>
            <CodeBlock file="plugins/svg-scroll-draw.ts">
{`import { createScrollDrawPlugin } from 'svg-scroll-draw/nuxt';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createScrollDrawPlugin());
});

// <ScrollDraw> is now available globally — no per-component imports needed`}
            </CodeBlock>
          </DocSection>

          {/* ── Astro ────────────────────────────────────────── */}
          <DocSection id="astro" tag="Frameworks" heading="Astro">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              <code className="font-mono text-pitch-black">initScrollDraw()</code> auto-initialises all elements
              with a <code className="font-mono text-pitch-black">data-scroll-draw</code> attribute.
              Options are read from a JSON attribute.
            </p>
            <CodeBlock file="src/pages/index.astro">
{`---
// no server-side code needed
---

<div
  data-scroll-draw
  data-scroll-draw-options='{"easing":"ease-out","fade":true,"once":true}'
>
  <svg viewBox="0 0 200 100" fill="none">
    <path d="M10 50 Q100 10 190 50" stroke="black" stroke-width="2" />
  </svg>
</div>

<script>
  import { initScrollDraw } from 'svg-scroll-draw/astro';
  initScrollDraw(); // scans the whole document for [data-scroll-draw]
</script>`}
            </CodeBlock>
            <Note>
              Pass a root element to <code className="font-mono">initScrollDraw(root)</code> to scope
              initialisation to a specific subtree.
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

          {/* ── createSpring ─────────────────────────────────── */}
          <DocSection id="create-spring" tag="v0.7.0" heading="createSpring">
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

          {/* ── scrollDrawTimeline ───────────────────────────── */}
          <DocSection id="timeline" tag="v0.7.0" heading="scrollDrawTimeline">
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
            </OptGroup>
          </DocSection>

          {/* ── CSS Custom Property ──────────────────────────── */}
          <DocSection id="css-custom-property" tag="v0.7.0" heading="CSS Custom Property">
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
}`}
            </CodeBlock>
          </DocSection>

        </main>
      </div>
    </div>
  );
}
