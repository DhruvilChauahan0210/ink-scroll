/**
 * Two SVG paths made morphable: the maths behind /svg-morph-generator.
 *
 * scrollDraw's `morphTo` (packages/svg-scroll-draw/src/core/engine.ts,
 * morphPath) pairs the numbers of two `d` strings by position and moves each
 * toward its partner. That only lands on the end shape when both paths have
 * the same commands and the same count of numbers, so this file rewrites any
 * two paths into that form:
 *
 *   1. parsePath: read every command, relative or absolute, implicit repeats,
 *      packed arc flags (`a5 5 0 0110 10`) and numbers like `1.5.5` included.
 *   2. toShape: rewrite each piece (subpath) as absolute cubic Béziers. Lines,
 *      H and V become straight cubics, Q and T are raised to cubics exactly,
 *      S and T reflect their control points, and every arc becomes one cubic
 *      per quarter turn or less (the standard 4/3·tan(θ/4) fit). Z becomes a
 *      straight cubic back to the start when the pen is not already there.
 *   3. matchShapes: pad the shape with fewer pieces with pieces shrunk to a
 *      point on its outline, split segments (de Casteljau, so the outline does not change)
 *      until each pair of pieces has the same count, then turn the end
 *      piece's starting point and direction so points travel the least.
 *   4. toD: write both back as `M x y C … Z`, the same letters in the same order.
 *
 * Pure functions, no DOM: the page's figure renders them on the server.
 */

export type Pt = [number, number];
/** One cubic Bézier: first control, second control, end. It starts where the previous one ends. */
export type Cubic = [number, number, number, number, number, number];
/** One subpath: where the pen goes down, its cubics, and whether it ends with Z (or back at its start). */
export type Piece = { start: Pt; segs: Cubic[]; closed: boolean };
export type Shape = Piece[];

export type Command = { c: string; args: number[] };

export type ParseResult =
  | { ok: true; commands: Command[]; shape: Shape; letters: string[] }
  | { ok: false; error: string };

const ARGS: Record<string, number> = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };
/** Every command letter a path can use, each also in lower case (relative). */
export const COMMAND_LETTERS = Object.keys(ARGS);
/** Beyond these the morph string gets too long to be any use, and the page too slow. */
export const MAX_CHARS = 20_000;
export const MAX_PIECES = 24;
export const MAX_SEGMENTS = 400;
const EPS = 1e-9;

// ── 1. Reading a d string ───────────────────────────────────────────────────

/** Reads `d` into absolute-or-relative commands with their numbers, as written. */
export function tokenize(d: string): { ok: true; commands: Command[] } | { ok: false; error: string } {
  const s = d;
  const n = s.length;
  let i = 0;
  const commands: Command[] = [];
  const isSpace = (ch: string) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === ',';
  const skip = () => { while (i < n && isSpace(s[i])) i++; };

  /** One number in SVG's grammar: sign, digits, a dot, digits, an exponent. */
  const number = (): number | null => {
    skip();
    const start = i;
    if (s[i] === '+' || s[i] === '-') i++;
    let digits = 0;
    while (i < n && s[i] >= '0' && s[i] <= '9') { i++; digits++; }
    if (s[i] === '.') {
      i++;
      while (i < n && s[i] >= '0' && s[i] <= '9') { i++; digits++; }
    }
    if (!digits) { i = start; return null; }
    if (s[i] === 'e' || s[i] === 'E') {
      const save = i;
      i++;
      if (s[i] === '+' || s[i] === '-') i++;
      let exp = 0;
      while (i < n && s[i] >= '0' && s[i] <= '9') { i++; exp++; }
      if (!exp) i = save;
    }
    const v = Number(s.slice(start, i));
    return Number.isFinite(v) ? v : null;
  };
  /** An arc flag: one character, 0 or 1, so `0110` is two flags and the number 10. */
  const flag = (): number | null => {
    skip();
    if (s[i] === '0' || s[i] === '1') return Number(s[i++]);
    return null;
  };

  skip();
  if (i >= n) return { ok: false, error: 'The path is empty.' };
  let cmd = '';
  while (true) {
    skip();
    if (i >= n) break;
    const ch = s[i];
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(ch)) {
      cmd = ch;
      i++;
      if (!commands.length && cmd !== 'M' && cmd !== 'm') return { ok: false, error: `A path starts with M, not ${cmd}.` };
      if (cmd === 'Z' || cmd === 'z') { commands.push({ c: cmd, args: [] }); continue; }
    } else if (!cmd) {
      return { ok: false, error: 'A path starts with M.' };
    } else if (cmd === 'Z' || cmd === 'z') {
      return { ok: false, error: `Unexpected “${ch}” after Z, at character ${i + 1}.` };
    }
    // One set of arguments for `cmd`; the loop comes back here for implicit repeats.
    const upper = cmd.toUpperCase();
    const count = ARGS[upper];
    const args: number[] = [];
    for (let k = 0; k < count; k++) {
      const v = upper === 'A' && (k === 3 || k === 4) ? flag() : number();
      if (v === null) {
        skip();
        const at = i < n ? `“${s[i]}” at character ${i + 1}` : 'the end';
        return { ok: false, error: `${cmd} needs ${count} numbers; found ${at} after ${k}.` };
      }
      args.push(v);
    }
    commands.push({ c: cmd, args });
    // After a moveto, further pairs are linetos of the same kind.
    if (cmd === 'M') cmd = 'L';
    else if (cmd === 'm') cmd = 'l';
  }
  return { ok: true, commands };
}

