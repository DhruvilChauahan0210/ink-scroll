/**
 * The geometry under `svg-scroll-draw/morph`, pure: no DOM, so it runs on a
 * server and in the unit tests exactly as in a browser.
 *
 * Every outline is turned into rings of cubic Béziers (lines, quadratics and
 * arcs converted exactly or, for arcs, within a hair), measured by arc length,
 * and two outlines are matched ring to ring. Each pair is cut at the same
 * fractions of its length — every corner of either outline plus `points` cuts
 * spaced evenly — so both have the same number of cubics, piece k of one
 * covering the same share of its outline as piece k of the other. The
 * in-between shape moves every control point in a straight line. Cutting a
 * cubic does not change the curve, so at t = 0 and t = 1 the result is the
 * outline itself, every corner kept.
 */

/** One cubic: x0 y0, the two control points, x3 y3. */
export type Cubic = number[];

export interface Ring {
  segs: Cubic[];
  closed: boolean;
}

/** A ring measured by arc length. */
interface Measured extends Ring {
  /** Each segment's cumulative length table, LUT_STEPS + 1 entries from 0. */
  luts: number[][];
  /** Where each segment starts, as a fraction of the ring's length; ends with 1. */
  at: number[];
  total: number;
  /** The shoelace area of the ring sampled: its sign is the winding. */
  area: number;
  cx: number;
  cy: number;
}

const LUT_STEPS = 16;
/** Samples per ring when aligning two of them. */
const ALIGN = 64;
const EPS = 1e-7;

// ── Parsing ───────────────────────────────────────────────────────────────────

const ARGS: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
const NUMBER = /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/y;

const line = (x0: number, y0: number, x1: number, y1: number): Cubic => [
  x0, y0, x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3, x0 + ((x1 - x0) * 2) / 3, y0 + ((y1 - y0) * 2) / 3, x1, y1,
];

/** An SVG arc as cubics, a quarter turn at most each (SVG 1.1 F.6.5–F.6.6). */
function arc(
  x1: number, y1: number, rx: number, ry: number, deg: number,
  large: number, sweep: number, x2: number, y2: number,
): Cubic[] {
  if (x1 === x2 && y1 === y2) return [];
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  if (!rx || !ry) return [line(x1, y1, x2, y2)];
  const phi = (deg * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const xp = cos * dx + sin * dy;
  const yp = -sin * dx + cos * dy;
  const lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
  let co = Math.sqrt(Math.max(0, num / (rx * rx * yp * yp + ry * ry * xp * xp)));
  if (large === sweep) co = -co;
  const cxp = (co * rx * yp) / ry;
  const cyp = (-co * ry * xp) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const ux = (xp - cxp) / rx;
  const uy = (yp - cyp) / ry;
  const start = angle(1, 0, ux, uy);
  let delta = angle(ux, uy, (-xp - cxp) / rx, (-yp - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  else if (sweep && delta < 0) delta += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2) - 1e-9));
  const step = delta / n;
  const k = (4 / 3) * Math.tan(step / 4);
  const pt = (th: number) => [cx + rx * Math.cos(th) * cos - ry * Math.sin(th) * sin, cy + rx * Math.cos(th) * sin + ry * Math.sin(th) * cos];
  const tan = (th: number) => [-rx * Math.sin(th) * cos - ry * Math.cos(th) * sin, -rx * Math.sin(th) * sin + ry * Math.cos(th) * cos];
  const out: Cubic[] = [];
  let [px, py] = [x1, y1];
  for (let i = 0; i < n; i++) {
    const a = start + i * step;
    const b = a + step;
    const ta = tan(a);
    const tb = tan(b);
    // The last end exactly where the arc said, not where cos and sin put it.
    const [qx, qy] = i === n - 1 ? [x2, y2] : pt(b);
    out.push([px, py, px + k * ta[0], py + k * ta[1], qx - k * tb[0], qy - k * tb[1], qx, qy]);
    [px, py] = [qx, qy];
  }
  return out;
}

/**
 * Path data as rings of cubics, in absolute coordinates. Every command of SVG
 * path data is read (relative ones, implicit repeats, S and T reflecting the
 * last control point, arcs with their flags run together as `a1 1 0 01 5 5`);
 * as in a browser, the path ends at the first error. A subpath that draws
 * nothing is dropped, and so is a segment of no length.
 */
