/**
 * Stack — a PCB layout of the library: one integrated circuit (the core) in a
 * 44-lead quad flat package, with copper traces routed out to a connector for
 * every framework entry the package ships. Built from geometry, not traced:
 * pins on a 16-unit pitch, orthogonal traces with tangent-arc corners, a
 * hatched ground pour with real clearance channels cut round every trace and
 * via, and connectors whose pin rows face the trace that feeds them.
 *
 * Pure module, no DOM and no randomness: the server and the client compute
 * byte-identical `d` strings. Every number is written with one decimal.
 *
 * Draw order matters. The library staggers elements in document order, and
 * Chromium restarts a dash pattern at every subpath, so anything that should
 * sweep — a pin comb, a trace, the hatch — is one continuous subpath.
 */

export type Weight = 'p' | 's' | 'h';
export type Tone = 'ink' | 'mute' | 'faint' | 'accent';
export type Layer = 'chip' | 'pour' | 'trace' | 'via' | 'conn' | 'edge' | 'part' | 'note';
export type ConnId = 'react' | 'next' | 'svelte' | 'vue' | 'nuxt' | 'solid' | 'angular' | 'wc' | 'astro';
/** A net is lit as one: a connector's trace, its vias and its shell, or the core. */
export type NetId = ConnId | 'core';

export interface Piece {
  d: string;
  w: Weight;
  tone: Tone;
  layer: Layer;
  /** Lit in the accent when this net is selected. */
  net?: NetId;
  /** Only on the full sheet: hidden in the phone crop. */
  wide?: boolean;
  /** `pour`: clipped to the ground pour and cut by the clearance mask. `clear`: cut by the mask only. */
  under?: 'pour' | 'clear';
}

type P = [number, number];

/** The layout grid every part is placed on. */
export const W = 1000;
export const H = 840;
/** The board's edge (Edge.Cuts): every label is silkscreen on it, so it encloses the grid. */
export const EDGE = { x0: -24, y0: -24, x1: 1024, y1: 864 } as const;
/** The sheet the SVG shows: the grid plus the board's edge and a margin. */
export const VIEW = { x: -30, y: -30, w: 1060, h: 900 } as const;
/** The phone crop, in grid units: the band that holds the chip and six connectors. */
export const CROP = { x0: 86, x1: 914, y0: 0, y1: 840 } as const;

const f = (n: number): string => {
  const s = n.toFixed(1);
  return s === '-0.0' ? '0.0' : s;
};
const xy = (p: P): string => `${f(p[0])} ${f(p[1])}`;
const polar = (c: P, r: number, a: number): P => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const len = (a: P): number => Math.hypot(a[0], a[1]);
const unit = (a: P): P => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
const deg = (d: number): number => (d * Math.PI) / 180;

/* ── Primitives ───────────────────────────────────────────────────────────── */

/** A full circle as one subpath, starting at angle `a0`, drawn clockwise. */
export function circle(c: P, r: number, a0 = -Math.PI / 2): string {
  const s = polar(c, r, a0);
  const m = polar(c, r, a0 + Math.PI);
  return `M${xy(s)}A${f(r)} ${f(r)} 0 1 1 ${xy(m)}A${f(r)} ${f(r)} 0 1 1 ${xy(s)}`;
}

/** One filleted corner from `prev` through `v` toward `next`. */
function fillet(prev: P, v: P, next: P, r: number): { a: P; b: P; r: number; sweep: 0 | 1 } {
  const u = unit(sub(prev, v));
  const w = unit(sub(next, v));
  const cos = Math.max(-1, Math.min(1, u[0] * w[0] + u[1] * w[1]));
  const tanHalf = Math.tan(Math.acos(cos) / 2) || 1e-6;
  let t = r / tanHalf;
  const lim = Math.min(len(sub(prev, v)), len(sub(next, v))) * 0.5;
  let rr = r;
  if (t > lim) {
    t = lim;
    rr = t * tanHalf;
  }
  const d1 = sub(v, prev);
  const d2 = sub(next, v);
  return { a: add(v, mul(u, t)), b: add(v, mul(w, t)), r: rr, sweep: d1[0] * d2[1] - d1[1] * d2[0] > 0 ? 1 : 0 };
}

/**
 * A closed outline that starts exactly at `pts[0]` — a point in the middle of
 * an edge — and fillets every other vertex. Starting mid-edge lets a
 * connector's shell begin where its trace lands.
 */
