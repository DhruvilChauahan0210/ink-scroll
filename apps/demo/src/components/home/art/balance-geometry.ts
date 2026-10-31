/**
 * Balance — a precision beam balance drawn the way an instrument maker would
 * draw it in elevation: a levelled plinth, a fluted column carrying a knife
 * edge, a graduated truss beam with a long pointer that reads a fine arc
 * scale, and two pans hung on chains.
 *
 * The weights are the data. Every weight is a cylinder whose volume is
 * proportional to the gzipped size it is engraved with, at one density, so
 * the stack that is GSAP + ScrollTrigger + DrawSVG and the single weight that
 * is svg-scroll-draw compare by volume exactly as they compare in bytes. The
 * beam's tilt is the difference times the instrument's sensitivity, and the
 * pointer reads that difference off the scale.
 *
 * Pure module, no DOM and no randomness: the server and the client compute
 * byte-identical `d` strings. Every number is written with one decimal.
 *
 * Draw order matters. The library staggers elements in document order, and
 * Chromium restarts a dash pattern at every subpath, so anything that should
 * sweep — a tick comb, a weight's outline, a pan rim — is one subpath.
 *
 * Moving parts are drawn at rest (beam level). The component rotates the
 * `beam` part about the knife edge and translates each `left` / `right` part
 * so its hook follows the beam end, which keeps chains and pans plumb.
 *
 * The arc under the pointer is too small to carry legible figures, so the
 * plinth has what a real analytical balance has for the same reason: an
 * optical reading window, where a magnified scale (the `window` part) slides
 * past a fixed index as the beam tips.
 */

import { COMPETITORS, SELF } from '@/data/competitors';

export type Weight = 'p' | 's' | 'h';
export type Tone = 'ink' | 'mute' | 'faint' | 'accent';
/** Which transform a piece moves with. */
export type Part = 'frame' | 'beam' | 'left' | 'right' | 'window';
export type Layer = 'base' | 'scale' | 'beam' | 'pan' | 'them' | 'ours' | 'ghost' | 'note';

export interface Piece {
  d: string;
  w: Weight;
  tone: Tone;
  layer: Layer;
  part: Part;
}

type P = [number, number];

const f = (n: number): string => {
  const s = n.toFixed(1);
  return s === '-0.0' ? '0.0' : s;
};
const xy = (p: P): string => `${f(p[0])} ${f(p[1])}`;
const deg = (d: number): number => (d * Math.PI) / 180;
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const len = (a: P): number => Math.hypot(a[0], a[1]);
const unit = (a: P): P => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
const round1 = (n: number): number => Math.round(n * 10) / 10;

/* ── The data, and what it derives ────────────────────────────────────────── */

const GSAP = COMPETITORS.gsapStack;
/** Each weight in the GSAP stack: core, then the two plugins by difference. */
export const KB = {
  self: SELF.gzipKb,
  stack: GSAP.gzipKb,
  core: COMPETITORS.gsapCore.gzipKb,
  trigger: round1(COMPETITORS.gsapScroll.gzipKb - COMPETITORS.gsapCore.gzipKb),
  draw: round1(GSAP.gzipKb - COMPETITORS.gsapScroll.gzipKb),
  framer: COMPETITORS.framerMotion.gzipKb,
} as const;
export const DELTA_KB = round1(KB.stack - KB.self);

/** The instrument: 0.2° of beam per KB, read on a scale of ±50 KB. */
export const DEG_PER_KB = 0.2;
export const SCALE_KB = 50;
/** The beam's tilt at rest under this load, in degrees (left end down). */
export const TILT_DEG = Math.min(DELTA_KB, SCALE_KB) * DEG_PER_KB;

/* ── Primitives ───────────────────────────────────────────────────────────── */

/** The view box; its origin sits a little down so the drawing is centred in it. */
export const VIEW = { y: 32, w: 1100, h: 1000 };
/** The view is a few degrees above the bench: circles foreshorten to ry = K·rx. */
const K = 0.125;

/** A full circle as one subpath, starting at angle `a0`, drawn clockwise. */
function circle(c: P, r: number, a0 = -Math.PI / 2): string {
  const at = (a: number): P => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  return `M${xy(at(a0))}A${f(r)} ${f(r)} 0 1 1 ${xy(at(a0 + Math.PI))}A${f(r)} ${f(r)} 0 1 1 ${xy(at(a0))}`;
}

/** A closed outline through `pts` with every corner a tangent arc. */
function roundedPoly(pts: P[], radii: number | number[]): string {
  const n = pts.length;
  const R = (i: number) => (Array.isArray(radii) ? radii[i] : radii);
  const corners = pts.map((v, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const u = unit(sub(prev, v));
    const w = unit(sub(next, v));
    const theta = Math.acos(Math.max(-1, Math.min(1, u[0] * w[0] + u[1] * w[1])));
    const tanHalf = Math.tan(theta / 2) || 1e-6;
    let t = R(i) / tanHalf;
    let r = R(i);
    const lim = Math.min(len(sub(prev, v)), len(sub(next, v))) * 0.48;
    if (t > lim) {
      t = lim;
      r = t * tanHalf;
    }
    const d1 = sub(v, prev);
    const d2 = sub(next, v);
    return { t1: add(v, mul(u, t)), t2: add(v, mul(w, t)), r, sweep: d1[0] * d2[1] - d1[1] * d2[0] > 0 ? 1 : 0 };
  });
  let d = `M${xy(corners[n - 1].t2)}`;
  for (const c of corners) d += `L${xy(c.t1)}A${f(c.r)} ${f(c.r)} 0 0 ${c.sweep} ${xy(c.t2)}`;
  return d + 'Z';
}

