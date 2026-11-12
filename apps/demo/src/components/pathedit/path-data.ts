/**
 * SVG path data for the path editor: read a d string exactly as a browser
 * does, write it back, measure it, and edit it without moving what was not
 * edited. Pure functions, no DOM: the page imports them on the server for its
 * tables and the figure, the editor on the client.
 *
 * Reading follows the SVG 2 path grammar as Chromium implements it
 * (third_party/blink/renderer/core/svg/svg_path_string_source.cc and
 * svg_parser_utilities.cc): every command in both cases, a command letter
 * written once for many sets of numbers (after M those sets are lines), numbers
 * run together where the next one starts with a sign or a second dot, arc flags
 * one character each, at most one comma between numbers, and on an error the
 * path drawn up to the command that holds it.
 *
 * A path is kept as the numbers written (Seg), never as floats worked out
 * from them, so an untouched segment is written back exactly as it came in.
 * Edits rewrite only the segments they have to: moving a point rewrites its
 * segment, then any relative segment after it whose start moved, so that it
 * stays where it was on screen.
 */

export type Pt = [number, number];
export type Upper = 'M' | 'L' | 'H' | 'V' | 'C' | 'S' | 'Q' | 'T' | 'A' | 'Z';
export type Letter = Upper | Lowercase<Upper>;
/** One command as written: its letter (the case says absolute or relative) and its numbers. */
export type Seg = { c: Letter; v: number[] };
export type Arc = { rx: number; ry: number; rot: number; large: number; sweep: number };

export const COMMAND_LETTERS: readonly Upper[] = ['M', 'L', 'H', 'V', 'C', 'S', 'Q', 'T', 'A', 'Z'];

/** What each command takes, in order: 'n' a number, 'f' a one-character arc flag. */
const ARGS: Record<Upper, string> = { M: 'nn', L: 'nn', H: 'n', V: 'n', C: 'nnnnnn', S: 'nnnn', Q: 'nnnn', T: 'nn', A: 'nnnffnn', Z: '' };

/** The names of each command's numbers, as the editor labels them. */
export const ARG_NAMES: Record<Upper, readonly string[]> = {
  M: ['x', 'y'],
  L: ['x', 'y'],
  H: ['x'],
  V: ['y'],
  C: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
  S: ['x2', 'y2', 'x', 'y'],
  Q: ['x1', 'y1', 'x', 'y'],
  T: ['x', 'y'],
  A: ['rx', 'ry', 'rotation', 'large-arc', 'sweep', 'x', 'y'],
  Z: [],
};

export const COMMAND_NAMES: Record<Upper, string> = {
  M: 'Move to',
  L: 'Line to',
  H: 'Horizontal line',
  V: 'Vertical line',
  C: 'Cubic curve',
  S: 'Smooth cubic',
  Q: 'Quadratic curve',
  T: 'Smooth quadratic',
  A: 'Arc',
  Z: 'Close path',
};

export const upper = (c: Letter): Upper => c.toUpperCase() as Upper;
export const isLower = (c: Letter): boolean => c !== c.toUpperCase();
const isLetter = (ch: string): ch is Letter => /^[MmLlHhVvCcSsQqTtAaZz]$/.test(ch);

// ── Reading ──────────────────────────────────────────────────────────────────

export type ParseError = {
  /** Index into the string where reading stopped. */
  at: number;
  message: string;
};
export type Parsed = {
  /** Every command read before the error, one Seg per set of numbers. */
  segs: Seg[];
  error: ParseError | null;
  /** Places that read, but where Firefox reads the path differently. */
  notes: ParseError[];
};

/** A comma between a command's last number and the next letter. */
const FIREFOX_COMMA =
  'A comma before a command letter: Chromium and Safari skip it, Firefox stops drawing there. Leave it out.';
/** An e with no digits after it. */
const FIREFOX_E = ' Firefox reads the number without the e and draws on.';

// SVG's white space: space, tab, line feed, form feed, carriage return.
const isWsp = (ch: string) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\f' || ch === '\r';
const isDigit = (ch: string | undefined) => ch !== undefined && ch >= '0' && ch <= '9';
const isNumberStart = (ch: string | undefined) => ch !== undefined && (isDigit(ch) || ch === '+' || ch === '-' || ch === '.');

/**
 * One number at `i`, or null. Chromium's rules: an optional sign, digits, then
 * optionally a dot that must have a digit after it; an exponent only where the
 * e is followed by something other than x or m (em and ex are units), and then
 * it must have digits, at most 38 of magnitude (Chromium reads into a float).
 */
