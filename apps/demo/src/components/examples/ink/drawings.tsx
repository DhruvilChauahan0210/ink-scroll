'use client';

/**
 * The /examples drawings, in the homepage's ink: precise strokes over a pencil
 * underdrawing, one accent, mono labels carrying real values. Each keeps the
 * API its example demonstrates.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { PRESETS } from 'svg-scroll-draw';
import { scrollDrawGroup, scrollDrawSequence } from 'svg-scroll-draw/group';
import { scrollDrawTimeline } from 'svg-scroll-draw/timeline';
import { SignatureArt, RouteArt, ChartArt, FlowArt } from '../../home/art/usecase-art';
import { SELF } from '@/data/competitors';
import { InkSheet, TRIGGER } from './kit';
import { arrowHead, circle, dot, elbow, line, n, roundRect, smooth, ticks, type P } from './geo';

/* ── Homepage art, on an example plate ─────────────────────────────────── */

function Art({ children, stagger, label }: { children: ReactNode; stagger: number; label: string }) {
  return (
    <ScrollDraw className="ink-sheet ink-art" trigger={TRIGGER} selector="path:not(.uc-x)" stagger={stagger} easing="ease-out">
      <div role="img" aria-label={label}>{children}</div>
    </ScrollDraw>
  );
}

export const ChartInk = () => <Art stagger={0.03} label="A two-series line chart plotting itself on a pencil grid"><ChartArt /></Art>;
export const SignatureInk = () => <Art stagger={0.08} label="A handwritten signature inking itself over its baseline"><SignatureArt /></Art>;
export const RouteInk = () => <Art stagger={0.012} label="A delivery route drawn across a street grid, start to pin"><RouteArt /></Art>;
export const DiagramInk = () => <Art stagger={0.025} label="A system diagram: client, edge, auth, api and db, connected in order"><FlowArt /></Art>;

/* ── 01 Logo reveal: the outline inks, then onComplete floods the fill ─── */

const NIB = 'M 200 214 L 171 140 Q 166 118 183 105 Q 200 94 217 105 Q 234 118 229 140 Z';

export function LogoInk() {
  const [done, setDone] = useState(false);
  return (
    <div className={`ink-logo${done ? ' ink-done' : ''}`}>
      <InkSheet label="A nib mark inside a ring, outlined by scroll, then filled when the outline completes" stagger={0.05} onComplete={() => setDone(true)}>
        <path className="uc-h uc-h2" d="M 200 34 V 258 M 88 148 H 312" />
        <path className="uc-h" d={circle(200, 148, 104)} />
        <path className="uc-h" d="M 92 44 H 104 M 92 44 V 56 M 308 44 H 296 M 308 44 V 56 M 92 252 H 104 M 92 252 V 240 M 308 252 H 296 M 308 252 V 240" />
        <path className="uc-p" d={circle(200, 148, 88)} />
        <path className="uc-h" d={circle(200, 148, 74)} />
        <path className="ink-flood uc-x" d={NIB} />
        <path className="uc-p ink-nib" d={NIB} />
        <path className="uc-s ink-cut" d="M 178 162 Q 200 170 222 162" />
        <path className="uc-a ink-cut" d="M 200 214 V 151" />
        <path className="uc-a ink-cut" d={circle(200, 145, 5.5)} />
        <text className="uc-t" x="56" y="284">ring Ø176 · nib 1 stroke</text>
        <text className="uc-t uc-t-a ink-note" x="344" y="284" textAnchor="end">onComplete → fill</text>
      </InkSheet>
    </div>
  );
}

/* ── 04 Checkout flow: four stations, connectors, in order ─────────────── */

const STATIONS = ['cart', 'address', 'payment', 'receipt'];
const SW = 70, SH = 46, SY = 120, SX0 = 24, SGAP = 24;
const sx = (i: number) => SX0 + i * (SW + SGAP);

