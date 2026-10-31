'use client';

import './migrate.css';
import Link from 'next/link';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { CopyCommand } from './CopyCommand';
import { COMPETITORS, SELF_ENTRIES } from '@/data/competitors';

/**
 * Chapter 08 — switching. Each drop-in is drawn as the plug you have today
 * above the plug that replaces it: the same pins (the API is unchanged), a body
 * drawn to scale by kilobytes, and a ghost of the old body showing what goes.
 * Not pinned: each card inks itself across about half a screen of scroll.
 */

type Lib = {
  key: 'aos' | 'scrollreveal' | 'vivus';
  name: string;
  ident: string;
  methods: string[];
  guide: string;
  guideLabel: string;
};

const LIBS: Lib[] = [
  { key: 'aos', name: 'AOS', ident: 'AOS', methods: ['init', 'refresh', 'refreshHard'], guide: '/guides/aos-nextjs', guideLabel: 'AOS in Next.js' },
  { key: 'scrollreveal', name: 'ScrollReveal', ident: 'ScrollReveal', methods: ['reveal', 'clean', 'destroy', 'sync'], guide: '/guides/scrollreveal-react', guideLabel: 'ScrollReveal in React' },
  { key: 'vivus', name: 'vivus', ident: 'Vivus', methods: ['play', 'stop', 'reset', 'destroy'], guide: '/guides/vivus-react', guideLabel: 'vivus in React' },
];

/* ── Geometry (viewBox 0 0 400 260) ─────────────────────────────────────── */

const K = 36;          // user units per KB: 6.7 KB → 241 units
const BX = 74;         // where the body starts; the pins sit left of it
const PIN_L = 32;      // prong length
const BODY_H = 56;
const OLD_Y = 52;      // top of the old plug
const NEW_Y = 156;     // top of the new plug
const f = (n: number) => n.toFixed(1);

function pinYs(top: number, n: number): number[] {
  const gap = 11;
  const span = (n - 1) * gap;
  const c = top + BODY_H / 2;
  return Array.from({ length: n }, (_, i) => c - span / 2 + i * gap);
}

function roundRect(x: number, y: number, w: number, h: number, r: number): string {
  return `M${f(x + r)} ${f(y)} H${f(x + w - r)} A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)} V${f(y + h - r)} A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)} H${f(x + r)} A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)} V${f(y + r)} A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)} Z`;
}

type Stroke = { d: string; cls: string };

/** One plug: prongs, body, grip ribs, strain relief, cable — in drawing order. */
function plug(top: number, kb: number, pins: number, tone: 'mute' | 'ink', cableTone: 'mute' | 'accent'): Stroke[] {
  const L = kb * K;
  const end = BX + L;
  const w = tone === 'ink' ? 'p' : 's';
  const out: Stroke[] = [];
  for (const y of pinYs(top, pins)) {
    out.push({ d: roundRect(BX - PIN_L, y - 2.5, PIN_L + 4, 5, 2.5), cls: `mg-w-s mg-t-${tone}` });
  }
  out.push({ d: roundRect(BX, top, L, BODY_H, 10), cls: `mg-w-${w} mg-t-${tone}` });
  // A shoulder line where the pins meet the body, and grip ribs near the end.
  out.push({ d: `M${f(BX + 10)} ${f(top + 8)} V${f(top + BODY_H - 8)}`, cls: `mg-w-h mg-t-${tone}` });
  const ribs = Math.max(2, Math.min(5, Math.floor(L / 40)));
  for (let i = 0; i < ribs; i++) {
    const x = end - 14 - i * 7;
    out.push({ d: `M${f(x)} ${f(top + 12)} V${f(top + BODY_H - 12)}`, cls: `mg-w-h mg-t-${tone}` });
  }
  const mid = top + BODY_H / 2;
  out.push({
    d: `M${f(end)} ${f(mid - 13)} L${f(end + 20)} ${f(mid - 7)} V${f(mid + 7)} L${f(end)} ${f(mid + 13)}`,
    cls: `mg-w-s mg-t-${tone}`,
  });
  out.push({
    d: `M${f(end + 20)} ${f(mid)} C${f(end + 60)} ${f(mid)}, ${f(end + 62)} ${f(mid + 22)}, ${f(Math.max(end + 90, 396))} ${f(mid + 22)}`,
    cls: `mg-w-${w} mg-t-${cableTone}`,
  });
  return out;
}

/** A dimension line with end ticks over [x0, x1] at height y. */
function dim(x0: number, x1: number, y: number): Stroke[] {
  return [
    { d: `M${f(x0)} ${f(y)} H${f(x1)}`, cls: 'mg-w-h mg-t-mute mg-lead' },
    { d: `M${f(x0)} ${f(y - 5)} V${f(y + 5)} M${f(x1)} ${f(y - 5)} V${f(y + 5)}`, cls: 'mg-w-h mg-t-mute mg-lead' },
  ];
}

type Art = { strokes: Stroke[]; ghost: string; oldKb: number; newKb: number; texts: { x: number; y: number; s: string; cls: string; anchor?: 'start' | 'middle' | 'end' }[] };