/** The letters the path is written with, as the library compares them (upper case). */
export function lettersOf(commands: Command[]): string[] {
  return commands.map((c) => c.c.toUpperCase());
}

/** `M A A Z` with runs folded: `M L×9 Z`. */
export function skeleton(letters: string[]): string {
  const out: string[] = [];
  for (let i = 0; i < letters.length; ) {
    let j = i;
    while (j < letters.length && letters[j] === letters[i]) j++;
    out.push(j - i > 2 ? `${letters[i]}×${j - i}` : letters.slice(i, j).join(' '));
    i = j;
  }
  return out.join(' ');
}

// ── 2. Everything as cubics ─────────────────────────────────────────────────

const lineCubic = (x0: number, y0: number, x: number, y: number): Cubic => [
  x0 + (x - x0) / 3, y0 + (y - y0) / 3, x0 + (2 * (x - x0)) / 3, y0 + (2 * (y - y0)) / 3, x, y,
];

/** A quadratic raised to the cubic that draws exactly the same curve. */
const quadCubic = (x0: number, y0: number, qx: number, qy: number, x: number, y: number): Cubic => [
  x0 + (2 / 3) * (qx - x0), y0 + (2 / 3) * (qy - y0), x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y), x, y,
];

/**
 * An SVG arc as cubics, one per quarter turn or less, following the SVG 2
 * implementation notes (endpoint to centre parameterisation, radii scaled up
 * when too small to reach). A zero radius is a straight line; an arc that ends
 * where it starts draws nothing.
 */
export function arcToCubics(
  x1: number, y1: number, rxIn: number, ryIn: number, angle: number, large: number, sweep: number, x2: number, y2: number,
): Cubic[] {
  if (Math.abs(x1 - x2) < EPS && Math.abs(y1 - y2) < EPS) return [];
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx < EPS || ry < EPS) return [lineCubic(x1, y1, x2, y2)];
  const phi = ((angle % 360) * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    const k = Math.sqrt(lambda);
    rx *= k;
    ry *= k;
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = (large !== sweep ? 1 : -1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const vx = (-x1p - cxp) / rx;
  const vy = (-y1p - cyp) / ry;
  const theta1 = ang(1, 0, ux, uy);
  let delta = ang(ux, uy, vx, vy);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  else if (sweep && delta < 0) delta += 2 * Math.PI;

  const parts = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2) - 1e-7));
  const step = delta / parts;
  const k = (4 / 3) * Math.tan(step / 4);
  // A point on the unit circle at angle t, mapped onto the ellipse.
  const map = (px: number, py: number): Pt => [cx + rx * cos * px - ry * sin * py, cy + rx * sin * px + ry * cos * py];
  const out: Cubic[] = [];
  let t = theta1;
  for (let p = 0; p < parts; p++) {
    const t2 = t + step;
    const c0 = Math.cos(t), s0 = Math.sin(t), c1 = Math.cos(t2), s1 = Math.sin(t2);
    const a = map(c0 - k * s0, s0 + k * c0);
    const b = map(c1 + k * s1, s1 - k * c1);
    const e = p === parts - 1 ? ([x2, y2] as Pt) : map(c1, s1);
    out.push([a[0], a[1], b[0], b[1], e[0], e[1]]);
    t = t2;
  }
  return out;
}

