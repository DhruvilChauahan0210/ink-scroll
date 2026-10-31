'use client';

import './migrate.css';
import Link from 'next/link';
import { useCallback, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { ScrollDraw } from 'svg-scroll-draw/react';
import { CopyCommand } from './CopyCommand';
import { COMPETITORS, SELF_ENTRIES } from '@/data/competitors';

/**
 * Chapter 08 — switching, as a lens change. A rangefinder body seen from the
 * top: the body is your markup and stays; the mount is the API and stays; the
 * lens is the engine. The old lens rests beside it, the drop-in slides onto
 * the mount and locks when the two red index dots line up. Lens lengths are
 * drawn to scale by kilobytes. Not pinned: it plays across about one screen.
 */

type Key = 'aos' | 'scrollreveal' | 'vivus';
type Lib = { key: Key; name: string; ident: string; methods: string[]; guide: string; guideLabel: string };

const LIBS: Lib[] = [
  { key: 'aos', name: 'AOS', ident: 'AOS', methods: ['init', 'refresh', 'refreshHard'], guide: '/guides/aos-nextjs', guideLabel: 'AOS in Next.js' },
  { key: 'scrollreveal', name: 'ScrollReveal', ident: 'ScrollReveal', methods: ['reveal', 'clean', 'destroy', 'sync'], guide: '/guides/scrollreveal-react', guideLabel: 'ScrollReveal in React' },
  { key: 'vivus', name: 'vivus', ident: 'Vivus', methods: ['play', 'stop', 'reset', 'destroy'], guide: '/guides/vivus-react', guideLabel: 'vivus in React' },
];

/* ── Geometry (drawn on a 1000 × 700 sheet, framed by VIEWBOX) ──────────── */

const VIEWBOX = '56 56 888 580';

const f = (n: number) => n.toFixed(1);
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${f(x + r)} ${f(y)} H${f(x + w - r)} A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)} V${f(y + h - r)} A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)} H${f(x + r)} A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)} V${f(y + r)} A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)} Z`;
const ring = (cx: number, cy: number, r: number) =>
  `M${f(cx - r)} ${f(cy)} A${r} ${r} 0 1 0 ${f(cx + r)} ${f(cy)} A${r} ${r} 0 1 0 ${f(cx - r)} ${f(cy)} Z`;
const knurl = (cx: number, cy: number, r1: number, r2: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return `M${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)} L${f(cx + Math.cos(a) * r2)} ${f(cy + Math.sin(a) * r2)}`;
  }).join(' ');

type S = { d: string; w: 'p' | 's' | 'h'; t: 'ink' | 'mute' };

const BODY: S[] = [
  { d: rr(170, 150, 660, 150, 56), w: 'p', t: 'ink' },
  { d: rr(186, 164, 628, 122, 44), w: 'h', t: 'ink' },
  // Rewind knob.
  { d: ring(296, 222, 38), w: 's', t: 'ink' },
  { d: knurl(296, 222, 38, 33, 30), w: 'h', t: 'ink' },
  { d: ring(296, 222, 24), w: 'h', t: 'ink' },
  { d: ring(296, 222, 7), w: 's', t: 'ink' },
  // Accessory shoe.
  { d: rr(452, 176, 96, 30, 3), w: 's', t: 'ink' },
  { d: 'M458 184 H542 M458 198 H542', w: 'h', t: 'ink' },
  // Shutter-speed dial and release.
  { d: ring(642, 222, 40), w: 's', t: 'ink' },
  { d: knurl(642, 222, 40, 35, 36), w: 'h', t: 'ink' },
  { d: ring(642, 222, 28), w: 'h', t: 'ink' },
  { d: 'M642 170 V179', w: 'h', t: 'ink' },
  { d: ring(728, 214, 14), w: 's', t: 'ink' },
  { d: ring(728, 214, 7), w: 'h', t: 'ink' },
  // Strap lugs and the front windows.
  { d: 'M170 210 C 154 210, 154 238, 170 238', w: 's', t: 'ink' },
  { d: 'M830 210 C 846 210, 846 238, 830 238', w: 's', t: 'ink' },
  { d: rr(214, 286, 84, 8, 2), w: 'h', t: 'ink' },
  { d: rr(700, 286, 64, 8, 2), w: 'h', t: 'ink' },
];

const MOUNT: S[] = [
  { d: rr(434, 300, 132, 18, 3), w: 'p', t: 'ink' },
  { d: 'M446 300 V318 M554 300 V318', w: 'h', t: 'ink' },
];

const LENS_W = 120;
const lensLen = (kb: number) => 64 + kb * 26;

/** A lens in plan view, mount end at (x0, y0), in drawing order. */
function lens(x0: number, y0: number, kb: number, t: S['t']): S[] {
  const L = lensLen(kb);
  const ha = Math.round(0.26 * L);
  const ya = y0 + 12;
  const yf = ya + ha + 4;
  const hf = Math.round(0.3 * L);
  const yb = yf + hf + 4;
  const end = y0 + L;
  const ym = yf + hf / 2;
  const knurls = Array.from({ length: 13 }, (_, i) => `M${f(x0 + 12 + i * 8)} ${f(ya + 5)} V${f(ya + ha - 5)}`).join(' ');
  const scale = Array.from({ length: 9 }, (_, i) => `M${f(x0 + 22 + i * 10)} ${f(ym - (i % 2 ? 3 : 6))} V${f(ym + (i % 2 ? 3 : 6))}`).join(' ');
  const main: S['w'] = t === 'ink' ? 'p' : 's';
  return [
    { d: rr(x0, y0, LENS_W, 12, 3), w: 's', t },
    { d: rr(x0 + 4, ya, LENS_W - 8, ha, 4), w: main, t },
    { d: knurls, w: 'h', t },
    { d: rr(x0 + 2, yf, LENS_W - 4, hf, 5), w: main, t },
    { d: `M${f(x0 + 2)} ${f(ym - 11)} C${f(x0 - 16)} ${f(ym - 11)}, ${f(x0 - 16)} ${f(ym + 11)}, ${f(x0 + 2)} ${f(ym + 11)}`, w: 's', t },
    { d: scale, w: 'h', t },
    { d: rr(x0 + 10, yb, LENS_W - 20, end - yb, 4), w: 's', t },
    { d: `M${f(x0 + 14)} ${f(end - 10)} H${f(x0 + 106)} M${f(x0 + 14)} ${f(end - 6)} H${f(x0 + 106)}`, w: 'h', t },
    { d: `M${f(x0 + 18)} ${f(end)} C${f(x0 + 40)} ${f(end + 16)}, ${f(x0 + 80)} ${f(end + 16)}, ${f(x0 + 102)} ${f(end)}`, w: 's', t },
  ];
}

const NEW_X = 440;
const NEW_Y = 318;
const OLD_X = 96;
const OLD_Y = 360;
const SLIDE = 110;            // how far below the mount the new lens starts
const STAGGER = 0.012;
const SPEED = 4;
const LOCK_FROM = 0.56;
const LOCK_AT = 0.86;

type Note = { dot: [number, number]; path: string; tx: number; ty: number; anchor: 'start' | 'end'; title: string; value: string; at: number; accent?: boolean };

function build(lib: Lib) {
  const oldKb = COMPETITORS[lib.key].gzipKb;
  const newKb = SELF_ENTRIES[lib.key];
  const oldL = lensLen(oldKb);
  const newL = lensLen(newKb);
  const old = lens(OLD_X, OLD_Y, oldKb, 'mute');
  const fresh = lens(NEW_X, NEW_Y, newKb, 'ink');
  const remove: S = { d: 'M430 334 C 362 338, 284 346, 222 368 M222 368 L234 366 M222 368 L229 377', w: 'h', t: 'mute' };
  const newDotY = NEW_Y + newL * 0.62;
  const oldDotY = OLD_Y + oldL * 0.34;
  const notes: Note[] = [
    { dot: [250, 152], path: 'M250 152 V112 H96', tx: 96, ty: 112, anchor: 'start', title: 'BODY', value: 'your markup · unchanged', at: 0.3 },
    { dot: [566, 309], path: 'M566 309 L612 352 H904', tx: 904, ty: 352, anchor: 'end', title: 'MOUNT · API', value: lib.methods.join(' · '), at: 0.42 },
    { dot: [OLD_X + LENS_W, oldDotY], path: `M${f(OLD_X + LENS_W)} ${f(oldDotY)} L246 ${f(oldDotY + 34)} H408`, tx: 246, ty: oldDotY + 34, anchor: 'start', title: `${lib.name.toUpperCase()} ${COMPETITORS[lib.key].version}`, value: `${oldKb.toFixed(1)} KB · removed`, at: 0.5 },
    { dot: [NEW_X + LENS_W, newDotY], path: `M${f(NEW_X + LENS_W)} ${f(newDotY)} L612 ${f(newDotY + 42)} H904`, tx: 904, ty: newDotY + 42, anchor: 'end', title: `SVG-SCROLL-DRAW/${lib.key.toUpperCase()}`, value: `${newKb.toFixed(1)} KB · −${(oldKb - newKb).toFixed(1)} KB`, at: LOCK_AT, accent: true },
  ];
  // Fixed draw order: body, mount, the old lens and the arrow taking it off,
  // the new lens (which then slides home), and the leaders last.
  const fixed: S[] = [...BODY, ...MOUNT, ...old, remove];
  const leaders: S[] = notes.map((n) => ({ d: n.path, w: 'h', t: 'mute' }));
  return { oldKb, newKb, fixed, fresh, leaders, notes, total: fixed.length + fresh.length + leaders.length };
}

/* ── Reduced motion, read as an external store (hydration-safe) ─────────── */

const RM = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getReduced = () => window.matchMedia(RM).matches;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function Strokes({ list, pencil }: { list: S[]; pencil?: boolean }) {
  return (
    <>
      {list.map((s, i) => (
        <path key={i} d={s.d} className={pencil ? 'mg-pencil' : `mg-ink mg-w-${s.w} mg-t-${s.t}`} stroke="currentColor" />
      ))}
    </>
  );
}

function Drawing({ lib }: { lib: Lib }) {
  const g = build(lib);
  const artRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<SVGGElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const pad = (n: number) => String(n).padStart(String(g.total).length, '0');

  const onProgress = useCallback((p: number) => {
    const art = artRef.current;
    if (!art) return;
    art.style.setProperty('--mg-p', p.toFixed(3));
    const t = Math.min(1, Math.max(0, (p - LOCK_FROM) / (LOCK_AT - LOCK_FROM)));
    lensRef.current?.setAttribute('transform', `translate(0 ${f(SLIDE * (1 - easeInOut(t)))})`);
    art.toggleAttribute('data-locked', p >= LOCK_AT);
    const inked = p < 1 / SPEED ? 0 : Math.min(g.total, Math.floor((p - 1 / SPEED) / STAGGER + 1e-6) + 1);
    if (countRef.current) countRef.current.textContent = pad(inked);
    // pad depends only on g.total, which is fixed for this mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g.total]);

  return (
    <div className="mg-art-wrap">
      <p className="mg-strokes" aria-hidden="true"><span ref={countRef}>{reduced ? pad(g.total) : pad(0)}</span> / {g.total} strokes</p>
      <div
        ref={artRef}
        className="mg-art"
        data-locked={reduced ? '' : undefined}
        style={reduced ? ({ '--mg-p': '1' } as CSSProperties) : undefined}
      >
        {/* The pencil underdrawing: the finished assembly, lens already home. */}
        <svg className="mg-svg mg-svg-pencil" viewBox={VIEWBOX} aria-hidden="true" focusable="false">
          <Strokes list={[...g.fixed, ...g.fresh]} pencil />
        </svg>
        <ScrollDraw
          className="mg-ink-layer"
          selector=".mg-ink"
          trigger={{ start: 'top 85%', end: 'top 15%' }}
          stagger={STAGGER}
          speed={SPEED}
          easing="ease-in-out"
          onProgress={onProgress}
        >
          <svg className="mg-svg" viewBox={VIEWBOX} role="img"
            aria-label={`A rangefinder camera seen from above: the body and mount stay, the ${lib.name} lens (${g.oldKb.toFixed(1)} KB) is set aside and the svg-scroll-draw lens (${g.newKb.toFixed(1)} KB) locks onto the same mount`}>
            <Strokes list={g.fixed} />
            <circle cx="420" cy="306" r="4" className="mg-dot" />
            <g ref={lensRef} transform={reduced ? undefined : `translate(0 ${SLIDE})`}>
              <Strokes list={g.fresh} />
              <circle cx="420" cy="325" r="4" className="mg-dot" />
            </g>
            <Strokes list={g.leaders} />
            <g className="mg-notes" aria-hidden="true">
              {g.notes.map((n, i) => (
                <g key={i} className="mg-note" style={{ '--mg-at': n.at.toFixed(2) } as CSSProperties}>
                  <circle cx={f(n.dot[0])} cy={f(n.dot[1])} r="3" className={n.accent ? 'mg-dot' : 'mg-ndot'} />
                  <text x={f(n.tx)} y={f(n.ty - 26)} textAnchor={n.anchor} className="mg-label-t">{n.title}</text>
                  <text x={f(n.tx)} y={f(n.ty - 8)} textAnchor={n.anchor} className={n.accent ? 'mg-label mg-label-accent' : 'mg-label'}>{n.value}</text>
                </g>
              ))}
            </g>
          </svg>
        </ScrollDraw>
      </div>
    </div>
  );
}

export function Migrate() {
  const [active, setActive] = useState(0);
  const lib = LIBS[active];
  return (
    <div className="mg-stage">
      <div className="mg-copy">
        <p className="mg-kicker"><span>08 / switching</span><span>same mount, lighter glass</span></p>
        <h2 id="mg-title" className="mg-title">Already on AOS? Change one import.</h2>
        <p className="mg-body">
          Keep the body and the mount — your markup and the API. Swap the lens: each drop-in is tested side by
          side against the original in Chromium, Firefox and WebKit.
        </p>
        <ul className="mg-rows">
          {LIBS.map((l, i) => {
            const oldKb = COMPETITORS[l.key].gzipKb;
            const newKb = SELF_ENTRIES[l.key];
            return (
              <li key={l.key}>
                <button type="button" className={`mg-row${i === active ? ' is-on' : ''}`} aria-pressed={i === active} onClick={() => setActive(i)}>
                  <span className="mg-row-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="mg-row-name">{l.name} <small>{COMPETITORS[l.key].version}</small></span>
                  <span className="mg-row-kb">{oldKb.toFixed(1)} → {newKb.toFixed(1)} KB</span>
                  <code className="mg-row-code">
                    <span className="mg-k">import</span> {l.ident} <span className="mg-k">from</span>{' '}
                    <s>&apos;{l.key}&apos;</s> <b>&apos;svg-scroll-draw/{l.key}&apos;</b>
                  </code>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mg-foot">
          <Link href={lib.guide} className="mg-link">{lib.guideLabel} <span aria-hidden="true">→</span></Link>
          <CopyCommand command="npx svg-scroll-draw migrate" />
        </div>
      </div>
      <Drawing key={lib.key} lib={lib} />
    </div>
  );
}