export function CheckoutInk() {
  const parts: ReactNode[] = [];
  STATIONS.forEach((s, i) => {
    const last = i === STATIONS.length - 1;
    parts.push(<path key={`b${i}`} className={last ? 'uc-a' : 'uc-s'} d={roundRect(sx(i), SY, SW, SH, 6)} />);
    if (!last) {
      const a: P = [sx(i) + SW + 3, SY + SH / 2];
      const b: P = [sx(i + 1) - 4, SY + SH / 2];
      parts.push(<path key={`c${i}`} className="uc-p" d={line(a, b)} />);
      parts.push(<path key={`h${i}`} className="uc-p" d={arrowHead(b, 'r', 3.6)} />);
    }
  });
  const yd = 214;
  return (
    <InkSheet label="A checkout flow: cart, address, payment and receipt, drawn one after another" stagger={0.028}>
      <text className="uc-t uc-t-lg" x={SX0} y="70">checkout</text>
      <path className="uc-h uc-h2 uc-x" d={`M ${SX0} 82 H ${sx(3) + SW}`} />
      {parts}
      {/* What each station holds, drawn small inside its box. */}
      <path className="uc-p" d={`M ${sx(0) + 20} ${SY + 14} H ${sx(0) + 25} L ${sx(0) + 29} ${SY + 29} H ${sx(0) + 46} L ${sx(0) + 50} ${SY + 19} H ${sx(0) + 27}`} />
      <path className="uc-dot" d={dot(sx(0) + 31, SY + 34)} />
      <path className="uc-dot" d={dot(sx(0) + 44, SY + 34)} />
      <path className="uc-p" d={`M ${sx(1) + 35} ${SY + 36} L ${sx(1) + 28} ${SY + 23} A 7.5 7.5 0 1 1 ${sx(1) + 42} ${SY + 23} Z`} />
      <path className="uc-s" d={circle(sx(1) + 35, SY + 19.5, 2.4)} />
      <path className="uc-p" d={roundRect(sx(2) + 21, SY + 12, 28, 21, 2.5)} />
      <path className="uc-s" d={`M ${sx(2) + 21} ${SY + 18.5} H ${sx(2) + 49} M ${sx(2) + 25} ${SY + 27.5} H ${sx(2) + 33}`} />
      <path className="uc-a" d={`M ${sx(3) + 24} ${SY + 23} L ${sx(3) + 32} ${SY + 31} L ${sx(3) + 47} ${SY + 15}`} />
      {STATIONS.map((s, i) => (
        <g key={s}>
          <text className="uc-t" x={n(sx(i) + 2)} y={SY - 12}>{String(i + 1).padStart(2, '0')}</text>
          <text className={`uc-t uc-t-box${i === 3 ? ' uc-t-a' : ''}`} x={n(sx(i) + SW / 2)} y={SY + SH + 20} textAnchor="middle">{s}</text>
        </g>
      ))}
      <path className="uc-h" d={`M ${SX0} ${yd - 6} V ${yd + 6} M ${sx(3) + SW} ${yd - 6} V ${yd + 6} M ${SX0} ${yd} H 128 M 272 ${yd} H ${sx(3) + SW}`} />
      <text className="uc-t" x="200" y={yd + 3.5} textAnchor="middle">4 steps · stagger 0.18</text>
    </InkSheet>
  );
}

/* ── Astro: one attribute, one script ──────────────────────────────────── */

export function AstroInk() {
  return (
    <InkSheet label="A div marked data-scroll-draw, its wave drawn by initScrollDraw" stagger={0.06}>
      <path className="uc-s" d={roundRect(56, 62, 288, 150, 6)} />
      <path className="uc-h" d="M 56 88 H 344" />
      <text className="uc-t uc-t-ink" x="70" y="80">&lt;div data-scroll-draw&gt;</text>
      <path className="uc-h uc-h2" d={`M 86 184 H 314 ${ticks(86, 314, 184, 12, 4)}`} />
      <path className="uc-a uc-route" d={smooth([[86, 168], [132, 116], [190, 150], [248, 104], [314, 136]])} />
      <path className="uc-dot uc-dot-a" d={dot(314, 136)} />
      <path className="uc-h" d="M 200 212 V 234" />
      <text className="uc-t" x="200" y="250" textAnchor="middle">options · ease-out · fade · once</text>
      <text className="uc-t uc-t-ink" x="200" y="270" textAnchor="middle">&lt;script&gt; initScrollDraw() &lt;/script&gt;</text>
    </InkSheet>
  );
}