/** Point on a foreshortened circle (an ellipse) at parameter `t`; y grows down. */
const ell = (cx: number, cy: number, r: number, t: number): P => [cx + r * Math.cos(t), cy + K * r * Math.sin(t)];
const arcTo = (r: number, p: P, sweep: 0 | 1, large: 0 | 1 = 0): string =>
  `A${f(r)} ${f(K * r)} 0 ${large} ${sweep} ${xy(p)}`;

/** The front half of a foreshortened circle, left to right through the near side. */
function frontArc(cx: number, cy: number, r: number): string {
  return `M${xy([cx - r, cy])}${arcTo(r, [cx, cy + K * r], 0)}${arcTo(r, [cx + r, cy], 0)}`;
}

/**
 * The visible part of a foreshortened circle whose far side is hidden, between
 * ±`occ`, behind something standing on it. One subpath, from the far-left
 * occlusion point round the near side to the far-right one.
 */
function openRim(cx: number, cy: number, r: number, occ: number): string {
  const a = Math.acos(Math.min(1, occ / r));
  const s = ell(cx, cy, r, Math.PI + a);
  const e = ell(cx, cy, r, 2 * Math.PI - a);
  return `M${xy(s)}${arcTo(r, [cx, cy + K * r], 0)}${arcTo(r, e, 0)}`;
}

/* ── Weights ──────────────────────────────────────────────────────────────── */

interface Cyl {
  cx: number;
  /** Base plane. */
  yb: number;
  r: number;
  h: number;
}

const CHAMFER = 3;

/**
 * A chamfered cylinder: the silhouette as one subpath (top far edge split
 * round whatever stands on it), the top face's near edge, and the line where
 * the chamfer meets the side.
 */
function cylinder(c: Cyl, occ: number, chamfer = CHAMFER): { body: string; top: string; band: string } {
  const { cx, yb, r, h } = c;
  const yt = yb - h;
  const rt = r - chamfer;
  const a = Math.acos(Math.min(1, occ / rt));
  let body = `M${xy(ell(cx, yt, rt, Math.PI + a))}`;
  body += arcTo(rt, [cx - rt, yt], 0);
  body += `L${xy([cx - r, yt + chamfer])}L${xy([cx - r, yb])}`;
  body += arcTo(r, [cx, yb + K * r], 0) + arcTo(r, [cx + r, yb], 0);
  body += `L${xy([cx + r, yt + chamfer])}L${xy([cx + rt, yt])}`;
  body += arcTo(rt, ell(cx, yt, rt, 2 * Math.PI - a), 0);
  return { body, top: frontArc(cx, yt, rt), band: frontArc(cx, yt + chamfer, r) };
}

/** A lifting knob on the top face at `yt`: a short neck and a domed cap. */
function knob(cx: number, yt: number, r: number): { neck: string; cap: string; top: number; rn: number } {
  const rn = 0.28 * r;
  const hn = 0.16 * r;
  const rc = 0.46 * r;
  const hc = 0.36 * r;
  const yn = yt - hn;
  const meet = yn + K * rc * Math.sqrt(1 - (rn / rc) ** 2);
  const neck = `M${xy([cx - rn, meet])}L${xy([cx - rn, yt])}${arcTo(rn, [cx, yt + K * rn], 0)}${arcTo(rn, [cx + rn, yt], 0)}L${xy([cx + rn, meet])}`;
  let cap = `M${xy([cx - rc, yn])}L${xy([cx - rc, yn - hc * 0.35])}`;
  cap += `C${xy([cx - rc, yn - hc * 0.92])} ${xy([cx - rc * 0.56, yn - hc])} ${xy([cx, yn - hc])}`;
  cap += `C${xy([cx + rc * 0.56, yn - hc])} ${xy([cx + rc, yn - hc * 0.92])} ${xy([cx + rc, yn - hc * 0.35])}`;
  cap += `L${xy([cx + rc, yn])}${arcTo(rc, [cx, yn + K * rc], 1)}${arcTo(rc, [cx - rc, yn], 1)}Z`;
  return { neck, cap, top: yn - hc, rn };
}

/* ── Layout ───────────────────────────────────────────────────────────────── */

/** The knife edge: the beam pivots here. */
export const PIVOT: P = [550, 236];
/** Half the beam: knife to hook. */
export const ARM = 330;
const END_H = 20;
const APEX_H = 70;
/** The hooks hang from eyes at the beam ends. */
const EYE_Y = PIVOT[1] - END_H / 2;
export const HOOK_L: P = [PIVOT[0] - ARM, EYE_Y];
export const HOOK_R: P = [PIVOT[0] + ARM, EYE_Y];

/* The pointer and its scale, all on circles round the knife. */
const POINTER = 552;
const SCALE_IN = 522;
const SCALE_BASE = 556;
const SCALE_NUM = 571;
const SCALE_OUT = 584;
const SCALE_SPAN = 12;

const PAN_Y = 606;
const PAN_R = 128;
const PAN_DEPTH = 26;
const BASE_Y = PAN_Y + 5;

