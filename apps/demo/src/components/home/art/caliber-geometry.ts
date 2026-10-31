/**
 * Calibre — a watchmaker's caseback drawing of a hand-wound movement, built
 * from geometry rather than traced: real tooth counts, wheels placed on their
 * pitch circles so they mesh, bridges drawn the way a CAD draftsman would
 * (straight runs joined by tangent arcs), and an 11-turn Archimedean
 * hairspring.
 *
 * Pure module, no DOM and no randomness: the server and the client compute
 * byte-identical `d` strings. Every number is written with one decimal.
 *
 * Draw order matters. The library staggers elements in document order, and
 * Chromium restarts a dash pattern at every subpath (so a multi-subpath path
 * draws all its pieces at once), so anything that should sweep — the minute
 * ring, a wheel's teeth, the hairspring — is a single continuous subpath.
 */

export type Weight = 'p' | 's' | 'h';
export type Tone = 'ink' | 'mute' | 'faint' | 'accent';
export type Layer = 'case' | 'bridge' | 'train' | 'escape' | 'balance' | 'note';

export interface Piece {
  d: string;
  w: Weight;
  tone: Tone;
  layer: Layer;
  /**
   * `bridges`: hidden where a bridge covers it. `balance`: also hidden under
   * the balance wheel. `fork`: also hidden under the pallet fork (the escape
   * wheel). `inside`: only visible on a bridge (the striping).
   */
  under?: 'bridges' | 'balance' | 'fork' | 'inside';
}

type P = [number, number];

const TAU = Math.PI * 2;
const f = (n: number): string => {
  const s = n.toFixed(1);
  return s === '-0.0' ? '0.0' : s;
};
const xy = (p: P): string => `${f(p[0])} ${f(p[1])}`;
const polar = (c: P, r: number, a: number): P => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
const deg = (d: number): number => (d * Math.PI) / 180;
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P, k: number): P => [a[0] * k, a[1] * k];
const len = (a: P): number => Math.hypot(a[0], a[1]);
const unit = (a: P): P => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const angOf = (c: P, p: P): number => Math.atan2(p[1] - c[1], p[0] - c[0]);

/* ── Primitives ───────────────────────────────────────────────────────────── */

/** A full circle as one subpath, starting at angle `a0`, drawn clockwise. */
export function circle(c: P, r: number, a0 = -Math.PI / 2): string {
  const s = polar(c, r, a0);
  const m = polar(c, r, a0 + Math.PI);
  return `M${xy(s)}A${f(r)} ${f(r)} 0 1 1 ${xy(m)}A${f(r)} ${f(r)} 0 1 1 ${xy(s)}`;
}

/**
 * A closed outline through `pts` with every corner replaced by a tangent arc —
 * how a bridge is drawn in CAD. Radii are clamped so neighbouring arcs never
 * overlap. Drawing starts on the edge leading into the first vertex.
 */
export function roundedPoly(pts: P[], radii: number | number[]): string {
  const n = pts.length;
  const R = (i: number) => (Array.isArray(radii) ? radii[i] : radii);
  const corners = pts.map((v, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const u = unit(sub(prev, v));
    const w = unit(sub(next, v));
    const cos = Math.max(-1, Math.min(1, u[0] * w[0] + u[1] * w[1]));
    const theta = Math.acos(cos);
    const tanHalf = Math.tan(theta / 2) || 1e-6;
    let t = R(i) / tanHalf;
    const lim = Math.min(len(sub(prev, v)), len(sub(next, v))) * 0.48;
    let r = R(i);
    if (t > lim) {
      t = lim;
      r = t * tanHalf;
    }
    const d1 = sub(v, prev);
    const d2 = sub(next, v);
    const cross = d1[0] * d2[1] - d1[1] * d2[0];
    return { t1: add(v, mul(u, t)), t2: add(v, mul(w, t)), r, sweep: cross > 0 ? 1 : 0 };
  });
  let d = `M${xy(corners[n - 1].t2)}`;
  for (const c of corners) d += `L${xy(c.t1)}A${f(c.r)} ${f(c.r)} 0 0 ${c.sweep} ${xy(c.t2)}`;
  return d + 'Z';
}

/* ── Wheels ───────────────────────────────────────────────────────────────── */

export interface Wheel {
  c: P;
  z: number;
  m: number;
  phase: number;
}

const pitchR = (w: Wheel): number => (w.m * w.z) / 2;