/* ── Timeline: tracks own slices of the scroll range ───────────────────── */

const TL = [
  { cls: 'tl-axis', label: 'axes', from: 0, to: 0.28 },
  { cls: 'tl-b1', label: 'Q1', from: 0.1, to: 0.42 },
  { cls: 'tl-b2', label: 'Q2', from: 0.26, to: 0.56 },
  { cls: 'tl-b3', label: 'Q3', from: 0.42, to: 0.72 },
  { cls: 'tl-b4', label: 'Q4', from: 0.58, to: 0.88 },
  { cls: 'tl-trend', label: 'trend', from: 0.75, to: 1 },
] as const;
const BARS = [
  { cls: 'tl-b1', v: 92, q: 'Q1' },
  { cls: 'tl-b2', v: 122, q: 'Q2' },
  { cls: 'tl-b3', v: 77, q: 'Q3' },
  { cls: 'tl-b4', v: 135, q: 'Q4' },
];
const bx = (i: number) => 60 + i * 40;
const BY = 210, BWD = 22;
const RX0 = 292, RX1 = 384;
const ry = (i: number) => 74 + i * 24;

export function TimelineInk() {
  const ref = useRef<HTMLDivElement>(null);
  const readout = useRef<SVGTextElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inst = scrollDrawTimeline(el, {
      trigger: TRIGGER,
      tracks: TL.map((t) => ({ selector: `.${t.cls}`, from: t.from, to: t.to, easing: t.cls === 'tl-trend' ? 'spring' : 'ease-out' })),
    });
    let raf = 0;
    const tick = () => {
      const p = inst.getProgress();
      el.style.setProperty('--tl-p', p.toFixed(3));
      if (readout.current) readout.current.textContent = `progress ${p.toFixed(2)}`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); inst.destroy(); };
  }, []);
  const tops = BARS.map((b, i): P => [bx(i) + BWD / 2, BY - b.v]);
  return (
    <div ref={ref} className="ink-sheet ink-tl" style={{ '--tl-p': 0 } as CSSProperties}>
      <svg className="uc-svg ink-svg" viewBox="0 0 400 300" role="img" aria-label="A bar chart whose axes, four bars and trend line each draw in their own slice of the scroll, beside a ruler of those slices">
        <path className="uc-h uc-h2" d={`M 40 ${BY - 45} H 230 M 40 ${BY - 90} H 230 M 40 ${BY - 135} H 230`} />
        <path className="tl-axis uc-s" d={`M 40 ${BY} H 230 M 40 ${BY} V 56`} />
        {BARS.map((b, i) => (
          <path key={b.cls} className={`${b.cls} ${i === 3 ? 'uc-a' : 'uc-p'}`} d={`M ${bx(i)} ${BY} V ${BY - b.v} H ${bx(i) + BWD} V ${BY}`} />
        ))}
        <path className="tl-trend uc-a" d={smooth(tops)} />
        {BARS.map((b, i) => (
          <g key={b.q}>
            <text className="uc-t" x={n(bx(i) + BWD / 2)} y={BY + 16} textAnchor="middle">{b.q}</text>
            <text className="uc-t" x={n(bx(i) + BWD / 2)} y={BY - b.v - 8} textAnchor="middle">${b.v}k</text>
          </g>
        ))}
        {/* The ruler: each track's window, and a playhead at the timeline's progress. */}
        <text className="uc-t" x={RX0} y="48">0</text>
        <text className="uc-t" x={RX1} y="48" textAnchor="end">1</text>
        <path className="uc-h uc-x" d={`M ${RX0} 56 H ${RX1} ${ticks(RX0, RX1, 56, 4, 4)}`} />
        {TL.map((t, i) => (
          <g key={t.cls}>
            <text className="uc-t" x="250" y={ry(i) + 3}>{t.label}</text>
            <path className="uc-h uc-h2 uc-x" d={`M ${RX0} ${ry(i)} H ${RX1}`} />
            <path className={`uc-x ink-win${t.cls === 'tl-trend' ? ' is-a' : ''}`} d={`M ${n(RX0 + t.from * (RX1 - RX0))} ${ry(i)} H ${n(RX0 + t.to * (RX1 - RX0))}`} />
          </g>
        ))}
        <path className="uc-x ink-head" d={`M ${RX0} 60 V ${ry(5) + 12}`} />
        <text ref={readout} className="uc-t uc-t-a" x={RX1} y={ry(5) + 30} textAnchor="end">progress 0.00</text>
      </svg>
    </div>
  );
}