const PLINTH_TOP = 860;
/** Top of the plinth's lower body, its underside, and the bench it stands on. */
const SLAB_Y = PLINTH_TOP + 26;
const BODY_Y = SLAB_Y + 64;
export const BENCH_Y = BODY_Y + 28;

/**
 * The optical reading window let into the plinth: the aperture, and how many
 * units of the magnified strip one KB takes. Figures every 10 KB sit 50 units
 * apart here, where on the arc they would sit 19. The aperture shows ±24 KB:
 * at rest and at the reading alike, no figure is cut by its edge.
 */
export const WINDOW = { x0: 430, x1: 670, y0: SLAB_Y + 14, y1: BODY_Y - 14, u: 5 } as const;

/* One density for every weight: the stack is STACK_H tall at its own radius,
   and everything else holds the same volume per KB. */
const STACK_R = 58;
const STACK_H = 128;
const VOL_PER_KB = (Math.PI * STACK_R * STACK_R * STACK_H) / KB.stack;
/** A free-standing weight is 0.6 as tall as it is wide: solve r from volume. */
const knobbedRadius = (kb: number): number => Math.cbrt((kb * VOL_PER_KB) / (Math.PI * 1.2));

const topY = (dx: number): number => PIVOT[1] - END_H - (APEX_H - END_H) * (1 - Math.abs(dx) / ARM);
/** Where a vertical at `x` meets the circle of radius `r` round the knife, below it. */
const onRadius = (x: number, r: number): number => PIVOT[1] + Math.sqrt(r * r - (x - PIVOT[0]) ** 2);
/** A point on a circle round the knife, `a` degrees right of plumb. */
const plumb = (r: number, a: number): P => [PIVOT[0] + r * Math.sin(deg(a)), PIVOT[1] + r * Math.cos(deg(a))];

/**
 * 45° section hatching across a rectangle, as one serpentine: each stroke is
 * clipped to the rectangle and the turns run along its edges.
 */
function hatch(x0: number, y0: number, x1: number, y1: number, gap: number): string {
  const h = y1 - y0;
  let d = '';
  let k = 0;
  for (let s = x0 - h + gap / 2; s < x1; s += gap, k++) {
    const t0 = Math.max(0, x0 - s);
    const t1 = Math.min(h, x1 - s);
    if (t1 <= t0) continue;
    const a: P = [s + t0, y1 - t0];
    const b: P = [s + t1, y1 - t1];
    const [from, to] = k % 2 === 0 ? [a, b] : [b, a];
    d += d ? `L${xy(from)}L${xy(to)}` : `M${xy(from)}L${xy(to)}`;
  }
  return d;
}

/* ── Assemble, in drawing order ───────────────────────────────────────────── */

const pieces: Piece[] = [];
const put = (d: string, w: Weight, tone: Tone, layer: Layer, part: Part): number => {
  pieces.push({ d, w, tone, layer, part });
  return pieces.length - 1;
};

export interface Engraving {
  x: number;
  y: number;
  text: string;
  /** Index in PIECES of the outline it is cut into. */
  at: number;
  part: Part;
  tone: 'mute' | 'accent' | 'faint';
  /** The maker's line above the value, set small. */
  small?: boolean;
}
const engr: Engraving[] = [];

export interface Note {
  key: 'gsap' | 'draw' | 'self' | 'framer' | 'tilt' | 'reading';
  dot: P | null;
  text: P;
  anchor: 'start' | 'end';
  title: string;
  part: Part;
  accent?: boolean;
  /** Index in PIECES of the leader (or the shelf it stands on). */
  at: number;
}
const notes: Note[] = [];
const leader = (pts: P[]): string => pts.map((p, i) => `${i ? 'L' : 'M'}${xy(p)}`).join('');

// 1 · Datum lines: the plumb axis and the level the beam rests on.
put(`M${xy([PIVOT[0], 104])}L${xy([PIVOT[0], BENCH_Y + 14])}`, 'h', 'faint', 'base', 'frame');
put(`M${xy([56, PIVOT[1]])}L${xy([1044, PIVOT[1]])}`, 'h', 'faint', 'base', 'frame');

// 1b · The bench, with the ground hatching under it as one comb.
{
  const x0 = 36;
  const x1 = VIEW.w - 36;
  let d = `M${xy([x0, BENCH_Y])}`;
  for (let x = x0 + 10; x <= x1; x += 13) d += `L${xy([x, BENCH_Y])}L${xy([x - 8, BENCH_Y + 9])}L${xy([x, BENCH_Y])}`;
  put(`${d}L${xy([x1, BENCH_Y])}`, 'h', 'faint', 'base', 'frame');
}