export function parsePath(d: string): Ring[] {
  const rings: Ring[] = [];
  let ring: Ring | null = null;
  let i = 0;
  let cmd = '';
  let x = 0, y = 0, sx = 0, sy = 0;
  // The last control point, for S and T, and which kind it came from.
  let qx = 0, qy = 0, last = '';
  const skip = () => { while (i < d.length && ' \t\n\r\f,'.includes(d[i])) i++; };
  const read = (flag: boolean): number => {
    skip();
    if (flag) return d[i] === '0' || d[i] === '1' ? +d[i++] : NaN;
    NUMBER.lastIndex = i;
    const m = NUMBER.exec(d);
    if (!m) return NaN;
    i = NUMBER.lastIndex;
    return +m[0];
  };
  const end = () => {
    if (ring && ring.segs.length) rings.push(ring);
    ring = null;
  };
  const add = (c: Cubic) => {
    if (!ring) ring = { segs: [], closed: false };
    if (c.some((v, k) => v !== c[k & 1])) ring.segs.push(c);
  };

  for (;;) {
    skip();
    if (i >= d.length) break;
    if (/[a-zA-Z]/.test(d[i])) {
      // Path data starts with a moveto, or draws nothing.
      if (!cmd && d[i] !== 'M' && d[i] !== 'm') break;
      cmd = d[i++];
      if (!(cmd.toLowerCase() in ARGS)) break;
    } else if (!cmd || cmd === 'z' || cmd === 'Z') break;
    const lower = cmd.toLowerCase();
    const rel = cmd === lower;
    const a: number[] = [];
    for (let k = 0; k < ARGS[lower]; k++) a.push(read(lower === 'a' && (k === 3 || k === 4)));
    if (a.some(isNaN)) break;
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    let kind = '';
    switch (lower) {
      case 'm':
        end();
        x = sx = a[0] + ox;
        y = sy = a[1] + oy;
        // Pairs after the first are lines.
        cmd = rel ? 'l' : 'L';
        break;
      case 'z':
        if (ring) {
          if (x !== sx || y !== sy) add(line(x, y, sx, sy));
          (ring as Ring).closed = true;
        }
        end();
        x = sx;
        y = sy;
        break;
      case 'l': add(line(x, y, (x = a[0] + ox), (y = a[1] + oy))); break;
      case 'h': add(line(x, y, (x = a[0] + ox), y)); break;
      case 'v': add(line(x, y, x, (y = a[0] + oy))); break;
      case 'c':
      case 's': {
        const [c1x, c1y] = lower === 'c'
          ? [a[0] + ox, a[1] + oy]
          : last === 'c' ? [2 * x - qx, 2 * y - qy] : [x, y];
        const r = lower === 'c' ? 2 : 0;
        qx = a[r] + ox;
        qy = a[r + 1] + oy;
        const ex = a[r + 2] + ox;
        const ey = a[r + 3] + oy;
        add([x, y, c1x, c1y, qx, qy, ex, ey]);
        x = ex;
        y = ey;
        kind = 'c';
        break;
      }
      case 'q':
      case 't': {
        [qx, qy] = lower === 'q'
          ? [a[0] + ox, a[1] + oy]
          : last === 'q' ? [2 * x - qx, 2 * y - qy] : [x, y];
        const r = lower === 'q' ? 2 : 0;
        const ex = a[r] + ox;
        const ey = a[r + 1] + oy;
        add([x, y, x + ((qx - x) * 2) / 3, y + ((qy - y) * 2) / 3, ex + ((qx - ex) * 2) / 3, ey + ((qy - ey) * 2) / 3, ex, ey]);
        x = ex;
        y = ey;
        kind = 'q';
        break;
      }
      case 'a': {
        const ex = a[5] + ox;
        const ey = a[6] + oy;
        for (const c of arc(x, y, a[0], a[1], a[2], a[3], a[4], ex, ey)) add(c);
        x = ex;
        y = ey;
        break;
      }
    }
    last = kind;
  }
  end();
  return rings;
}

// ── Measuring ─────────────────────────────────────────────────────────────────

function point(c: Cubic, u: number): [number, number] {
  const v = 1 - u;
  const a = v * v * v, b = 3 * v * v * u, e = 3 * v * u * u, f = u * u * u;
  return [a * c[0] + b * c[2] + e * c[4] + f * c[6], a * c[1] + b * c[3] + e * c[5] + f * c[7]];
}

