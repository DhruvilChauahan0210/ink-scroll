'use client';

import './stack.css';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { SELF } from '@/data/competitors';
import { BUDGET_KB } from '@/data/facts';
import { EXAMPLE_COUNT } from '@/data/examples-index';
import {
  CHIP_DONE_AT,
  CLEARANCE,
  CONNS,
  CORE_PULSE,
  DIMENSION,
  DIMENSION_AT,
  FIDUCIALS,
  FIDUCIAL_AT,
  KEEPOUT,
  LEADER_AT,
  MARKING,
  NOTES,
  PIECES,
  PIN1,
  POUR,
  PULSES,
  SHELL_INDEX,
  TRACE_INDEX,
  VIAS,
  VIEW,
  type Conn,
  type ConnId,
  type NetId,
  type Note,
  type Piece,
} from './art/stack-geometry';

/**
 * Chapter 07 — the library as a circuit board: the core in a 44-lead package,
 * a trace routed out to a connector for every framework entry it ships, and
 * the scroll inking the board from the core outward. Choosing a framework
 * lights its net and runs a pulse down it; the code panel beside it shows
 * the same entry, written that framework's way.
 *
 * Not pinned: the drawing is scrubbed while it travels up the viewport, from
 * its centre at 92% of the viewport to its centre at 50%. The window is
 * measured on the centre, not the top, because the chip — the first thing
 * drawn — sits in the middle of the board: starting from the top would ink
 * it while it is still below the fold. Every stroke gets `1 / SPEED` of the
 * window and stroke i starts `i × STAGGER` later, so the chip lands first,
 * the traces fan out together, then the connectors, and the board's edge
 * closes round them. The last stroke lands at p ≈ 0.88 — the board's centre
 * at 55% of the viewport — so a reader who stops with the chapter centred
 * always sees the finished board.
 */
const STAGGER = 0.01;
const SPEED = 5;
const EASING = 'ease-in-out' as const;
const SELECTOR = '.st-ink';
const START = 0.92;
const END = 0.5;
const VIEWBOX = `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`;

const doneAt = (i: number): string => Math.min(1, i * STAGGER + 1 / SPEED).toFixed(3);
const startAt = (i: number): string => (i * STAGGER).toFixed(3);

const TOTAL = PIECES.length;
const inkedAt = (p: number): number =>
  p < 1 / SPEED ? 0 : Math.min(TOTAL, Math.floor((p - 1 / SPEED) / STAGGER + 1e-6) + 1);
const pad = (n: number): string => String(n).padStart(String(TOTAL).length, '0');

/* ── The frameworks ───────────────────────────────────────────────────────── */

type TabId = 'react' | 'vue' | 'svelte' | 'solid' | 'angular' | 'astro' | 'vanilla' | 'cdn';

interface Tab {
  id: TabId;
  label: string;
  file: string;
  entry: string;
  /** The nets this snippet runs through: lit together. */
  nets: NetId[];
  code: string;
}