// 2 · Plinth: two slabs, the reading window between hatched panels, the two
//     arrest knobs, levelling feet
let windowAt = -1;
{
  const yl = SLAB_Y;
  const yb = BODY_Y;
  put(roundedPoly([[200, yl], [900, yl], [900, yb], [200, yb]], 5), 's', 'ink', 'base', 'frame');
  put(roundedPoly([[250, PLINTH_TOP], [850, PLINTH_TOP], [862, yl], [238, yl]], [4, 4, 1, 1]), 's', 'ink', 'base', 'frame');
  // the front panels either side of the window, in section
  const py0 = yl + 7;
  const py1 = yb - 7;
  const { x0, x1, y0, y1, u } = WINDOW;
  put(roundedPoly([[246, py0], [x0 - 16, py0], [x0 - 16, py1], [246, py1]], 2), 'h', 'mute', 'base', 'frame');
  put(hatch(246, py0, x0 - 16, py1, 7), 'h', 'faint', 'base', 'frame');
  put(roundedPoly([[x1 + 16, py0], [854, py0], [854, py1], [x1 + 16, py1]], 2), 'h', 'mute', 'base', 'frame');
  put(hatch(x1 + 16, py0, 854, py1, 7), 'h', 'faint', 'base', 'frame');
  const ky = (yl + yb) / 2;
  put(`${circle([224, ky], 11)}${circle([224, ky], 4.5)}${circle([876, ky], 11)}${circle([876, ky], 4.5)}`, 'h', 'ink', 'base', 'frame');
  // The window: a bezel, the aperture, then the magnified strip behind it —
  // a base line with a tick every 2.5 KB across ±50 KB, one comb.
  put(roundedPoly([[x0 - 8, y0 - 7], [x1 + 8, y0 - 7], [x1 + 8, y1 + 7], [x0 - 8, y1 + 7]], 6), 's', 'ink', 'scale', 'frame');
  put(roundedPoly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], 2), 'h', 'mute', 'scale', 'frame');
  {
    const cx = PIVOT[0];
    const yb0 = y0 + 4;
    let d = `M${xy([cx - SCALE_KB * u - 10, yb0])}`;
    for (let kb = -SCALE_KB; kb <= SCALE_KB; kb += 2.5) {
      const x = cx + kb * u;
      const t = kb % 10 === 0 ? 13 : kb % 5 === 0 ? 8.5 : 5;
      d += `L${xy([x, yb0])}L${xy([x, yb0 + t])}L${xy([x, yb0])}`;
    }
    windowAt = put(`${d}L${xy([cx + SCALE_KB * u + 10, yb0])}`, 'h', 'ink', 'scale', 'window');
  }
  // The fixed index the strip is read against: a hairline down the screen
  // from a small arrowhead set in the bezel.
  {
    const x = PIVOT[0];
    put(`M${xy([x - 5, y0 - 6])}L${xy([x, y0 + 1])}L${xy([x + 5, y0 - 6])}M${xy([x, y0 + 1])}L${xy([x, y1 - 1])}`, 's', 'ink', 'scale', 'frame');
  }
  for (const fx of [270, 830]) {
    // stem, thumb-wheel and pad in one stroke; its knurling as one serpentine
    const pad = roundedPoly([[fx - 22, yb + 18], [fx + 22, yb + 18], [fx + 16, yb + 28], [fx - 16, yb + 28]], [1, 1, 4, 4]);
    put(
      `M${xy([fx - 5, yb])}L${xy([fx - 5, yb + 6])}L${xy([fx - 19, yb + 6])}L${xy([fx - 19, yb + 18])}L${xy([fx + 19, yb + 18])}L${xy([fx + 19, yb + 6])}L${xy([fx + 5, yb + 6])}L${xy([fx + 5, yb])}${pad}`,
      's',
      'ink',
      'base',
      'frame',
    );
    let k = '';
    for (let i = 0; i < 9; i++) {
      const x = fx - 16 + 4 * i;
      const [a, b] = i % 2 ? [yb + 16, yb + 8] : [yb + 8, yb + 16];
      k += `${i ? 'L' : 'M'}${xy([x, a])}L${xy([x, b])}`;
    }
    put(k, 'h', 'mute', 'base', 'frame');
  }
  // spirit level let into the upper slab
  const vx = 700;
  const vy = PLINTH_TOP + 13;
  put(roundedPoly([[vx - 34, vy - 6], [vx + 34, vy - 6], [vx + 34, vy + 6], [vx - 34, vy + 6]], 6), 'h', 'ink', 'base', 'frame');
  put(`${circle([vx, vy], 3.4)}M${xy([vx - 8, vy - 6])}L${xy([vx - 8, vy + 6])}M${xy([vx + 8, vy - 6])}L${xy([vx + 8, vy + 6])}`, 'h', 'mute', 'base', 'frame');
}