export function readNumber(s: string, i: number): { value: number; end: number } | null {
  let p = i;
  if (s[p] === '+' || s[p] === '-') p++;
  if (!isDigit(s[p]) && s[p] !== '.') return null;
  while (isDigit(s[p])) p++;
  if (s[p] === '.') {
    p++;
    if (!isDigit(s[p])) return null;
    while (isDigit(s[p])) p++;
  }
  if (p + 1 < s.length && (s[p] === 'e' || s[p] === 'E') && s[p + 1] !== 'x' && s[p + 1] !== 'm') {
    p++;
    if (s[p] === '+' || s[p] === '-') p++;
    if (!isDigit(s[p])) return null;
    let exp = 0;
    while (isDigit(s[p])) exp = exp * 10 + Number(s[p++]);
    if (exp > 38) return null;
  }
  const value = Number(s.slice(i, p));
  if (!Number.isFinite(value)) return null;
  return { value, end: p };
}

/** White space, then at most one comma and the white space after it. */
function skipCommaWsp(s: string, i: number): number {
  while (i < s.length && isWsp(s[i])) i++;
  if (s[i] === ',') {
    i++;
    while (i < s.length && isWsp(s[i])) i++;
  }
  return i;
}
function skipWsp(s: string, i: number): number {
  while (i < s.length && isWsp(s[i])) i++;
  return i;
}

const show = (ch: string | undefined) => (ch === undefined ? 'the end' : `“${ch}”`);

/** Reads a d attribute. On an error, `segs` is what a browser draws: every command before the one that holds it. */
export function parsePath(d: string): Parsed {
  const segs: Seg[] = [];
  const notes: ParseError[] = [];
  const fail = (at: number, message: string): Parsed => ({ segs, error: { at, message }, notes });
  let i = skipWsp(d, 0);
  let prev: Letter | null = null;
  while (i < d.length) {
    const ch = d[i];
    let c: Letter;
    if (prev === null) {
      if (ch !== 'M' && ch !== 'm') {
        return fail(i, `A path has to start with M or m, not ${show(ch)}. Nothing is drawn.`);
      }
      c = ch;
      i++;
    } else if (isLetter(ch)) {
      c = ch;
      i++;
    } else if (isNumberStart(ch) && upper(prev) !== 'Z') {
      // The same command again, without its letter; after a move, a line.
      c = prev === 'M' ? 'L' : prev === 'm' ? 'l' : prev;
    } else if (isNumberStart(ch)) {
      return fail(i, 'Z takes no numbers: a number after it needs a command letter first.');
    } else {
      return fail(i, `Expected a command letter or a number, found ${show(ch)}.`);
    }
    prev = c;
    const U = upper(c);
    const v: number[] = [];
    const names = ARG_NAMES[U];
    const kinds = ARGS[U];
    let tokenEnd = i;
    for (let k = 0; k < kinds.length; k++) {
      if (kinds[k] === 'f') {
        // A flag is one character, 0 or 1, with no white space skipped before it.
        if (d[i] !== '0' && d[i] !== '1') return fail(i, `${c} needs its ${names[k]} flag here, 0 or 1; found ${show(d[i])}.`);
        v.push(d[i] === '1' ? 1 : 0);
        tokenEnd = i + 1;
        i = skipCommaWsp(d, i + 1);
      } else {
        i = skipWsp(d, i);
        const n = readNumber(d, i);
        if (!n) {
          const e = /^[-+]?(?:\d+(?:\.\d+)?|\.\d+)[eE]/.test(d.slice(i)) ? FIREFOX_E : '';
          return fail(i, `${c} needs ${kinds.length} numbers (${names.join(' ')}); ${names[k]} could not be read at ${show(d[i])}.${e}`);
        }
        v.push(n.value);
        tokenEnd = n.end;
        i = skipCommaWsp(d, n.end);
      }
    }
    segs.push({ c, v });
    if (kinds.length && d.slice(tokenEnd, i).includes(',') && isLetter(d[i] ?? '')) notes.push({ at: d.indexOf(',', tokenEnd), message: FIREFOX_COMMA });
    i = skipWsp(d, i);
  }
  return { segs, error: null, notes };
}

// ── Writing ──────────────────────────────────────────────────────────────────

/** A number as the shortest string that reads back as it: 0.1, 12, 1e-7. Never -0. */
export function num(n: number): string {
  return Object.is(n, -0) ? '0' : String(n);
}

/** Same, without the leading zero: .5, -.25. */
function numCompact(n: number): string {
  return num(n).replace(/^(-?)0\./, '$1.');
}

const isFlag = (U: Upper, k: number) => U === 'A' && (k === 3 || k === 4);