const same = (a: Pt, b: Pt, eps = 1e-6) => Math.abs(a[0] - b[0]) <= eps && Math.abs(a[1] - b[1]) <= eps;
const endOf = (p: Piece): Pt => (p.segs.length ? [p.segs[p.segs.length - 1][4], p.segs[p.segs.length - 1][5]] : p.start);
const isZeroLength = (x0: number, y0: number, c: Cubic) =>
  same([x0, y0], [c[0], c[1]]) && same([x0, y0], [c[2], c[3]]) && same([x0, y0], [c[4], c[5]]);

/** The commands as absolute cubics, one piece per subpath. Pieces that draw nothing are dropped. */
export function toShape(commands: Command[]): Shape {
  const shape: Shape = [];
  let piece: Piece | null = null;
  let x = 0, y = 0, sx = 0, sy = 0;
  /** The last cubic's second control point, for S; the last quadratic's control, for T. */
  let lastC: Pt | null = null;
  let lastQ: Pt | null = null;

  const open = () => {
    if (!piece) {
      piece = { start: [x, y], segs: [], closed: false };
      shape.push(piece);
    }
    return piece;
  };
  const push = (c: Cubic) => {
    const p = open();
    if (!isZeroLength(x, y, c)) p.segs.push(c);
    x = c[4];
    y = c[5];
  };

  for (const { c, args } of commands) {
    const rel = c === c.toLowerCase();
    const C = c.toUpperCase();
    const ax = (v: number) => (rel ? x + v : v);
    const ay = (v: number) => (rel ? y + v : v);
    let nextC: Pt | null = null;
    let nextQ: Pt | null = null;
    switch (C) {
      case 'M': {
        x = ax(args[0]);
        y = ay(args[1]);
        sx = x;
        sy = y;
        piece = { start: [x, y], segs: [], closed: false };
        shape.push(piece);
        break;
      }
      case 'L': push(lineCubic(x, y, ax(args[0]), ay(args[1]))); break;
      case 'H': push(lineCubic(x, y, ax(args[0]), y)); break;
      case 'V': push(lineCubic(x, y, x, ay(args[0]))); break;
      case 'C': {
        const cub: Cubic = [ax(args[0]), ay(args[1]), ax(args[2]), ay(args[3]), ax(args[4]), ay(args[5])];
        nextC = [cub[2], cub[3]];
        push(cub);
        break;
      }
      case 'S': {
        const c1: Pt = lastC ? [2 * x - lastC[0], 2 * y - lastC[1]] : [x, y];
        const cub: Cubic = [c1[0], c1[1], ax(args[0]), ay(args[1]), ax(args[2]), ay(args[3])];
        nextC = [cub[2], cub[3]];
        push(cub);
        break;
      }
      case 'Q': {
        const q: Pt = [ax(args[0]), ay(args[1])];
        nextQ = q;
        push(quadCubic(x, y, q[0], q[1], ax(args[2]), ay(args[3])));
        break;
      }
      case 'T': {
        const q: Pt = lastQ ? [2 * x - lastQ[0], 2 * y - lastQ[1]] : [x, y];
        nextQ = q;
        push(quadCubic(x, y, q[0], q[1], ax(args[0]), ay(args[1])));
        break;
      }
      case 'A': {
        const ex = ax(args[5]);
        const ey = ay(args[6]);
        const cubs = arcToCubics(x, y, args[0], args[1], args[2], args[3], args[4], ex, ey);
        for (const cub of cubs) push(cub);
        x = ex;
        y = ey;
        break;
      }
      case 'Z': {
        const p = open();
        if (!same([x, y], [sx, sy])) push(lineCubic(x, y, sx, sy));
        p.closed = true;
        // Snap the last end onto the start, so a rounded copy still closes.
        if (p.segs.length) { p.segs[p.segs.length - 1][4] = sx; p.segs[p.segs.length - 1][5] = sy; }
        x = sx;
        y = sy;
        // A command after Z without an M starts a new piece at the same point.
        piece = null;
        break;
      }
    }
    lastC = nextC;
    lastQ = nextQ;
  }
  // Back at the start without a Z still turns like a closed outline.
  for (const p of shape) if (!p.closed && p.segs.length > 1 && same(endOf(p), p.start, 1e-4)) p.closed = true;
  return shape.filter((p) => p.segs.length > 0);
}