/* ── Group: three containers, one trigger ──────────────────────────────── */

function Cell({ refEl, icon, k, v }: { refEl: React.RefObject<HTMLDivElement | null>; icon: ReactNode; k: string; v: string }) {
  return (
    <div className="ink-cell">
      <div ref={refEl} className="ink-cell-icon">
        <svg className="uc-svg" viewBox="0 0 64 64" aria-hidden="true">{icon}</svg>
      </div>
      <span className="ink-cell-k">{k}</span>
      <span className="ink-cell-v">{v}</span>
    </div>
  );
}

export function GroupInk() {
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const c = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = [a.current, b.current, c.current].filter(Boolean) as Element[];
    const g = scrollDrawGroup(els, { easing: 'ease-out', speed: 1.1, once: true, trigger: TRIGGER });
    return () => g.destroy();
  }, []);
  return (
    <div className="ink-ui">
      <div className="ink-cells">
        <Cell refEl={a} k="speed" v="1.1×" icon={<>
          <path className="uc-s" d="M 10 44 A 22 22 0 1 1 54 44" />
          <path className="uc-h" d={ticks(14, 50, 44, 6, -4)} />
          <path className="uc-a" d="M 32 44 L 45 26" />
          <path className="uc-dot uc-dot-a" d={dot(32, 44)} />
        </>} />
        <Cell refEl={b} k="gzipped" v={`${SELF.gzipKb} KB`} icon={<>
          <path className="uc-s" d={roundRect(14, 14, 36, 36, 3)} />
          <path className="uc-p" d={roundRect(23, 23, 18, 18, 2)} />
          <path className="uc-h" d="M 22 8 V 14 M 32 8 V 14 M 42 8 V 14 M 22 50 V 56 M 32 50 V 56 M 42 50 V 56 M 8 22 H 14 M 8 32 H 14 M 8 42 H 14 M 50 22 H 56 M 50 32 H 56 M 50 42 H 56" />
        </>} />
        <Cell refEl={c} k="frameworks" v="react · vue · svelte" icon={<>
          <path className="uc-s" d="M 32 16 L 16 46 M 32 16 L 48 46 M 16 46 H 48" />
          <path className="uc-p" d={circle(32, 14, 5)} />
          <path className="uc-p" d={circle(15, 48, 5)} />
          <path className="uc-a" d={circle(49, 48, 5)} />
        </>} />
      </div>
      <p className="ink-bracket"><span>scrollDrawGroup — one trigger, three containers, drawn together</span></p>
    </div>
  );
}

/* ── Sequence: each starts when the last one finishes ──────────────────── */

const SEQ = [
  { k: 'code', icon: <><path className="uc-p" d="M 22 20 L 10 32 L 22 44" /><path className="uc-p" d="M 42 20 L 54 32 L 42 44" /><path className="uc-a" d="M 36 14 L 28 50" /></> },
  { k: 'build', icon: <><path className="uc-s" d="M 32 10 L 52 21 V 43 L 32 54 L 12 43 V 21 Z" /><path className="uc-p" d="M 12 21 L 32 32 L 52 21 M 32 32 V 54" /><path className="uc-a" d="M 22 15.5 L 42 26.5" /></> },
  { k: 'ship', icon: <><path className="uc-s" d="M 12 52 H 52" /><path className="uc-p" d="M 20 44 L 32 12 L 44 44 Z" /><path className="uc-a" d="M 26 44 V 52 M 38 44 V 52" /><path className="uc-p" d={circle(32, 30, 4)} /></> },
];