/**
 * The d string. Normal: every letter written, numbers apart. Compact: a
 * letter left out when the command repeats (and L after M), no leading zeros,
 * and no separator where the next number starts with a sign or a second dot or
 * follows an arc flag.
 */
export function writeD(segs: Seg[], compact = false): string {
  if (!compact) {
    return segs.map((s) => s.c + s.v.map((n, k) => (isFlag(upper(s.c), k) ? String(n ? 1 : 0) : num(n))).join(' ')).join(' ');
  }
  let out = '';
  let prev: Letter | null = null;
  /** The last token written, and whether it was a number, a flag or a letter. */
  let last: { t: string; kind: 'num' | 'flag' | 'letter' } | null = null;
  for (const s of segs) {
    const U = upper(s.c);
    const implicit = prev !== null && U !== 'Z' && U !== 'M' && (prev === s.c || (prev === 'M' && s.c === 'L') || (prev === 'm' && s.c === 'l'));
    if (!implicit) {
      out += s.c;
      last = { t: s.c, kind: 'letter' };
    }
    s.v.forEach((n, k) => {
      const flag = isFlag(U, k);
      const t = flag ? String(n ? 1 : 0) : numCompact(n);
      let sep = ' ';
      if (!last || last.kind === 'letter' || last.kind === 'flag') sep = '';
      else if (!flag && (t[0] === '-' || t[0] === '+')) sep = '';
      else if (!flag && t[0] === '.' && last.t.includes('.') && !/e/i.test(last.t)) sep = '';
      out += sep + t;
      last = { t, kind: flag ? 'flag' : 'num' };
    });
    prev = s.c;
  }
  return out;
}

/** "M C×3 S Z": the letters in order, runs counted. */
export function skeleton(segs: Seg[]): string {
  const out: string[] = [];
  let run = 0;
  segs.forEach((s, i) => {
    run++;
    if (i === segs.length - 1 || segs[i + 1].c !== s.c) {
      out.push(run > 1 ? `${s.c}×${run}` : s.c);
      run = 0;
    }
  });
  return out.join(' ');
}

// ── Geometry ─────────────────────────────────────────────────────────────────

/** A segment in absolute coordinates. */
export type Geo = {
  type: Upper;
  /** Its numbers are relative. False for a first m, which is read as absolute. */
  rel: boolean;
  /** Its letter is lowercase (a first m included). */
  lower: boolean;
  start: Pt;
  end: Pt;
  /** C and Q: the first control point. S and T: the implied one (`implicit`). */
  c1?: Pt;
  /** C and S: the second control point. */
  c2?: Pt;
  implicit?: boolean;
  arc?: Arc;
};

type Pen = { cur: Pt; sub: Pt; prevType: Upper | null; prevC2: Pt | null; prevQ: Pt | null };
const newPen = (): Pen => ({ cur: [0, 0], sub: [0, 0], prevType: null, prevC2: null, prevQ: null });
const add = (a: Pt, x: number, y: number): Pt => [a[0] + x, a[1] + y];
const reflect = (p: Pt, about: Pt): Pt => [2 * about[0] - p[0], 2 * about[1] - p[1]];

/** One segment's geometry from the pen, and the pen moved on past it. */
function step(pen: Pen, s: Seg, i: number): Geo {
  const U = upper(s.c);
  const lower = isLower(s.c);
  const rel = lower && !(i === 0 && U === 'M');
  const start = pen.cur;
  const base: Pt = rel ? start : [0, 0];
  const v = s.v;
  let g: Geo;
  switch (U) {
    case 'M':
      g = { type: U, rel, lower, start, end: add(base, v[0], v[1]) };
      pen.sub = g.end;
      break;
    case 'L':
    case 'T':
      g = { type: U, rel, lower, start, end: add(base, v[0], v[1]) };
      if (U === 'T') {
        g.c1 = pen.prevType === 'Q' || pen.prevType === 'T' ? reflect(pen.prevQ!, start) : start;
        g.implicit = true;
      }
      break;
    case 'H':
      g = { type: U, rel, lower, start, end: [rel ? start[0] + v[0] : v[0], start[1]] };
      break;
    case 'V':
      g = { type: U, rel, lower, start, end: [start[0], rel ? start[1] + v[0] : v[0]] };
      break;
    case 'C':
      g = { type: U, rel, lower, start, c1: add(base, v[0], v[1]), c2: add(base, v[2], v[3]), end: add(base, v[4], v[5]) };
      break;
    case 'S':
      g = {
        type: U,
        rel,
        lower,
        start,
        c1: pen.prevType === 'C' || pen.prevType === 'S' ? reflect(pen.prevC2!, start) : start,
        implicit: true,
        c2: add(base, v[0], v[1]),
        end: add(base, v[2], v[3]),
      };
      break;
    case 'Q':
      g = { type: U, rel, lower, start, c1: add(base, v[0], v[1]), end: add(base, v[2], v[3]) };
      break;
    case 'A':
      g = { type: U, rel, lower, start, end: add(base, v[5], v[6]), arc: { rx: v[0], ry: v[1], rot: v[2], large: v[3] ? 1 : 0, sweep: v[4] ? 1 : 0 } };
      break;
    default:
      g = { type: 'Z', rel: lower, lower, start, end: pen.sub };
  }
  pen.cur = g.end;
  pen.prevType = U;
  pen.prevC2 = U === 'C' || U === 'S' ? g.c2! : null;
  pen.prevQ = U === 'Q' || U === 'T' ? g.c1! : null;
  return g;
}