function outline(pts: P[], radii: number[]): string {
  const n = pts.length;
  let d = `M${xy(pts[0])}`;
  for (let i = 1; i < n; i++) {
    const c = fillet(pts[i - 1], pts[i], pts[(i + 1) % n], radii[i]);
    d += `L${xy(c.a)}A${f(c.r)} ${f(c.r)} 0 0 ${c.sweep} ${xy(c.b)}`;
  }
  return `${d}L${xy(pts[0])}Z`;
}

/** A rounded rectangle as one subpath, starting mid top edge. */
function roundRect(x0: number, y0: number, x1: number, y1: number, r: number): string {
  const cx = (x0 + x1) / 2;
  return outline(
    [
      [cx, y0],
      [x1, y0],
      [x1, y1],
      [x0, y1],
      [x0, y0],
    ],
    [0, r, r, r, r],
  );
}

/**
 * An orthogonal trace through `pts`, every corner a tangent arc of radius
 * `r`. Returns the path and its exact length (for the pulse that runs it).
 */
function route(pts: P[], r: number): { d: string; len: number; at: (k: number) => number } {
  let d = `M${xy(pts[0])}`;
  let total = 0;
  /** Running length at each vertex, measured along the filleted path. */
  const marks: number[] = [0];
  let from = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const c = fillet(pts[i - 1], pts[i], pts[i + 1], r);
    total += len(sub(c.a, from));
    marks.push(total + (c.r * Math.PI) / 4);
    total += (c.r * Math.PI) / 2;
    d += `L${xy(c.a)}A${f(c.r)} ${f(c.r)} 0 0 ${c.sweep} ${xy(c.b)}`;
    from = c.b;
  }
  const end = pts[pts.length - 1];
  total += len(sub(end, from));
  marks.push(total);
  d += `L${xy(end)}`;
  return { d, len: total, at: (k: number) => marks[k] };
}

/* ── The package ──────────────────────────────────────────────────────────── */

export const C: P = [500, 420];
const HS = 110; // half the package body
const PIN_L = 20;
const PIN_HW = 3.5;
const PITCH = 16;
export const PINS_PER_SIDE = 11;
const PIN_OFF = Array.from({ length: PINS_PER_SIDE }, (_, k) => (k - (PINS_PER_SIDE - 1) / 2) * PITCH);

const BX0 = C[0] - HS;
const BX1 = C[0] + HS;
const BY0 = C[1] - HS;
const BY1 = C[1] + HS;
const CHAMFER = 18;

/** Package body with the pin-1 corner chamfered. Starts at the chamfer and runs clockwise. */
const PACKAGE = outline(
  [
    [BX0 + CHAMFER + 30, BY0],
    [BX1, BY0],
    [BX1, BY1],
    [BX0, BY1],
    [BX0, BY0 + CHAMFER],
    [BX0 + CHAMFER, BY0],
  ],
  [0, 5, 5, 5, 1.5, 1.5],
);
export const CORE_LEN = 4 * 2 * HS - 2 * CHAMFER + Math.SQRT2 * CHAMFER;

const MOLD_IN = 12;
const MOLD = outline(
  [
    [BX0 + MOLD_IN + CHAMFER + 24, BY0 + MOLD_IN],
    [BX1 - MOLD_IN, BY0 + MOLD_IN],
    [BX1 - MOLD_IN, BY1 - MOLD_IN],
    [BX0 + MOLD_IN, BY1 - MOLD_IN],
    [BX0 + MOLD_IN, BY0 + MOLD_IN + CHAMFER - 4],
    [BX0 + MOLD_IN + CHAMFER - 4, BY0 + MOLD_IN],
  ],
  [0, 3, 3, 3, 1, 1],
);

/**
 * One side's leads as a comb: along the package edge, out along a lead,
 * across its toe and back, so a whole side sweeps as one stroke. `side`
 * walks the package clockwise from the top.
 */
function pinComb(side: 0 | 1 | 2 | 3): string {
  // local frame: `along` runs clockwise round the body, `out` points away from it
  const frames: { o: P; along: P; out: P }[] = [
    { o: [C[0], BY0], along: [1, 0], out: [0, -1] },
    { o: [BX1, C[1]], along: [0, 1], out: [1, 0] },
    { o: [C[0], BY1], along: [-1, 0], out: [0, 1] },
    { o: [BX0, C[1]], along: [0, -1], out: [-1, 0] },
  ];
  const { o, along, out } = frames[side];
  const L = (a: number, h: number): P => add(o, add(mul(along, a), mul(out, h)));
  const span = PIN_OFF[PIN_OFF.length - 1] + 8;
  let d = `M${xy(L(-span, 0))}`;
  for (const a of PIN_OFF) {
    d += `L${xy(L(a - PIN_HW, 0))}L${xy(L(a - PIN_HW, PIN_L))}L${xy(L(a + PIN_HW, PIN_L))}L${xy(L(a + PIN_HW, 0))}`;
  }
  return `${d}L${xy(L(span, 0))}`;
}