const TABS: Tab[] = [
  {
    id: 'react',
    label: 'React',
    file: 'Hero.tsx',
    entry: 'svg-scroll-draw/react',
    nets: ['react', 'next'],
    code: `'use client';
import { ScrollDraw, ScrollText } from 'svg-scroll-draw/react';

export function Hero() {
  return (
    <>
      <ScrollText as="h1" split="words" stagger={0.05}>
        Every word arrives on scroll
      </ScrollText>
      <ScrollDraw easing="ease-out">
        <svg viewBox="0 0 200 80">{/* paths */}</svg>
      </ScrollDraw>
    </>
  );
}`,
  },
  {
    id: 'vue',
    label: 'Vue',
    file: 'Hero.vue',
    entry: 'svg-scroll-draw/vue',
    nets: ['vue', 'nuxt'],
    code: `<script setup>
import { ScrollDraw } from 'svg-scroll-draw/vue';
// Nuxt: the same components from 'svg-scroll-draw/nuxt'
</script>

<template>
  <ScrollDraw easing="ease-out" :speed="1.2">
    <svg viewBox="0 0 200 80"><!-- paths --></svg>
  </ScrollDraw>
</template>`,
  },
  {
    id: 'svelte',
    label: 'Svelte',
    file: 'Hero.svelte',
    entry: 'svg-scroll-draw/svelte',
    nets: ['svelte'],
    code: `<script>
  import { scrollDraw } from 'svg-scroll-draw/svelte';
</script>

<!-- an action: it runs when the node mounts -->
<div use:scrollDraw={{ easing: 'ease-out', stagger: 0.1 }}>
  <svg viewBox="0 0 200 80"><!-- paths --></svg>
</div>`,
  },
  {
    id: 'solid',
    label: 'Solid',
    file: 'Hero.tsx',
    entry: 'svg-scroll-draw/solid',
    nets: ['solid'],
    code: `import { useScrollDraw } from 'svg-scroll-draw/solid';

export function Hero() {
  // a hook: hand its ref setter to any element
  const ref = useScrollDraw({ easing: 'ease-out' });
  return (
    <div ref={ref}>
      <svg viewBox="0 0 200 80">{/* paths */}</svg>
    </div>
  );
}`,
  },
  {
    id: 'angular',
    label: 'Angular',
    file: 'hero.component.ts',
    entry: 'svg-scroll-draw/angular',
    nets: ['angular'],
    code: `import { Component, ElementRef, ViewChild }
  from '@angular/core';
import { ScrollDrawRef } from 'svg-scroll-draw/angular';

@Component({
  selector: 'app-hero',
  template: '<div #art><svg>…</svg></div>',
})
export class HeroComponent {
  @ViewChild('art') art!: ElementRef<HTMLElement>;
  private draw = new ScrollDrawRef();
  ngAfterViewInit() {
    const el = this.art.nativeElement;
    this.draw.init(el, { easing: 'ease-out' });
  }
  ngOnDestroy() { this.draw.destroy(); }
}`,
  },
  {
    id: 'astro',
    label: 'Astro',
    file: 'Hero.astro',
    entry: 'svg-scroll-draw/astro',
    nets: ['astro'],
    code: `<div
  data-scroll-draw
  data-scroll-draw-options='{"easing":"ease-out"}'
>
  <svg viewBox="0 0 200 80"><!-- paths --></svg>
</div>

<script>
  import { initScrollDraw } from 'svg-scroll-draw/astro';
  initScrollDraw();
</script>`,
  },
  {
    id: 'vanilla',
    label: 'Vanilla JS',
    file: 'main.js',
    entry: 'svg-scroll-draw',
    nets: ['core'],
    code: `import { scrollDraw, scrollAnimate } from 'svg-scroll-draw';

// Draw every path in #logo as it scrolls through view
scrollDraw('#logo', { easing: 'ease-out', stagger: 0.1 });

// Animate any CSS property from scroll
scrollAnimate('.card', {
  props: {
    opacity: [0, 1],
    transform: ['translateY(32px)', 'none'],
  },
  once: true,
});`,
  },
  {
    id: 'cdn',
    label: 'CDN',
    file: 'index.html',
    entry: 'svg-scroll-draw/web-component',
    nets: ['wc'],
    code: `<script src="https://unpkg.com/svg-scroll-draw/dist/cdn/svg-scroll-draw.global.js"></script>

<scroll-draw easing="ease-out" once>
  <svg viewBox="0 0 200 80"><!-- paths --></svg>
</scroll-draw>`,
  },
];

const TAB_OF: Record<NetId, TabId> = {
  react: 'react',
  next: 'react',
  vue: 'vue',
  nuxt: 'vue',
  svelte: 'svelte',
  solid: 'solid',
  angular: 'angular',
  astro: 'astro',
  wc: 'cdn',
  core: 'vanilla',
};

const MAX_LINES = Math.max(...TABS.map((t) => t.code.split('\n').length));

/* The reference designators of the nets a snippet lights, as the board's
   silkscreen prints them: the code panel's status bar names the same parts
   that are glowing on the board. */
const DESIGNATOR: Record<NetId, string> = { core: 'U1' } as Record<NetId, string>;
for (const c of CONNS) DESIGNATOR[c.id] = c.title.split(' · ')[0];

/* ── A small highlighter: enough to read, never a dependency ──────────────── */

type Kind = 'c' | 's' | 'e' | 'n' | 'k' | 'g' | 'f';
const TOKEN =
  /(\/\/.*$|<!--.*?-->|\{\/\*.*?\*\/\})|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(@\w+|\b(?:import|from|export|function|return|const|class|private|new|this)\b)|(<\/?[A-Za-z][\w.:-]*|\/?>)|([A-Za-z_$][\w$]*(?=\())/g;

function tokens(line: string): { t: string; k?: Kind }[] {
  const out: { t: string; k?: Kind }[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ t: line.slice(last, at) });
    const [t, c, s, n, k, g] = m;
    const kind: Kind = c ? 'c' : s ? (t.includes('svg-scroll-draw') ? 'e' : 's') : n ? 'n' : k ? 'k' : g ? 'g' : 'f';
    out.push({ t, k: kind });
    last = at + t.length;
  }
  if (last < line.length) out.push({ t: line.slice(last) });
  return out;
}