export function SequenceInk() {
  const refs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const els = refs.map((r) => r.current).filter(Boolean) as Element[];
    const s = scrollDrawSequence(els, {
      easing: 'ease-out',
      speed: 1.4,
      trigger: TRIGGER,
      onComplete: () => setStep((v) => Math.min(v + 1, 3)),
    });
    return () => s.destroy();
    // refs are stable for the component's life
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="ink-ui">
      <div className="ink-seq">
        {SEQ.map((s, i) => (
          <div key={s.k} className={`ink-seq-st${step > i ? ' is-done' : ''}`}>
            <div ref={refs[i]} className="ink-cell-icon">
              <svg className="uc-svg" viewBox="0 0 64 64" aria-hidden="true">{s.icon}</svg>
            </div>
            <span className="ink-cell-k">{String(i + 1).padStart(2, '0')} · {s.k}</span>
          </div>
        ))}
      </div>
      <p className="ink-bracket"><span>scrollDrawSequence · step {Math.min(step + 1, 3)} / 3{step >= 3 ? ' · done' : ''}</span></p>
    </div>
  );
}

/* ── Presets: five one-liners, each with its real settings ─────────────── */

const PRESET_NAMES = ['sketch', 'reveal', 'typewriter', 'cinematic', 'spring'] as const;
const WAVE = [0, 1, 2, 3].map((i) => smooth([[8 + i * 46, 22], [8 + i * 46 + 11.5, 8], [8 + i * 46 + 23, 22], [8 + i * 46 + 34.5, 36], [8 + i * 46 + 44, 22]]));

function describe(name: (typeof PRESET_NAMES)[number]): string {
  const p = PRESETS[name] as Record<string, unknown>;
  const parts = [p.easing, p.speed !== undefined ? `${p.speed}×` : null, p.stagger !== undefined ? `stagger ${p.stagger}` : null, p.fade ? 'fade' : null, p.once ? 'once' : null];
  return parts.filter(Boolean).join(' · ');
}