/** Where pin `k` (0-based, clockwise on its side) ends, at its toe. */
function pinTip(side: 0 | 1 | 2 | 3, k: number): P {
  const a = PIN_OFF[k];
  if (side === 0) return [C[0] + a, BY0 - PIN_L];
  if (side === 1) return [BX1 + PIN_L, C[1] + a];
  if (side === 2) return [C[0] - a, BY1 + PIN_L];
  return [BX0 - PIN_L, C[1] - a];
}

/** The library's own mark, engraved on the package. */
const MARK = (() => {
  const k = 3.4;
  const o: P = [C[0], C[1] - 40];
  const q = (x: number, y: number): string => xy([o[0] + (x - 12) * k, o[1] + (y - 12) * k]);
  // the nav mark `M3 17 C6 6 10 6 12 12 S18 18 21 7`, with the S expanded
  return `M${q(3, 17)}C${q(6, 6)} ${q(10, 6)} ${q(12, 12)}C${q(14, 18)} ${q(18, 18)} ${q(21, 7)}`;
})();
export const MARKING = { x: C[0], y: C[1] + 24 };
export const PIN1: P = [BX0 + MOLD_IN + 18, BY0 + MOLD_IN + 18];

/* ── Connectors ───────────────────────────────────────────────────────────── */

const CW = 180;
const CH = 60;

type Enter = 'top' | 'bottom' | 'left' | 'right';

export interface Conn {
  id: ConnId;
  /** Engraved on the shell. */
  name: string;
  /** Reference designator and what the entry hands you. */
  title: string;
  entry: string;
  c: P;
  /** The edge the trace comes in through. */
  enter: Enter;
  wide: boolean;
  /** Engraved name, inside the shell. */
  nameAt: P;
  /** The label block outside the shell. */
  label: { x: number; y: number; anchor: 'start' | 'middle' | 'end' };
}

interface ConnSpec {
  id: ConnId;
  name: string;
  title: string;
  entry: string;
  c: P;
  enter: Enter;
  wide?: boolean;
}

const ROW_T = 88;
const ROW_B = 752;
const COL_L = 96;
const COL_R = 904;
const SIDE_HI = 240;
const SIDE_LO = 600;
/** Top and bottom rows: 300 apart, so even `svg-scroll-draw/web-component` clears its neighbours. */
const ROW_X = [200, 500, 800] as const;

const SPECS: ConnSpec[] = [
  { id: 'react', name: 'REACT', title: 'J1 · COMPONENT', entry: 'react', c: [ROW_X[0], ROW_T], enter: 'bottom' },
  { id: 'svelte', name: 'SVELTE', title: 'J2 · ACTION', entry: 'svelte', c: [ROW_X[1], ROW_T], enter: 'bottom' },
  { id: 'vue', name: 'VUE', title: 'J3 · COMPONENT', entry: 'vue', c: [ROW_X[2], ROW_T], enter: 'bottom' },
  { id: 'nuxt', name: 'NUXT', title: 'J4 · PLUGIN', entry: 'nuxt', c: [COL_R, SIDE_HI], enter: 'left', wide: true },
  { id: 'angular', name: 'ANGULAR', title: 'J5 · CLASS', entry: 'angular', c: [ROW_X[2], ROW_B], enter: 'top' },
  { id: 'wc', name: 'WEB COMPONENT', title: 'J6 · CUSTOM ELEMENT', entry: 'web-component', c: [ROW_X[1], ROW_B], enter: 'top' },
  { id: 'solid', name: 'SOLID', title: 'J7 · HOOK', entry: 'solid', c: [ROW_X[0], ROW_B], enter: 'top' },
  { id: 'astro', name: 'ASTRO', title: 'J8 · DATA ATTRIBUTE', entry: 'astro', c: [COL_L, SIDE_LO], enter: 'right', wide: true },
  { id: 'next', name: 'NEXT.JS', title: 'J9 · CLIENT COMPONENT', entry: 'react', c: [COL_L, SIDE_HI], enter: 'right', wide: true },
];