function measure(r: Ring): Measured {
  const luts = r.segs.map((c) => {
    const lut = [0];
    let [px, py] = [c[0], c[1]];
    for (let k = 1; k <= LUT_STEPS; k++) {
      const [qx, qy] = point(c, k / LUT_STEPS);
      lut.push(lut[k - 1] + Math.hypot(qx - px, qy - py));
      [px, py] = [qx, qy];
    }
    return lut;
  });
  const total = luts.reduce((s, l) => s + l[LUT_STEPS], 0);
  const at: number[] = [];
  let run = 0;
  luts.forEach((l) => {
    at.push(total ? run / total : 0);
    run += l[LUT_STEPS];
  });
  at.push(1);
  const m: Measured = { ...r, luts, at, total, area: 0, cx: 0, cy: 0 };
  // Area (the winding) and the middle, from points spaced evenly along it.
  const pts = Array.from({ length: ALIGN }, (_, k) => pointAt(m, k / ALIGN));
  pts.forEach(([px, py], k) => {
    const [nx, ny] = pts[(k + 1) % ALIGN];
    m.area += (px * ny - nx * py) / 2;
    m.cx += px / ALIGN;
    m.cy += py / ALIGN;
  });
  return m;
}

/** Which segment holds fraction `f` of the ring, and where in it, as the cubic's parameter. */
function locate(m: Measured, f: number, seg?: number): [number, number] {
  let j = seg ?? 0;
  if (seg == null) while (j < m.segs.length - 1 && m.at[j + 1] <= f) j++;
  const lut = m.luts[j];
  const len = Math.min(lut[LUT_STEPS], Math.max(0, (f - m.at[j]) * m.total));
  let k = 1;
  while (k < LUT_STEPS && lut[k] < len) k++;
  const span = lut[k] - lut[k - 1];
  return [j, (k - 1 + (span ? (len - lut[k - 1]) / span : 0)) / LUT_STEPS];
}

function pointAt(m: Measured, f: number): [number, number] {
  if (!m.segs.length) return [m.cx, m.cy];
  const [j, u] = locate(m, f);
  return point(m.segs[j], u);
}

/** The part of cubic `c` from parameter u0 to u1 (de Casteljau, twice). */
function part(c: Cubic, u0: number, u1: number): Cubic {
  const split = (c: Cubic, u: number): [Cubic, Cubic] => {
    const l = (a: number, b: number) => a + (b - a) * u;
    const ab = [l(c[0], c[2]), l(c[1], c[3])];
    const bc = [l(c[2], c[4]), l(c[3], c[5])];
    const cd = [l(c[4], c[6]), l(c[5], c[7])];
    const abc = [l(ab[0], bc[0]), l(ab[1], bc[1])];
    const bcd = [l(bc[0], cd[0]), l(bc[1], cd[1])];
    const p = [l(abc[0], bcd[0]), l(abc[1], bcd[1])];
    return [[c[0], c[1], ...ab, ...abc, ...p], [...p, ...bcd, ...cd, c[6], c[7]]];
  };
  if (u1 <= u0) {
    const [x, y] = point(c, u0);
    return [x, y, x, y, x, y, x, y];
  }
  let out = u1 < 1 ? split(c, u1)[0] : c;
  if (u0 > 0) out = split(out, u0 / u1)[1];
  return out;
}

function reverse(m: Measured): Measured {
  const segs = m.segs.map((c) => [c[6], c[7], c[4], c[5], c[2], c[3], c[0], c[1]]).reverse();
  return measure({ segs, closed: m.closed });
}

/** A ring of no size at (x, y), for an outline with no partner. */
const dot = (x: number, y: number, closed: boolean): Measured =>
  ({ segs: [], closed, luts: [], at: [0, 1], total: 0, area: 0, cx: x, cy: y });

// ── Matching ──────────────────────────────────────────────────────────────────

/**
 * Pair the rings of two outlines: closest middles and sizes first. A closed
 * ring left over on either side grows from, or shrinks to, a point at its own
 * middle — a hole opening in a letter, a dot appearing. An open one left over
 * splits from, or joins, the ring on the other side nearest it: a line
 * shrunk to a point would leave a dot wherever its stroke has round caps.
 */
