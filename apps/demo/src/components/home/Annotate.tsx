'use client';

import './annotate.css';
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { ScrollDraw, useScrollDrawProgress } from 'svg-scroll-draw/react';

/* ─────────────────────────────────────────────────────────────────────────────
   04 — Annotations. A paragraph marked up in editor's red pen as it scrolls by:
   an underline, a loop, a double rule, a margin arrow, a box. Every mark is
   measured off its phrase in px and drawn in a viewBox of the same px, so a
   stroke is never stretched, and every mark is cut into pieces of one length
   so that, with stagger = 1/N and speed = N, the pen moves at one speed from
   the first mark to the last.
   ──────────────────────────────────────────────────────────────────────────── */

const TRIGGER = { start: 'top 75%', end: 'bottom 45%' };

type Pt = [number, number];
type Seg = [Pt, Pt, Pt, Pt];
type Key = 'kb' | 'deps' | 'native' | 'mit';

interface Box { l: number; r: number; t: number; b: number; base: number }

interface Measure {
  w: number;
  h: number;
  fs: number;
  /** Free width to the right of the paragraph, for the margin note. */
  room: number;
  box: Record<Key, Box>;
  /** Right edge of the text on the line that holds "native scroll timeline". */
  lineEnd: number;
  /** Right-most text edge on the lines from that one down (the narrow arrow climbs past it). */
  rightBelow: number;
  sig: string;
}

interface Ink { d: string; rest: boolean; thin: boolean }

interface Drawing {
  ink: Ink[];
  sw: number;
  /** The margin arrow is a lighter hand than the marks themselves. */
  thin: number;
  note: { x: number; y: number; wide: boolean };
  /** Overall-progress window in which the margin note fades in. */
  noteFrom: number;
  noteTo: number;
}

/* ── Curve kit ────────────────────────────────────────────────────────────── */

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function split(s: Seg, t: number): [Seg, Seg] {
  const a = lerp(s[0], s[1], t), b = lerp(s[1], s[2], t), c = lerp(s[2], s[3], t);
  const d = lerp(a, b, t), e = lerp(b, c, t), f = lerp(d, e, t);
  return [[s[0], a, d, f], [f, e, c, s[3]]];
}

function segLen(s: Seg): number {
  let len = 0;
  let px = s[0][0], py = s[0][1];
  for (let i = 1; i <= 24; i++) {
    const t = i / 24, u = 1 - t;
    const x = u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0];
    const y = u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1];
    len += Math.hypot(x - px, y - py);
    px = x; py = y;
  }
  return len;
}

/** An explicit cubic chain: a start point, then [c1, c2, end] per segment. */
function chain(start: Pt, ...rest: [Pt, Pt, Pt][]): Seg[] {
  const out: Seg[] = [];
  let p = start;
  for (const [c1, c2, e] of rest) { out.push([p, c1, c2, e]); p = e; }
  return out;
}