/** Shell outline, starting where the trace lands, with a polarising key on the far edge. */
function shell(s: ConnSpec): string {
  const [cx, cy] = s.c;
  const x0 = cx - CW / 2;
  const x1 = cx + CW / 2;
  const y0 = cy - CH / 2;
  const y1 = cy + CH / 2;
  const kw = 14;
  const kd = 5;
  const r = 7;
  const kr = 1.5;
  switch (s.enter) {
    case 'bottom':
      return outline(
        [[cx, y1], [x0, y1], [x0, y0], [cx - kw, y0], [cx - kw, y0 + kd], [cx + kw, y0 + kd], [cx + kw, y0], [x1, y0], [x1, y1]],
        [0, r, r, kr, kr, kr, kr, r, r],
      );
    case 'top':
      return outline(
        [[cx, y0], [x1, y0], [x1, y1], [cx + kw, y1], [cx + kw, y1 - kd], [cx - kw, y1 - kd], [cx - kw, y1], [x0, y1], [x0, y0]],
        [0, r, r, kr, kr, kr, kr, r, r],
      );
    case 'right':
      return outline(
        [[x1, cy], [x1, y1], [x0, y1], [x0, cy + kw], [x0 + kd, cy + kw], [x0 + kd, cy - kw], [x0, cy - kw], [x0, y0], [x1, y0]],
        [0, r, r, kr, kr, kr, kr, r, r],
      );
    case 'left':
      return outline(
        [[x0, cy], [x0, y0], [x1, y0], [x1, cy - kw], [x1 - kd, cy - kw], [x1 - kd, cy + kw], [x1, cy + kw], [x1, y1], [x0, y1]],
        [0, r, r, kr, kr, kr, kr, r, r],
      );
  }
}

/**
 * The insulator strip and its pins, facing the trace, and — on the long
 * connectors — the two board-lock pegs either side of it. Small parts: one
 * path, several subpaths.
 */
function header(s: ConnSpec): string {
  const [cx, cy] = s.c;
  const sq = (p: P, h: number): string => roundRect(p[0] - h, p[1] - h, p[0] + h, p[1] + h, 1);
  if (s.enter === 'top' || s.enter === 'bottom') {
    const sy = s.enter === 'bottom' ? cy + 16 : cy - 16;
    let d = roundRect(cx - 66, sy - 7.5, cx + 66, sy + 7.5, 3);
    for (let k = -3; k <= 3; k++) d += sq([cx + k * 18, sy], 3);
    d += circle([cx - 79, sy], 4) + circle([cx + 79, sy], 4);
    return d;
  }
  const sx = s.enter === 'right' ? cx + CW / 2 - 16 : cx - CW / 2 + 16;
  let d = roundRect(sx - 7.5, cy - 23, sx + 7.5, cy + 23, 3);
  for (let k = -1; k <= 1; k++) d += sq([sx, cy + k * 15], 3);
  return d;
}

/** Where the trace meets the shell. */
function landing(s: ConnSpec): P {
  const [cx, cy] = s.c;
  if (s.enter === 'bottom') return [cx, cy + CH / 2];
  if (s.enter === 'top') return [cx, cy - CH / 2];
  if (s.enter === 'right') return [cx + CW / 2, cy];
  return [cx - CW / 2, cy];
}

function place(s: ConnSpec): Conn {
  const [cx, cy] = s.c;
  let nameAt: P;
  let label: Conn['label'];
  if (s.enter === 'bottom') {
    nameAt = [cx, cy - 5];
    label = { x: cx, y: cy - CH / 2 - 12, anchor: 'middle' };
  } else if (s.enter === 'top') {
    nameAt = [cx, cy + 16];
    label = { x: cx, y: cy + CH / 2 + 22 + 21, anchor: 'middle' };
  } else {
    // side connectors: the label sits toward the middle of the sheet, clear of the bottom row's traces
    const below = cy < C[1];
    const x = s.enter === 'right' ? cx - CW / 2 : cx + CW / 2;
    nameAt = [s.enter === 'right' ? cx - 14 : cx + 14, cy + 5];
    label = { x, y: below ? cy + CH / 2 + 22 + 21 : cy - CH / 2 - 12, anchor: s.enter === 'right' ? 'start' : 'end' };
  }
  return { id: s.id, name: s.name, title: s.title, entry: s.entry, c: s.c, enter: s.enter, wide: !!s.wide, nameAt, label };
}

/* ── Routing ──────────────────────────────────────────────────────────────── */

const R_TRACE = 16;
const Y_TOP_RUN = 180;
const Y_BOT_RUN = 660;
const conn = (id: ConnId): ConnSpec => SPECS.find((s) => s.id === id)!;