/** Every segment in absolute coordinates. */
export function geometry(segs: Seg[]): Geo[] {
  const pen = newPen();
  return segs.map((s, i) => step(pen, s, i));
}

/** Where each subpath starts, for the segment at each index (an M starts its own). */
export function subpathOf(segs: Seg[]): number[] {
  let n = -1;
  let closed = true;
  return segs.map((s) => {
    const U = upper(s.c);
    if (U === 'M' || closed) n++;
    closed = U === 'Z';
    if (U === 'M') closed = false;
    return Math.max(0, n);
  });
}

export type ArcCenter = { cx: number; cy: number; rx: number; ry: number; phi: number; theta1: number; dtheta: number };

/**
 * An arc's ellipse, from its end points (SVG 2, Implementation notes, B.2.4):
 * radii too small to reach scaled up, flags picking one of the four arcs.
 * Null when the arc is a straight line (a radius 0) or draws nothing (it ends
 * where it starts).
 */
export function arcCenter(start: Pt, end: Pt, a: Arc): ArcCenter | null {
  const [x1, y1] = start;
  const [x2, y2] = end;
  if (x1 === x2 && y1 === y2) return null;
  let rx = Math.abs(a.rx);
  let ry = Math.abs(a.ry);
  if (rx === 0 || ry === 0) return null;
  const phi = (((a.rot % 360) + 360) % 360) * (Math.PI / 180);
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num2 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = (a.large !== a.sweep ? 1 : -1) * Math.sqrt(Math.max(0, num2 / den));
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const vx = (-x1p - cxp) / rx;
  const vy = (-y1p - cyp) / ry;
  const theta1 = angle(1, 0, ux, uy);
  let dtheta = angle(ux, uy, vx, vy);
  if (!a.sweep && dtheta > 0) dtheta -= 2 * Math.PI;
  if (a.sweep && dtheta < 0) dtheta += 2 * Math.PI;
  return { cx, cy, rx, ry, phi, theta1, dtheta };
}

/** The point at angle θ on an arc's ellipse. */
export function arcPoint(c: ArcCenter, theta: number): Pt {
  const cos = Math.cos(c.phi);
  const sin = Math.sin(c.phi);
  const x = c.rx * Math.cos(theta);
  const y = c.ry * Math.sin(theta);
  return [c.cx + cos * x - sin * y, c.cy + sin * x + cos * y];
}

/** Roots of a t² + b t + c in (0, 1). */
function rootsIn01(a: number, b: number, c: number): number[] {
  const out: number[] = [];
  const keep = (t: number) => { if (t > 0 && t < 1) out.push(t); };
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) keep(-c / b);
    return out;
  }
  const disc = b * b - 4 * a * c;
  if (disc < 0) return out;
  const r = Math.sqrt(disc);
  keep((-b + r) / (2 * a));
  keep((-b - r) / (2 * a));
  return out;
}

const cubicAt = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const m = 1 - t;
  return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3;
};
const quadAt = (p0: number, p1: number, p2: number, t: number) => {
  const m = 1 - t;
  return m * m * p0 + 2 * m * t * p1 + t * t * p2;
};

export type Box = { x: number; y: number; w: number; h: number };

/**
 * The bounding box of what the path draws: every drawing segment's ends and
 * the furthest its curves and arcs reach (control points do not count), as
 * getBBox() reports it. A move with nothing drawn after it is left out.
 */