function art(lib: Lib): Art {
  const oldKb = COMPETITORS[lib.key].gzipKb;
  const newKb = SELF_ENTRIES[lib.key];
  const n = lib.methods.length;
  const oldEnd = BX + oldKb * K;
  const newEnd = BX + newKb * K;
  const strokes: Stroke[] = [
    ...plug(OLD_Y, oldKb, n, 'mute', 'mute'),
    ...dim(BX, oldEnd, OLD_Y - 16),
    // The pin gauge: one bracket tying both sets of prongs together.
    { d: `M${f(BX - PIN_L - 12)} ${f(pinYs(OLD_Y, n)[0])} V${f(pinYs(NEW_Y, n)[n - 1])}`, cls: 'mg-w-h mg-t-mute mg-lead' },
    ...plug(NEW_Y, newKb, n, 'ink', 'accent'),
    ...dim(BX, newEnd, NEW_Y + BODY_H + 16),
  ];
  const saved = oldKb - newKb;
  return {
    strokes,
    ghost: roundRect(BX, NEW_Y, oldKb * K, BODY_H, 10),
    oldKb,
    newKb,
    texts: [
      { x: (BX + oldEnd) / 2, y: OLD_Y - 24, s: `${lib.key} ${COMPETITORS[lib.key].version} · ${oldKb.toFixed(1)} KB`, cls: 'mg-tx mg-tx-mute', anchor: 'middle' },
      { x: BX + 18, y: OLD_Y + BODY_H / 2 + 4, s: `'${lib.key}'`, cls: 'mg-tx mg-tx-mute' },
      { x: BX + 18, y: NEW_Y + BODY_H / 2 + 4, s: `/${lib.key}`, cls: 'mg-tx' },
      { x: (BX + newEnd) / 2, y: NEW_Y + BODY_H + 34, s: `svg-scroll-draw/${lib.key} · ${newKb.toFixed(1)} KB`, cls: 'mg-tx', anchor: 'middle' },
      // The saving sits over the ghost's far corner, clear of the strain relief
      // and cable however small the difference is.
      ...(saved > 0.05
        ? [{ x: oldEnd, y: NEW_Y - 9, s: `−${saved.toFixed(1)} KB`, cls: 'mg-tx mg-tx-save', anchor: 'end' as const }]
        : []),
      { x: BX - PIN_L - 18, y: (OLD_Y + NEW_Y + BODY_H) / 2 + 4, s: `${n} methods`, cls: 'mg-tx mg-tx-mute mg-tx-v', anchor: 'middle' },
    ],
  };
}

const ARTS = LIBS.map(art);
const TOTAL = ARTS.reduce((s, a) => s + a.strokes.length, 0);

function Card({ lib, a, i }: { lib: Lib; a: Art; i: number }) {
  return (
    <article className="mg-card">
      <ScrollDraw
        className="mg-art"
        selector=".mg-ink"
        trigger={{ start: 'top 88%', end: 'top 42%' }}
        stagger={0.024}
        speed={3}
        easing="ease-out"
      >
        <span className="mg-n" aria-hidden="true">{String(i + 1).padStart(2, '0')} / 03</span>
        {/* The pencil underdrawing, with the ghost of the old body. */}
        <svg className="mg-svg mg-svg-pencil" viewBox="0 0 400 260" aria-hidden="true" focusable="false">
          {a.strokes.map((s, k) => <path key={k} d={s.d} className="mg-pencil" />)}
        </svg>
        <svg className="mg-svg" viewBox="0 0 400 260" role="img" aria-label={`${lib.name} plug beside the svg-scroll-draw drop-in: the same ${lib.methods.length} methods, ${a.oldKb.toFixed(1)} KB down to ${a.newKb.toFixed(1)} KB`}>
          <path d={a.ghost} className="mg-ghost" />
          {a.strokes.map((s, k) => <path key={k} d={s.d} className={`mg-ink ${s.cls}`} />)}
          {a.texts.map((t, k) => (
            <text key={k} x={f(t.x)} y={f(t.y)} textAnchor={t.anchor ?? 'start'} className={t.cls}
              transform={t.cls.includes('mg-tx-v') ? `rotate(-90 ${f(t.x)} ${f(t.y)})` : undefined}>
              {t.s}
            </text>
          ))}
        </svg>
      </ScrollDraw>
      <div className="mg-meta">
        <h3 className="mg-name">{lib.name} <span>{COMPETITORS[lib.key].version}</span></h3>
        <code className="mg-code">
          <span className="mg-k">import</span> {lib.ident} <span className="mg-k">from</span>{' '}
          <s>&apos;{lib.key}&apos;</s> <b>&apos;svg-scroll-draw/{lib.key}&apos;</b>
        </code>
        <p className="mg-methods">{lib.methods.join(' · ')} <span>— unchanged</span></p>
        <Link href={lib.guide} className="mg-link">{lib.guideLabel} <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}

export function Migrate() {
  return (
    <div className="mg-stage">
      <header className="mg-head">
        <p className="mg-kicker"><span>08 / switching</span><span className="mg-count">3 drop-ins · {TOTAL} strokes</span></p>
        <h2 id="mg-title" className="mg-title">Already on AOS? Change one import.</h2>
        <p className="mg-body">
          Each drop-in keeps its API and your markup — the same plug, smaller insides — tested side by side
          against the real library in Chromium, Firefox and WebKit.
        </p>
      </header>
      <div className="mg-grid">
        {LIBS.map((lib, i) => <Card key={lib.key} lib={lib} a={ARTS[i]} i={i} />)}
      </div>
      <div className="mg-cmd">
        <CopyCommand command="npx svg-scroll-draw migrate" />
        <span className="mg-cmd-note">rewrites the imports for you</span>
      </div>
    </div>
  );
}