/** The T where Next.js takes the same pin as React: both import `svg-scroll-draw/react`. */
export const TEE: P = [pinTip(0, 1)[0], SIDE_HI];

/**
 * A straight vertical run with a length-matching serpentine in it, as a
 * board designer adds one so every net arrives in step: five rungs whose
 * width is solved so the run comes out as long as `target`.
 */
function serpentine(from: P, to: P, dir: 1 | -1, target: number): { pts: P[] } {
  const rungs = 5;
  const pitch = 18;
  const lead = 34;
  const build = (amp: number): P[] => {
    const x = from[0];
    const pts: P[] = [from];
    let y = from[1] + dir * lead;
    pts.push([x, y]);
    let side = 1;
    pts.push([x + amp, y]);
    for (let k = 0; k < rungs - 1; k++) {
      y += dir * pitch;
      pts.push([x + side * amp, y]);
      side = -side;
      pts.push([x + side * amp, y]);
    }
    // the last rung comes back to the centre line and the run carries on
    pts[pts.length - 1] = [x, y];
    pts.push(to);
    return pts;
  };
  // bisection on the amplitude: length grows monotonically with it
  let lo = 8;
  let hi = 60;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (route(build(mid), R_TRACE).len < target) lo = mid;
    else hi = mid;
  }
  return { pts: build((lo + hi) / 2) };
}

interface Route {
  id: ConnId;
  d: string;
  len: number;
  /** Distance along the route at which each via sits. */
  vias: { c: P; s: number }[];
  /** Where the route starts: a pin, or the tee on another route. */
  from: P;
}

const ROUTES: Route[] = (() => {
  const out: Route[] = [];
  const mk = (id: ConnId, pts: P[], viaAt: { seg: number; t: number }[]) => {
    const r = route(pts, R_TRACE);
    // a via sits `t` of the way along straight segment `seg`
    const vias = viaAt.map(({ seg, t }) => {
      const a = pts[seg];
      const b = pts[seg + 1];
      const c: P = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const s0 = r.at(seg);
      return { c, s: s0 + len(sub(c, a)) - (seg > 0 ? R_TRACE * (1 - Math.PI / 4) : 0) };
    });
    out.push({ id, d: r.d, len: r.len, vias, from: pts[0] });
  };
  const top = (k: number) => pinTip(0, k);
  const bot = (k: number) => pinTip(2, PINS_PER_SIDE - 1 - k); // bottom side counts right→left
  const L = (id: ConnId) => landing(conn(id));

  // top row, out of the top side; the straight centre run is serpentined to match React's length
  const reactPts: P[] = [top(1), [top(1)[0], Y_TOP_RUN], [L('react')[0], Y_TOP_RUN], L('react')];
  const svelte = serpentine(top(5), L('svelte'), -1, route(reactPts, R_TRACE).len);
  mk('svelte', svelte.pts, [{ seg: svelte.pts.length - 2, t: 0.5 }]);
  // React's first via is the tee Next.js leaves from
  const teeT = (top(1)[1] - SIDE_HI) / (top(1)[1] - Y_TOP_RUN);
  mk('react', reactPts, [
    { seg: 0, t: teeT },
    { seg: 1, t: 0.5 },
  ]);
  mk('vue', [top(9), [top(9)[0], Y_TOP_RUN], [L('vue')[0], Y_TOP_RUN], L('vue')], [{ seg: 1, t: 0.5 }]);
  mk('nuxt', [top(10), [top(10)[0], SIDE_HI], L('nuxt')], [{ seg: 1, t: 0.74 }]);
  // bottom row, out of the bottom side
  const solidPts: P[] = [bot(1), [bot(1)[0], Y_BOT_RUN], [L('solid')[0], Y_BOT_RUN], L('solid')];
  const wc = serpentine(bot(5), L('wc'), 1, route(solidPts, R_TRACE).len);
  mk('wc', wc.pts, [{ seg: wc.pts.length - 2, t: 0.5 }]);
  mk('angular', [bot(9), [bot(9)[0], Y_BOT_RUN], [L('angular')[0], Y_BOT_RUN], L('angular')], [{ seg: 1, t: 0.5 }]);
  mk('solid', solidPts, [{ seg: 1, t: 0.5 }]);
  mk('astro', [bot(0), [bot(0)[0], SIDE_LO], L('astro')], [{ seg: 1, t: 0.74 }]);
  // Next.js leaves React's trace at the tee: same pin, same entry
  mk('next', [TEE, L('next')], []);
  return out;
})();

/** React's first via is the tee itself; it is drawn once, on React's net. */
const TEE_VIA_S = ROUTES.find((r) => r.id === 'react')!.vias[0].s;