export function bounds(geo: Geo[]): Box | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const take = (p: Pt) => {
    if (p[0] < x0) x0 = p[0];
    if (p[0] > x1) x1 = p[0];
    if (p[1] < y0) y0 = p[1];
    if (p[1] > y1) y1 = p[1];
  };
  for (const g of geo) {
    if (g.type === 'M') continue;
    take(g.start);
    take(g.end);
    if ((g.type === 'C' || g.type === 'S') && g.c1 && g.c2) {
      for (const k of [0, 1] as const) {
        const p0 = g.start[k], p1 = g.c1[k], p2 = g.c2[k], p3 = g.end[k];
        const ts = rootsIn01(3 * (-p0 + 3 * p1 - 3 * p2 + p3), 6 * (p0 - 2 * p1 + p2), 3 * (p1 - p0));
        for (const t of ts) take([cubicAt(g.start[0], g.c1[0], g.c2[0], g.end[0], t), cubicAt(g.start[1], g.c1[1], g.c2[1], g.end[1], t)]);
      }
    } else if ((g.type === 'Q' || g.type === 'T') && g.c1) {
      for (const k of [0, 1] as const) {
        const den = g.start[k] - 2 * g.c1[k] + g.end[k];
        if (Math.abs(den) < 1e-12) continue;
        const t = (g.start[k] - g.c1[k]) / den;
        if (t > 0 && t < 1) take([quadAt(g.start[0], g.c1[0], g.end[0], t), quadAt(g.start[1], g.c1[1], g.end[1], t)]);
      }
    } else if (g.type === 'A' && g.arc) {
      const c = arcCenter(g.start, g.end, g.arc);
      if (c) {
        const cos = Math.cos(c.phi);
        const sin = Math.sin(c.phi);
        const tx = Math.atan2(-c.ry * sin, c.rx * cos);
        const ty = Math.atan2(c.ry * cos, c.rx * sin);
        for (const base of [tx, tx + Math.PI, ty, ty + Math.PI]) {
          // Is base on the swept range θ1 … θ1 + Δθ?
          const lo = Math.min(c.theta1, c.theta1 + c.dtheta);
          const hi = Math.max(c.theta1, c.theta1 + c.dtheta);
          let t = base;
          while (t > lo) t -= 2 * Math.PI;
          while (t < lo) t += 2 * Math.PI;
          if (t <= hi) take(arcPoint(c, t));
        }
      }
    }
  }
  return x0 === Infinity ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** One segment on its own, in absolute commands, for drawing it over the path. */
export function segmentD(g: Geo): string {
  const p = (q: Pt) => `${num(q[0])} ${num(q[1])}`;
  const m = `M${p(g.start)}`;
  switch (g.type) {
    case 'M':
      return `M${p(g.end)}`;
    case 'C':
    case 'S':
      return `${m} C${p(g.c1!)} ${p(g.c2!)} ${p(g.end)}`;
    case 'Q':
    case 'T':
      return `${m} Q${p(g.c1!)} ${p(g.end)}`;
    case 'A': {
      const a = g.arc!;
      return `${m} A${num(a.rx)} ${num(a.ry)} ${num(a.rot)} ${a.large} ${a.sweep} ${p(g.end)}`;
    }
    default:
      return `${m} L${p(g.end)}`;
  }
}

// ── Exact numbers ────────────────────────────────────────────────────────────

/** Decimal places a number is written with: 0.25 → 2, 1e-7 → 7, 12 → 0. */
export function decimalsOf(n: number): number {
  const s = num(Math.abs(n));
  const m = /^(\d+)(?:\.(\d+))?(?:e([-+]\d+))?$/.exec(s);
  if (!m) return 0;
  const frac = m[2]?.length ?? 0;
  const exp = m[3] ? Number(m[3]) : 0;
  return Math.max(0, frac - exp);
}

/** The most decimals any number in the path is written with, at most 10. */
export function placesOf(segs: Seg[], ...more: number[]): number {
  let d = 0;
  for (const s of segs) for (const n of s.v) d = Math.max(d, decimalsOf(n));
  for (const n of more) d = Math.max(d, decimalsOf(n));
  return Math.min(10, d);
}

/**
 * Rounds to `places` decimals. Sums and differences of numbers written with at
 * most that many decimals come out exact, so converting a path between
 * absolute and relative leaves no float noise (0.30000000000000004) behind.
 */
export function roundTo(n: number, places: number): number {
  const k = 10 ** places;
  const r = Math.round(n * k) / k;
  return Object.is(r, -0) ? 0 : r;
}

// ── Rewriting ────────────────────────────────────────────────────────────────

/** A segment to write: its kind, absolute or relative, and where its points are. */
export type Target = { type: Upper; rel: boolean; end: Pt; c1?: Pt; c2?: Pt; arc?: Arc };

const targetOf = (g: Geo, rel = g.lower): Target => ({ type: g.type, rel, end: g.end, c1: g.c1, c2: g.c2, arc: g.arc });