// 3 · Column foot and the scale plate in front of the column
const COL_W = 18;
{
  const cx = PIVOT[0];
  const y0 = onRadius(cx + 24, SCALE_OUT);
  put(roundedPoly([[cx - 24, y0], [cx + 24, y0], [cx + 40, PLINTH_TOP], [cx - 40, PLINTH_TOP]], [2, 2, 1, 1]), 's', 'ink', 'base', 'frame');
  put(`M${xy([cx - 28.5, y0 + 11])}L${xy([cx + 28.5, y0 + 11])}`, 'h', 'mute', 'base', 'frame');
}
/** Index in PIECES of the scale's graduations; the numerals follow it. */
export const SCALE_TICKS_AT = (() => {
  let d = `M${xy(plumb(SCALE_OUT, -SCALE_SPAN))}A${SCALE_OUT} ${SCALE_OUT} 0 0 0 ${xy(plumb(SCALE_OUT, SCALE_SPAN))}`;
  d += `L${xy(plumb(SCALE_IN, SCALE_SPAN))}A${SCALE_IN} ${SCALE_IN} 0 0 1 ${xy(plumb(SCALE_IN, -SCALE_SPAN))}Z`;
  put(d, 's', 'ink', 'scale', 'frame');
  const inner = SCALE_IN + 7;
  put(`M${xy(plumb(inner, -SCALE_SPAN + 0.5))}A${inner} ${inner} 0 0 0 ${xy(plumb(inner, SCALE_SPAN - 0.5))}`, 'h', 'mute', 'scale', 'frame');
  // Graduations as one comb along the base arc: every 2.5 KB across ±50 KB.
  const step = 2.5 * DEG_PER_KB;
  const n = Math.round((2 * SCALE_KB * DEG_PER_KB) / step);
  const a0 = -SCALE_KB * DEG_PER_KB;
  let c = `M${xy(plumb(SCALE_BASE, a0 - 0.6))}A${SCALE_BASE} ${SCALE_BASE} 0 0 0 ${xy(plumb(SCALE_BASE, a0))}`;
  for (let i = 0; i <= n; i++) {
    const a = a0 + i * step;
    const kb = Math.abs(Math.round(a / DEG_PER_KB));
    const tick = kb % 10 === 0 ? 16 : kb % 5 === 0 ? 10 : 5.5;
    if (i > 0) c += `A${SCALE_BASE} ${SCALE_BASE} 0 0 0 ${xy(plumb(SCALE_BASE, a))}`;
    c += `L${xy(plumb(SCALE_BASE - tick, a))}L${xy(plumb(SCALE_BASE, a))}`;
  }
  c += `A${SCALE_BASE} ${SCALE_BASE} 0 0 0 ${xy(plumb(SCALE_BASE, -a0 + 0.6))}`;
  return put(c, 'h', 'ink', 'scale', 'frame');
})();

// 4 · Column: fluted shaft, capital, the knife edge and its bearing
{
  const cx = PIVOT[0];
  const yCap = PIVOT[1] + 46;
  const yIn = onRadius(cx + COL_W, SCALE_IN);
  put(`M${xy([cx - COL_W, yIn])}L${xy([cx - COL_W, yCap])}L${xy([cx + COL_W, yCap])}L${xy([cx + COL_W, yIn])}`, 's', 'ink', 'base', 'frame');
  let fl = '';
  const xs = [-12, -6, 6, 12];
  xs.forEach((dx, i) => {
    const yb = onRadius(cx + dx, SCALE_IN);
    const [a, b] = i % 2 === 0 ? [yb, yCap + 9] : [yCap + 9, yb];
    fl += `${i ? 'L' : 'M'}${xy([cx + dx, a])}L${xy([cx + dx, b])}`;
  });
  put(fl, 'h', 'mute', 'base', 'frame');
  put(`M${xy([cx - COL_W, yCap + 9])}L${xy([cx + COL_W, yCap + 9])}`, 'h', 'mute', 'base', 'frame');
  put(roundedPoly([[cx - 25, PIVOT[1] + 38], [cx + 25, PIVOT[1] + 38], [cx + 19, yCap], [cx - 19, yCap]], [1, 1, 2, 2]), 's', 'ink', 'base', 'frame');
  put(roundedPoly([[cx - 31, PIVOT[1] + 28], [cx + 31, PIVOT[1] + 28], [cx + 31, PIVOT[1] + 38], [cx - 31, PIVOT[1] + 38]], 2.5), 's', 'ink', 'base', 'frame');
  put(`M${xy([cx - 14, PIVOT[1] + 28])}L${xy(PIVOT)}L${xy([cx + 14, PIVOT[1] + 28])}`, 's', 'ink', 'base', 'frame');
  put(circle(PIVOT, 6, Math.PI / 2), 'h', 'ink', 'base', 'frame');
}