/** Reads a d string all the way to cubics, with a reason when it cannot. */
export function parsePath(d: string): ParseResult {
  const text = d.trim();
  if (text.length > MAX_CHARS) return { ok: false, error: `That path is over ${MAX_CHARS.toLocaleString('en')} characters.` };
  const t = tokenize(text);
  if (!t.ok) return t;
  const shape = toShape(t.commands);
  if (!shape.length) return { ok: false, error: 'That path draws nothing: every piece of it has no length.' };
  if (shape.length > MAX_PIECES) return { ok: false, error: `That path has ${shape.length} pieces (M commands); this tool takes up to ${MAX_PIECES}.` };
  const segs = shape.reduce((n, p) => n + p.segs.length, 0);
  if (segs > MAX_SEGMENTS) return { ok: false, error: `That path has ${segs} segments; this tool takes up to ${MAX_SEGMENTS}.` };
  return { ok: true, commands: t.commands, shape, letters: lettersOf(t.commands) };
}

// ── Measuring ───────────────────────────────────────────────────────────────

// 8-point Gauss–Legendre, applied to each half of a cubic: far below a pixel
// for any curve this tool draws.
const GL_X = [-0.9602898564975363, -0.7966664774136267, -0.5255324099163290, -0.1834346424956498, 0.1834346424956498, 0.5255324099163290, 0.7966664774136267, 0.9602898564975363];
const GL_W = [0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.3626837833783620, 0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];

/** Arc length of one cubic starting at (x0, y0). */
export function cubicLength(x0: number, y0: number, c: Cubic): number {
  const speed = (t: number) => {
    const u = 1 - t;
    const dx = 3 * u * u * (c[0] - x0) + 6 * u * t * (c[2] - c[0]) + 3 * t * t * (c[4] - c[2]);
    const dy = 3 * u * u * (c[1] - y0) + 6 * u * t * (c[3] - c[1]) + 3 * t * t * (c[5] - c[3]);
    return Math.hypot(dx, dy);
  };
  let sum = 0;
  for (const [a, b] of [[0, 0.5], [0.5, 1]] as const) {
    const h = (b - a) / 2;
    const m = (a + b) / 2;
    for (let k = 0; k < GL_X.length; k++) sum += GL_W[k] * h * speed(m + h * GL_X[k]);
  }
  return sum;
}

/** The length of each segment of a piece, in order. */
export function segmentLengths(p: Piece): number[] {
  let [x, y] = p.start;
  return p.segs.map((c) => {
    const l = cubicLength(x, y, c);
    x = c[4];
    y = c[5];
    return l;
  });
}

export const shapeLength = (s: Shape) => s.reduce((n, p) => n + segmentLengths(p).reduce((a, b) => a + b, 0), 0);

/** Start point and each segment's end: the points a morph moves. */
export function vertices(p: Piece): Pt[] {
  return [p.start, ...p.segs.map((c) => [c[4], c[5]] as Pt)];
}

/** Bounds of the control polygon: never smaller than the curve. */
export function bounds(shapes: Shape[]): { x: number; y: number; w: number; h: number } | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number) => {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  };
  for (const s of shapes) for (const p of s) {
    add(p.start[0], p.start[1]);
    for (const c of p.segs) { add(c[0], c[1]); add(c[2], c[3]); add(c[4], c[5]); }
  }
  return Number.isFinite(x0) ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

// ── 3. Matching two shapes ──────────────────────────────────────────────────

/** de Casteljau: the cubic from (x0, y0) split at t, as two cubics. */
export function splitCubic(x0: number, y0: number, c: Cubic, t: number): [Cubic, Cubic] {
  const lerp = (a: number, b: number) => a + (b - a) * t;
  const ax = lerp(x0, c[0]), ay = lerp(y0, c[1]);
  const bx = lerp(c[0], c[2]), by = lerp(c[1], c[3]);
  const cx = lerp(c[2], c[4]), cy = lerp(c[3], c[5]);
  const dx = lerp(ax, bx), dy = lerp(ay, by);
  const ex = lerp(bx, cx), ey = lerp(by, cy);
  const fx = lerp(dx, ex), fy = lerp(dy, ey);
  return [[ax, ay, dx, dy, fx, fy], [ex, ey, cx, cy, c[4], c[5]]];
}

/**
 * How many pieces each segment is cut into so the piece has `n` in all: one
 * cut at a time to whichever segment has the longest pieces (equal lengths
 * where the counts allow), in order on a tie.
 */