/**
 * Watch-wheel outline: radial flanks below the pitch circle and a rounded
 * ogival addendum above it (the cycloidal form horology uses rather than a
 * true involute), joined by root arcs. One continuous subpath, so it sweeps.
 */
export function gearOutline(w: Wheel): string {
  const { c, z, m, phase } = w;
  const rp = pitchR(w);
  const ra = rp + 0.92 * m;
  const rr = rp - 1.18 * m;
  const pitch = TAU / z;
  const h = 0.23 * Math.PI * m;
  const wP = Math.asin(h / rp);
  const aP = rp * Math.cos(wP);
  const addn = ra - aP;
  const k = 0.5523;
  let d = '';
  for (let i = 0; i < z; i++) {
    const phi = phase + i * pitch;
    const u: P = [Math.cos(phi), Math.sin(phi)];
    const v: P = [-Math.sin(phi), Math.cos(phi)];
    const L = (a: number, x: number): P => add(c, add(mul(u, a), mul(v, x)));
    const rootS = polar(c, rr, phi - wP);
    if (i === 0) d += `M${xy(rootS)}`;
    d += `L${xy(L(aP, -h))}`;
    d += `C${xy(L(aP + addn * k, -h))} ${xy(L(ra, -h * k))} ${xy(L(ra, 0))}`;
    d += `C${xy(L(ra, h * k))} ${xy(L(aP + addn * k, h))} ${xy(L(aP, h))}`;
    d += `L${xy(polar(c, rr, phi + wP))}`;
    d += `A${f(rr)} ${f(rr)} 0 0 1 ${xy(polar(c, rr, phi + pitch - wP))}`;
  }
  return d + 'Z';
}

/** Rim radius just inside the tooth roots. */
const rimOf = (w: Wheel, band: number): number => pitchR(w) - 1.18 * w.m - band;

/* Cubic helpers for the spokes. */
type Cubic = [P, P, P, P];
function subCubic(q: Cubic, t0: number, t1: number): Cubic {
  // de Casteljau split at t1, then at t0/t1 on the left half.
  const split = (c: Cubic, t: number): [Cubic, Cubic] => {
    const ab = lerp(c[0], c[1], t), bc = lerp(c[1], c[2], t), cd = lerp(c[2], c[3], t);
    const abc = lerp(ab, bc, t), bcd = lerp(bc, cd, t), m = lerp(abc, bcd, t);
    return [[c[0], ab, abc, m], [m, bcd, cd, c[3]]];
  };
  const left = split(q, t1)[0];
  return split(left, t0 / t1)[1];
}
const rev = (q: Cubic): Cubic => [q[3], q[2], q[1], q[0]];

/**
 * The windows of a crossed-out wheel: `n` spokes from hub to rim, each an
 * S-curve with an angular `twist`, tapering from `wHub` to `wRim`. Each
 * window is one closed subpath with filleted corners.
 */
export function wheelWindows(
  c: P,
  n: number,
  rHub: number,
  rRim: number,
  wHub: number,
  wRim: number,
  twist: number,
  phase: number,
  fillet = 3,
): string[] {
  const L = rRim - rHub;
  const edge = (j: number, side: 1 | -1): Cubic => {
    const a0 = phase + (j * TAU) / n;
    const a1 = a0 + twist;
    const n0: P = [-Math.sin(a0), Math.cos(a0)];
    const n1: P = [-Math.sin(a1), Math.cos(a1)];
    const o0 = mul(n0, (side * wHub) / 2);
    const o1 = mul(n1, (side * wRim) / 2);
    return [
      add(polar(c, rHub, a0), o0),
      add(polar(c, rHub + L * 0.45, a0), o0),
      add(polar(c, rRim - L * 0.45, a1), o1),
      add(polar(c, rRim, a1), o1),
    ];
  };
  const out: string[] = [];
  for (let j = 0; j < n; j++) {
    const e1 = edge(j, 1);
    const e2 = edge(j + 1, -1);
    const approxLen = L * 1.05;
    const dt = Math.min(0.3, fillet / approxLen);
    const s1 = subCubic(e1, dt, 1 - dt);
    const s2 = rev(subCubic(e2, dt, 1 - dt));
    const aRim1 = angOf(c, e1[3]) + fillet / rRim;
    let aRim2 = angOf(c, e2[3]) - fillet / rRim;
    while (aRim2 < aRim1) aRim2 += TAU;
    const aHub2 = angOf(c, e2[0]) - fillet / rHub;
    let aHub1 = angOf(c, e1[0]) + fillet / rHub;
    while (aHub1 > aHub2) aHub1 -= TAU;
    const rim1 = polar(c, rRim, aRim1);
    const rim2 = polar(c, rRim, aRim2);
    const hub2 = polar(c, rHub, aHub2);
    const hub1 = polar(c, rHub, aHub1);
    const largeRim = aRim2 - aRim1 > Math.PI ? 1 : 0;
    const largeHub = aHub2 - aHub1 > Math.PI ? 1 : 0;
    let d = `M${xy(s1[0])}`;
    d += `C${xy(s1[1])} ${xy(s1[2])} ${xy(s1[3])}`;
    d += `Q${xy(e1[3])} ${xy(rim1)}`;
    d += `A${f(rRim)} ${f(rRim)} 0 ${largeRim} 1 ${xy(rim2)}`;
    d += `Q${xy(e2[3])} ${xy(s2[0])}`;
    d += `C${xy(s2[1])} ${xy(s2[2])} ${xy(s2[3])}`;
    d += `Q${xy(e2[0])} ${xy(hub2)}`;
    d += `A${f(rHub)} ${f(rHub)} 0 ${largeHub} 0 ${xy(hub1)}`;
    d += `Q${xy(e1[0])} ${xy(s1[0])}Z`;
    out.push(d);
  }
  return out;
}