export function PresetsInk() {
  return (
    <div className="ink-ui ink-presets">
      {PRESET_NAMES.map((name) => (
        <div key={name} className="ink-preset">
          <code className="ink-preset-k">{name}</code>
          <ScrollDraw className="ink-preset-w" preset={name} trigger={TRIGGER}>
            <svg className="uc-svg" viewBox="0 0 196 44" aria-hidden="true">
              {WAVE.map((d, i) => <path key={i} className={name === 'spring' ? 'uc-a' : 'uc-p'} d={d} />)}
            </svg>
          </ScrollDraw>
          <span className="ink-preset-v">{describe(name)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Vue, Svelte, Solid: the same pattern, drawn as each framework's tree ── */

type Node = { x: number; y: number; w: number; label: string; sub?: string; accent?: boolean };

function Tree({ tag, nodes, edges, notes, label }: {
  tag: string;
  nodes: Node[];
  edges: { from: number; to: number; note?: string; back?: boolean }[];
  notes?: ReactNode;
  label: string;
}) {
  const H = 40;
  const box = (i: number) => nodes[i];
  // Each stroke starts at index × stagger; keep the last start by mid-window so all finish in it.
  const strokes = nodes.length + edges.reduce((s, e) => s + (e.back ? 1 : 2), 0);
  return (
    <InkSheet label={label} stagger={Math.min(0.06, 0.5 / strokes)}>
      <text className="uc-t uc-t-lg" x="24" y="34">{tag}</text>
      {nodes.map((nd, i) => (
        <path key={`n${i}`} className={nd.accent ? 'uc-a' : 'uc-s'} d={roundRect(nd.x - nd.w / 2, nd.y - H / 2, nd.w, H, 6)} />
      ))}
      {edges.map((e, i) => {
        const a = box(e.from), b = box(e.to);
        if (e.back) {
          const p0: P = [a.x + a.w / 2, a.y];
          const p3: P = [b.x + b.w / 2 + 4, b.y];
          const xr = Math.max(a.x + a.w / 2, b.x + b.w / 2) + 26;
          return <path key={`e${i}`} className="uc-h" d={elbow([p0, [xr, p0[1]], [xr, p3[1]], p3], 10)} />;
        }
        const p0: P = [a.x, a.y + H / 2];
        const p3: P = [b.x, b.y - H / 2 - 3];
        const mid = (p0[1] + p3[1]) / 2;
        return (
          <g key={`e${i}`}>
            <path className="uc-p" d={elbow([p0, [p0[0], mid], [p3[0], mid], p3], 10)} />
            <path className="uc-p" d={arrowHead(p3, 'd', 3.4)} />
          </g>
        );
      })}
      {nodes.map((nd, i) => (
        <g key={`t${i}`}>
          <text className={`uc-t uc-t-box uc-t-ink${nd.accent ? ' uc-t-a' : ''}`} x={n(nd.x)} y={n(nd.y - (nd.sub ? 2 : -3.5))} textAnchor="middle">{nd.label}</text>
          {nd.sub && <text className="uc-t" x={n(nd.x)} y={n(nd.y + 11)} textAnchor="middle">{nd.sub}</text>}
        </g>
      ))}
      {notes}
    </InkSheet>
  );
}

export const VueInk = () => (
  <Tree
    label="A Vue component tree: App passes a title to Header and a list to Content, which emits updates back"
    tag="vue 3 · <ScrollDraw>"
    nodes={[
      { x: 200, y: 82, w: 120, label: 'App.vue', accent: true },
      { x: 110, y: 196, w: 120, label: 'Header.vue' },
      { x: 290, y: 196, w: 120, label: 'Content.vue' },
    ]}
    edges={[{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 2, to: 0, back: true }]}
    notes={<>
      <text className="uc-t" x="118" y="162">:title</text>
      <text className="uc-t" x="282" y="162" textAnchor="end">v-for</text>
      <text className="uc-t" x="354" y="146" textAnchor="middle">emit</text>
      <text className="uc-t" x="200" y="262" textAnchor="middle">useScrollDraw() · or the &lt;ScrollDraw&gt; component</text>
    </>}
  />
);

export const SvelteInk = () => (
  <Tree
    label="A Svelte store graph: one writable source feeding two derived stores and an effect"
    tag="svelte · use:scrollDraw"
    nodes={[
      { x: 200, y: 82, w: 118, label: '$source', sub: 'writable', accent: true },
      { x: 84, y: 196, w: 100, label: '$count', sub: 'derived' },
      { x: 200, y: 196, w: 100, label: '$label', sub: 'derived' },
      { x: 316, y: 196, w: 100, label: '$effect', sub: 'autorun' },
    ]}
    edges={[{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 }]}
    notes={<text className="uc-t" x="200" y="262" textAnchor="middle">use:scrollDraw action · or createScrollDraw()</text>}
  />
);

export const SolidInk = () => (
  <Tree
    label="A Solid signal graph: a signal feeding two memos that drive one effect"
    tag="solid · useScrollDraw"
    nodes={[
      { x: 200, y: 70, w: 130, label: 'createSignal', sub: 'count = 0', accent: true },
      { x: 108, y: 158, w: 116, label: 'createMemo', sub: 'doubled' },
      { x: 292, y: 158, w: 116, label: 'createMemo', sub: 'isEven' },
      { x: 200, y: 244, w: 130, label: 'createEffect', sub: 'DOM update' },
    ]}
    edges={[{ from: 0, to: 1 }, { from: 0, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 3 }]}
  />
);