/* ── Ground pour ──────────────────────────────────────────────────────────── */

const PX0 = 282;
const PX1 = 718;
const PY0 = 146;
const PY1 = 694;
const PCH = 46;
/** A copper zone as a board tool draws one: straight edges, 45° chamfers. Starts mid top edge. */
export const POUR = outline(
  [
    [(PX0 + PX1) / 2, PY0],
    [PX1 - PCH, PY0],
    [PX1, PY0 + PCH],
    [PX1, PY1 - PCH],
    [PX1 - PCH, PY1],
    [PX0 + PCH, PY1],
    [PX0, PY1 - PCH],
    [PX0, PY0 + PCH],
    [PX0 + PCH, PY0],
  ],
  [0, 4, 4, 4, 4, 4, 4, 4, 4],
);
/** Chip keep-out: the leads' toes plus clearance. */
export const KEEPOUT = roundRect(BX0 - PIN_L - 14, BY0 - PIN_L - 14, BX1 + PIN_L + 14, BY1 + PIN_L + 14, 10);

/** The pour's hatch as ONE serpentine path; the turns fall outside the pour, where the clip hides them. */
export const HATCH: string = (() => {
  const ang = deg(-45);
  const u: P = [Math.cos(ang), Math.sin(ang)];
  const v: P = [-Math.sin(ang), Math.cos(ang)];
  const gap = 13;
  const half = 420;
  const mid: P = [(PX0 + PX1) / 2, (PY0 + PY1) / 2];
  let d = '';
  let k = 0;
  for (let o = -27; o <= 27; o++, k++) {
    const base = add(mid, mul(v, o * gap));
    const a = add(base, mul(u, -half));
    const b = add(base, mul(u, half));
    const [from, to] = k % 2 === 0 ? [a, b] : [b, a];
    d += `${k === 0 ? 'M' : 'L'}${xy(from)}L${xy(to)}`;
  }
  return d;
})();

/* ── The clock ────────────────────────────────────────────────────────────── */

/*
 * Y1, an HC-49 crystal on the core's west side, its two leads on the pitch of
 * pins 9 and 11 so the traces run dead straight into them. The engine's clock
 * is requestAnimationFrame, and the label says so.
 */
const XTAL_PINS: P[] = [pinTip(3, 3), pinTip(3, 1)];
const XC: P = [222, (XTAL_PINS[0][1] + XTAL_PINS[1][1]) / 2];
const X_CAN = roundRect(XC[0] - 22, XC[1] - 44, XC[0] + 22, XC[1] + 44, 15);
const X_LIP =
  roundRect(XC[0] - 16, XC[1] - 38, XC[0] + 16, XC[1] + 38, 10) +
  XTAL_PINS.map((p) => roundRect(XC[0] + 22, p[1] - 4, XC[0] + 40, p[1] + 4, 1)).join('');
/** Both clock traces in one path: they sweep in together. */
const X_TRACES = XTAL_PINS.map((p) => `M${xy([XC[0] + 40, p[1]])}L${xy(p)}`).join('');

/* ── The board's edge ─────────────────────────────────────────────────────── */

const BOARD_R = 36;
/**
 * Two halves from the top centre to the bottom centre, one each way round:
 * a dash restarts at every subpath, so the outline closes symmetrically.
 */
const BOARD = (() => {
  const top: P = [(EDGE.x0 + EDGE.x1) / 2, EDGE.y0];
  const bot: P = [(EDGE.x0 + EDGE.x1) / 2, EDGE.y1];
  const west = route([top, [EDGE.x0, EDGE.y0], [EDGE.x0, EDGE.y1], bot], BOARD_R).d;
  const east = route([top, [EDGE.x1, EDGE.y0], [EDGE.x1, EDGE.y1], bot], BOARD_R).d;
  return west + east;
})();

/** M1–M4: plated mounting holes, concentric with the edge's corner arcs, each with a ring of stitching vias. */
export const HOLES: P[] = [
  [EDGE.x0 + 38, EDGE.y0 + 38],
  [EDGE.x1 - 38, EDGE.y0 + 38],
  [EDGE.x1 - 38, EDGE.y1 - 38],
  [EDGE.x0 + 38, EDGE.y1 - 38],
];
const hole = (c: P): string => {
  let d = circle(c, 16) + circle(c, 8.5);
  for (let k = 0; k < 8; k++) d += circle(polar(c, 23, deg(22.5 + k * 45)), 2.2);
  return d;
};