/** The numbers of one segment, written from its points and the pen. */
function writeSeg(t: Target, cur: Pt, fmt: (n: number) => number, fmtRadius = fmt): Seg {
  const base: Pt = t.rel ? cur : [0, 0];
  const x = (p: Pt) => fmt(p[0] - base[0]);
  const y = (p: Pt) => fmt(p[1] - base[1]);
  const c = (t.rel ? t.type.toLowerCase() : t.type) as Letter;
  switch (t.type) {
    case 'M':
    case 'L':
    case 'T':
      return { c, v: [x(t.end), y(t.end)] };
    case 'H':
      return { c, v: [x(t.end)] };
    case 'V':
      return { c, v: [y(t.end)] };
    case 'C':
      return { c, v: [x(t.c1!), y(t.c1!), x(t.c2!), y(t.c2!), x(t.end), y(t.end)] };
    case 'S':
      return { c, v: [x(t.c2!), y(t.c2!), x(t.end), y(t.end)] };
    case 'Q':
      return { c, v: [x(t.c1!), y(t.c1!), x(t.end), y(t.end)] };
    case 'A': {
      const a = t.arc!;
      return { c, v: [fmtRadius(a.rx), fmtRadius(a.ry), fmt(a.rot), a.large, a.sweep, x(t.end), y(t.end)] };
    }
    default:
      return { c, v: [] };
  }
}

/**
 * Writes every target in order, each relative one from the pen as written so
 * far, so rounding never builds up along a run of relative commands.
 */
export function rewrite(targets: Target[], fmt: (n: number) => number, fmtRadius = fmt): Seg[] {
  const pen = newPen();
  return targets.map((t, i) => {
    const s = writeSeg(t, pen.cur, fmt, fmtRadius);
    step(pen, s, i);
    return s;
  });
}

const near = (a: Pt, b: Pt) =>
  Math.abs(a[0] - b[0]) <= 1e-9 * Math.max(1, Math.abs(b[0])) && Math.abs(a[1] - b[1]) <= 1e-9 * Math.max(1, Math.abs(b[1]));

/**
 * Keeps the drawing where it was after an edit: from index `from` on, a
 * relative segment whose start has moved is rewritten so its own points stay
 * at `keep[i]`. Absolute segments, and relative ones whose start did not move,
 * keep their numbers as written.
 */
function settle(segs: Seg[], keep: (Geo | null)[], from: number, places: number): Seg[] {
  const out = segs.slice();
  const pen = newPen();
  const fmt = (n: number) => roundTo(n, places);
  for (let i = 0; i < out.length; i++) {
    const k = keep[i];
    const U = upper(out[i].c);
    const rel = isLower(out[i].c) && !(i === 0 && U === 'M');
    if (i >= from && k && rel && U !== 'Z' && !near(pen.cur, k.start)) {
      out[i] = writeSeg(targetOf(k, true), pen.cur, fmt, (n) => n);
    }
    step(pen, out[i], i);
  }
  return out;
}

export type Handle = 'end' | 'c1' | 'c2';

/** Moves one point of segment i to p; the rest of the drawing stays where it is. */
export function movePoint(segs: Seg[], i: number, which: Handle, p: Pt, places: number): Seg[] {
  const geo = geometry(segs);
  const g = geo[i];
  const t = targetOf(g);
  if (which === 'end') {
    t.end = g.type === 'H' ? [p[0], g.start[1]] : g.type === 'V' ? [g.start[0], p[1]] : p;
  } else if (which === 'c1') {
    if (g.implicit) return segs;
    t.c1 = p;
  } else {
    t.c2 = p;
  }
  const fmt = (n: number) => roundTo(n, places);
  const next = segs.slice();
  next[i] = writeSeg(t, g.start, fmt, (n) => n);
  return settle(next, geo, i + 1, places);
}

/** Sets one number of segment i; the rest of the drawing stays where it is. */
export function setValue(segs: Seg[], i: number, k: number, n: number): Seg[] {
  const geo = geometry(segs);
  const next = segs.slice();
  const v = next[i].v.slice();
  v[k] = n;
  next[i] = { c: next[i].c, v };
  return settle(next, geo, i + 1, placesOf(next));
}

/** Writes segment i the other way: absolute ↔ relative. Nothing moves. */
export function toggleCase(segs: Seg[], i: number): Seg[] {
  const geo = geometry(segs);
  const places = placesOf(segs);
  const next = segs.slice();
  const want = !isLower(segs[i].c);
  next[i] = writeSeg(targetOf(geo[i], want), geo[i].start, (n) => roundTo(n, places), (n) => n);
  return next;
}

