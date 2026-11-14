'use client';

import './docs.css';
import { Children, useState, useEffect, useRef } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import Link from 'next/link';
import { CopyButton } from './CopyButton';
import { CopyCommand } from './home/CopyCommand';
import { DocsAnatomy } from './DocsAnatomy';
import { CodeBox } from './site/CodeBox';
import { SELF, SELF_ENTRIES, COMPETITORS } from '@/data/competitors';
import { UNIT_TESTS, BROWSER_TESTS } from '@/data/facts';


// The sidebar follows the page: groups and items in the order the sections
// appear, so reading down moves the highlight one entry at a time. Each
// section's title strip still says which version added it.
const NAV_GROUPS = [
  {
    label: 'Getting Started',
    items: [
      { id: 'installation',             label: 'Installation' },
      { id: 'quick-start',              label: 'Quick Start' },
    ],
  },
  {
    label: 'Options',
    items: [
      { id: 'core-options',             label: 'Core' },
      { id: 'trigger',                  label: 'Trigger' },
      { id: 'visual',                   label: 'Visual' },
      { id: 'callbacks',                label: 'Callbacks' },
      { id: 'advanced',                 label: 'Advanced' },
    ],
  },
  {
    label: 'Instance',
    items: [
      { id: 'instance-methods',         label: 'Methods' },
    ],
  },
  {
    label: 'Frameworks',
    items: [
      { id: 'react',                    label: 'React' },
      { id: 'vue',                      label: 'Vue 3' },
      { id: 'svelte',                   label: 'Svelte' },
      { id: 'solid',                    label: 'Solid.js' },
      { id: 'angular',                  label: 'Angular' },
      { id: 'nuxt',                     label: 'Nuxt' },
      { id: 'astro',                    label: 'Astro' },
      { id: 'web-component',            label: 'Web Component' },
      { id: 'vanilla',                  label: 'Vanilla JS' },
    ],
  },
  {
    label: 'Multi-element',
    items: [
      { id: 'group-api',                label: 'Group API' },
      { id: 'sequence-api',             label: 'Sequence API' },
    ],
  },
  {
    label: 'Hooks',
    items: [
      { id: 'use-scroll-draw-progress', label: 'useScrollDrawProgress' },
    ],
  },
  {
    label: 'Engine',
    items: [
      { id: 'native-css',               label: 'Native CSS' },
      { id: 'create-spring',            label: 'createSpring' },
      { id: 'create-bounce',            label: 'createBounce' },
      { id: 'create-elastic',           label: 'createElastic' },
      { id: 'timeline',                 label: 'scrollDrawTimeline' },
      { id: 'presets',                  label: 'Presets' },
      { id: 'cli-init',                 label: 'CLI init' },
      { id: 'css-custom-property',      label: 'CSS Custom Prop' },
    ],
  },
  {
    label: 'Frameworks v2',
    items: [
      { id: 'v2-vue',                   label: 'Vue 3 v2' },
      { id: 'v2-svelte',                label: 'Svelte v2' },
      { id: 'v2-solid',                 label: 'Solid v2' },
    ],
  },
  {
    label: 'Reliability',
    items: [
      { id: 'instance-refresh',         label: 'refresh()' },
      { id: 'timeline-reduced-motion',  label: 'Timeline & reduced motion' },
      { id: 'cdn-dev-build',            label: 'CDN dev build' },
    ],
  },
  {
    label: 'Scroll APIs',
    items: [
      { id: 'scroll-progress',          label: 'scrollProgress' },
      { id: 'scroll-horizontal',        label: 'scrollHorizontal' },
      { id: 'scroll-reveal',            label: 'scrollReveal' },
      { id: 'velocity-scale',           label: 'velocityScale' },
      { id: 'scroll-pin',               label: 'scrollPin' },
      { id: 'scroll-snap',              label: 'scrollSnap' },
      { id: 'scroll-callbacks',         label: 'Scroll Callbacks' },
      { id: 'lenis-adapter',            label: 'Lenis Adapter' },
      { id: 'scroll-animate',           label: 'scrollAnimate' },
      { id: 'scroll-counter',           label: 'scrollCounter' },
      { id: 'scroll-parallax',          label: 'scrollParallax' },
      { id: 'scroll-video',             label: 'scrollVideo' },
      { id: 'scroll-frames',            label: 'scrollFrames' },
      { id: 'scroll-text',              label: 'scrollText' },
    ],
  },
  {
    label: 'Tooling',
    items: [
      { id: 'devtools',                 label: 'DevTools' },
      { id: 'typescript',               label: 'Types' },
    ],
  },
];

/** Each section's sidebar group, for its kicker ("options / trigger"). */
const GROUP_OF: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.id, g.label])),
);

/**
 * Zone references, as on the drawing sheet that closes every page: a letter
 * per sidebar group, a number per section in it — A1 Installation, B2 Trigger.
 */
// Drawing sheets skip I and O so a zone never reads as a one or a zero.
const ZONE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const zoneLetter = (gi: number) => ZONE_LETTERS[gi] ?? `Z${gi}`;
const ZONE: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((g, gi) => g.items.map((it, ii) => [it.id, `${zoneLetter(gi)}${ii + 1}`])),
);
const isVersion = (t: string) => /^v\d/.test(t);

// ── Primitives ────────────────────────────────────────────────────────────────

function CodeBlock({ file, children }: { file: string; children: string }) {
  return <CodeBox file={file}>{children}</CodeBox>;
}

function Opt({
  name, type, defaultVal, children,
}: {
  name: string; type: string; defaultVal?: string; children: React.ReactNode;
}) {
  return (
    <div className="dc-opt">
      <div className="dc-opt-l">
        <code className="dc-opt-name">{name}</code>
        <span className="dc-opt-type">{type}</span>
        {defaultVal && (
          <span className="dc-opt-default">
            default <strong>{defaultVal}</strong>
          </span>
        )}
      </div>
      <p className="dc-opt-d">{children}</p>
    </div>
  );
}

function DocSection({
  id, tag, heading, children,
}: {
  id: string; tag: string; heading: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="dc-sec">
      <div className="dc-tb">
        <span className="dc-tb-zone">{ZONE[id]}</span>
        <span className="dc-tb-cell">{(GROUP_OF[id] ?? 'Docs').toLowerCase()}</span>
        {tag !== GROUP_OF[id] && (
          <span className="dc-tb-cell">{isVersion(tag) ? `since ${tag}` : tag.toLowerCase()}</span>
        )}
        <a href={`#${id}`} className="dc-tb-cell dc-tb-link" aria-label={`Link to ${heading}`}>#</a>
      </div>
      <h2 className="dc-h2">{heading}</h2>
      {children}
    </section>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="dc-sub">
      {children}
    </h3>
  );
}

const TRY_LINK = 'underline underline-offset-2 hover:text-pitch-black transition-colors';

/** A one-line pointer from a section to the free tool that builds the same thing. */
function Try({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] text-graphite-border mt-3">
      <strong>Try it:</strong> {children}
    </p>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="dc-note">
      <span className="dc-note-k">Note</span>
      {/* One cell: the note is a two-column grid, and loose text and code spans
          each became a grid item of their own, stacking the sentence vertically. */}
      <div>{children}</div>
    </div>
  );
}

function OptGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="dc-opts">
      {/* A dimension line over the sheet, inked as it scrolls in, carrying the real count. */}
      <ScrollDraw className="dc-dim" selector=".dc-dim-ink" trigger={{ start: 'top 94%', end: 'top 64%' }} stagger={0.12} easing="ease-out" once>
        <svg aria-hidden="true">
          <line x1="0.5" y1="5" x2="0.5" y2="19" className="dc-dim-ink" stroke="currentColor" />
          <line x1="0" y1="12" x2="100%" y2="12" className="dc-dim-ink" stroke="currentColor" />
          <line x1="100%" y1="5" x2="100%" y2="19" className="dc-dim-ink" stroke="currentColor" />
        </svg>
        <span className="dc-dim-label">{Children.count(children)} {Children.count(children) === 1 ? 'option' : 'options'}</span>
      </ScrollDraw>
      <div className="dc-opts-h" aria-hidden="true"><span>option · type · default</span><span>What it does</span></div>
      {children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function DocsPage() {
  const [activeId, setActiveId] = useState('installation');
  const sideRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // Keep the active entry in view by moving the lists only as far as it takes:
  // reading down, each new entry arrives at the bottom edge one row at a time
  // (with two rows of what comes next showing); reading up, the same at the
  // top. Only the lists move, never the page.
  useEffect(() => {
    const side = sideRef.current;
    const link = side?.querySelector<HTMLElement>('[aria-current]');
    if (side && link && side.offsetParent !== null) {
      const top = link.getBoundingClientRect().top - side.getBoundingClientRect().top + side.scrollTop;
      const bottom = top + link.offsetHeight;
      const ahead = link.offsetHeight * 2;
      if (bottom + ahead > side.scrollTop + side.clientHeight) {
        side.scrollTo({ top: bottom + ahead - side.clientHeight, behavior: 'smooth' });
      } else if (top - ahead < side.scrollTop) {
        side.scrollTo({ top: Math.max(0, top - ahead), behavior: 'smooth' });
      }
    }
    const strip = stripRef.current;
    const pill = strip?.querySelector<HTMLElement>('[aria-current]');
    if (strip && pill && strip.offsetParent !== null) {
      const left = pill.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft;
      const right = left + pill.offsetWidth;
      const pad = 24;
      if (right + pad > strip.scrollLeft + strip.clientWidth) {
        strip.scrollTo({ left: right + pad - strip.clientWidth, behavior: 'smooth' });
      } else if (left - pad < strip.scrollLeft) {
        strip.scrollTo({ left: Math.max(0, left - pad), behavior: 'smooth' });
      }
    }
  }, [activeId]);

  // The active section is the last one whose top has passed a line a third of
  // the way down the screen. Reading positions each frame (rather than waiting
  // for intersection events) stays right however fast the page is scrolled.
  //
  // In-page links glide instead of jumping. While a glide runs, the highlight
  // stays on the entry that was clicked rather than flickering through every
  // section on the way; it is released when the scroll ends.
  const lockRef = useRef<string | null>(null);
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.dc-main section[id]'));
    const root = document.querySelector<HTMLElement>('.docs');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let timer = 0;

    const read = () => {
      raf = 0;
      if (lockRef.current) return;
      const line = window.innerHeight * 0.33;
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      let current = sections[0]?.id;
      for (const sec of sections) {
        if (sec.getBoundingClientRect().top <= line) current = sec.id;
        else break;
      }
      // The last sections can never reach the line; at the very bottom, the last one wins.
      if (atBottom && sections.length) {
        const last = sections[sections.length - 1];
        if (last.getBoundingClientRect().top < window.innerHeight) current = last.id;
      }
      if (current) setActiveId(current);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(read); };

    // The hold ends when the page has reached the target — not on the first
    // scrollend from anywhere — or as soon as the reader takes over.
    let target: HTMLElement | null = null;
    let started = 0;
    const arrived = () => {
      if (!target) return true;
      const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      return Math.abs(target.getBoundingClientRect().top - margin) < 6 || atBottom;
    };
    const unlock = () => {
      lockRef.current = null;
      target = null;
      window.clearTimeout(timer);
      onScroll();
    };
    const release = () => { if (lockRef.current && arrived()) unlock(); };
    const watch = () => {
      timer = window.setTimeout(() => {
        if (!lockRef.current) return;
        if (arrived() || Date.now() - started > 6000) unlock();
        else watch();
      }, 160);
    };
    const takeOver = () => { if (lockRef.current) unlock(); };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      if (!a || !root?.contains(a)) return;
      const id = decodeURIComponent((a.getAttribute('href') ?? '').slice(1));
      const el = id ? document.getElementById(id) : null;
      if (!el) return;
      e.preventDefault();
      window.clearTimeout(timer);
      if (sections.some((sec) => sec.id === id)) {
        lockRef.current = id;
        target = el;
        started = Date.now();
        setActiveId(id);
        watch();
      }
      el.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      history.pushState(null, '', `#${id}`);
    };

    raf = requestAnimationFrame(read);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('scrollend', release);
    window.addEventListener('wheel', takeOver, { passive: true });
    window.addEventListener('touchstart', takeOver, { passive: true });
    window.addEventListener('keydown', takeOver);
    root?.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scrollend', release);
      window.removeEventListener('wheel', takeOver);
      window.removeEventListener('touchstart', takeOver);
      window.removeEventListener('keydown', takeOver);
      root?.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div className="docs">

      {/* ── Opening ──────────────────────────────────────── */}
      <header className="pg-head dc-head">
        <div>
        <p className="pg-kicker"><span>docs / api reference</span><span>v{SELF.version}</span></p>
        <h1 className="pg-title">
          Animate SVG on scroll<span className="sr-only"> — svg-scroll-draw API Reference</span>
        </h1>
        <p className="pg-lede">
          Every option, method and entry point, with the code to paste. One call draws a path as the
          page scrolls; the rest of the library reveals, pins, counts and scrubs on the same engine.
        </p>
        <div className="pg-actions">
          <CopyCommand />
          <Link href="/examples" className="btn" data-magnetic>See the examples</Link>
        </div>
        <dl className="pg-facts">
          <div><dt>Version</dt><dd>{SELF.version}</dd></div>
          <div><dt>Gzipped</dt><dd>{SELF.gzipKb} KB</dd></div>
          <div><dt>Unit tests</dt><dd>{UNIT_TESTS}</dd></div>
          <div><dt>Browser tests</dt><dd>{BROWSER_TESTS} × 3</dd></div>
        </dl>
        </div>
        <DocsAnatomy />
      </header>

      {/* Mobile section nav — scrollable pill strip */}
      <div className="dc-strip md:hidden scrollbar-hide" ref={stripRef}>
        {NAV_GROUPS.flatMap((g) => g.items).map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={activeId === item.id ? 'location' : undefined}
          >
            <span className="dc-strip-ref">{ZONE[item.id]}</span> {item.label}
          </a>
        ))}
      </div>

      <div className="dc-cols">

        {/* Sidebar — desktop only */}
        <aside className="dc-side hidden md:block" aria-label="Sections" ref={sideRef}>
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="dc-side-group">
                <span className="dc-side-zone">{zoneLetter(NAV_GROUPS.indexOf(group))}</span>
                {group.label}
              </p>
              <ul>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="dc-side-link"
                      aria-current={activeId === item.id ? 'location' : undefined}
                    >
                      <span className="dc-side-ref">{ZONE[item.id]}</span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </aside>

        {/* Content */}
        <div className="dc-main">

          {/* ── Installation ─────────────────────────────────── */}
          <DocSection id="installation" tag="Getting Started" heading="Installation">
            <p className="text-sm text-graphite-border leading-relaxed mb-5">
              Install via your package manager of choice, or drop in a CDN script tag — no build step required.{' '}
              Coming from GSAP DrawSVG?{' '}
              <Link href="/blog/gsap-drawsvg-alternative" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
                See the migration guide →
              </Link>
            </p>
            <div className="dc-pm" role="list" aria-label="Install commands">
              {[
                { pm: 'npm',  cmd: 'npm i svg-scroll-draw' },
                { pm: 'pnpm', cmd: 'pnpm add svg-scroll-draw' },
                { pm: 'yarn', cmd: 'yarn add svg-scroll-draw' },
                { pm: 'bun',  cmd: 'bun add svg-scroll-draw' },
              ].map(({ pm, cmd }, i) => (
                <div key={pm} className="dc-pm-row" role="listitem">
                  <span className="dc-pm-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="dc-pm-k">{pm}</span>
                  <code className="dc-pm-cmd"><span aria-hidden="true">$ </span>{cmd}</code>
                  <span className="dc-pm-copy"><CopyButton text={cmd} /></span>
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
              <code className="font-mono">{'fill="none"'}</code>.
              In dev mode, a warning is logged if either condition is violated.
            </Note>
            <Try>Not sure a drawing will animate? The <Link href="/svg-path-viewer" className={TRY_LINK}>SVG path viewer</Link> lists each path’s length and what stops it drawing, and the <Link href="/svg-shape-to-path-converter" className={TRY_LINK}>SVG shape to path converter</Link> turns rects, circles and polygons into the paths they equal.</Try>
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
              <Opt name="easing" type="'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce' | 'elastic' | `cubic-bezier(…)` | 'ease' | (t: number) => number" defaultVal="'linear'">
                Easing curve applied to draw progress. Pass a custom function for full control — it receives progress from 0 to 1 and may return values outside 0–1: overshoot past 1 is how spring and elastic work.
                Since 2.26.0 it also takes a CSS cubic-bezier() as you would write it in a stylesheet, in every API:{' '}
                <code className="font-mono text-pitch-black">{"'cubic-bezier(.2, .8, .2, 1)'"}</code> (x1 and x2 in [0, 1]),
                and the keyword{' '}
                <code className="font-mono text-pitch-black">ease</code> (steps() is not parsed: pass a function). The library&apos;s own names come first:{' '}
                <code className="font-mono text-pitch-black">ease-in</code>,{' '}
                <code className="font-mono text-pitch-black">ease-out</code> and{' '}
                <code className="font-mono text-pitch-black">ease-in-out</code> are its quadratics, not the CSS keywords
                of the same name. Any other string (a typo like{' '}
                <code className="font-mono text-pitch-black">{"'easeOut'"}</code>) warns in development, naming the value and
                the valid forms, and runs as the default; in 2.25 and earlier every one of these strings ran as the default without a word.
              </Opt>
              <Opt name="direction" type="'forward' | 'reverse'" defaultVal="'forward'">
                <code className="font-mono text-pitch-black">{"'forward'"}</code> draws the path as you scroll in.{' '}
                <code className="font-mono text-pitch-black">{"'reverse'"}</code> starts fully drawn and erases it — useful for “write then erase” effects.
              </Opt>
              <Opt name="stagger" type="number" defaultVal="0">
                Delay between each path starting, as a fraction of the total scroll range.{' '}
                <code className="font-mono text-pitch-black">0.1</code> means each path starts 10% of the range after the previous one.
                Each path also ends that much later, so the last one finishes after{' '}
                <code className="font-mono text-pitch-black">trigger.end</code>; from 2.19.1, where the page ends
                before it would, the stagger is tightened just enough for the last path to finish at the bottom.
              </Opt>
              <Opt name="once" type="boolean" defaultVal="false">
                Lock draw progress at its maximum once reached. Scrolling back up will not erase the paths.
                What locks is how far the scroll got, so an easing that overshoots or dips (
                <code className="font-mono text-pitch-black">elastic</code>,{' '}
                <code className="font-mono text-pitch-black">spring</code>,{' '}
                <code className="font-mono text-pitch-black">bounce</code>, a function) still plays out and ends
                exactly drawn. In 2.23.2 and earlier it stayed on the overshoot, drawn past its end; fixed in 2.23.3.
              </Opt>
            </OptGroup>
            <Try>Watch each named easing draw a line in the <Link href="/easing-visualizer" className={TRY_LINK}>easing visualizer</Link>, or shape your own curve in the <Link href="/cubic-bezier-generator" className={TRY_LINK}>cubic-bezier generator</Link> and paste its cubic-bezier() string straight into easing (2.26.0+).</Try>
          </DocSection>

          {/* ── Trigger ──────────────────────────────────────── */}
          <DocSection id="trigger" tag="Options" heading="Trigger">
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              Triggers define when the animation starts and ends relative to the scroll position.
              Both use an <code className="font-mono text-pitch-black">{'"element-anchor viewport-anchor"'}</code> string format,
              or a percentage like <code className="font-mono text-pitch-black">{'"20%"'}</code>.
            </p>
            <OptGroup>
              <Opt name="trigger.start" type="string" defaultVal="'top bottom'">
                When the animation begins.{' '}
                <code className="font-mono text-pitch-black">{"'top bottom'"}</code> means “when the top of the element
                hits the bottom of the viewport.” Valid anchors:{' '}
                <code className="font-mono text-pitch-black">top | center | bottom</code>.
              </Opt>
              <Opt name="trigger.end" type="string" defaultVal="'bottom top'">
                When the animation completes.{' '}
                <code className="font-mono text-pitch-black">{"'bottom top'"}</code> means “when the bottom of the element
                reaches the top of the viewport.”
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
            <Try>Set a start and end anchor in the <Link href="/scroll-trigger-visualizer" className={TRY_LINK}>scroll trigger visualizer</Link> and watch progress run from 0 to 1 as you scroll.</Try>
          </DocSection>

          {/* ── Visual ───────────────────────────────────────── */}
          <DocSection id="visual" tag="Options" heading="Visual Effects">
            <OptGroup>
              <Opt name="fade" type="boolean" defaultVal="false">
                Fade the element opacity from 0→1 in sync with the draw. Combine with{' '}
                <code className="font-mono text-pitch-black">{"direction: 'reverse'"}</code> to fade out while erasing.
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
                <code className="font-mono text-pitch-black">{"'left'"}</code>.
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
            <Try>Match two shapes point for point in the <Link href="/svg-morph-generator" className={TRY_LINK}>SVG morph generator</Link>, which writes the <code className="font-mono">morphTo</code> call; the <Link href="/svg-path-editor" className={TRY_LINK}>SVG path editor</Link> lets you edit a path command by command until the two line up.</Try>
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
                Scroll axis to track. Use <code className="font-mono text-pitch-black">{"'x'"}</code> for
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
                Use <code className="font-mono text-pitch-black">{"'infinite'"}</code> to loop forever.
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
              All options are passed as props, and props are live: change{' '}
              <code className="font-mono text-pitch-black">speed</code> or a{' '}
              <code className="font-mono text-pitch-black">trigger</code> and the animation is rebuilt. A re-render
              with equal props — an inline object, a new arrow function — keeps the running one.
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
              The <code className="font-mono">ScrollDraw</code> component is SSR-safe: it renders your markup on the
              server and starts in <code className="font-mono">useEffect</code>. From v2.16.1 it carries{' '}
              <code className="font-mono">{"'use client'"}</code>, so a Next.js Server Component can render it directly;
              callbacks such as <code className="font-mono">onProgress</code> need a client component of your own. A
              complete project is in the <Link href="/nextjs-scroll-animation" className="underline">Next.js guide</Link>.
            </Note>
            <p className="text-sm text-graphite-border leading-relaxed mt-3">
              <code className="font-mono">id</code>, <code className="font-mono">role</code>,{' '}
              <code className="font-mono">title</code>, <code className="font-mono">aria-*</code> and{' '}
              <code className="font-mono">data-*</code> go on the rendered element; every other prop is an option. Before
              2.19.0 they all became options, so a test id never reached the page.
            </p>
            <Try>Paste an SVG into the <Link href="/svg-to-jsx-converter" className={TRY_LINK}>SVG to JSX converter</Link> for a typed React component with an optional <code className="font-mono">ScrollDraw</code> wrapper.</Try>
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
const containerRef = useScrollDraw({ easing: 'spring', speed: 0.9, once: true });

// Pass a getter (or a ref) to keep options live — rebuilds when speed changes
const liveRef = useScrollDraw(() => ({ easing: 'spring', speed: speed.value }));`}
            </CodeBlock>
            <Note>
              Component props are live, and so are composable options passed as a getter or a ref. A plain
              object is read once. Equal options never rebuild the animation. From 2.19.0{' '}
              <code className="font-mono">&lt;ScrollDraw&gt;</code> takes every option as a prop (it took 12), an
              absent boolean is left to the engine’s default, and other attributes fall through to the div.
            </Note>
          </DocSection>

          {/* ── Svelte ───────────────────────────────────────── */}
          <DocSection id="svelte" tag="Frameworks" heading="Svelte">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              A Svelte action — apply it to any container with{' '}
              <code className="font-mono text-pitch-black">use:scrollDraw</code>.
              Changing its options rebuilds the animation; a new object with equal values, which Svelte
              passes whenever anything in the expression changes, keeps the running one.
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
              <code className="font-mono text-pitch-black">ref</code> prop. Pass an accessor, or a component’s
              props, to keep options live: the animation is rebuilt when a signal it reads changes.
            </p>
            <CodeBlock file="Hero.tsx">
{`import { createSignal } from 'solid-js';
import { useScrollDraw, createScrollDraw } from 'svg-scroll-draw/solid';

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

// Live options: an accessor, rebuilt when speed() changes
function LiveHero() {
  const [speed, setSpeed] = createSignal(1);
  const ref = useScrollDraw(() => ({ easing: 'ease-out', speed: speed() }));
  return <div ref={ref}><svg>...</svg></div>;
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
              that integrate with Angular’s component lifecycle. No peer dependency on{' '}
              <code className="font-mono text-pitch-black">@angular/core</code> is required in the library. Call{' '}
              <code className="font-mono text-pitch-black">update(options)</code> from{' '}
              <code className="font-mono text-pitch-black">ngOnChanges</code> to keep options live: it rebuilds
              the animation only when an option really changed.
            </p>

            <Sub>ScrollDrawRef — SVG path drawing (v1)</Sub>
            <CodeBlock file="hero.component.ts">
{`import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, OnDestroy } from '@angular/core';
import { ScrollDrawRef } from 'svg-scroll-draw/angular';

@Component({
  selector: 'app-hero',
  template: \`<div #container><svg>...</svg></div>\`,
})
export class HeroComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('container') containerRef!: ElementRef<HTMLElement>;
  @Input() speed = 1.2;
  private draw = new ScrollDrawRef();

  ngAfterViewInit() {
    this.draw.init(this.containerRef.nativeElement, this.options());
  }

  // Rebuilds only when an option really changed; a no-op before init()
  ngOnChanges() { this.draw.update(this.options()); }

  replay()      { this.draw.replay(); }
  ngOnDestroy() { this.draw.destroy(); }

  private options() {
    return { easing: 'ease-out', speed: this.speed, fade: true, once: true };
  }
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
              All Ref classes expose <code className="font-mono">update(options)</code> and the full instance API: <code className="font-mono">replay()</code>,{' '}
              <code className="font-mono">pause()</code>, <code className="font-mono">resume()</code>,{' '}
              <code className="font-mono">seek(p)</code>, <code className="font-mono">getProgress()</code>,{' '}
              <code className="font-mono">destroy()</code>. <code className="font-mono">ScrollVideoRef</code> follows the same pattern for{' '}
              <code className="font-mono">&lt;video&gt;</code> elements.
            </Note>
          </DocSection>

          {/* ── Nuxt ─────────────────────────────────────────── */}
          <DocSection id="nuxt" tag="Frameworks" heading="Nuxt">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              <code className="font-mono text-pitch-black">svg-scroll-draw/nuxt</code> is a Nuxt module (2.27.0+): add it to <code className="font-mono text-pitch-black">modules</code> and every component and composable is auto-imported. Nuxt 3 and 4, no extra dependency. It also re-exports all v1 and v2 Vue composables and components, plus a plugin factory, for apps that import them by hand.
            </p>

            <Sub>The module (recommended)</Sub>
            <CodeBlock file="nuxt.config.ts">
{`export default defineNuxtConfig({
  modules: ['svg-scroll-draw/nuxt'],
  // Optional. prefix: 'Ink' gives <InkScrollDraw>; either half can be left out.
  svgScrollDraw: { prefix: '', components: true, composables: true },
});`}
            </CodeBlock>
            <CodeBlock file="pages/index.vue">
{`<script setup>
// No imports: useScrollCounter and the components are auto-imported.
const revenue = useScrollCounter({ to: 1_250_000, format: n => '$' + Math.round(n).toLocaleString() });
</script>

<template>
  <ScrollDraw :once="false"><svg>…</svg></ScrollDraw>
  <span :ref="revenue" />
</template>`}
            </CodeBlock>

            <Sub>v2 composables — per-component import</Sub>
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
            <p className="text-sm text-graphite-border leading-relaxed mt-3">
              From 2.19.0 each element keeps one engine per kind: editing its options attribute rebuilds it, an equal
              value keeps it, and running an init again — on every <code className="font-mono">astro:page-load</code>{' '}
              with View Transitions — keeps the engine it started. <code className="font-mono">format</code> and
              callbacks cannot come from JSON; use <code className="font-mono">&quot;decimals&quot;</code>.
            </p>
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
              From 2.19.0, changing one of these attributes later rebuilds the engine; an equal value does not.
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
              <Opt name="easing" type="Easing (a name, a CSS cubic-bezier() string, or (t: number) => number)" defaultVal="'linear'">Same easing curves as <code className="font-mono text-pitch-black">scrollDraw()</code>.</Opt>
              <Opt name="trigger" type="TriggerConfig">Same trigger syntax. Default: start <code className="font-mono text-pitch-black">{"'top bottom'"}</code>, end <code className="font-mono text-pitch-black">{"'bottom top'"}</code>.</Opt>
              <Opt name="axis" type="'x' | 'y'" defaultVal="'y'">Scroll axis.</Opt>
              <Opt name="scrollContainer" type="string | Element">Custom scroll container.</Opt>
              <Opt name="once" type="boolean" defaultVal="false">Lock at max progress once reached — never decreases on scroll back.</Opt>
            </OptGroup>
          </DocSection>

          {/* ── Native CSS rendering ─────────────────────────── */}
          <DocSection id="native-css" tag="v1.1.0" heading="Native CSS rendering">
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              For the common case, <code className="font-mono text-pitch-black">svg-scroll-draw</code> hands
              the animation to the browser’s native{' '}
              <code className="font-mono text-pitch-black">animation-timeline: view()</code>.
              The browser drives the draw from the scroll position, with{' '}
              <strong>zero per-frame JavaScript and no scroll or resize listeners.</strong>{' '}
              (The stroke still repaints on the main thread — browsers don&apos;t composite{' '}
              <code className="font-mono text-pitch-black">stroke-dashoffset</code> — but no script runs per frame.){' '}
              It falls back to the JS engine automatically when the browser lacks support, or when the config
              uses a feature CSS can&apos;t express declaratively.
            </p>
            <Sub>Eligible for native CSS</Sub>
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              Default trigger, optional{' '}
              <code className="font-mono text-pitch-black">fade</code>, forward or reverse direction,
              and one of four named easings:{' '}
              <code className="font-mono text-pitch-black">linear</code>,{' '}
              <code className="font-mono text-pitch-black">ease-in</code>,{' '}
              <code className="font-mono text-pitch-black">ease-out</code>,{' '}
              <code className="font-mono text-pitch-black">ease-in-out</code>. Those four are emitted as
              CSS timing functions that reproduce this library&apos;s own curves — <em>not</em> the CSS
              keywords of the same name, which are different curves and differ by up to 0.069.
              Since 2.26.0 a CSS{' '}
              <code className="font-mono text-pitch-black">cubic-bezier()</code> string you pass is eligible too, and goes to CSS
              as written, so both engines run the same curve.
              Any other easing (<code className="font-mono text-pitch-black">spring</code>,{' '}
              <code className="font-mono text-pitch-black">bounce</code>,{' '}
              <code className="font-mono text-pitch-black">elastic</code>, or a function) declines the
              fast path and stays on the JS engine rather than being approximated.
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
              <code className="font-mono text-pitch-black">spring</code> easing, animated color/width/fill,{' '}
              <code className="font-mono text-pitch-black">autoplay</code> and{' '}
              <code className="font-mono text-pitch-black">debug</code> in a development build (a production
              build draws no trigger lines, so since 2.23.4 debug left on there keeps the fast path). In 2.23.2 and earlier those last two
              did not count: a plain <code className="font-mono text-pitch-black">{'{ autoplay: true }'}</code>{' '}
              followed the scroll instead of playing over its duration, and{' '}
              <code className="font-mono text-pitch-black">{'{ debug: true }'}</code> drew no trigger lines,
              in every browser with view timelines. Fixed in 2.23.3.
            </p>
            <Sub>Jumping straight past a drawing</Sub>
            <p className="text-sm text-graphite-border leading-relaxed mb-4">
              The one place the two paths differ. Jump past a drawing without ever showing it — a deep link,
              a restored scroll position,{' '}
              <code className="font-mono text-pitch-black">scrollTo(0, document.body.scrollHeight)</code> — and
              the native path holds its end state, because the animation fills both ways, while the JS
              engine, which only runs while the container is on screen, leaves it undrawn. You can’t see
              either while it is off screen, and the JS engine catches up on the first frame the drawing
              scrolls back into view. What you can see is the reading: off screen,{' '}
              <code className="font-mono text-pitch-black">getProgress()</code> and the path’s computed{' '}
              <code className="font-mono text-pitch-black">stroke-dashoffset</code> report the end on the
              native path and the start on the JS engine. The browser suite pins this
              behaviour in <code className="font-mono text-pitch-black">e2e/parity.spec.ts</code>, so a change
              to it is a decision rather than an accident.
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
            <Try>The <Link href="/css-scroll-driven-animation-generator" className={TRY_LINK}>CSS scroll-driven animation generator</Link> writes <code className="font-mono">animation-timeline</code> CSS for seven effects, and the <Link href="/svg-line-drawing-generator" className={TRY_LINK}>SVG line drawing generator</Link> turns any SVG into a file that draws itself with CSS alone.</Try>
          </DocSection>

          {/* ── createSpring ─────────────────────────────────── */}
          <DocSection id="create-spring" tag="v1.0.0" heading="createSpring">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Returns a custom spring easing function. The built-in{' '}
              <code className="font-mono text-pitch-black">{"'spring'"}</code> easing is hardcoded —{' '}
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
              <code className="font-mono">{"easing: 'spring'"}</code>. Use it when you need to parameterize the bounce.
            </Note>
          </DocSection>

          {/* ── createBounce ─────────────────────────────────── */}
          <DocSection id="create-bounce" tag="v1.2.0" heading="createBounce">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Returns a bounce-out easing. The animation rises to 1 via ease-out, then makes{' '}
              <code className="font-mono text-pitch-black">bounces − 1</code> dips below 1 that settle —
              like a ball landing. The rise is the first of the{' '}
              <code className="font-mono text-pitch-black">bounces</code> segments. Output stays within [0, 1].
            </p>
            <OptGroup>
              <Opt name="bounces" type="number" defaultVal="3">
                Segments, the first rise included, so <code className="font-mono text-pitch-black">bounces − 1</code>{' '}
                dips follow it: the default 3 is a rise and two dips. Higher = more dips before settling.
              </Opt>
              <Opt name="decay" type="number" defaultVal="0.5">
                Amplitude reduction per bounce (0–1). Lower = faster decay, shallower bounces.
              </Opt>
            </OptGroup>
            <CodeBlock file="bounce.js">
{`import { scrollDraw, createBounce } from 'svg-scroll-draw';

// Named string — default params (bounces: 3, a rise and two dips; decay 0.5)
scrollDraw('#svg', { easing: 'bounce' });

// Four quick dips
scrollDraw('#svg', { easing: createBounce({ bounces: 5, decay: 0.35 }) });

// One slow, deep dip
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
              <Link href="/playground" className="underline underline-offset-2 hover:text-pitch-black transition-colors">
                playground
              </Link>{' '}
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
              <Opt name="easing" type="EasingName | CSS cubic-bezier() string | function" defaultVal="'linear'">
                Easing applied to this track’s local progress independently of other tracks.
              </Opt>
              <Opt name="fade" type="boolean" defaultVal="false">
                Fade opacity in sync with this track’s draw progress.
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
                Inject a fixed HUD panel into <code className="font-mono text-pitch-black">document.body</code> showing each track’s
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
              and the overall alpha in clip mode. <code className="font-mono">onProgress</code> and{' '}
              <code className="font-mono">getProgress()</code> report the same value; with{' '}
              <code className="font-mono">stagger</code>, <code className="font-mono">onComplete</code> waits
              for the last path.
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

          {/* ── v2.10.0 — refresh() ─────────────────────────── */}
          <DocSection id="instance-refresh" tag="v2.10.0" heading="refresh()">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Re-measure after a layout change: path lengths, and the scroll trigger window.
              The engine already re-measures on <code className="font-mono text-[0.85em]">resize</code>,
              on <code className="font-mono text-[0.85em]">orientationchange</code>, and through a{' '}
              <code className="font-mono text-[0.85em]">ResizeObserver</code> on the document element —
              but none of those fire for a change that leaves the document height alone, such as a tab
              switching, a sibling collapsing, or a font swapping inside a fixed-height box.
            </p>
            <CodeBlock file="refresh.js">
{`const draw = scrollDraw('#diagram');

// After swapping the SVG, or revealing a hidden tab panel:
draw.refresh();

// Available on the timeline and the group APIs too
const group = scrollDrawGroup(['#a', '#b']);
group.refresh();  // reaches every member`}
            </CodeBlock>
            <Note>
              Available on <code className="font-mono">scrollDraw</code>,{' '}
              <code className="font-mono">scrollDrawTimeline</code>, the group and sequence APIs,{' '}
              <code className="font-mono">scrollPin</code> and{' '}
              <code className="font-mono">scrollHorizontal</code>. It is optional on the shared
              instance type, because a few instances are fan-outs or SSR stubs — use{' '}
              <code className="font-mono">instance.refresh?.()</code> if you hold one of unknown origin.
            </Note>
          </DocSection>

          {/* ── v2.10.0 — timeline reduced motion ────────────── */}
          <DocSection id="timeline-reduced-motion" tag="v2.10.0" heading="Timeline & reduced motion">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              <code className="font-mono text-[0.85em]">scrollDrawTimeline</code> now takes{' '}
              <code className="font-mono text-[0.85em]">respectReducedMotion</code> (default{' '}
              <code className="font-mono text-[0.85em]">true</code>), and it applies to the time-driven{' '}
              <code className="font-mono text-[0.85em]">loop</code> only.
            </p>
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              The two halves of the API deserve different answers. Scroll scrubbing advances 1:1 with the
              user&apos;s own input — direct manipulation, not motion played at them — so it keeps working.
              The loop replays the whole timeline off a timer with no scroll input at all, which is
              autonomous motion, so with reduced motion requested it simply does not start. The preference
              is tracked live, so toggling the OS setting takes effect without a reload.
            </p>
            <CodeBlock file="timeline.js">
{`scrollDrawTimeline('#diagram', {
  tracks: [{ selector: '.line', from: 0, to: 1 }],
  loop: true,
  loopDuration: 1500,

  // Default. Set false to loop regardless of the preference.
  respectReducedMotion: true,
});`}
            </CodeBlock>
          </DocSection>

          {/* ── v2.10.0 — CDN dev build ─────────────────────── */}
          <DocSection id="cdn-dev-build" tag="v2.10.0" heading="CDN development build">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              A second CDN bundle that reports mistakes. The production build&apos;s warnings are
              compiled out, and before 2.10.0 there was no other build — the warnings were gated on{' '}
              <code className="font-mono text-[0.85em]">process.env.NODE_ENV</code>, and{' '}
              <code className="font-mono text-[0.85em]">process</code> does not exist in a browser
              without a bundler, so a <code className="font-mono text-[0.85em]">&lt;script src&gt;</code>{' '}
              user could never see one.
            </p>
            <CodeBlock file="index.html">
{`<!-- While developing: unminified, and it tells you what is wrong -->
<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.dev.global.js"></script>

<!-- In production: minified, silent -->
<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>`}
            </CodeBlock>
            <Note>
              What it reports: a path with no stroke, a selector that matches nothing, a fill that will
              obscure the stroke, a <code className="font-mono">morphTo</code> whose commands do not
              correspond — and a trigger window with zero length, which is an element that looks
              configured and will never move.
            </Note>
          </DocSection>

          {/* ── v2.9.0 — scrollProgress ─────────────────────── */}
          <DocSection id="scroll-progress" tag="v2.9.0" heading="scrollProgress">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Expose scroll progress as CSS custom properties on a target element.
              Drive opacity, transforms, colors, gradients — anything CSS can express — directly from{' '}
              <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">calc()</code> expressions with zero per-frame JS beyond the variable write.
              Two properties are set: raw (linear) and eased.
            </p>
            <CodeBlock file="index.js">
{`import { scrollProgress } from 'svg-scroll-draw/progress';

// Set --scroll-progress (raw) and --scroll-progress-eased on the element
scrollProgress('#hero', { easing: 'ease-in-out' });

// Custom variable names
scrollProgress('#section', {
  variable:      '--my-progress',
  easedVariable: '--my-progress-eased',
  trigger: { start: 'top 80%', end: 'bottom 20%' },
});

// Use in CSS
// #hero {
//   opacity: calc(var(--scroll-progress-eased));
//   transform: translateY(
//     calc((1 - var(--scroll-progress-eased)) * 40px)
//   );
// }`}
            </CodeBlock>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-[13px] border border-subtle-ash rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-pitch-black text-light-linen text-[11px]">
                    <th className="text-left px-4 py-2 font-medium">Option</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Default</th>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['variable',       'string',            '"--scroll-progress"',       'Raw (linear) 0–1 progress property.'],
                    ['easedVariable',  'string | null',     '"--scroll-progress-eased"', 'Eased 0–1 progress property. Set to null to skip.'],
                    ['trigger',        'TriggerConfig',     'top bottom / bottom top',   'Scroll window for 0→1 mapping.'],
                    ['easing',         'EasingName | fn',   '"linear"',                  'Easing applied to the eased variable.'],
                    ['speed',          'number',            '1',                         'Animation speed scale.'],
                    ['axis',           '"x" | "y"',         '"y"',                       'Scroll axis.'],
                    ['scrollContainer','string | Element',  '—',                         'Custom scroll container.'],
                    ['onProgress',     '(raw, eased) => void','—',                       'Callback fired every frame with both values.'],
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
            <Try>Build a reading bar on any edge, or a ring, in the <Link href="/scroll-progress-bar-generator" className={TRY_LINK}>scroll progress bar generator</Link>.</Try>
          </DocSection>

          {/* ── v2.9.0 — scrollHorizontal ───────────────────── */}
          <DocSection id="scroll-horizontal" tag="v2.9.0" heading="scrollHorizontal">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Drive horizontal <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">translateX</code> from vertical scroll —
              the Apple / Stripe “scroll sideways” pattern. You handle the sticky CSS;
              <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">scrollHorizontal</code> drives the transform.
            </p>
            <CodeBlock file="index.js">
{`import { scrollHorizontal } from 'svg-scroll-draw/horizontal';

// Minimal CSS:
// .outer  { height: 400vh; }
// .sticky { position: sticky; top: 0; height: 100vh; overflow: clip; }
// .track  { display: flex; width: max-content; }

// No distance: the track's width minus the sticky stage's, measured
// again whenever the window, the page, the track or the runway resizes.
const inst = scrollHorizontal('.track', {
  onProgress: (p) => dots.setActive(Math.round(p * 3)),
});

// React
useEffect(() => {
  const inst = scrollHorizontal(trackRef.current);
  return () => inst.destroy();
}, []);

inst.refresh();  // re-measure now, after a change nothing resized
inst.destroy();  // cleanup`}
            </CodeBlock>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-[13px] border border-subtle-ash rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-pitch-black text-light-linen text-[11px]">
                    <th className="text-left px-4 py-2 font-medium">Option</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Default</th>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['distance',             'number',                    'track − stage', 'Total horizontal travel in px. Defaults to the track’s width minus the content box of its sticky stage (or, without one, the scroll container’s or the viewport’s width, scrollbar left out), and is measured again when the layout changes (2.18.1). A number you pass is used as given.'],
                    ['trigger',              'TriggerConfig',             '{ start: "top top", end: "bottom bottom" }', 'Scroll window the travel is mapped across.'],
                    ['easing',               'EasingName | fn',           '"linear"',      'Easing for the movement. Linear gives the scrub feel.'],
                    ['triggerElement',       'string | Element',          'Sticky parent', 'Element whose height defines the scroll window. Defaults to the container of the track’s nearest position:sticky ancestor — the element that actually holds the scroll room. A sticky-pinned track is only one viewport tall, so measuring against it would give a zero-length window and no movement.'],
                    ['respectReducedMotion', 'boolean',                   'false',         'Unlike other APIs here, defaults to false. The transform is scroll-linked scrubbing — it advances only as the user scrolls — and holding a final state instead would leave every panel but one unreachable inside the sticky container. Set true if you have a non-transform fallback; the strip then also holds still if the reader turns reduced motion on mid-visit.'],
                    ['scrollContainer',      'string | Element',          'window',        'Custom scroll container.'],
                    ['onProgress',           '(p: number) => void',       '—',             'Fires every frame with 0–1 progress through the window.'],
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
            <Try>Set the panels, gap and scroll length in the <Link href="/horizontal-scroll-generator" className={TRY_LINK}>horizontal scroll generator</Link> and copy the sticky CSS with the JS.</Try>
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
                  <tr className="bg-pitch-black text-light-linen text-[11px]">
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
                    ['stagger',  'number',             '0.15',        'How far behind its neighbour each element in the same row starts, as a fraction of the reveal window (0–1). Rows are read from the layout, so a grid cascades within each row; applies on top of a custom trigger too.'],
                    ['easing',   'EasingName | fn',    '"ease-out"',  'Animation easing.'],
                    ['once',     'boolean',            'true',        'Freeze at max progress — don\'t reverse on scroll back.'],
                    ['trigger',  'TriggerConfig',      '"top 88%" → "top 53%"', 'Override the reveal window. The stagger offset is added on top of it, per element.'],
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
            <Try>Pick a preset, stagger and trigger in the <Link href="/scroll-reveal-generator" className={TRY_LINK}>scroll reveal generator</Link> and copy one <code className="font-mono">scrollReveal</code> call.</Try>
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
  pinDistance: '100vh', // one screen; holds still while a phone's address bar slides
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
                  <tr className="bg-pitch-black text-light-linen text-[11px]">
                    <th className="text-left px-4 py-2 font-medium">Option</th>
                    <th className="text-left px-4 py-2 font-medium">Type</th>
                    <th className="text-left px-4 py-2 font-medium">Default</th>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['pinDistance',  "number | '150vh'", 'window.innerHeight', "Scroll to stay pinned. A number is pixels and stays fixed; '150vh' is CSS's 150vh, which follows rotation and window resizes but not a phone's address bar (2.20.0)."],
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
            <Try>Scroll a pinned feature tour in the <Link href="/scroll-pin-generator" className={TRY_LINK}>scroll pin generator</Link> and copy its HTML, CSS and JS.</Try>
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

// Horizontal snap (e.g. feature carousel). The cards scroll inside .carousel
// (overflow-x: auto); without scrollContainer it would snap the window sideways.
scrollSnap('.card', {
  direction:       'horizontal',
  scrollContainer: '.carousel',
  duration:        400,
  easing:          'ease-out',
  onSnap:          (i) => setActiveCard(i),
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
                  <tr className="bg-pitch-black text-light-linen text-[11px]">
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
                    ['respectReducedMotion', 'boolean',              'true',          'Honour prefers-reduced-motion by jumping straight to the target section. Snapping still happens — only the animated scroll is dropped. Tracked live, so toggling the OS setting takes effect without a reload.'],
                    ['onSnap',          '(index: number) => void',   '—',             'Fires after each snap with the target section index. Fires once per snap.'],
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
            <Try>Prefer plain <code className="font-mono">scroll-snap-type</code>? The <Link href="/css-scroll-snap-generator" className={TRY_LINK}>CSS scroll snap generator</Link> builds a carousel or full-height sections with no JavaScript.</Try>
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
              Lenis needs no adapter. Every Lenis release so far is 1.x (2.0 exists only as development prereleases), and on every frame
              it moves the real scroll position: its <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">setScroll()</code> calls <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">scrollTo()</code>, so{' '}
              <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">window.scrollY</code> follows the eased scroll and every engine, the native CSS path included, works out of the box.
            </p>
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">createLenisAdapter</code> is for a scroller that keeps a virtual position and never moves the page: anything with
              Lenis’s <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">{"on('scroll')"}</code> / <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">{"off('scroll')"}</code> shape. It patches{' '}
              <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">window.scrollY</code> and <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">window.pageYOffset</code> to that value; pass{' '}
              <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">native: false</code> there, since CSS reads the real position. <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">destroy()</code> puts the
              browser’s own properties back (2.26.0+; before that it deleted them and left <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">window.scrollY</code> undefined).
            </p>
            <CodeBlock file="index.js">
{`// ── Lenis (no adapter needed) ─────────────────────────────────────
import Lenis from 'lenis';
import { scrollAnimate } from 'svg-scroll-draw';

const lenis = new Lenis();
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Lenis scrolls the real page, so svg-scroll-draw just works
scrollAnimate('#hero', { props: { opacity: [0, 1] }, once: true });

// ── A scroller that keeps a virtual position ──────────────────────
import { createLenisAdapter } from 'svg-scroll-draw/lenis';

// emits 'scroll' with { scroll, velocity, direction, progress }
const adapter = createLenisAdapter(scroller);
scrollAnimate('#hero', { props: { opacity: [0, 1] }, native: false });

// Cleanup: restores the browser's own window.scrollY
adapter.destroy();`}
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
                  <tr className="bg-pitch-black text-light-linen text-[11px]">
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
                    ['respectReducedMotion', 'boolean', 'true', 'Honour prefers-reduced-motion by applying the final state instead of animating, also when the reader turns it on while the page is open (2.22.0+). Set false only for scroll-linked scrubbing, which advances 1:1 with the user’s own scrolling rather than playing on its own.'],
                    ['triggerElement', 'Element', 'The animated element', 'Measure the trigger window from a different element. Needed when the animated element cannot supply the scroll length itself — a position:sticky element is only one viewport tall, so its window collapses to zero. Setting this disables the native CSS fast path, which can only measure its own subject.'],
                    ['onProgress',   '(n) => void', '—', 'Called as the scroll moves, with alpha 0–1 (the first path’s, under stagger).'],
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

// Percentage with one decimal. decimals replaces format, so the % goes in format.
scrollCounter('#conversion', {
  from:   0,
  to:     94.7,
  format: n => n.toFixed(1) + '%',
});

// React
import { ScrollCounter } from 'svg-scroll-draw/react';
<ScrollCounter to={50000} format={n => n.toLocaleString()} once />`}
            </CodeBlock>
            <Try>Set from, to, decimals and a suffix in the <Link href="/counter-animation-generator" className={TRY_LINK}>counter animation generator</Link> and watch the number count before you copy it.</Try>
          </DocSection>

          <DocSection id="scroll-parallax" tag="v2.0.0" heading="scrollParallax">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Move any element at a different rate than scroll. <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">speed</code> is how far it travels while it crosses the viewport, as a fraction of its own size. A positive speed moves it up as you scroll down, so it runs ahead of the page: <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">0.5</code> = up half its height. A negative one moves it down, so it lags behind, like a background: <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">-0.2</code> = down a fifth.
            </p>
            <CodeBlock file="index.js">
{`import { scrollParallax } from 'svg-scroll-draw';

scrollParallax('#hero-bg-image', { speed: 0.4 });         // ahead of the page
scrollParallax('#floating-element', { speed: -0.2 });     // lags behind the page
scrollParallax('#side-badge', { speed: 0.3, axis: 'x' }); // horizontal`}
            </CodeBlock>
            <Try>Give each layer its own speed in the <Link href="/parallax-scrolling-generator" className={TRY_LINK}>parallax scrolling generator</Link> and scroll the scene to feel the depth.</Try>
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

// A pinned film: the video sits in a sticky stage inside a tall track,
// so measure the track — the video's own box moves while it is stuck (2.18.0)
scrollVideo('#film', {
  triggerElement: document.querySelector('#film-track'),
  trigger: { start: 'top top', end: 'bottom bottom' },
});

// React: preload follows the option, poster goes to the <video> (2.23.4)
import { ScrollVideo } from 'svg-scroll-draw/react';
<ScrollVideo src="/hero.mp4" poster="/hero.jpg" trigger={{ start: 'top top', end: 'bottom top' }} />`}
            </CodeBlock>
            <p className="text-[12px] text-graphite-border mt-3">
              <strong>Encoding:</strong> put a keyframe every few frames (<code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">-g 3</code>):
              measured in Chromium, that kept every seek under 7.3 ms, where one keyframe for the whole clip took up to
              53.6 ms. Serve the file from a server that answers Range requests, or it will not seek at all, and add{' '}
              <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">muted playsinline preload=&quot;auto&quot;</code>.
              The whole pinned-film build is the{' '}
              <Link href="/examples/scroll-video" className="underline underline-offset-2">Scroll-video recipe</Link>.
            </p>
            <Try>Set the pin, range and easing on your own clip in the <Link href="/scroll-video-scrub-generator" className={TRY_LINK}>scroll video scrub generator</Link>.</Try>
          </DocSection>

          <DocSection id="scroll-frames" tag="v2.24.0" heading="scrollFrames">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              The same film drawn one still at a time: frame <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">round(progress × (count − 1))</code> of a numbered image sequence, painted on a <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">{'<canvas>'}</code> as you scroll. A video seeks to a keyframe and decodes forward; a decoded image shows at once, in every browser. {SELF_ENTRIES.frames} KB gzipped for its entry.
            </p>
            <CodeBlock file="index.js">
{`import { scrollFrames } from 'svg-scroll-draw/frames';

// 120 frames: /film/0001.jpg … /film/0120.jpg
scrollFrames('#film', {
  frames: (i) => \`/film/\${String(i + 1).padStart(4, '0')}.jpg\`,
  count: 120,
});

// Pinned: the canvas in a sticky stage, the track measured
scrollFrames('#film', {
  frames: urls,                 // or a list of URLs
  fit: 'contain',               // the whole frame; 'cover' (default) fills and crops
  triggerElement: document.querySelector('#film-track'),
  trigger: { start: 'top top', end: 'bottom bottom' },
});`}
            </CodeBlock>
            <p className="text-[12px] text-graphite-border mt-3">
              Size the canvas with CSS: its drawing buffer follows the box × <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">devicePixelRatio</code> (capped at 2). Frame 0 loads first, then the last, then the middle of every gap, <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">concurrency</code> (6) at a time; until a frame arrives, the nearest loaded one shows. Under reduced motion only the last frame is loaded and drawn. The library adds no ARIA: give the canvas <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">role=&quot;img&quot;</code> and an <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">aria-label</code>. In React and Vue (2.25.0+), <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">{'<ScrollFrames>'}</code> (from <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">svg-scroll-draw/react</code> or <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">/vue</code>) renders the canvas with <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">role=&quot;img&quot;</code>, takes every option as a prop and stops the film when it unmounts; an inline <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">frames</code> function is compared by the URLs it gives, so a re-render keeps the film. In Svelte, Solid and Angular (2.26.0+) it binds to a canvas you write, with the same rules: <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">{'use:scrollFramesAction={{ frames, count }}'}</code> (or <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">createScrollFrames</code>) from <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">svg-scroll-draw/svelte</code>, <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">{'<canvas ref={useScrollFrames(() => ({ frames, count }))} />'}</code> from <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">svg-scroll-draw/solid</code>, and <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">new ScrollFramesRef()</code> from <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">svg-scroll-draw/angular</code> with <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">init</code>, <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">update</code> and <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">destroy</code> from its lifecycle hooks; <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">triggerElement</code> also takes a selector there. The whole pinned build, on 71 real frames, is the{' '}
              <Link href="/examples/scroll-frames" className="underline underline-offset-2">Scroll image sequence recipe</Link>.
            </p>
            <Try>Turn a video into frames and scrub them, pinned or in the flow, in the <Link href="/scroll-image-sequence-generator" className={TRY_LINK}>scroll image sequence generator</Link>.</Try>
          </DocSection>

          <DocSection id="scroll-text" tag="v2.1.0" heading="scrollText">
            <p className="text-sm text-graphite-border leading-relaxed mb-2">
              Split any text element into chars, words, or lines and animate each piece on scroll. A {SELF_ENTRIES.text} KB alternative to GSAP SplitText. SplitText is free and {COMPETITORS.gsapSplitText.gzipKb} KB, but it only splits — animating the pieces needs GSAP core ({COMPETITORS.gsapCore.gzipKb} KB) too.
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
              Accessibility: the element keeps one visually hidden copy of its whole text, after the split pieces, so a screen reader reads the sentence once. All split spans have <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">aria-hidden=&quot;true&quot;</code>. No <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">aria-label</code> is added: ARIA does not allow one on a paragraph or a span. <code className="font-mono text-[0.85em] bg-marketplace-gray px-1 py-0.5 rounded">destroy()</code> restores the original HTML.
            </p>
            <Try>Split a line by word, letter or line in the <Link href="/text-animation-generator" className={TRY_LINK}>text animation generator</Link>, or type it out letter by letter in the <Link href="/typewriter-effect-generator" className={TRY_LINK}>typewriter effect generator</Link>.</Try>
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

        </div>
      </div>
    </div>
  );
}