/* ── The drawing ──────────────────────────────────────────────────────────── */

type Group = { under: Piece['under']; items: { p: Piece; i: number }[] };
const GROUPS: Group[] = [];
PIECES.forEach((p, i) => {
  const last = GROUPS[GROUPS.length - 1];
  if (last && last.under === p.under) last.items.push({ p, i });
  else GROUPS.push({ under: p.under, items: [{ p, i }] });
});

const LEADS = new Set<number>([...Object.values(LEADER_AT), DIMENSION_AT, DIMENSION_AT - 1, DIMENSION_AT - 2, DIMENSION_AT - 3]);

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <clipPath id={`${id}-clip`}>
        <path d={POUR} />
      </clipPath>
      {/* The pour's clearance: black wherever copper must not be. Hidden
          traces take their channels with them, so the phone crop's hatch
          closes over them. */}
      <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h}>
        <rect x={VIEW.x} y={VIEW.y} width={VIEW.w} height={VIEW.h} fill="#fff" />
        <path d={KEEPOUT} fill="#000" />
        {CLEARANCE.traces.map((t, k) => (
          <path key={`t${k}`} className={t.wide ? 'st-wide' : undefined} d={t.d} fill="none" stroke="#000" strokeWidth="24" />
        ))}
        {CLEARANCE.vias.map((v, k) => (
          <circle key={`v${k}`} className={v.wide ? 'st-wide' : undefined} cx={v.c[0].toFixed(1)} cy={v.c[1].toFixed(1)} r="15" fill="#000" />
        ))}
        {CLEARANCE.lines.map((d, k) => (
          <path key={`l${k}`} className="st-cut" d={d} fill="none" stroke="#000" strokeWidth="10" />
        ))}
        {CLEARANCE.zones.map((d, k) => (
          <path key={`z${k}`} d={d} fill="#000" />
        ))}
        {CLEARANCE.dots.map((c, k) => (
          <circle key={`d${k}`} className="st-cut" cx={c[0].toFixed(1)} cy={c[1].toFixed(1)} r="9" fill="#000" />
        ))}
      </mask>
    </defs>
  );
}

function Strokes({ id, ghost, lit }: { id: string; ghost?: boolean; lit: ReadonlySet<NetId> }) {
  return (
    <>
      {GROUPS.map((g, gi) => {
        const items = ghost ? g.items.filter(({ p }) => p.layer !== 'note') : g.items;
        if (!items.length) return null;
        const paths = items.map(({ p, i }) => {
          const wide = p.wide ? ' st-wide' : '';
          const cls = ghost
            ? `st-pencil st-w-${p.w}${wide}`
            : `st-ink st-w-${p.w} st-t-${p.tone}${wide}${LEADS.has(i) ? ' st-lead' : ''}${p.net && lit.has(p.net) ? ' is-lit' : ''}`;
          /* The stroke attribute only satisfies the library's dev check, which
             reads attributes; the classes set the real colour. */
          return <path key={i} className={cls} d={p.d} stroke={ghost ? undefined : 'currentColor'} />;
        });
        if (g.under === 'pour') {
          return (
            <g key={gi} clipPath={`url(#${id}-clip)`} mask={`url(#${id}-mask)`}>
              {paths}
            </g>
          );
        }
        if (g.under === 'clear') {
          return (
            <g key={gi} mask={`url(#${id}-mask)`}>
              {paths}
            </g>
          );
        }
        return <g key={gi}>{paths}</g>;
      })}
    </>
  );
}

const at = (v: string): CSSProperties => ({ '--st-at': v }) as CSSProperties;

/* What each leader says: a title and a value, both true of the library. The
   engine's clock is requestAnimationFrame, and its loop only runs while the
   drawing is on screen. */
const NOTE_TEXT: Record<Note['key'], [string, string]> = {
  tee: ['SHARED NET', 'Next.js on /react'],
  gnd: ['GROUND PLANE', '0 runtime deps'],
  clk: ['Y1 · CLOCK', 'rAF · in view'],
};