/** Removes segment i; what comes after it stays where it is. */
export function removeSeg(segs: Seg[], i: number): Seg[] {
  const geo = geometry(segs);
  const next = segs.filter((_, j) => j !== i);
  const keep = next.map((_, j) => geo[j < i ? j : j + 1]);
  return settle(next, keep, i, placesOf(segs));
}

/** Inserts a segment after index i (−1: at the start); what comes after it stays where it is. */
export function insertSeg(segs: Seg[], i: number, seg: Seg): Seg[] {
  const geo = geometry(segs);
  const next = [...segs.slice(0, i + 1), seg, ...segs.slice(i + 1)];
  const keep = next.map((_, j) => (j <= i ? geo[j] : j === i + 1 ? null : geo[j - 1]));
  return settle(next, keep, i + 2, placesOf(next));
}

/** A new segment of type U from the pen at the end of segment i, `u` units long. */
export function newSeg(segs: Seg[], i: number, U: Upper, rel: boolean, u: number): Seg {
  const geo = geometry(segs);
  const cur: Pt = i >= 0 && geo[i] ? geo[i].end : [0, 0];
  const at = (dx: number, dy: number): Pt => [cur[0] + dx * u, cur[1] + dy * u];
  const t: Target = { type: U, rel, end: at(2, 0) };
  if (U === 'M') t.end = at(1, 1);
  if (U === 'V') t.end = at(0, 2);
  if (U === 'C') { t.c1 = at(0.5, -1); t.c2 = at(1.5, -1); }
  if (U === 'S') t.c2 = at(1.5, 1);
  if (U === 'Q') t.c1 = at(1, -1.5);
  if (U === 'A') t.arc = { rx: u, ry: u, rot: 0, large: 0, sweep: 1 };
  const places = placesOf(segs, u);
  return writeSeg(t, cur, (n) => roundTo(n, places));
}

/** Every segment written absolute, or every one relative. Nothing moves. */
export function convertAll(segs: Seg[], rel: boolean): Seg[] {
  const places = placesOf(segs);
  return rewrite(geometry(segs).map((g) => targetOf(g, rel)), (n) => roundTo(n, places), (n) => n);
}

/**
 * Every number rounded to `places` decimals. Relative numbers are rounded
 * from where the rounded path has got to, so each point lands within half a
 * unit of the last decimal of where it was, however long the run. A radius is
 * never rounded to 0, which would turn its arc into a line.
 */
export function roundPath(segs: Seg[], places: number): Seg[] {
  const unit = 10 ** -places;
  return rewrite(
    geometry(segs).map((g) => targetOf(g)),
    (n) => roundTo(n, places),
    (n) => (n !== 0 && roundTo(n, places) === 0 ? Math.sign(n) * unit : roundTo(n, places)),
  );
}

/**
 * An arc's ellipse under a 2 × 2 matrix [a b c d] (x' = a x + c y,
 * y' = b x + d y): new radii and rotation, and the sweep flipped when the
 * matrix mirrors.
 */