function rotate(stroke: Seg[], deg: number, c: Pt): Seg[] {
  const a = (deg * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
  const r = (p: Pt): Pt => {
    const x = p[0] - c[0], y = p[1] - c[1];
    return [c[0] + x * cos - y * sin, c[1] + x * sin + y * cos];
  };
  return stroke.map((s) => s.map(r) as Seg);
}

/** Cut a stroke into pieces of about `unit` px, so every piece draws at the same pen speed. */
function pieces(stroke: Seg[], unit: number): Seg[][] {
  const fine: { s: Seg; len: number }[] = [];
  for (const s of stroke) {
    const n = Math.max(1, Math.ceil(segLen(s) / (unit / 5)));
    let rest = s;
    for (let i = n; i > 1; i--) {
      const [a, b] = split(rest, 1 / i);
      fine.push({ s: a, len: segLen(a) });
      rest = b;
    }
    fine.push({ s: rest, len: segLen(rest) });
  }
  const total = fine.reduce((sum, f) => sum + f.len, 0);
  const count = Math.max(1, Math.round(total / unit));
  const groups: Seg[][] = [[]];
  let acc = 0;
  for (const f of fine) {
    groups[groups.length - 1].push(f.s);
    acc += f.len;
    if (groups.length < count && acc >= (groups.length * total) / count - f.len / 2) groups.push([]);
  }
  return groups.filter((g) => g.length > 0);
}

const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

function toD(g: Seg[]): string {
  let d = `M${n1(g[0][0][0])} ${n1(g[0][0][1])}`;
  for (const s of g) d += `C${n1(s[1][0])} ${n1(s[1][1])} ${n1(s[2][0])} ${n1(s[2][1])} ${n1(s[3][0])} ${n1(s[3][1])}`;
  return d;
}

/* ── The marks ────────────────────────────────────────────────────────────
   Offsets are in em, read off Geist at weight 500: caps and ascenders reach
   0.71em above the baseline, descenders 0.16em below, and at line-height 1.28
   that leaves a clear band of about 0.41em between lines for the pen to work in.
   ──────────────────────────────────────────────────────────────────────────── */

/** "10 KB" — one confident stroke, rising a touch, that overshoots and flicks back. */
function underline(b: Box, e: number): Seg[] {
  const y = b.base + 0.14 * e;
  const p0: Pt = [b.l - 0.06 * e, y + 0.03 * e];
  // Overshoot stops short of a following descender ("gzipped" starts with a g).
  const p1: Pt = [b.r + 0.15 * e, y - 0.02 * e];
  const q: Pt = [p1[0] - 0.02 * e, p1[1] + 0.085 * e];
  const end: Pt = [q[0] - 0.52 * e, q[1] + 0.1 * e];
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  return chain(
    p0,
    [[p0[0] + dx * 0.32, p0[1] + dy * 0.32 + 0.022 * e], [p0[0] + dx * 0.7, p0[1] + dy * 0.7 + 0.016 * e], p1],
    [[p1[0] + 0.055 * e, p1[1] - 0.002 * e], [p1[0] + 0.05 * e, q[1] - 0.002 * e], q],
    [[q[0] - 0.2 * e, q[1] + 0.004 * e], [end[0] + 0.26 * e, end[1] - 0.03 * e], end],
  );
}

/**
 * "zero dependencies." — a long pen loop. It sets down on the top edge near the
 * right, runs left over the words, round the end, back along the underside,
 * up round the full stop and over its own start, finishing a hair outside it.
 */
function loop(b: Box, e: number): Seg[] {
  const L = b.l - 0.26 * e;
  const R = b.r + 0.285 * e; // takes in the full stop, stops short of the next word
  const cy = b.base - 0.28 * e;
  const T = cy - 0.55 * e, B = cy + 0.55 * e;
  const ex = Math.min(0.82 * e, (R - L) / 4); // how far in from each end the rounding starts
  const k = 0.5523;
  const w = R - L - 2 * ex;
  const S: Pt = [R - ex - 0.9 * e, T + 0.022 * e];
  const tl: Pt = [L + ex, T];
  const bl: Pt = [L + ex, B];
  const br: Pt = [R - ex, B - 0.015 * e];
  const tr: Pt = [R - ex * 1.04, T - 0.03 * e];
  const E: Pt = [S[0] - 1.2 * e, T - 0.058 * e];
  const stroke = chain(
    S,
    [[S[0] - (S[0] - tl[0]) * 0.34, T - 0.022 * e], [tl[0] + (S[0] - tl[0]) * 0.28, T - 0.012 * e], tl],
    [[tl[0] - ex * k, T], [L, cy - (cy - T) * k], [L, cy]],
    [[L, cy + (B - cy) * k], [bl[0] - ex * k, B], bl],
    [[bl[0] + w * 0.32, B + 0.03 * e], [bl[0] + w * 0.72, B + 0.022 * e], br],
    [[br[0] + ex * k, br[1]], [R, cy + (br[1] - cy) * k], [R, cy - 0.01 * e]],
    [[R, cy - (cy - tr[1]) * k], [tr[0] + ex * k * 1.04, tr[1]], tr],
    [[tr[0] - (tr[0] - E[0]) * 0.4, tr[1] - 0.006 * e], [E[0] + (tr[0] - E[0]) * 0.32, E[1] + 0.012 * e], E],
  );
  return rotate(stroke, -0.9, [(L + R) / 2, cy]);
}

/** "native scroll timeline" — two rules, the second shorter and set in from both ends. */
function doubleRule(b: Box, e: number): Seg[][] {
  const rule = (x0: number, y0: number, x1: number, y1: number, sag: number): Seg[] => {
    const dx = x1 - x0, dy = y1 - y0;
    return chain([x0, y0], [[x0 + dx * 0.3, y0 + dy * 0.3 + sag], [x0 + dx * 0.7, y0 + dy * 0.7 + sag], [x1, y1]]);
  };
  return [
    rule(b.l - 0.05 * e, b.base + 0.135 * e, b.r + 0.08 * e, b.base + 0.11 * e, 0.014 * e),
    rule(b.l + 0.12 * e, b.base + 0.265 * e, b.r - 0.3 * e, b.base + 0.245 * e, 0.016 * e),
  ];
}

/** "MIT" — a quick pen box with soft corners; the pen closes it and runs on along the top. */
function penBox(b: Box, e: number): Seg[] {
  // The span carries 0.13em of right padding, so the box clears the comma after it.
  const x0 = b.l - 0.05 * e, x1 = b.r - 0.045 * e;
  const y0 = b.base - 0.87 * e, y1 = b.base + 0.17 * e;
  const r = 0.07 * e, k = 0.5523;
  const W = x1 - x0, H = y1 - y0;
  const stroke = chain(
    [x0 + 0.07 * e, y0 + 0.014 * e],
    [[x0 + W * 0.36, y0 - 0.012 * e], [x0 + W * 0.7, y0 - 0.008 * e], [x1 - r, y0]],
    [[x1 - r + r * k, y0], [x1, y0 + r - r * k], [x1, y0 + r]],
    [[x1 + 0.016 * e, y0 + H * 0.38], [x1 + 0.012 * e, y0 + H * 0.72], [x1, y1 - r]],
    [[x1, y1 - r + r * k], [x1 - r + r * k, y1], [x1 - r, y1]],
    [[x1 - W * 0.34, y1 + 0.016 * e], [x0 + W * 0.3, y1 + 0.014 * e], [x0 + r, y1]],
    [[x0 + r - r * k, y1], [x0, y1 - r + r * k], [x0, y1 - r]],
    [[x0 - 0.014 * e, y1 - H * 0.36], [x0 - 0.008 * e, y0 + H * 0.3], [x0 + 0.004 * e, y0 + r]],
    [[x0 + 0.004 * e, y0 + r - r * k], [x0 + r - r * k, y0 - 0.006 * e], [x0 + r, y0 - 0.008 * e]],
    [[x0 + W * 0.2, y0 - 0.014 * e], [x0 + W * 0.32, y0 - 0.022 * e], [x0 + W * 0.44, y0 - 0.05 * e]],
  );
  return rotate(stroke, 0.8, [(x0 + x1) / 2, (y0 + y1) / 2]);
}

/**
 * The margin arrow. Its shaft leaves the note, drops into the clear band under
 * the marked line and runs back towards the double rule, so it never strikes
 * through a word; it lifts at the end to point at the phrase. The head is one
 * stroke, drawn after the shaft.
 */
function arrow(m: Measure, e: number): { shaft: Seg[]; head: Seg[]; note: { x: number; y: number; wide: boolean } } {
  const b = m.box.native;
  const wide = m.room >= 0.95 * e + 112; // room for the two-line note beside the text
  const gapY = b.base + 0.37 * e;
  const tip: Pt = [b.r + 0.3 * e, b.base + 0.25 * e];
  let shaft: Seg[];
  let note: { x: number; y: number; wide: boolean };
  if (wide) {
    const tail: Pt = [m.w + 0.68 * e, b.base - 0.2 * e];
    const turn: Pt = [Math.max(m.lineEnd + 0.2 * e, tip[0] + 0.9 * e), gapY];
    note = { x: m.w + 0.95 * e, y: b.base - 0.28 * e, wide };
    const run = turn[0] - tip[0];
    shaft = chain(
      tail,
      [[tail[0] - 0.06 * e, tail[1] + 0.42 * e], [turn[0] + Math.min(0.6 * e, (tail[0] - turn[0]) * 0.7), gapY], turn],
      [[turn[0] - run * 0.4, gapY + 0.006 * e], [tip[0] + Math.min(0.9 * e, run * 0.35), gapY + 0.01 * e], tip],
    );
  } else {
    // Mobile and tablet: the note sits under the paragraph and the shaft climbs
    // the right edge, just outside the text, before turning in under the line.
    const gx = Math.min(m.w + 11, Math.max(m.rightBelow, tip[0] + 0.6 * e) + 0.42 * e);
    const r = Math.max(0.2 * e, Math.min(0.5 * e, (gx - tip[0]) / 3));
    const ny = m.h + 0.78 * e;
    const tail: Pt = [m.w - 0.22 * e, ny];
    note = { x: m.w - 0.42 * e, y: ny, wide };
    const run = gx - r - tip[0];
    const elbow = gx - tail[0];
    shaft = chain(
      tail,
      [[tail[0] + elbow * 0.55, ny], [gx, ny - elbow * 0.45], [gx, ny - elbow]],
      [[gx + 0.01 * e, (ny + gapY) / 2], [gx, gapY + r * 1.6], [gx, gapY + r]],
      [[gx, gapY + r * 0.45], [gx - r * 0.45, gapY], [gx - r, gapY]],
      [[gx - r - run * 0.4, gapY + 0.006 * e], [tip[0] + Math.min(0.9 * e, run * 0.35), gapY + 0.01 * e], tip],
    );
  }
  // Head: two wings about the direction the shaft arrives in, drawn wing → tip → wing.
  const last = shaft[shaft.length - 1];
  const dx = tip[0] - last[2][0], dy = tip[1] - last[2][1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const hl = 0.3 * e, spread = 0.5;
  const wing = (sgn: number): Pt => [
    tip[0] - hl * (ux * Math.cos(spread) - sgn * uy * Math.sin(spread)),
    tip[1] - hl * (uy * Math.cos(spread) + sgn * ux * Math.sin(spread)),
  ];
  const w1 = wing(1), w2 = wing(-1);
  const head = chain(
    w1,
    [lerp(w1, tip, 0.33), lerp(w1, tip, 0.7), tip],
    [lerp(tip, w2, 0.3), lerp(tip, w2, 0.67), w2],
  );
  return { shaft, head, note };
}

function draw(m: Measure): Drawing {
  const e = m.fs;
  const unit = 2.3 * e;
  const ink: Ink[] = [];
  const add = (stroke: Seg[], thin = false) => {
    for (const g of pieces(stroke, unit)) ink.push({ d: toD(g), rest: false, thin });
  };
  const rest = (n = 1) => { for (let i = 0; i < n; i++) ink.push({ d: 'M0 0h1', rest: true, thin: false }); };

  add(underline(m.box.kb, e));
  rest();
  add(loop(m.box.deps, e));
  rest();
  for (const r of doubleRule(m.box.native, e)) add(r);
  rest();
  const a = arrow(m, e);
  add(a.shaft, true);
  ink.push({ d: toD(a.head), rest: false, thin: true });
  const noteAt = ink.length;
  rest(2);
  add(penBox(m.box.mit, e));
  rest();

  const N = ink.length;
  const sw = Math.min(2.2, Math.max(1.6, (2.2 * e) / 46));
  return {
    ink,
    sw,
    thin: Math.max(1.15, sw * 0.7),
    note: a.note,
    noteFrom: (noteAt - 0.4) / N,
    noteTo: (noteAt + 1.4) / N,
  };
}

/* ── Measuring ────────────────────────────────────────────────────────────── */

const KEYS: Key[] = ['kb', 'deps', 'native', 'mit'];
const r1 = (v: number) => Math.round(v * 2) / 2;

function measure(block: HTMLElement, para: HTMLElement): Measure | null {
  const br = block.getBoundingClientRect();
  if (br.width === 0) return null;
  const fs = parseFloat(getComputedStyle(para).fontSize);
  const box = {} as Record<Key, Box>;
  for (const k of KEYS) {
    const el = para.querySelector<HTMLElement>(`[data-an="${k}"]`);
    const probe = el?.querySelector<HTMLElement>('.an-bl');
    if (!el || !probe) return null;
    const r = el.getBoundingClientRect();
    box[k] = {
      l: r1(r.left - br.left), r: r1(r.right - br.left),
      t: r1(r.top - br.top), b: r1(r.bottom - br.top),
      base: r1(probe.getBoundingClientRect().top - br.top),
    };
  }
  // Where the native-timeline line ends: the arrow aims past any words that follow it.
  const nb = box.native;
  let lineEnd = nb.r;
  let rightBelow = nb.r;
  const range = document.createRange();
  range.selectNodeContents(para);
  for (const r of Array.from(range.getClientRects())) {
    if (r.width === 0) continue;
    const mid = (r.top + r.bottom) / 2 - br.top;
    const right = r1(r.right - br.left);
    if (mid > nb.t && mid < nb.b) lineEnd = Math.max(lineEnd, right);
    if (mid > nb.t) rightBelow = Math.max(rightBelow, right);
  }
  const host = block.parentElement;
  let room = 0;
  if (host) {
    const hr = host.getBoundingClientRect();
    room = hr.right - parseFloat(getComputedStyle(host).paddingRight) - br.right;
  }
  const w = r1(br.width), h = r1(br.height);
  const sig = JSON.stringify([w, h, fs, r1(room), lineEnd, rightBelow, box]);
  return { w, h, fs, room: r1(room), box, lineEnd, rightBelow, sig };
}

/* ── Pieces of the page ───────────────────────────────────────────────────── */

function Mk({ k, children }: { k: Key; children: ReactNode }) {
  return (
    <span className={`an-mk an-mk--${k}`} data-an={k}>
      {children}
      <i className="an-bl" aria-hidden="true" />
    </span>
  );
}

function Note({ target, d }: { target: RefObject<HTMLDivElement | null>; d: Drawing }) {
  const p = useScrollDrawProgress(target, { trigger: TRIGGER });
  const t = Math.min(1, Math.max(0, (p - d.noteFrom) / (d.noteTo - d.noteFrom)));
  return (
    <p
      className={`an-note ${d.note.wide ? 'is-wide' : 'is-narrow'}`}
      style={{
        left: `${d.note.x.toFixed(1)}px`,
        top: `${d.note.y.toFixed(1)}px`,
        opacity: t.toFixed(3),
        transform: `translate3d(${d.note.wide ? '0' : '-100%'}, -50%, 0) translateY(${((1 - t) * 6).toFixed(2)}px)`,
      }}
    >
      the browser{d.note.wide ? <br /> : ' '}does the work
    </p>
  );
}

export function Annotate() {
  const blockRef = useRef<HTMLDivElement>(null);
  const paraRef = useRef<HTMLParagraphElement>(null);
  const [m, setM] = useState<Measure | null>(null);
  const labelId = useId();

  useEffect(() => {
    const block = blockRef.current, para = paraRef.current;
    if (!block || !para) return;
    let raf = 0;
    let alive = true;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!alive) return;
        const next = measure(block, para);
        if (next) setM((prev) => (prev && prev.sig === next.sig ? prev : next));
      });
    };
    const ro = new ResizeObserver(run);
    ro.observe(block);
    if (block.parentElement) ro.observe(block.parentElement);
    const fonts = document.fonts;
    fonts?.ready.then(run);
    fonts?.addEventListener('loadingdone', run);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      fonts?.removeEventListener('loadingdone', run);
    };
  }, []);

  const d = m ? draw(m) : null;

  return (
    <section className="an" aria-labelledby={labelId}>
      <p className="an-label" id={labelId}>
        <b>03</b> / annotations, drawn in order
      </p>
      <div className="an-block" ref={blockRef}>
        <p className="an-p" ref={paraRef}>
          svg-scroll-draw is <Mk k="kb">10&nbsp;KB</Mk> gzipped with <Mk k="deps">zero dependencies</Mk>. It draws
          on the browser’s <Mk k="native">native scroll timeline</Mk> where one exists and falls back to a frame
          loop where it doesn’t — and it is <Mk k="mit">MIT</Mk>, so it is yours.
        </p>
        {m && d && (
          <ScrollDraw
            key={m.sig}
            className="an-ink"
            trigger={TRIGGER}
            stagger={1 / d.ink.length}
            speed={d.ink.length}
          >
            <svg
              className="an-svg"
              width={m.w}
              height={m.h}
              viewBox={`0 0 ${m.w} ${m.h}`}
              style={{ strokeWidth: d.sw.toFixed(2) }}
              aria-hidden="true"
              focusable="false"
            >
              {d.ink.map((p, i) => (
                <path
                  key={i}
                  d={p.d}
                  className={p.rest ? 'an-rest' : undefined}
                  strokeWidth={p.thin ? d.thin.toFixed(2) : undefined}
                />
              ))}
            </svg>
          </ScrollDraw>
        )}
        {m && d && <Note target={blockRef} d={d} />}
      </div>
    </section>
  );
}