/** Short labels for the phone crop, set under or over each connector. */
function shortY(c: Conn): number {
  return c.enter === 'bottom' ? c.c[1] - 42 : c.c[1] + 60;
}

/* The pulse: one comet per lit trace, all at one speed and one cycle, so a
   branch that leaves late stays in step with its trunk. */
const PULSE_SPEED = 300; // units per second
const PULSE_CYCLE = 2; // seconds
const COMET = 54; // units

function pulseStyle(len: number, lead: number): CSSProperties {
  const dash = (COMET / len) * 100;
  const run = ((PULSE_SPEED * PULSE_CYCLE) / len) * 100;
  return {
    '--st-dash': dash.toFixed(2),
    '--st-from': dash.toFixed(2),
    '--st-to': (dash - run).toFixed(2),
    animationDuration: `${PULSE_CYCLE.toFixed(2)}s`,
    animationDelay: `${(lead / PULSE_SPEED).toFixed(3)}s`,
  } as CSSProperties;
}

const CORE_STYLE = {
  '--st-dash': ((COMET * 1.6 * 100) / CORE_PULSE.len).toFixed(2),
  '--st-gap': (100 - (COMET * 1.6 * 100) / CORE_PULSE.len).toFixed(2),
  animationDuration: `${(CORE_PULSE.len / PULSE_SPEED).toFixed(2)}s`,
} as CSSProperties;

function Pulses({ tab }: { tab: Tab }) {
  if (tab.nets.includes('core')) {
    return (
      <g className="st-pulse-g" style={at(doneAt(CHIP_DONE_AT))}>
        <path className="st-pulse st-pulse-loop" d={CORE_PULSE.d} pathLength="100" style={CORE_STYLE} />
      </g>
    );
  }
  return (
    <>
      {tab.nets.map((n) => {
        const pz = PULSES[n as ConnId];
        const c = CONNS.find((x) => x.id === n)!;
        const style = pulseStyle(pz.len, pz.lead);
        return (
          <g key={n} className={`st-pulse-g${c.wide ? ' st-wide' : ''}`} style={at(doneAt(TRACE_INDEX[n as ConnId]))}>
            <path className="st-halo" d={pz.d} />
            <path className="st-pulse" d={pz.d} pathLength="100" style={style} />
          </g>
        );
      })}
    </>
  );
}