export function allocate(lens: number[], n: number): number[] {
  const m = lens.length;
  const cuts = new Array<number>(m).fill(1);
  const total = lens.reduce((a, b) => a + b, 0);
  for (let extra = n - m, r = 0; extra > 0; extra--, r++) {
    let best = r % m;
    if (total > EPS) {
      let score = -1;
      for (let j = 0; j < m; j++) {
        const s = lens[j] / cuts[j];
        if (s > score + 1e-9) { score = s; best = j; }
      }
    }
    cuts[best]++;
  }
  return cuts;
}

/**
 * The piece cut into exactly `n` segments, without changing its outline: the
 * extra cuts go as allocate() says, and each segment is cut at equal steps of
 * its curve parameter.
 */
export function splitTo(p: Piece, n: number): Piece {
  const m = p.segs.length;
  if (n <= m) return { start: p.start, segs: p.segs.map((c) => [...c] as Cubic), closed: p.closed };
  const cuts = allocate(segmentLengths(p), n);
  const segs: Cubic[] = [];
  let [x, y] = p.start;
  p.segs.forEach((c, j) => {
    let rest: Cubic = [...c] as Cubic;
    let rx = x, ry = y;
    for (let k = cuts[j]; k > 1; k--) {
      const [a, b] = splitCubic(rx, ry, rest, 1 / k);
      segs.push(a);
      rx = a[4];
      ry = a[5];
      rest = b;
    }
    segs.push(rest);
    x = c[4];
    y = c[5];
  });
  return { start: p.start, segs, closed: p.closed };
}

/** Longest piece over shortest once a piece is cut into `n`: 1 when every piece is the same length. */
function unevenness(lens: number[], n: number): number {
  const cuts = allocate(lens, n);
  const pieces = lens.map((l, j) => l / cuts[j]).filter((l) => l > EPS);
  return pieces.length ? Math.max(...pieces) / Math.min(...pieces) : 1;
}

/**
 * The segment count a pair is matched at when the visitor has not chosen one:
 * the fewest that keep the points evenly spaced on both outlines. Circle (4)
 * to star (10) becomes 20, five points per quarter circle and two per edge,
 * where 10 would put six on one half of the circle and four on the other and
 * twist the morph. Each extra segment has to earn its place (0.02 of
 * unevenness), and the search stops at three times the larger count.
 */
export function autoPoints(a: Piece, b: Piece): number {
  const la = segmentLengths(a);
  const lb = segmentLengths(b);
  const lo = Math.max(la.length, lb.length);
  const hi = Math.min(MAX_SEGMENTS, Math.max(lo, Math.min(64, lo * 3)));
  let best = lo;
  let score = Infinity;
  for (let n = lo; n <= hi; n++) {
    const s = unevenness(la, n) + unevenness(lb, n) + 0.02 * (n - lo);
    if (s < score - 1e-9) { score = s; best = n; }
  }
  return best;
}

/** The same piece drawn the other way round. */
export function reversePiece(p: Piece): Piece {
  const pts = vertices(p);
  const segs: Cubic[] = [];
  for (let i = p.segs.length - 1; i >= 0; i--) {
    const c = p.segs[i];
    segs.push([c[2], c[3], c[0], c[1], pts[i][0], pts[i][1]]);
  }
  return { start: pts[pts.length - 1], segs, closed: p.closed };
}

/** A closed piece starting from its k-th point instead of its first. Open pieces stay as they are. */
export function rotatePiece(p: Piece, k: number): Piece {
  const n = p.segs.length;
  if (!p.closed || n === 0) return p;
  const r = ((k % n) + n) % n;
  if (!r) return p;
  const pts = vertices(p);
  return { start: pts[r], segs: [...p.segs.slice(r), ...p.segs.slice(0, r)], closed: true };
}

/** A piece of `n` segments with every point at `at`: what an extra piece shrinks to. */
export function pointPiece(at: Pt, n: number, closed: boolean): Piece {
  return { start: at, segs: Array.from({ length: n }, () => [at[0], at[1], at[0], at[1], at[0], at[1]] as Cubic), closed };
}

/** Where a piece's points are, on average. */
export function centroid(p: Piece): Pt {
  const v = vertices(p);
  const pts = p.closed ? v.slice(0, -1) : v;
  const sx = pts.reduce((a, q) => a + q[0], 0);
  const sy = pts.reduce((a, q) => a + q[1], 0);
  return [sx / pts.length, sy / pts.length];
}