/* ── Annotations ──────────────────────────────────────────────────────────── */

export interface Note {
  d: string;
  dot: P;
  text: P;
  anchor: 'start' | 'end';
  key: 'tee' | 'gnd' | 'clk';
}

const leader = (from: P, elbow: P, to: P): string => `M${xy(from)}L${xy(elbow)}L${xy(to)}`;
const EDGE_L = 6;
const EDGE_R = 994;
const SHELF_TEE = 392;
const SHELF_GND = 602;
const GND_DOT: P = [690, 596];
const SHELF_CLK = 490;
const CLK_DOT: P = [XC[0] - 6, XC[1] + 12];

const NOTES_RAW: Note[] = [
  { d: leader(TEE, [300, SHELF_TEE], [EDGE_L, SHELF_TEE]), dot: TEE, text: [EDGE_L, SHELF_TEE - 10], anchor: 'start', key: 'tee' },
  { d: leader(GND_DOT, [740, SHELF_GND], [EDGE_R, SHELF_GND]), dot: GND_DOT, text: [EDGE_R, SHELF_GND - 10], anchor: 'end', key: 'gnd' },
  { d: leader(CLK_DOT, [168, SHELF_CLK], [EDGE_L, SHELF_CLK]), dot: CLK_DOT, text: [EDGE_L, SHELF_CLK - 10], anchor: 'start', key: 'clk' },
];

/** The package-height dimension, to the right of the chip. */
const DIM_X = 742;
const DIM_EXT0 = BX1 + 8;
const DIM_EXT1 = DIM_X + 12;

/* ── Assemble, in drawing order ───────────────────────────────────────────── */

const pieces: Piece[] = [];
const put = (d: string, w: Weight, tone: Tone, layer: Layer, extra: Partial<Piece> = {}) =>
  pieces.push({ d, w, tone, layer, ...extra });

// 1 · The core: body, leads, mould line, pin-1 dimple, the mark
put(PACKAGE, 'p', 'ink', 'chip', { net: 'core' });
for (const s of [0, 1, 2, 3] as const) put(pinComb(s), 's', 'ink', 'chip');
put(MOLD, 'h', 'mute', 'chip');
put(circle(PIN1, 6), 'h', 'ink', 'chip');
put(circle([BX1 - MOLD_IN - 22, BY0 + MOLD_IN + 22], 9, deg(180)), 'h', 'mute', 'chip');
put(MARK, 's', 'ink', 'chip', { net: 'core' });
export const CHIP_DONE_AT = pieces.length - 1;

// 2 · Ground pour: its edge, then the hatch, both cut round every trace
put(POUR, 'h', 'mute', 'pour', { under: 'clear' });
put(HATCH, 'h', 'faint', 'pour', { under: 'pour' });
export const POUR_AT = pieces.length - 1;

// 3 · Traces, from the core outward, then the clock's pair
const ORDER: ConnId[] = ['svelte', 'react', 'vue', 'angular', 'solid', 'wc', 'next', 'nuxt', 'astro'];
const TRACE_AT: Partial<Record<ConnId, number>> = {};
for (const id of ORDER) {
  const r = ROUTES.find((x) => x.id === id)!;
  TRACE_AT[id] = pieces.length;
  put(r.d, 'p', 'ink', 'trace', { net: id, wide: conn(id).wide });
}
put(X_TRACES, 'p', 'ink', 'trace');

// 4 · Vias: an annular ring each (the drill is a dot, set in type)
export interface Via {
  c: P;
  net: ConnId;
  wide: boolean;
  at: number;
}
const vias: Via[] = [];
for (const id of ORDER) {
  const r = ROUTES.find((x) => x.id === id)!;
  for (const v of r.vias) {
    vias.push({ c: v.c, net: id, wide: !!conn(id).wide, at: pieces.length });
    put(circle(v.c, 8), 'h', 'ink', 'via', { net: id, wide: conn(id).wide });
  }
}

// 5 · Connectors: shell, then the pin header
const SHELL_AT: Partial<Record<ConnId, number>> = {};
for (const id of ORDER) {
  const s = conn(id);
  SHELL_AT[id] = pieces.length;
  put(shell(s), 's', 'ink', 'conn', { net: id, wide: !!s.wide });
  put(header(s), 'h', 'mute', 'conn', { wide: !!s.wide });
}

// 6 · The board closes round them: its edge, then the four mounting holes
put(BOARD, 'p', 'ink', 'edge', { wide: true });
export const HOLE_AT = pieces.length;
for (const c of HOLES) put(hole(c), 'h', 'mute', 'edge', { wide: true });