// 5 · The beam: a graduated Warren truss on the knife, its bob and pointer
export const BEAM_AT = put(
  (() => {
    const [px, py] = PIVOT;
    const rEnd: P = [px + ARM, py - END_H];
    const lEnd: P = [px - ARM, py - END_H];
    const apex: P = [px, py - APEX_H];
    const u = unit(sub(rEnd, apex));
    const w = unit(sub(lEnd, apex));
    const theta = Math.acos(u[0] * w[0] + u[1] * w[1]);
    const r = 16;
    const t = r / Math.tan(theta / 2);
    let d = `M${xy(PIVOT)}L${xy([px + ARM, py])}A10 10 0 0 0 ${xy(rEnd)}`;
    d += `L${xy(add(apex, mul(u, t)))}A${f(r)} ${f(r)} 0 0 0 ${xy(add(apex, mul(w, t)))}`;
    d += `L${xy(lEnd)}A10 10 0 0 0 ${xy([px - ARM, py])}Z`;
    return d;
  })(),
  'p',
  'ink',
  'beam',
  'beam',
);
put(circle(HOOK_L, 5), 'h', 'ink', 'beam', 'beam');
put(circle(HOOK_R, 5), 'h', 'ink', 'beam', 'beam');
{
  // Truss windows: the triangles between a zigzag of members, inset by half
  // a member's width (scaled about each triangle's incentre).
  const yb = PIVOT[1] - 3.5;
  const yt = (dx: number): number => topY(dx) + 3.5;
  const inset = (tri: P[], wHalf: number): P[] | null => {
    const [A, B, C] = tri;
    const a = len(sub(B, C));
    const b = len(sub(A, C));
    const c = len(sub(A, B));
    const s = a + b + c;
    const I: P = [(a * A[0] + b * B[0] + c * C[0]) / s, (a * A[1] + b * B[1] + c * C[1]) / s];
    const area = Math.abs((B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1])) / 2;
    const rin = (2 * area) / s;
    if (rin - wHalf < 2.2) return null;
    const k = (rin - wHalf) / rin;
    return tri.map((p) => add(I, mul(sub(p, I), k)));
  };
  for (const side of [-1, 1]) {
    const node = (dx: number, top: boolean): P => [PIVOT[0] + side * dx, top ? yt(dx) : yb];
    const king = inset([node(9, false), node(9, true), node(52, true)], 3.5);
    if (king) put(roundedPoly(king, 2.5), 'h', 'ink', 'beam', 'beam');
    const zig: P[] = [20, 64, 108, 152, 196, 240, 284].map((dx, i) => node(dx, i % 2 === 1));
    for (let i = 0; i + 2 < zig.length; i++) {
      const tri = inset([zig[i], zig[i + 1], zig[i + 2]], 3.5);
      if (tri) put(roundedPoly(tri, 2.5), 'h', 'ink', 'beam', 'beam');
    }
  }
  // Rider graduations along each top chord: 20 divisions, longer every fifth.
  for (const side of [1, -1]) {
    let d = '';
    for (let i = 0; i <= 20; i++) {
      const dx = 34 + i * 14;
      const x = PIVOT[0] + side * dx;
      const y = topY(dx);
      const h = i % 10 === 0 ? 10 : i % 5 === 0 ? 7 : 4;
      d += `${i ? 'L' : 'M'}${xy([x, y])}L${xy([x, y - h])}L${xy([x, y])}`;
    }
    put(d, 'h', 'mute', 'beam', 'beam');
  }
  // The gravity bob: a nut on a short threaded rod above the apex, which sets
  // how far the beam swings per KB.
  const top = PIVOT[1] - APEX_H;
  put(`M${xy([PIVOT[0] - 2.5, top + 2])}L${xy([PIVOT[0] - 2.5, top - 34])}L${xy([PIVOT[0] + 2.5, top - 34])}L${xy([PIVOT[0] + 2.5, top + 2])}`, 'h', 'ink', 'beam', 'beam');
  put(roundedPoly([[PIVOT[0] - 10, top - 26], [PIVOT[0] + 10, top - 26], [PIVOT[0] + 10, top - 15], [PIVOT[0] - 10, top - 15]], 2), 's', 'ink', 'beam', 'beam');
}
export const POINTER_AT = put(
  `M${xy([PIVOT[0] - 2.4, PIVOT[1] + 7])}L${xy([PIVOT[0], PIVOT[1] + POINTER])}L${xy([PIVOT[0] + 2.4, PIVOT[1] + 7])}`,
  's',
  'ink',
  'beam',
  'beam',
);
put(roundedPoly([[PIVOT[0] - 6, PIVOT[1] + 150], [PIVOT[0] + 6, PIVOT[1] + 150], [PIVOT[0] + 6, PIVOT[1] + 174], [PIVOT[0] - 6, PIVOT[1] + 174]], 2), 'h', 'ink', 'beam', 'beam');

// 5b · What makes it an equal-arm balance: knife to either hook, the same.
//      Drawn from the centre outward, like the case dimension in chapter 02.
const DIM_Y = 96;
{
  const xl = HOOK_L[0];
  const xr = HOOK_R[0];
  put(`M${xy([xl, EYE_Y - 22])}L${xy([xl, DIM_Y - 10])}M${xy([xr, EYE_Y - 22])}L${xy([xr, DIM_Y - 10])}`, 'h', 'mute', 'note', 'frame');
  put(`M${xy([PIVOT[0], DIM_Y])}L${xy([xl, DIM_Y])}l7 -4L${xy([xl, DIM_Y])}l7 4`, 'h', 'mute', 'note', 'frame');
  put(`M${xy([PIVOT[0], DIM_Y])}L${xy([xr, DIM_Y])}l-7 -4L${xy([xr, DIM_Y])}l-7 4`, 'h', 'mute', 'note', 'frame');
}
const dimensionAt = pieces.length - 1;

/* ── Pans, chains and the weights on them ─────────────────────────────────── */

const TAG_Y = PAN_Y + PAN_DEPTH + 76;