/** The point at t on the cubic from (x0, y0). */
export function pointOn(x0: number, y0: number, c: Cubic, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
  return [a * x0 + b * c[0] + d * c[2] + e * c[4], a * y0 + b * c[1] + d * c[3] + e * c[5]];
}

/**
 * The point on a shape's outline nearest `p`, from 48 samples a segment:
 * where an extra piece shrinks to. On the outline rather than in open space,
 * because a piece shrunk to a point still paints a dot with round caps, and
 * there the line covers it.
 */
export function nearestOn(shape: Shape, p: Pt): Pt {
  let best: Pt = shape[0]?.start ?? p;
  let dist = Infinity;
  for (const piece of shape) {
    let [x, y] = piece.start;
    for (const c of piece.segs) {
      for (let k = 0; k <= 48; k++) {
        const q = pointOn(x, y, c, k / 48);
        const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
        if (d < dist) { dist = d; best = q; }
      }
      x = c[4];
      y = c[5];
    }
  }
  return best;
}

/** Every point of a piece in drawing order: start, then each segment's two controls and end. */
function allPoints(p: Piece): number[] {
  const out = [p.start[0], p.start[1]];
  for (const c of p.segs) out.push(...c);
  return out;
}

/** Sum of squared distances between two pieces of the same length, point by point. */
export function travelCost(a: Piece, b: Piece): number {
  const pa = allPoints(a);
  const pb = allPoints(b);
  let sum = 0;
  for (let i = 0; i < pa.length; i++) sum += (pa[i] - pb[i]) ** 2;
  return sum;
}

/** How far each moving point travels, on average: start and segment ends only. */
export function meanTravel(a: Piece[], b: Piece[]): number {
  let sum = 0;
  let n = 0;
  a.forEach((p, i) => {
    const va = vertices(p);
    const vb = vertices(b[i]);
    for (let k = 0; k < va.length; k++) { sum += Math.hypot(va[k][0] - vb[k][0], va[k][1] - vb[k][1]); n++; }
  });
  return n ? sum / n : 0;
}

export type Fit = { rotate: number; reverse: boolean; cost: number };

/**
 * The starting point and direction for `b` that move its points least onto
 * `a`'s: every rotation (closed pieces) both ways round. Both pieces must
 * already have the same number of segments.
 */
export function bestFit(a: Piece, b: Piece): Fit {
  let best: Fit = { rotate: 0, reverse: false, cost: Infinity };
  for (const reverse of [false, true]) {
    const base = reverse ? reversePiece(b) : b;
    const turns = base.closed ? base.segs.length : 1;
    for (let k = 0; k < turns; k++) {
      const cost = travelCost(a, rotatePiece(base, k));
      if (cost < best.cost - 1e-9) best = { rotate: k, reverse, cost };
    }
  }
  return best;
}

/** `b` turned and/or reversed as a Fit says. */
export function applyFit(b: Piece, rotate: number, reverse: boolean): Piece {
  return rotatePiece(reverse ? reversePiece(b) : b, rotate);
}

export type MatchOptions = {
  /** At least this many segments in each pair of pieces; null or left out: autoPoints(). */
  points?: number | null;
  /** The first end piece's starting point, counted in its segments; null: the best fit. */
  rotate?: number | null;
  /** Draw the first end piece the other way round; null: the best fit. */
  reverse?: boolean | null;
};

export type Matched = {
  from: Shape;
  to: Shape;
  /** Segments in each pair, after splitting. */
  counts: number[];
  /** The fewest segments the first pair can have: the larger of the two. */
  minFirst: number;
  /** The best fit for the first pair, whatever was asked for. */
  fit: Fit;
  /** The starting point and direction used for the first pair. */
  rotate: number;
  reverse: boolean;
  /** Whether the first end piece can be turned (it is closed). */
  turnable: boolean;
  /** Pieces added as points, in the start shape and in the end one. */
  addedFrom: number;
  addedTo: number;
  /** Whether both are written with Z: only when every pair is closed in both. */
  closed: boolean;
};