function Drawing({ tab, lit, onPick }: { tab: Tab; lit: ReadonlySet<NetId>; onPick: (t: TabId) => void }) {
  const pick = (e: MouseEvent<SVGSVGElement>) => {
    const hit = (e.target as Element).closest('[data-net]');
    const net = hit?.getAttribute('data-net') as NetId | null;
    if (net && TAB_OF[net]) onPick(TAB_OF[net]);
  };
  return (
    <div className="st-plate">
      {/* The pencil underdrawing: static, in its own SVG, so the per-frame
          ink updates never repaint it. The ink traces exactly over it. */}
      <svg className="st-svg st-svg-pencil" viewBox={VIEWBOX} aria-hidden="true" focusable="false">
        <Defs id="st-p" />
        <Strokes id="st-p" ghost lit={lit} />
      </svg>
      <svg
        className="st-svg"
        viewBox={VIEWBOX}
        role="img"
        aria-label="Circuit-board drawing: the svg-scroll-draw core chip with traces routed to connectors for React, Next.js, Vue, Nuxt, Svelte, Solid, Angular, Astro and Web Components"
        onClick={pick}
      >
        <Defs id="st-i" />
        <Strokes id="st-i" lit={lit} />

        <g className="st-pulses" aria-hidden="true">
          <Pulses key={tab.id} tab={tab} />
        </g>

        <g className="st-notes" aria-hidden="true">
          {/* Engraved on the package, once its body is inked */}
          <g className="st-note st-chip" data-net="core" style={at(doneAt(CHIP_DONE_AT))}>
            <rect className="st-hit" x={(MARKING.x - 110).toFixed(1)} y={(MARKING.y - 134).toFixed(1)} width="220" height="220" />
            <text className="st-marking" x={MARKING.x} y={MARKING.y} textAnchor="middle">
              <tspan className="st-marking-t" x={MARKING.x} y={MARKING.y}>
                SVG-SCROLL-DRAW
              </tspan>
              <tspan className="st-marking-v" x={MARKING.x} y={MARKING.y + 27}>
                CORE · {SELF.gzipKb} KB
              </tspan>
              <tspan className="st-marking-t" x={MARKING.x} y={MARKING.y + 51}>
                V{SELF.version} · MIT
              </tspan>
            </text>
            <circle className="st-pin1" cx={PIN1[0].toFixed(1)} cy={PIN1[1].toFixed(1)} r="2.6" />
            <text className="st-silk" x={(PIN1[0] - 44).toFixed(1)} y={(PIN1[1] - 40).toFixed(1)} textAnchor="middle">
              U1
            </text>
          </g>

          {VIAS.map((v, k) => (
            <circle
              key={k}
              className={`st-note st-drill${v.wide ? ' st-wide' : ''}${lit.has(v.net) ? ' is-lit' : ''}`}
              cx={v.c[0].toFixed(1)}
              cy={v.c[1].toFixed(1)}
              r="3.2"
              style={at(doneAt(v.at))}
            />
          ))}
          {FIDUCIALS.map((c, k) => (
            <circle
              key={k}
              className="st-note st-fid st-wide"
              cx={c[0].toFixed(1)}
              cy={c[1].toFixed(1)}
              r="4.5"
              style={at(doneAt(FIDUCIAL_AT + k))}
            />
          ))}

          {CONNS.map((c) => {
            const on = lit.has(c.id);
            const s = SHELL_INDEX[c.id];
            return (
              <g key={c.id} className={`st-conn${c.wide ? ' st-wide' : ''}${on ? ' is-lit' : ''}`} data-net={c.id}>
                <rect className="st-hit" x={(c.c[0] - 96).toFixed(1)} y={(c.c[1] - 36).toFixed(1)} width="192" height="72" />
                <text className="st-note st-name" x={c.nameAt[0]} y={c.nameAt[1]} textAnchor="middle" style={at(doneAt(s))}>
                  {c.name}
                </text>
                <text className="st-note st-clabel st-full" x={c.label.x} y={c.label.y} textAnchor={c.label.anchor} style={at(doneAt(s + 1))}>
                  <tspan className="st-clabel-t" x={c.label.x} y={c.label.y - 21}>
                    {c.title}
                  </tspan>
                  <tspan className="st-clabel-v" x={c.label.x} y={c.label.y}>
                    <tspan className="st-pkg">svg-scroll-draw/</tspan>
                    {c.entry}
                  </tspan>
                </text>
                <text className="st-note st-clabel st-short" x={c.c[0]} y={shortY(c)} textAnchor="middle" style={at(doneAt(s + 1))}>
                  /{c.entry}
                </text>
              </g>
            );
          })}

          <text className="st-note st-annot" x={DIMENSION.x} y={DIMENSION.y} style={at(doneAt(DIMENSION_AT))}>
            <tspan className="st-annot-t" x={DIMENSION.x} y={DIMENSION.y - 8}>
              GZIP · CI BUDGET
            </tspan>
            <tspan className="st-annot-v" x={DIMENSION.x} y={DIMENSION.y + 15}>
              {SELF.gzipKb} / {BUDGET_KB.toFixed(1)} KB
            </tspan>
          </text>

          {NOTES.map((n) => {
            const i = LEADER_AT[n.key];
            return (
              <g key={n.key}>
                <circle className="st-note st-dot" cx={n.dot[0].toFixed(1)} cy={n.dot[1].toFixed(1)} r="3.2" style={at(startAt(i))} />
                <text className="st-note st-annot" x={n.text[0]} y={n.text[1]} textAnchor={n.anchor} style={at(doneAt(i))}>
                  <tspan className="st-annot-t" x={n.text[0]} dy="-19">
                    {NOTE_TEXT[n.key][0]}
                  </tspan>
                  <tspan className="st-annot-v" x={n.text[0]} dy="21">
                    {NOTE_TEXT[n.key][1]}
                  </tspan>
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

/* ── The code panel ───────────────────────────────────────────────────────── */

function Code({ tab }: { tab: Tab }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tab.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the code stays selectable */
    }
  };
  const lines = tab.code.split('\n');
  return (
    <div className="st-panel" id="st-panel" role="tabpanel" aria-labelledby={`st-tab-${tab.id}`}>
      <div className="st-panel-head">
        <span className="st-file">
          <i aria-hidden="true" />
          {tab.file}
        </span>
        <span className="st-panel-entry">{tab.entry}</span>
        <button type="button" className="st-copybtn" onClick={copy} aria-live="polite">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="st-pre" style={{ '--st-lines': String(MAX_LINES) } as CSSProperties}>
        <code>
          {lines.map((ln, i) => (
            <span className="st-ln" key={i} style={{ '--i': String(i) } as CSSProperties}>
              <span className="st-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="st-src">
                {tokens(ln).map((t, k) =>
                  t.k ? (
                    <span key={k} className={`st-k-${t.k}`}>
                      {t.t}
                    </span>
                  ) : (
                    t.t
                  ),
                )}
              </span>
            </span>
          ))}
        </code>
      </pre>
      <div className="st-panel-foot">
        <span className="st-foot-cmd">
          <span aria-hidden="true">$ </span>npm i svg-scroll-draw
        </span>
        <span className="st-foot-net">
          <span className="st-foot-k">net</span> {tab.nets.map((n) => DESIGNATOR[n]).join(' · ')}
        </span>
      </div>
    </div>
  );
}

/* ── Reduced motion, read as an external store ────────────────────────────── */

const REDUCED = '(prefers-reduced-motion: reduce)';
function subscribeReduced(cb: () => void): () => void {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const getReduced = (): boolean => window.matchMedia(REDUCED).matches;
const getReducedOnServer = (): boolean => false;

export function Stack() {
  const artRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const inkedRef = useRef(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState<TabId>('react');
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];
  const lit: ReadonlySet<NetId> = new Set(tab.nets);

  /* The engine reports stroke 0's eased alpha, which finishes early, so the
     callback is the per-frame tick and the window position is read here. One
     style write per frame; nothing re-renders. */
  const onProgress = useCallback(() => {
    const art = artRef.current?.parentElement;
    if (!art) return;
    const r = art.getBoundingClientRect();
    const vh = window.innerHeight;
    const span = (START - END) * vh;
    const p = span > 0 ? Math.min(1, Math.max(0, (START * vh - (r.top + r.height / 2)) / span)) : 1;
    art.style.setProperty('--st-p', p.toFixed(4));
    const inked = inkedAt(p);
    if (inked !== inkedRef.current && countRef.current) {
      inkedRef.current = inked;
      countRef.current.textContent = pad(inked);
    }
  }, []);

  /* The pulse is a CSS animation that repaints every frame; it rests while
     the board is off screen. An attribute write, not state. */
  useEffect(() => {
    const art = artRef.current?.parentElement;
    if (!art || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => art.toggleAttribute('data-idle', !e.isIntersecting));
    io.observe(art);
    return () => io.disconnect();
  }, []);

  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedOnServer);
  useEffect(() => {
    if (!reduced) return;
    artRef.current?.parentElement?.style.setProperty('--st-p', '1');
    if (countRef.current) countRef.current.textContent = pad(TOTAL);
  }, [reduced]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setActive(TABS[next].id);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="st-stage">
      <div className="st-copy">
        <p className="st-kicker">
          <span>07 / your stack</span>
          <span className="st-count" aria-hidden="true">
            <span ref={countRef}>{pad(0)}</span> / {TOTAL} strokes
          </span>
        </p>
        <h2 id="st-title" className="st-title">
          Written the way your framework writes
        </h2>
        <p className="st-lede">
          A component in React and Vue, an action in Svelte, a hook in Solid, a custom element for plain HTML. SSR-safe.
        </p>
        <div className="st-links">
          <Link href="/examples" className="btn" data-magnetic>
            {EXAMPLE_COUNT} live examples
          </Link>
          <Link href="/blocks" className="btn" data-magnetic>
            Copy-paste blocks
          </Link>
        </div>
      </div>

      <ScrollDraw
        className="st-art"
        selector={SELECTOR}
        trigger={{ start: `center ${START * 100}%`, end: `center ${END * 100}%` }}
        stagger={STAGGER}
        speed={SPEED}
        easing={EASING}
        onProgress={onProgress}
      >
        <div ref={artRef} className="st-art-in">
          <Drawing tab={tab} lit={lit} onPick={setActive} />
        </div>
      </ScrollDraw>

      <div className="st-code">
        <div className="st-tabs" role="tablist" aria-label="Framework" onKeyDown={onKey}>
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`st-tab-${t.id}`}
              aria-selected={t.id === active}
              aria-controls="st-panel"
              tabIndex={t.id === active ? 0 : -1}
              className="st-tab"
              onClick={() => setActive(t.id)}
            >
              <i aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>
        <Code key={tab.id} tab={tab} />
      </div>
    </div>
  );
}