export function pairRings(a: Ring[], b: Ring[]): Array<[Measured, Measured]> {
  const ma = a.map(measure);
  const mb = b.map(measure);
  const cost = (p: Measured, q: Measured) => (p.cx - q.cx) ** 2 + (p.cy - q.cy) ** 2 + ((p.total - q.total) / 4) ** 2;
  const costs: Array<[number, number, number]> = [];
  ma.forEach((p, i) => mb.forEach((q, j) => costs.push([cost(p, q), i, j])));
  costs.sort((p, q) => p[0] - q[0]);
  const toB = new Map<number, number>();
  const taken = new Set<number>();
  for (const [, i, j] of costs) {
    if (toB.has(i) || taken.has(j)) continue;
    toB.set(i, j);
    taken.add(j);
  }
  /** The partner for a ring left over: the nearest on the other side when it is open. */
  const spare = (p: Measured, others: Measured[]): Measured =>
    (!p.closed && others.reduce<Measured | undefined>((m, q) => (!m || cost(p, q) < cost(p, m) ? q : m), undefined)) ||
    dot(p.cx, p.cy, p.closed);
  const pairs: Array<[Measured, Measured]> = ma.map((p, i) => {
    const j = toB.get(i);
    return [p, j == null ? spare(p, mb) : mb[j]];
  });
  mb.forEach((q, j) => { if (!taken.has(j)) pairs.push([spare(q, ma), q]); });
  return pairs;
}

/** Fraction `f` of a ring whose start has moved on by `o`. */
const wrap = (f: number) => f - Math.floor(f);

/**
 * How to lay ring `b` over ring `a`: which way round to run `b`, and where
 * along each to start, for the least travel — the sum of squared distances
 * between points spaced evenly along both. Two closed rings keep their
 * windings matched (an outline turned inside out in between looks wrong) and
 * `b` turns to the best start; with an open one, only a closed ring can turn,
 * and both directions are tried.
 */
export function align(a: Measured, b: Measured): { b: Measured; oa: number; ob: number } {
  const turnA = a.closed && !b.closed;
  const turnB = b.closed;
  const rings = a.closed && b.closed && a.area && b.area
    ? [a.area * b.area < 0 ? reverse(b) : b]
    : [b, reverse(b)];
  const pa = Array.from({ length: ALIGN }, (_, k) => pointAt(a, k / ALIGN));
  let best = { b, oa: 0, ob: 0 };
  let low = Infinity;
  for (const ring of rings) {
    const pb = Array.from({ length: ALIGN }, (_, k) => pointAt(ring, k / ALIGN));
    for (let o = 0; o < (turnA || turnB ? ALIGN : 1); o++) {
      let cost = 0;
      for (let k = 0; k < ALIGN; k++) {
        const [x0, y0] = pa[turnA ? (k + o) % ALIGN : k];
        const [x1, y1] = pb[turnA ? k : (k + o) % ALIGN];
        cost += (x0 - x1) ** 2 + (y0 - y1) ** 2;
      }
      if (cost < low - EPS) {
        low = cost;
        best = { b: ring, oa: turnA ? o / ALIGN : 0, ob: turnB ? o / ALIGN : 0 };
      }
    }
  }
  return best;
}

/** `m` cut at `fracs` (ascending from 0, on a ring whose start moved on by `o`): one cubic per cut. */
function cut(m: Measured, fracs: number[], o: number): Cubic[] {
  if (!m.segs.length) return fracs.map(() => [m.cx, m.cy, m.cx, m.cy, m.cx, m.cy, m.cx, m.cy]);
  return fracs.map((f, k) => {
    let p = f + o;
    let q = (k + 1 < fracs.length ? fracs[k + 1] : 1) + o;
    if (p >= 1 - EPS) { p -= 1; q -= 1; }
    // No piece crosses a corner or the ring's own start: every one of them is a cut.
    const [j] = locate(m, (p + q) / 2);
    const u0 = Math.abs(p - m.at[j]) < EPS ? 0 : locate(m, p, j)[1];
    const u1 = Math.abs(q - m.at[j + 1]) < EPS ? 1 : locate(m, q, j)[1];
    return part(m.segs[j], u0, u1);
  });
}

/**
 * Both rings of a pair as the same number of cubics, piece k of each covering
 * the same share of its length, laid out as one list of numbers each: the
 * start point, then three points per cubic.
 */
export function matchPair(pa: Measured, pb: Measured, points: number): [number[], number[]] {
  const { b, oa, ob } = align(pa, pb);
  const set: number[] = [0];
  for (let k = 1; k < points; k++) set.push(k / points);
  pa.at.slice(0, -1).forEach((f) => set.push(wrap(f - oa)));
  b.at.slice(0, -1).forEach((f) => set.push(wrap(f - ob)));
  set.sort((p, q) => p - q);
  const fracs = set.filter((f, k) => f < 1 - EPS && (k === 0 || f - set[k - 1] > EPS));
  const flat = (cs: Cubic[]) => cs.reduce((out, c) => out.concat(c.slice(2)), cs[0].slice(0, 2));
  return [flat(cut(pa, fracs, oa)), flat(cut(b, fracs, ob))];
}