function hanger(E: P, part: 'left' | 'right', occ: number, chainStop: number): void {
  const [ex, ey] = E;
  // An S-hook through the eye, a ring, three chains to the rim.
  put(`M${xy([ex + 2.6, ey + 2])}A3.3 3.3 0 1 0 ${xy([ex - 3.3, ey])}L${xy([ex - 3.3, ey + 14])}Q${xy([ex - 3.3, ey + 22])} ${xy([ex, ey + 24])}L${xy([ex, ey + 34])}`, 's', 'ink', 'pan', part);
  put(circle([ex, ey + 40], 6), 'h', 'ink', 'pan', part);
  const ring: P = [ex, ey + 46];
  put(`M${xy(ring)}L${xy([ex - PAN_R, PAN_Y])}`, 'h', 'mute', 'pan', part);
  put(`M${xy(ring)}L${xy([ex, chainStop])}`, 'h', 'mute', 'pan', part);
  put(`M${xy(ring)}L${xy([ex + PAN_R, PAN_Y])}`, 'h', 'mute', 'pan', part);
  // The dish: its bowl, and the rim round the near side of the load.
  put(
    `M${xy([ex - PAN_R, PAN_Y])}C${xy([ex - PAN_R + 4, PAN_Y + 17])} ${xy([ex - PAN_R + 30, PAN_Y + PAN_DEPTH])} ${xy([ex - PAN_R + 58, PAN_Y + PAN_DEPTH])}L${xy([ex + PAN_R - 58, PAN_Y + PAN_DEPTH])}C${xy([ex + PAN_R - 30, PAN_Y + PAN_DEPTH])} ${xy([ex + PAN_R - 4, PAN_Y + 17])} ${xy([ex + PAN_R, PAN_Y])}`,
    's',
    'ink',
    'pan',
    part,
  );
  put(openRim(ex, PAN_Y, PAN_R, occ), 's', 'ink', 'pan', part);
  put(openRim(ex, PAN_Y, PAN_R - 9, occ), 'h', 'mute', 'pan', part);
}

/** A hanging tag: from the bottom of a dish, down and out to a shelf. */
function tag(E: P, part: 'left' | 'right'): void {
  const side = part === 'left' ? -1 : 1;
  const dot: P = [E[0], PAN_Y + PAN_DEPTH];
  const edge = part === 'left' ? 24 : VIEW.w - 24;
  // The elbow turns back under the dish, so the shelf runs out clear of the type.
  const at = put(leader([dot, [E[0] - side * 12, TAG_Y], [edge, TAG_Y]]), 'h', part === 'left' ? 'mute' : 'accent', 'note', part);
  notes.push(
    part === 'left'
      ? { key: 'gsap', dot, text: [edge, TAG_Y - 10], anchor: 'start', title: 'GSAP', part, at }
      : { key: 'self', dot, text: [edge, TAG_Y - 10], anchor: 'end', title: 'SVG-SCROLL-DRAW', part, accent: true, at },
  );
}

// 6 · Left pan: the GSAP stack — three slotted discs of one radius whose
//     heights share STACK_H in proportion to their KB, a knob on top.
{
  const cx = HOOK_L[0];
  const kn = knob(cx, BASE_Y - STACK_H, STACK_R);
  hanger(HOOK_L, 'left', STACK_R, kn.top - 4);
  const out = cylinder({ cx, yb: BASE_Y, r: STACK_R, h: STACK_H }, kn.rn);
  const body = put(out.body, 'p', 'ink', 'them', 'left');
  put(out.top, 'h', 'ink', 'them', 'left');
  put(out.band, 'h', 'mute', 'them', 'left');
  const discs = [
    { name: 'GSAP CORE', kb: KB.core },
    { name: 'SCROLLTRIGGER', kb: KB.trigger },
    { name: 'DRAWSVG', kb: KB.draw },
  ];
  let y = BASE_Y;
  let washer = y;
  discs.forEach((disc, i) => {
    const y1 = y - (disc.kb / KB.stack) * STACK_H;
    // each seam a fine groove: two edges 2.8 apart
    if (i < discs.length - 1) put(`${frontArc(cx, y1 + 1.4, STACK_R)}${frontArc(cx, y1 - 1.4, STACK_R)}`, 'h', 'mute', 'them', 'left');
    const c = (y + y1) / 2;
    if (y - y1 > 30) {
      engr.push({ x: cx, y: c - 4, text: disc.name, at: body, part: 'left', tone: 'mute', small: true });
      engr.push({ x: cx, y: c + 13, text: `${disc.kb.toFixed(1)} KB`, at: body, part: 'left', tone: 'mute' });
    } else washer = c;
    y = y1;
  });
  put(kn.neck, 'h', 'ink', 'them', 'left');
  put(kn.cap, 's', 'ink', 'them', 'left');
  // The washer is too thin to cut a value into: it gets a note of its own.
  const dot: P = [cx - STACK_R, washer];
  const at = put(leader([dot, [24, washer]]), 'h', 'mute', 'note', 'left');
  notes.push({ key: 'draw', dot, text: [24, washer - 10], anchor: 'start', title: 'DRAWSVG', part: 'left', at });
  tag(HOOK_L, 'left');
}

// 7 · Right pan: svg-scroll-draw, one weight at the same density.
export const SELF_R = knobbedRadius(KB.self);
{
  const cx = HOOK_R[0];
  const h = 1.2 * SELF_R;
  const kn = knob(cx, BASE_Y - h, SELF_R);
  hanger(HOOK_R, 'right', SELF_R, kn.top - 4);
  const out = cylinder({ cx, yb: BASE_Y, r: SELF_R, h }, kn.rn);
  const body = put(out.body, 'p', 'accent', 'ours', 'right');
  put(out.top, 'h', 'accent', 'ours', 'right');
  put(out.band, 'h', 'accent', 'ours', 'right');
  put(kn.neck, 'h', 'accent', 'ours', 'right');
  put(kn.cap, 's', 'accent', 'ours', 'right');
  engr.push({ x: cx, y: BASE_Y - h * 0.42 + 5, text: `${KB.self.toFixed(1)} KB`, at: body, part: 'right', tone: 'accent' });
  tag(HOOK_R, 'right');
}

