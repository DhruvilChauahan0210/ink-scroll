/**
 * CSS cubic-bezier() as numbers, for the cubic-bezier generator
 * (/cubic-bezier-generator). Pure: no DOM, so the page, its figure, the tool
 * and the node tests all use the same maths.
 *
 * A cubic-bezier(x1, y1, x2, y2) is the Bézier curve through P0 (0, 0) and
 * P3 (1, 1) pulled by P1 (x1, y1) and P2 (x2, y2). Along the curve, at a
 * parameter s from 0 to 1, both coordinates are cubic polynomials:
 *
 *   x(s) = 3·x1·s(1 − s)² + 3·x2·s²(1 − s) + s³      (time)
 *   y(s) = 3·y1·s(1 − s)² + 3·y2·s²(1 − s) + s³      (progress)
 *
 * Easing time t is the inverse problem: find the s with x(s) = t, then read
 * y(s). With x1 and x2 in 0–1, x(s) never falls, so that s is unique.
 */

/** The four numbers of a cubic-bezier(): P1 then P2. */
export type Bezier = readonly [x1: number, y1: number, x2: number, y2: number];

/** How close x(s) has to come to t. The same order as browsers use. */
export const EPSILON = 1e-7;

/** Lowest and highest y the editor allows. CSS itself takes any y. */
export const Y_MIN = -5;
export const Y_MAX = 5;

/** One coordinate's polynomial, written ((a·s + b)·s + c)·s, from its two control values. */
function poly(p1: number, p2: number) {
  const c = 3 * p1;
  const b = 3 * (p2 - p1) - c;
  const a = 1 - c - b;
  return {
    at: (s: number) => ((a * s + b) * s + c) * s,
    slope: (s: number) => (3 * a * s + 2 * b) * s + c,
  };
}

/** The curve's point at parameter s (not at time s). */
export function pointAt([x1, y1, x2, y2]: Bezier, s: number): { x: number; y: number } {
  return { x: poly(x1, x2).at(s), y: poly(y1, y2).at(s) };
}

/**
 * The parameter s at which x(s) = t: Newton–Raphson from s = t, which takes a
 * few steps wherever the curve is not flat in x, then bisection, which always
 * gets there because x(s) rises from 0 to 1. Newton is abandoned as soon as
 * the slope is near 0 (cubic-bezier(1, 0, 0, 1) has slope 0 at s = 0.5) or a
 * step leaves 0–1, where another root of the cubic could be waiting.
 */
export function solveS([x1, , x2]: Bezier, t: number): { s: number; newton: number; bisection: number } {
  if (t <= 0) return { s: 0, newton: 0, bisection: 0 };
  if (t >= 1) return { s: 1, newton: 0, bisection: 0 };
  const x = poly(x1, x2);
  let s = t;
  for (let i = 0; i < 8; i++) {
    const e = x.at(s) - t;
    if (Math.abs(e) < EPSILON) return { s, newton: i, bisection: 0 };
    const d = x.slope(s);
    if (Math.abs(d) < 1e-6) break;
    s -= e / d;
    if (s < 0 || s > 1) break;
  }
  let lo = 0;
  let hi = 1;
  s = t;
  let n = 0;
  while (hi - lo > EPSILON) {
    const e = x.at(s) - t;
    if (Math.abs(e) < EPSILON) break;
    if (e < 0) lo = s;
    else hi = s;
    s = (lo + hi) / 2;
    n++;
  }
  return { s, newton: 8, bisection: n };
}

/**
 * cubic-bezier(x1, y1, x2, y2) as a function of time t (0 → 1), the shape
 * svg-scroll-draw's `easing` option takes. 0 and 1 are exact, a straight line
 * is t itself, and anything between is solved as solveS() describes.
 */
export function bezierEasing(b: Bezier): (t: number) => number {
  const [x1, y1, x2, y2] = b;
  if (x1 === y1 && x2 === y2) return (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t);
  const y = poly(y1, y2);
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return y.at(solveS(b, t).s);
  };
}

/** True when the curve is a straight line from (0, 0) to (1, 1): linear. */
export const isLinear = ([x1, y1, x2, y2]: Bezier) => x1 === y1 && x2 === y2;

/** The same curve played backwards in time and progress: ease-in becomes ease-out. */
export const mirror = ([x1, y1, x2, y2]: Bezier): Bezier => [round6(1 - x2), round6(1 - y2), round6(1 - x1), round6(1 - y1)];

/** Lowest and highest value the curve reaches, and where. */
export function bezierRange(b: Bezier, n = 400): { min: number; minAt: number; max: number; maxAt: number } {
  const f = bezierEasing(b);
  let min = 0, minAt = 0, max = 1, maxAt = 1;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const v = f(t);
    if (v < min) { min = v; minAt = t; }
    if (v > max) { max = v; maxAt = t; }
  }
  return { min, minAt, max, maxAt };
}

/**
 * De Casteljau's construction at s: the three points on the control polygon,
 * the two between them, and the point on the curve. The figure draws it.
 */