/** Phase for wheel `b` so a gap faces wheel `a` while `a` points a tooth at `b`. */
function meshPhase(a: Wheel, b: Wheel): number {
  const theta = angOf(a.c, b.c);
  const pa = TAU / a.z;
  // angle of a's tooth nearest the line of centres
  const ka = Math.round((theta - a.phase) / pa);
  const toothA = a.phase + ka * pa;
  const off = theta - toothA; // a's tooth is `off` short of the line
  const ratio = a.z / b.z;
  return theta + Math.PI + TAU / b.z / 2 - off * ratio;
}

/** A wheel `b` of `z` teeth placed on `a`'s pitch circle at angle `ang`. */
function meshWith(a: Wheel, z: number, ang: number): Wheel {
  const dist = pitchR(a) + (a.m * z) / 2;
  const b: Wheel = { c: polar(a.c, dist, ang), z, m: a.m, phase: 0 };
  b.phase = meshPhase(a, b);
  return b;
}

/* ── Escapement ───────────────────────────────────────────────────────────── */

/** Swiss club-tooth escape wheel: forward-leaning teeth with a short club face. */
function escapeOutline(c: P, z: number, rTip: number, rRoot: number, phase: number): string {
  const p = TAU / z;
  let d = '';
  for (let i = 0; i < z; i++) {
    const phi = phase + i * p;
    const base0 = polar(c, rRoot, phi - 0.46 * p);
    const tip = polar(c, rTip, phi + 0.06 * p);
    const club = polar(c, rTip - 3.2, phi + 0.17 * p);
    const base1 = polar(c, rRoot, phi + 0.02 * p);
    const backCtl = polar(c, rRoot + (rTip - rRoot) * 0.78, phi - 0.3 * p);
    const faceCtl = polar(c, rRoot + (rTip - rRoot) * 0.45, phi + 0.02 * p);
    if (i === 0) d += `M${xy(base0)}`;
    d += `Q${xy(backCtl)} ${xy(tip)}`;
    d += `L${xy(club)}`;
    d += `Q${xy(faceCtl)} ${xy(base1)}`;
    d += `A${f(rRoot)} ${f(rRoot)} 0 0 1 ${xy(polar(c, rRoot, phi + p - 0.46 * p))}`;
  }
  return d + 'Z';
}

/* ── Hairspring ───────────────────────────────────────────────────────────── */

/**
 * Archimedean spiral from r0 to r1 over `turns`, as quarter-turn cubic
 * Béziers (Hermite from the analytic tangent), then an overcoil that lifts
 * to the stud. One subpath, drawn from the collet outward.
 */