// 8 · The weight left off the scale: Framer Motion, a ghost standing on the
//     bench beside the instrument, at the same density as the rest.
export const FRAMER_R = knobbedRadius(KB.framer);
{
  const cx = VIEW.w - 26 - FRAMER_R;
  // Its base circle's near edge stands on the bench line.
  const yb = BENCH_Y - K * FRAMER_R - 0.6;
  const h = 1.2 * FRAMER_R;
  const kn = knob(cx, yb - h, FRAMER_R);
  const out = cylinder({ cx, yb, r: FRAMER_R, h }, kn.rn);
  const body = put(out.body, 's', 'faint', 'ghost', 'frame');
  put(out.top, 'h', 'faint', 'ghost', 'frame');
  put(out.band, 'h', 'faint', 'ghost', 'frame');
  put(kn.neck, 'h', 'faint', 'ghost', 'frame');
  put(kn.cap, 'h', 'faint', 'ghost', 'frame');
  engr.push({ x: cx, y: yb - h * 0.42 + 5, text: `${KB.framer.toFixed(1)} KB`, at: body, part: 'frame', tone: 'faint' });
  const dot: P = [cx, kn.top];
  const shelf = kn.top - 19;
  const at = put(leader([dot, [cx - 20, shelf], [VIEW.w - 248, shelf]]), 'h', 'faint', 'note', 'frame');
  notes.push({ key: 'framer', dot, text: [VIEW.w - 244, shelf - 10], anchor: 'start', title: 'FRAMER MOTION', part: 'frame', at });
}

// 9 · The swing to come: an angular dimension at the left beam end.
{
  const R = ARM + 42;
  const a0 = Math.PI;
  const a1 = Math.PI - deg(TILT_DEG);
  const at = (r: number, a: number): P => [PIVOT[0] + r * Math.cos(a), PIVOT[1] + r * Math.sin(a)];
  put(`M${xy(at(R - 18, a0))}L${xy(at(R + 14, a0))}M${xy(at(R - 18, a1))}L${xy(at(R + 14, a1))}`, 'h', 'mute', 'note', 'frame');
  const end = at(R, a1);
  const dir: P = [Math.sin(deg(TILT_DEG)), Math.cos(deg(TILT_DEG))];
  const back = mul(dir, -8);
  const n: P = [-dir[1] * 3.6, dir[0] * 3.6];
  put(`M${xy(at(R, a0))}A${R} ${R} 0 0 0 ${xy(end)}L${xy(add(add(end, back), n))}M${xy(end)}L${xy(sub(add(end, back), n))}`, 'h', 'mute', 'note', 'frame');
  const dot = at(R, (a0 + a1) / 2);
  const lAt = put(leader([dot, [150, 192], [24, 192]]), 'h', 'mute', 'note', 'frame');
  notes.push({ key: 'tilt', dot, text: [24, 182], anchor: 'start', title: `TILT · ${DEG_PER_KB}°/KB`, part: 'frame', at: lAt });
}

// 10 · Where the needle will come to rest.
{
  const dot = plumb(POINTER, TILT_DEG);
  const at = put(leader([dot, [668, TAG_Y], [786, TAG_Y]]), 'h', 'mute', 'note', 'frame');
  notes.push({ key: 'reading', dot, text: [672, TAG_Y - 10], anchor: 'start', title: 'READING', part: 'frame', at });
}

/* ── Scale numerals ───────────────────────────────────────────────────────── */

export interface Numeral {
  x: number;
  y: number;
  text: string;
}
/** On the arc: every 20 KB, all the room it has for figures that can be read. */
export const NUMERALS: readonly Numeral[] = (() => {
  const out: Numeral[] = [];
  for (let kb = -40; kb <= 40; kb += 20) {
    const [x, y] = plumb(SCALE_NUM, kb * DEG_PER_KB);
    out.push({ x: round1(x), y: round1(y + 4.5), text: String(Math.abs(kb)) });
  }
  return out;
})();
/** In the reading window: every 10 KB, at rest (zero under the index). */
export const WINDOW_NUMERALS: readonly Numeral[] = (() => {
  const out: Numeral[] = [];
  for (let kb = -SCALE_KB; kb <= SCALE_KB; kb += 10) {
    out.push({ x: round1(PIVOT[0] + kb * WINDOW.u), y: WINDOW.y1 - 5, text: String(Math.abs(kb)) });
  }
  return out;
})();
/** Index in PIECES of the window's strip, which its figures follow. */
export const WINDOW_AT = windowAt;
/** The equal-arm dimension over the beam. */
export const DIMENSION = { x: PIVOT[0], y: DIM_Y - 12, text: 'ARMS 1 : 1', at: dimensionAt } as const;

export const PIECES: readonly Piece[] = pieces;
export const NOTES: readonly Note[] = notes;
export const ENGRAVINGS: readonly Engraving[] = engr;

/** How far a hook travels when the beam stands at `a` degrees (negative: left end down). */
export function hookShift(a: number, side: -1 | 1): P {
  const r = deg(a);
  const dx = side * ARM;
  const dy = EYE_Y - PIVOT[1];
  return [dx * Math.cos(r) - dy * Math.sin(r) - dx, dx * Math.sin(r) + dy * Math.cos(r) - dy];
}

export const countLayer = (layer: Layer): number => pieces.filter((p) => p.layer === layer).length;