/** Both shapes with the same pieces, the same segments in each, matched for the least travel. */
export function matchShapes(a: Shape, b: Shape, opts: MatchOptions = {}): Matched {
  const from = a.map((p) => ({ ...p }));
  const to = b.map((p) => ({ ...p }));
  let addedFrom = 0;
  let addedTo = 0;
  // Pad the shorter list: each extra piece meets a point on the other shape's
  // outline, the one nearest its own centre.
  while (from.length < to.length) { const q = to[from.length]; from.push(pointPiece(nearestOn(a, centroid(q)), q.segs.length, q.closed)); addedFrom++; }
  while (to.length < from.length) { const q = from[to.length]; to.push(pointPiece(nearestOn(b, centroid(q)), q.segs.length, q.closed)); addedTo++; }

  const counts: number[] = [];
  const outFrom: Shape = [];
  const outTo: Shape = [];
  let fit: Fit = { rotate: 0, reverse: false, cost: 0 };
  let rotate = 0;
  let reverse = false;
  let turnable = false;
  const minFirst = Math.max(from[0].segs.length, to[0].segs.length);
  from.forEach((pa, i) => {
    const pb = to[i];
    const fewest = Math.max(pa.segs.length, pb.segs.length);
    const n = Math.min(MAX_SEGMENTS, opts.points == null ? autoPoints(pa, pb) : Math.max(fewest, opts.points));
    const sa = splitTo(pa, n);
    const sb = splitTo(pb, n);
    const f = bestFit(sa, sb);
    if (i === 0) {
      fit = f;
      turnable = sb.closed;
      reverse = opts.reverse ?? f.reverse;
      rotate = turnable ? ((((opts.rotate ?? f.rotate) % n) + n) % n) : 0;
      outFrom.push(sa);
      outTo.push(applyFit(sb, rotate, reverse));
    } else {
      outFrom.push(sa);
      outTo.push(applyFit(sb, f.rotate, f.reverse));
    }
    counts.push(n);
  });
  const closed = outFrom.every((p, i) => p.closed && outTo[i].closed);
  return { from: outFrom, to: outTo, counts, minFirst, fit, rotate, reverse, turnable, addedFrom, addedTo, closed };
}

// ── 4. Writing it back ──────────────────────────────────────────────────────

/** A number at `decimals` places, with no trailing zeros, no -0 and never an exponent. */
export function num(n: number, decimals: number): string {
  const f = 10 ** decimals;
  const v = Math.round(n * f) / f;
  if (Object.is(v, -0) || v === 0) return '0';
  const s = v.toFixed(decimals);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

/** `M x y C … C … Z` for every piece; Z only when `closed`. */
export function toD(shape: Shape, decimals: number, closed: boolean): string {
  const f = (n: number) => num(n, decimals);
  return shape
    .map((p) => {
      const parts = [`M${f(p.start[0])} ${f(p.start[1])}`];
      for (const c of p.segs) parts.push(`C${c.map(f).join(' ')}`);
      if (closed) parts.push('Z');
      return parts.join(' ');
    })
    .join(' ');
}

// ── The library's interpolation, for frames drawn without it ──────────────────

const NUMBER = /[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?/g;

/**
 * morphPath from packages/svg-scroll-draw/src/core/engine.ts, line for line:
 * each number of `from` moved toward the number at the same place in `to`,
 * kept to 4 decimals. The page draws reduced-motion frames with it, where the
 * library itself shows the end shape at once.
 */
export function morphPath(from: string, to: string, t: number): string {
  const toNums = (to.match(NUMBER) ?? []).map(Number);
  let idx = 0;
  return from.replace(NUMBER, (match) => {
    const f = parseFloat(match);
    const target = toNums[idx++] ?? f;
    return String(+(f + (target - f) * t).toFixed(4));
  });
}

/** What the library's development build checks before a morph (checkMorphCompatible). */
export function compatibility(from: string, to: string): { letters: boolean; numbers: [number, number] } {
  const letters = (s: string) => (s.match(/[MmLlHhVvCcSsQqTtAaZz]/g) ?? []).join('').toUpperCase();
  return {
    letters: letters(from) === letters(to),
    numbers: [(from.match(NUMBER) ?? []).length, (to.match(NUMBER) ?? []).length],
  };
}

/** Each moving point at t, for the dots over the preview. */
export function pointsAt(a: Piece[], b: Piece[], t: number): Pt[][] {
  return a.map((p, i) => {
    const va = vertices(p);
    const vb = vertices(b[i]);
    return va.map((q, k) => [q[0] + (vb[k][0] - q[0]) * t, q[1] + (vb[k][1] - q[1]) * t] as Pt);
  });
}