function hairspring(c: P, r0: number, r1: number, turns: number, a0: number, stud: P): string {
  const span = turns * TAU;
  const at = (th: number): P => {
    const r = r0 + ((r1 - r0) * (th - a0)) / span;
    return polar(c, r, th);
  };
  const tan = (th: number): P => {
    const r = r0 + ((r1 - r0) * (th - a0)) / span;
    const dr = (r1 - r0) / span;
    return [dr * Math.cos(th) - r * Math.sin(th), dr * Math.sin(th) + r * Math.cos(th)];
  };
  const seg = Math.PI / 4;
  const steps = Math.round(span / seg);
  let d = `M${xy(at(a0))}`;
  for (let i = 0; i < steps; i++) {
    const ta = a0 + i * seg;
    const tb = ta + seg;
    const pa = at(ta), pb = at(tb);
    const da = tan(ta), db = tan(tb);
    d += `C${xy(add(pa, mul(da, seg / 3)))} ${xy(sub(pb, mul(db, seg / 3)))} ${xy(pb)}`;
  }
  // overcoil: leave the last turn tangentially, curve in to the stud
  const end = a0 + span;
  const pe = at(end);
  const te = unit(tan(end));
  d += `C${xy(add(pe, mul(te, 22)))} ${xy(add(stud, mul(unit(sub(pe, stud)), 10)))} ${xy(stud)}`;
  return d;
}

/* ── The movement ─────────────────────────────────────────────────────────── */

export const C: P = [500, 500];
export const R_CASE = 352;
export const R_PLATE = 296;
const M = 3.6;

export const W1: Wheel = { c: polar(C, 162, deg(-55)), z: 60, m: M, phase: deg(-55) };
export const W2: Wheel = (() => {
  const b: Wheel = { c: C, z: 30, m: M, phase: 0 };
  b.phase = meshPhase(W1, b);
  return b;
})();
export const WC: Wheel = meshWith(W1, 20, deg(26));
export const W3: Wheel = meshWith(W2, 18, deg(140));

export const BAL: P = polar(C, 170, deg(40));
const BAL_RIM = 80;
const BAL_RIM_IN = 72;
const BAL_AXIS = angOf(C, BAL); // the cock runs out along this line
const LEVER_DIR = deg(170);
export const ESC: P = polar(BAL, 172, LEVER_DIR);
const ESC_TIP = 38;
const ESC_ROOT = 28;
export const PIV: P = polar(ESC, 48, LEVER_DIR + Math.PI);
export const BAL_DISC = { c: BAL, r: BAL_RIM + 11 };

/**
 * A bridge whose outer edge is the movement's own edge: an open contour from
 * the plate circle back to the plate circle. `region` closes it along the
 * plate for masks and clips; `d` is what gets drawn.
 */