// 7 · Parts: the clock, the decoupling capacitors in three corners of the
// keep-out, and the fiducials for the pick-and-place camera
put(X_CAN, 's', 'ink', 'part');
put(X_LIP, 'h', 'mute', 'part');
export const CAPS: P[] = [
  [BX1 + 18, BY0 - 18],
  [BX1 + 18, BY1 + 18],
  [BX0 - 18, BY1 + 18],
];
for (const c of CAPS) {
  put(roundRect(c[0] - 14, c[1] - 5, c[0] - 4, c[1] + 5, 1.5) + roundRect(c[0] + 4, c[1] - 5, c[0] + 14, c[1] + 5, 1.5), 'h', 'ink', 'part');
}
export const FIDUCIALS: P[] = [
  [44, 150],
  [956, 150],
  [44, 744],
  [956, 744],
];
export const FIDUCIAL_AT = pieces.length;
for (const p of FIDUCIALS) put(circle(p, 11), 'h', 'mute', 'part', { wide: true });

// 8 · The dimension: extension lines, then the arrows from the middle out
put(`M${xy([DIM_EXT0, BY0])}L${xy([DIM_EXT1, BY0])}`, 'h', 'mute', 'note');
put(`M${xy([DIM_EXT0, BY1])}L${xy([DIM_EXT1, BY1])}`, 'h', 'mute', 'note');
put(`M${xy([DIM_X, C[1] - 22])}L${xy([DIM_X, BY0])}l-4 7L${xy([DIM_X, BY0])}l4 7`, 'h', 'mute', 'note');
put(`M${xy([DIM_X, C[1] + 22])}L${xy([DIM_X, BY1])}l-4 -7L${xy([DIM_X, BY1])}l4 -7`, 'h', 'mute', 'note');
export const DIMENSION_AT = pieces.length - 1;
export const DIMENSION = { x: DIM_X + 16, y: C[1] };

// 9 · Leaders
const leaderAt: Record<Note['key'], number> = { tee: -1, gnd: -1, clk: -1 };
for (const n of NOTES_RAW) {
  leaderAt[n.key] = pieces.length;
  put(n.d, 'h', 'mute', 'note');
}

export const PIECES: readonly Piece[] = pieces;
export const CONNS: readonly Conn[] = ORDER.map((id) => place(conn(id)));
export const VIAS: readonly Via[] = vias;
export const NOTES: readonly Note[] = NOTES_RAW;
export const LEADER_AT: Readonly<Record<Note['key'], number>> = leaderAt;
export const TRACE_INDEX: Readonly<Record<ConnId, number>> = TRACE_AT as Record<ConnId, number>;
export const SHELL_INDEX: Readonly<Record<ConnId, number>> = SHELL_AT as Record<ConnId, number>;

/** What the mask cuts out of the pour: the chip, every trace and via, the notes that cross it. */
export const CLEARANCE = {
  keepout: KEEPOUT,
  traces: [...ROUTES.map((r) => ({ d: r.d, wide: conn(r.id).wide })), { d: X_TRACES, wide: false }],
  vias: vias.map((v) => ({ c: v.c, wide: v.wide })),
  lines: [
    `M${xy([DIM_EXT0, BY0])}L${xy([DIM_EXT1, BY0])}`,
    `M${xy([DIM_EXT0, BY1])}L${xy([DIM_EXT1, BY1])}`,
    ...NOTES_RAW.map((n) => n.d),
  ],
  dots: NOTES_RAW.map((n) => n.dot),
  /** The clock pair is cleared as one band: no sliver of copper between two traces. */
  zones: [roundRect(XC[0] + 40, XTAL_PINS[0][1] - 12, BX0, XTAL_PINS[1][1] + 12, 4)],
};

/**
 * The pulse that runs a lit trace: its path, its length, and how far along
 * another trace it waits before leaving — Next.js leaves the tee as React's
 * pulse passes it, so the two read as one current out of the core.
 */
export const PULSES: Readonly<Record<ConnId, { d: string; len: number; lead: number }>> = (() => {
  const out = {} as Record<ConnId, { d: string; len: number; lead: number }>;
  for (const r of ROUTES) out[r.id] = { d: r.d, len: r.len, lead: r.id === 'next' ? TEE_VIA_S : 0 };
  return out;
})();
export const CORE_PULSE = { d: PACKAGE, len: CORE_LEN };

/** Count of pieces in a layer, for labels that state real numbers. */
export const countLayer = (layer: Layer): number => pieces.filter((p) => p.layer === layer).length;