export function casteljau([x1, y1, x2, y2]: Bezier, s: number) {
  const lerp = (a: [number, number], b: [number, number]): [number, number] => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
  const p0: [number, number] = [0, 0];
  const p1: [number, number] = [x1, y1];
  const p2: [number, number] = [x2, y2];
  const p3: [number, number] = [1, 1];
  const q = [lerp(p0, p1), lerp(p1, p2), lerp(p2, p3)] as const;
  const r = [lerp(q[0], q[1]), lerp(q[1], q[2])] as const;
  return { q, r, b: lerp(r[0], r[1]) };
}

/**
 * The cubic-bezier with x controls at 1/3 and 2/3 that is exactly the
 * polynomial c1·t + c2·t² + (1 − c1 − c2)·t³. With those x controls x(s) = s,
 * so y(s) is the curve itself (the library's own trick for its ease-in and
 * ease-out, packages/svg-scroll-draw/src/core/css-easing.ts:23-36).
 */
export function exactCubic(c1: number, c2: number): Bezier {
  return [round6(1 / 3), round6(c1 / 3), round6(2 / 3), round6((c2 + 2 * c1) / 3)];
}

// ── Reading and writing ─────────────────────────────────────────────────────

export const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/** A number as CSS wants it: up to 6 decimals, no trailing zeros, no "-0". */
export function fmt(n: number): string {
  const s = String(round6(n));
  return s === '-0' ? '0' : s;
}

export const cssOf = (b: Bezier) => `cubic-bezier(${b.map(fmt).join(', ')})`;

/** Two numbers equal to the 6 decimals the generator writes. */
export const sameBezier = (a: Bezier, b: Bezier) => a.every((v, i) => round6(v) === round6(b[i]));

const KEYWORDS: Record<string, Bezier> = {
  // The CSS keywords, as CSS Easing Functions Level 1 defines them.
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  linear: [0, 0, 1, 1],
};

/** The five CSS keywords that are cubic-béziers (linear is the straight one). */
export const CSS_KEYWORDS = KEYWORDS;

export type Parsed = { ok: true; value: Bezier } | { ok: false; error: string };

/**
 * Text to a curve: "cubic-bezier(0.34, 1.56, 0.64, 1)", the four numbers on
 * their own (commas or spaces, brackets allowed), or a CSS keyword.
 */
export function parseBezier(text: string): Parsed {
  const s = text.trim().toLowerCase().replace(/;$/, '');
  if (!s) return { ok: false, error: 'Type four numbers, or cubic-bezier(…).' };
  if (s in KEYWORDS) return { ok: true, value: KEYWORDS[s] };
  const inner = s.replace(/^cubic-bezier\s*\(/, '').replace(/^[[(]/, '').replace(/[\])]$/, '');
  const parts = inner.split(/[\s,]+/).filter(Boolean);
  if (parts.length !== 4) return { ok: false, error: `cubic-bezier() takes 4 numbers; this has ${parts.length}.` };
  const nums = parts.map((p) => (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/.test(p) ? Number(p) : NaN));
  if (nums.some((n) => !Number.isFinite(n))) return { ok: false, error: 'One of the four is not a number.' };
  const [x1, y1, x2, y2] = nums;
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    return { ok: false, error: 'x1 and x2 must be between 0 and 1: CSS treats cubic-bezier() with any other x as invalid.' };
  }
  if (y1 < Y_MIN || y1 > Y_MAX || y2 < Y_MIN || y2 > Y_MAX) {
    return { ok: false, error: `This editor keeps y between ${Y_MIN} and ${Y_MAX}. CSS takes any y.` };
  }
  return { ok: true, value: [x1, y1, x2, y2] };
}

/**
 * The JavaScript easing function the generator writes, as source. It is the
 * same algorithm as bezierEasing() above, written out so it can be pasted
 * anywhere; the tests run this text and compare it with bezierEasing() and
 * with the browser's own cubic-bezier().
 */
export const SOLVER_JS = `/**
 * CSS cubic-bezier(x1, y1, x2, y2) as an easing function of t (0 to 1).
 * x is time and y is progress: find the point on the curve whose x is t
 * (Newton–Raphson, then bisection where the curve is flat), return its y.
 */
function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const x = (s) => ((ax * s + bx) * s + cx) * s;
  const y = (s) => ((ay * s + by) * s + cy) * s;
  const dx = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let s = t;
    for (let i = 0; i < 8; i++) {
      const e = x(s) - t;
      if (Math.abs(e) < 1e-7) return y(s);
      const d = dx(s);
      if (Math.abs(d) < 1e-6) break;
      s -= e / d;
      if (s < 0 || s > 1) break;
    }
    let lo = 0, hi = 1;
    s = t;
    while (hi - lo > 1e-7) {
      const e = x(s) - t;
      if (Math.abs(e) < 1e-7) break;
      if (e < 0) lo = s; else hi = s;
      s = (lo + hi) / 2;
    }
    return y(s);
  };
}`;