export function transformArc(arc: Arc, m: [number, number, number, number]): Arc {
  const [a, b, c, d] = m;
  const rx = Math.abs(arc.rx);
  const ry = Math.abs(arc.ry);
  const sweep = a * d - b * c < 0 ? 1 - arc.sweep : arc.sweep;
  const rot = ((arc.rot % 360) + 360) % 360;
  if (b === 0 && c === 0 && rot % 90 === 0) {
    const swap = rot % 180 !== 0;
    return { rx: rx * Math.abs(swap ? d : a), ry: ry * Math.abs(swap ? a : d), rot: arc.rot, large: arc.large, sweep };
  }
  // A = M · R(φ) · diag(rx, ry); the new radii are its singular values.
  const phi = (rot * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const A11 = (a * cos + c * sin) * rx;
  const A12 = (-a * sin + c * cos) * ry;
  const A21 = (b * cos + d * sin) * rx;
  const A22 = (-b * sin + d * cos) * ry;
  // Eigen-decomposition of A Aᵀ.
  const p = A11 * A11 + A12 * A12;
  const q = A11 * A21 + A12 * A22;
  const r = A21 * A21 + A22 * A22;
  const mean = (p + r) / 2;
  const diff = Math.sqrt(((p - r) / 2) ** 2 + q * q);
  const l1 = mean + diff;
  const l2 = Math.max(0, mean - diff);
  const angle = Math.abs(q) < 1e-15 && p >= r ? 0 : Math.atan2(l1 - p, q);
  let deg = (angle * 180) / Math.PI;
  deg = ((deg % 180) + 180) % 180;
  return { rx: Math.sqrt(l1), ry: Math.sqrt(l2), rot: Math.abs(q) < 1e-15 && p < r ? 90 : deg, large: arc.large, sweep };
}

/**
 * The path moved by (dx, dy) and scaled by (sx, sy) about `origin`, written
 * back with the same commands: absolute numbers move and scale, relative ones
 * only scale. Arcs get new radii, and their sweep flips under a mirror.
 */
export function transformPath(segs: Seg[], sx: number, sy: number, dx: number, dy: number, origin: Pt = [0, 0]): Seg[] {
  const f = (p: Pt): Pt => [origin[0] + sx * (p[0] - origin[0]) + dx, origin[1] + sy * (p[1] - origin[1]) + dy];
  const scaled = sx !== 1 || sy !== 1;
  const places = scaled ? 10 : placesOf(segs, dx, dy, ...origin);
  const targets = geometry(segs).map((g): Target => ({
    type: g.type,
    rel: g.lower,
    end: f(g.end),
    c1: g.c1 && f(g.c1),
    c2: g.c2 && f(g.c2),
    arc: g.arc && (scaled ? transformArc(g.arc, [sx, 0, 0, sy]) : g.arc),
  }));
  return rewrite(targets, (n) => roundTo(n, places), scaled ? (n) => roundTo(n, places) : (n) => n);
}

/**
 * The same drawing, run the other way: the subpaths in reverse order, each
 * from its end to its start. A closed subpath keeps its start point and goes
 * round the other way. S and T become C and Q (the point they mirror is on the
 * other side now), an arc's sweep flips, and each segment keeps the case of
 * the one it came from. A move with nothing drawn after it is dropped.
 */
export function reversePath(segs: Seg[]): Seg[] {
  const geo = geometry(segs);
  type Sub = { start: Pt; mCase: boolean; segs: Geo[]; closed: Geo | null };
  const subs: Sub[] = [];
  let sub: Sub | null = null;
  for (const g of geo) {
    if (g.type === 'M') {
      sub = { start: g.end, mCase: g.lower, segs: [], closed: null };
      subs.push(sub);
      continue;
    }
    if (!sub || sub.closed) {
      // Drawing on after Z, with no M: a new subpath from the same start.
      sub = { start: sub ? sub.start : g.start, mCase: false, segs: [], closed: null };
      subs.push(sub);
    }
    if (g.type === 'Z') sub.closed = g;
    else sub.segs.push(g);
  }
  const out: Target[] = [];
  const back = (g: Geo): Target => {
    const rel = g.lower;
    switch (g.type) {
      case 'C':
      case 'S':
        return { type: 'C', rel, end: g.start, c1: g.c2, c2: g.c1 };
      case 'Q':
      case 'T':
        return { type: 'Q', rel, end: g.start, c1: g.c1 };
      case 'A':
        return { type: 'A', rel, end: g.start, arc: { ...g.arc!, sweep: 1 - g.arc!.sweep } };
      default:
        return { type: g.type, rel, end: g.start };
    }
  };
  // A move with nothing drawn after it draws nothing, so it is left out.
  const drawn = subs.filter((s) => s.segs.length || s.closed);
  for (const s of (drawn.length ? drawn : subs.slice(-1)).reverse()) {
    const n = s.segs.length;
    if (!s.closed) {
      out.push({ type: 'M', rel: out.length > 0 && s.mCase, end: n ? s.segs[n - 1].end : s.start });
      for (let k = n - 1; k >= 0; k--) out.push(back(s.segs[k]));
      continue;
    }
    out.push({ type: 'M', rel: out.length > 0 && s.mCase, end: s.start });
    const last = n ? s.segs[n - 1].end : s.start;
    // Z drew a line back to the start; reversed, that line comes first.
    if (!near(last, s.start)) out.push({ type: 'L', rel: s.closed.lower, end: last });
    for (let k = n - 1; k >= 0; k--) {
      const t = back(s.segs[k]);
      // The last one back to the start: a straight one is what Z draws.
      if (k === 0 && (t.type === 'L' || t.type === 'H' || t.type === 'V')) break;
      out.push(t);
    }
    out.push({ type: 'Z', rel: s.closed.lower, end: s.start });
  }
  const places = placesOf(segs);
  return rewrite(out, (n) => roundTo(n, places), (n) => n);
}

/** Every point the editor can show for segment i, in absolute coordinates. */
export function pointsOf(geo: Geo[]): Pt[] {
  const pts: Pt[] = [];
  for (const g of geo) {
    pts.push(g.end);
    if (g.c1) pts.push(g.c1);
    if (g.c2) pts.push(g.c2);
  }
  return pts;
}