interface Bridge {
  d: string;
  region: string;
}
function plateBridge(a0: number, a1: number, inner: P[], radii: number[]): Bridge {
  const s = polar(C, R_PLATE, a0);
  const e = polar(C, R_PLATE, a1);
  const pts: P[] = [s, ...inner, e];
  // fillet every inner vertex; the end points sit on the plate
  let d = `M${xy(s)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1], v = pts[i], next = pts[i + 1];
    const u = unit(sub(prev, v)), w = unit(sub(next, v));
    const theta = Math.acos(Math.max(-1, Math.min(1, u[0] * w[0] + u[1] * w[1])));
    const tanHalf = Math.tan(theta / 2) || 1e-6;
    let r = radii[i - 1];
    let t = r / tanHalf;
    const lim = Math.min(len(sub(prev, v)) * (i === 1 ? 0.9 : 0.48), len(sub(next, v)) * (i === pts.length - 2 ? 0.9 : 0.48));
    if (t > lim) {
      t = lim;
      r = t * tanHalf;
    }
    const d1 = sub(v, prev), d2 = sub(next, v);
    const sweep = d1[0] * d2[1] - d1[1] * d2[0] > 0 ? 1 : 0;
    d += `L${xy(add(v, mul(u, t)))}A${f(r)} ${f(r)} 0 0 ${sweep} ${xy(add(v, mul(w, t)))}`;
  }
  d += `L${xy(e)}`;
  // close back along the plate edge, the long way round is never wanted
  const span = ((a0 - a1) % TAU + TAU) % TAU;
  const region = `${d}A${R_PLATE} ${R_PLATE} 0 ${span > Math.PI ? 1 : 0} 1 ${xy(s)}Z`;
  return { d, region };
}

const TRAIN_BRIDGE = plateBridge(
  deg(236),
  deg(76),
  [
    [376, 318],
    [370, 470],
    [517, 483],
    [517, 517],
    [398, 517],
    [352, 592],
    [370, 704],
    [530, 712],
  ],
  // the two 18s close the arm in a near-semicircle round the centre jewel
  [70, 30, 18, 18, 24, 56, 56, 40],
);

const COCK = (() => {
  const ax = BAL_AXIS;
  const nrm = ax + Math.PI / 2;
  const span = deg(10.5);
  const at = (r: number, x: number): P => add(polar(BAL, r, ax), polar([0, 0], x, nrm));
  return plateBridge(
    ax + span,
    ax - span,
    [at(64, 21), at(8, 19), at(-24, 0), at(8, -19), at(64, -21)],
    [70, 20, 22, 20, 70],
  );
})();

/**
 * The escape-wheel cock: a slim tapered bar from the wheel's arbor to a
 * screwed foot. It covers only the hub, so the club teeth and the pallet fork
 * stay legible.
 */
const ESC_FOOT: P = polar(ESC, 46, deg(128));
const ESC_BRIDGE: Bridge = (() => {
  const u = unit(sub(ESC_FOOT, ESC));
  const n: P = [-u[1], u[0]];
  const d = roundedPoly(
    [
      add(sub(ESC, mul(u, 11)), mul(n, 11)),
      add(add(ESC_FOOT, mul(u, 10)), mul(n, 10)),
      sub(add(ESC_FOOT, mul(u, 10)), mul(n, 10)),
      sub(sub(ESC, mul(u, 11)), mul(n, 11)),
    ],
    [11, 10, 10, 11],
  );
  return { d, region: d };
})();

export const BRIDGES: Bridge[] = [TRAIN_BRIDGE, COCK, ESC_BRIDGE];

function screw(c: P, r: number, slot: number): string {
  const a = polar(c, r * 0.72, slot);
  const b = polar(c, r * 0.72, slot + Math.PI);
  return `${circle(c, r, slot + Math.PI / 2)}M${xy(a)}L${xy(b)}`;
}
function jewel(c: P, r: number): string {
  return `${circle(c, r)}${circle(c, r * 0.46)}`;
}

/** The pallet fork: an anchor whose arms straddle the escape wheel. */
function palletFork(): { body: string; stones: string[] } {
  const dir = angOf(PIV, BAL);
  const back = dir + Math.PI;
  const L = (a: number, x: number): P =>
    add(PIV, add(mul([Math.cos(dir), Math.sin(dir)], a), mul([-Math.sin(dir), Math.cos(dir)], x)));
  const reach = len(sub(BAL, PIV)) - 16;
  const spread = deg(32);
  const sIn = polar(ESC, ESC_TIP + 1.2, back + Math.PI - spread);
  const sOut = polar(ESC, ESC_TIP + 1.2, back + Math.PI + spread);
  const toLocal = (p: P): P => {
    const d = sub(p, PIV);
    return [d[0] * Math.cos(dir) + d[1] * Math.sin(dir), -d[0] * Math.sin(dir) + d[1] * Math.cos(dir)];
  };
  const a = toLocal(sIn);
  const b = toLocal(sOut);
  const pts: P[] = [
    L(reach, -3),
    L(reach, -9),
    L(reach + 8, -11),
    L(reach - 6, -14),
    L(reach * 0.45, -4.5),
    L(8, -7),
    L(a[0] + 9, a[1] - 6),
    L(a[0] + 2, a[1] - 7),
    L(a[0] - 1, a[1] + 4),
    L(-4, -2),
    L(b[0] - 1, b[1] - 4),
    L(b[0] + 2, b[1] + 7),
    L(b[0] + 9, b[1] + 6),
    L(8, 7),
    L(reach * 0.45, 4.5),
    L(reach - 6, 14),
    L(reach + 8, 11),
    L(reach, 9),
    L(reach, 3),
  ];
  const radii = [1.5, 1.5, 3, 10, 30, 10, 3, 2, 6, 10, 6, 2, 3, 10, 30, 10, 3, 1.5, 1.5];
  const stone = (s: P, ang: number): string => {
    const u: P = [Math.cos(ang), Math.sin(ang)];
    const v: P = [-Math.sin(ang), Math.cos(ang)];
    const q = (a2: number, x: number): P => add(s, add(mul(u, a2), mul(v, x)));
    return roundedPoly([q(-2.5, -2.4), q(9, -2.4), q(9, 2.4), q(-2.5, 2.4)], 0.8);
  };
  return {
    body: roundedPoly(pts, radii),
    stones: [stone(sIn, angOf(ESC, sIn) + Math.PI), stone(sOut, angOf(ESC, sOut) + Math.PI)],
  };
}

/** The pallet fork, computed once: its body doubles as a mask region. */
const FORK = palletFork();
export const FORK_REGION: string = FORK.body;

/* ── Assemble, in drawing order ───────────────────────────────────────────── */

const pieces: Piece[] = [];
const put = (d: string, w: Weight, tone: Tone, layer: Layer, under?: Piece['under']) =>
  pieces.push({ d, w, tone, layer, under });

/**
 * Côtes de Genève as ONE serpentine path: each stripe runs the full width and
 * turns round outside the plate, where the bridge clip hides the turn. One
 * subpath means the stripes engrave one after another instead of all at once.
 */
export const STRIPES: string = (() => {
  const ang = deg(-58);
  const u: P = [Math.cos(ang), Math.sin(ang)];
  const v: P = [-Math.sin(ang), Math.cos(ang)];
  const gap = 15;
  const half = 330;
  let d = '';
  let k = 0;
  for (let o = -19; o <= 19; o++, k++) {
    const base = add(C, mul(v, o * gap));
    const a = add(base, mul(u, -half));
    const b = add(base, mul(u, half));
    const [from, to] = k % 2 === 0 ? [a, b] : [b, a];
    const mid = add(lerp(from, to, 0.5), mul(v, 9));
    d += k === 0 ? `M${xy(from)}` : `L${xy(from)}`;
    d += `Q${xy(mid)} ${xy(to)}`;
  }
  return d;
})();

/* ── Annotations (defined before assembly; each draws after its layer) ──── */

export interface Note {
  /** Leader path (drawn), starting at the feature. */
  d: string;
  dot: P;
  text: P;
  anchor: 'start' | 'end';
  title: string;
  key: 'train' | 'bridge' | 'escape' | 'balance';
  accent?: boolean;
}

const leader = (from: P, elbow: P, to: P): string => `M${xy(from)}L${xy(elbow)}L${xy(to)}`;
const SHELF_TOP = 186;
const SHELF_BOT = 834;
const trainDot = polar(W1.c, 96, deg(-38));
const bridgeDot: P = [330, 430];
const escDot = polar(ESC, 30, deg(205));
// below the balance cock, so the red leader never crosses it
const hsDot = polar(BAL, 50, deg(115));
/* Labels hang off the outer edges, clear of the Ø extension lines at x 148 / 852. */
const EDGE_L = 24;
const EDGE_R = 976;

const NOTES_RAW: Note[] = [
  { d: leader(bridgeDot, [216, SHELF_TOP], [EDGE_L, SHELF_TOP]), dot: bridgeDot, text: [EDGE_L, SHELF_TOP - 10], anchor: 'start', title: 'BRIDGES', key: 'bridge' },
  { d: leader(trainDot, [784, SHELF_TOP], [EDGE_R, SHELF_TOP]), dot: trainDot, text: [EDGE_R, SHELF_TOP - 10], anchor: 'end', title: 'GEAR TRAIN', key: 'train' },
  { d: leader(escDot, [250, SHELF_BOT], [EDGE_L, SHELF_BOT]), dot: escDot, text: [EDGE_L, SHELF_BOT - 10], anchor: 'start', title: 'ESCAPEMENT', key: 'escape' },
  { d: leader(hsDot, [740, SHELF_BOT], [EDGE_R, SHELF_BOT]), dot: hsDot, text: [EDGE_R, SHELF_BOT - 10], anchor: 'end', title: 'HAIRSPRING', key: 'balance', accent: true },
];
/** Index in PIECES of each note's leader, filled in during assembly. */
const leaderAt: Record<Note['key'], number> = { bridge: -1, train: -1, escape: -1, balance: -1 };
const putNote = (key: Note['key']) => {
  const n = NOTES_RAW.find((x) => x.key === key)!;
  leaderAt[key] = pieces.length;
  put(n.d, 'h', n.accent ? 'accent' : 'mute', 'note');
};

// 1 · Case
put(`M${xy([C[0] - 430, C[1]])}L${xy([C[0] + 430, C[1]])}`, 'h', 'faint', 'case');
put(`M${xy([C[0], C[1] - 386])}L${xy([C[0], C[1] + 386])}`, 'h', 'faint', 'case');
put(circle(C, R_CASE, deg(180)), 'p', 'ink', 'case');
put(circle(C, R_CASE - 12, deg(180)), 'h', 'mute', 'case');
{
  // Minute ring as one comb: along the outer circle, in and back out at each tick.
  const rO = R_CASE - 24;
  let d = '';
  for (let i = 0; i < 60; i++) {
    const a = deg(-90 + i * 6);
    const rI = i % 5 === 0 ? rO - 16 : rO - 7;
    const o = polar(C, rO, a);
    d += i === 0 ? `M${xy(o)}` : `A${f(rO)} ${f(rO)} 0 0 1 ${xy(o)}`;
    d += `L${xy(polar(C, rI, a))}L${xy(o)}`;
  }
  d += `A${f(rO)} ${f(rO)} 0 0 1 ${xy(polar(C, rO, deg(-90)))}`;
  put(d, 'h', 'mute', 'case');
}
put(circle(C, R_PLATE, deg(-90)), 's', 'ink', 'case');
{
  // Crown, tube and stem at three o'clock.
  const x0 = C[0] + R_CASE;
  put(roundedPoly([[x0 - 1, C[1] - 13], [x0 + 15, C[1] - 13], [x0 + 15, C[1] + 13], [x0 - 1, C[1] + 13]], 2), 's', 'ink', 'case');
  const cx0 = x0 + 15;
  const cx1 = cx0 + 32;
  put(roundedPoly([[cx0, C[1] - 38], [cx1, C[1] - 38], [cx1, C[1] + 38], [cx0, C[1] + 38]], [4, 10, 10, 4]), 'p', 'ink', 'case');
  let d = '';
  const rows = 9;
  for (let i = 0; i < rows; i++) {
    const y = C[1] - 28 + (56 / (rows - 1)) * i;
    const a: P = [cx0 + 6, y];
    const b: P = [cx1 - 5, y];
    if (i === 0) d += `M${xy(a)}L${xy(b)}`;
    else if (i % 2 === 1) d += `L${xy(b)}L${xy(a)}`;
    else d += `L${xy(a)}L${xy(b)}`;
  }
  put(d, 'h', 'mute', 'case');
  const xs = C[0] + R_PLATE + 2;
  put(`M${xy([x0 - 2, C[1] - 4])}L${xy([xs, C[1] - 4])}L${xy([xs, C[1] + 4])}L${xy([x0 - 2, C[1] + 4])}`, 'h', 'mute', 'case');
}

// 1b · The case dimension, drawn from the centre outward
const dimY = C[1] - R_CASE - 46;
{
  const xl = C[0] - R_CASE;
  const xr = C[0] + R_CASE;
  put(`M${xy([xl, C[1] - 16])}L${xy([xl, dimY - 10])}`, 'h', 'mute', 'note');
  put(`M${xy([xr, C[1] - 50])}L${xy([xr, dimY - 10])}`, 'h', 'mute', 'note');
  put(`M${xy([C[0], dimY])}L${xy([xl, dimY])}l7 -4L${xy([xl, dimY])}l7 4`, 'h', 'mute', 'note');
  put(`M${xy([C[0], dimY])}L${xy([xr, dimY])}l-7 -4L${xy([xr, dimY])}l-7 4`, 'h', 'mute', 'note');
}
export const DIMENSION_AT = pieces.length - 1;

// 2 · Bridges, their stripes, screws and jewels
for (const b of BRIDGES) put(b.d, 's', 'ink', 'bridge');
put(STRIPES, 'h', 'faint', 'bridge', 'inside');
put(screw([318, 352], 8, deg(30)), 'h', 'ink', 'bridge');
put(screw([292, 640], 8, deg(-20)), 'h', 'ink', 'bridge');
put(screw([470, 756], 8, deg(40)), 'h', 'ink', 'bridge');
put(screw(polar(BAL, 112, BAL_AXIS), 7.5, deg(60)), 'h', 'ink', 'bridge');
put(screw(ESC_FOOT, 6.5, deg(10)), 'h', 'ink', 'bridge');
put(jewel(W2.c, 9), 'h', 'ink', 'bridge');
put(jewel(W3.c, 7.5), 'h', 'ink', 'bridge');
put(jewel(ESC, 7), 'h', 'ink', 'bridge');
put(jewel(PIV, 6), 'h', 'ink', 'bridge');
putNote('bridge');

// 3 · Gear train
{
  const w1Rim = rimOf(W1, 9);
  put(gearOutline(W1), 'p', 'ink', 'train');
  for (const d of wheelWindows(W1.c, 5, 24, w1Rim, 9, 7, deg(34), deg(-55), 4)) put(d, 's', 'ink', 'train');
  put(circle(W1.c, 13), 's', 'ink', 'train');
  put(screw(W1.c, 8, deg(45)), 'h', 'ink', 'train');

  put(gearOutline(WC), 's', 'ink', 'train');
  for (const d of wheelWindows(WC.c, 4, 11, rimOf(WC, 6), 6, 5, deg(26), deg(10), 2.5)) put(d, 'h', 'ink', 'train');
  put(circle(WC.c, 5), 'h', 'ink', 'train');

  put(gearOutline(W2), 's', 'ink', 'train', 'bridges');
  for (const d of wheelWindows(W2.c, 4, 16, rimOf(W2, 7), 7, 6, deg(18), deg(20), 3)) put(d, 'h', 'ink', 'train', 'bridges');

  put(gearOutline(W3), 's', 'ink', 'train', 'bridges');
  for (const d of wheelWindows(W3.c, 3, 12, rimOf(W3, 5), 6, 5, deg(14), deg(-30), 2.5)) put(d, 'h', 'ink', 'train', 'bridges');
}
putNote('train');

// 4 · Escapement
{
  put(escapeOutline(ESC, 15, ESC_TIP, ESC_ROOT, deg(12)), 's', 'ink', 'escape', 'fork');
  for (const d of wheelWindows(ESC, 5, 9, ESC_ROOT - 5, 4, 3.5, 0, deg(12), 2)) put(d, 'h', 'ink', 'escape', 'fork');
  put(FORK.body, 's', 'ink', 'escape', 'balance');
  for (const s of FORK.stones) put(s, 'h', 'ink', 'escape', 'balance');
}
putNote('escape');

// 5 · Balance and hairspring
{
  put(circle(BAL, BAL_RIM, BAL_AXIS + Math.PI), 'p', 'ink', 'balance', 'bridges');
  for (const d of wheelWindows(BAL, 4, 10, BAL_RIM_IN, 6, 6, 0, deg(-5), 3)) put(d, 's', 'ink', 'balance', 'bridges');
  for (let g = 0; g < 4; g++) {
    for (let s = -1; s <= 1; s++) {
      const a = deg(-5 + 45 + g * 90 + s * 13);
      const u: P = [Math.cos(a), Math.sin(a)];
      const v: P = [-Math.sin(a), Math.cos(a)];
      const q = (r: number, x: number): P => add(BAL, add(mul(u, r), mul(v, x)));
      put(
        roundedPoly([q(BAL_RIM + 1.5, -3.2), q(BAL_RIM + 7.5, -3.2), q(BAL_RIM + 7.5, 3.2), q(BAL_RIM + 1.5, 3.2)], 1.2),
        'h',
        'ink',
        'balance',
        'bridges',
      );
    }
  }
  const studAng = BAL_AXIS + deg(34);
  put(hairspring(BAL, 11, 61, 11, studAng - 11 * TAU, polar(BAL, 67, studAng)), 'h', 'accent', 'balance', 'bridges');
  put(jewel(BAL, 8), 'h', 'ink', 'balance');
  // regulator: a fine scale on the cock and the index arm that reads it
  {
    const dir = BAL_AXIS;
    const scaleR = 92;
    let d = '';
    const n = 9;
    const a0 = dir - deg(11);
    const a1 = dir + deg(11);
    for (let i = 0; i < n; i++) {
      const a = a0 + ((a1 - a0) * i) / (n - 1);
      const o = polar(BAL, scaleR, a);
      const r2 = scaleR + (i % 4 === 0 ? 8 : 4.5);
      d += i === 0 ? `M${xy(o)}` : `A${f(scaleR)} ${f(scaleR)} 0 0 1 ${xy(o)}`;
      d += `L${xy(polar(BAL, r2, a))}L${xy(o)}`;
    }
    put(d, 'h', 'mute', 'balance');
    put(`M${xy(polar(BAL, 12, dir + deg(3)))}L${xy(polar(BAL, scaleR - 3, dir + deg(3)))}`, 'h', 'ink', 'balance');
  }
}

putNote('balance');

export const PIECES: readonly Piece[] = pieces;
export const NOTES: readonly Note[] = NOTES_RAW;
/** Index in PIECES of each note's leader line. */
export const LEADER_AT: Readonly<Record<Note['key'], number>> = leaderAt;
export const DIMENSION = { x: C[0], y: dimY - 12, text: 'Ø 38.0 mm' };

/** Count of pieces in a layer, for labels that state real numbers. */
export const countLayer = (layer: Layer): number => pieces.filter((p) => p.layer === layer).length;
/** Index of the last piece in a layer. */
export const lastIndex = (layer: Layer): number => {
  let k = -1;
  pieces.forEach((p, i) => {
    if (p.layer === layer) k = i;
  });
  return k;
};
