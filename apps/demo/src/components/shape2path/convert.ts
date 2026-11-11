/**
 * The shape → path maths for the SVG shape to path converter.
 *
 * Pure functions, no DOM: each one takes a shape's attributes (as a getter)
 * and returns the `d` of the path the SVG 2 spec says the shape is equal to
 * (https://www.w3.org/TR/SVG2/shapes.html), its exact length, and what was
 * read along the way. The paths start where the browser starts the shape and
 * run the same way round, clockwise, so a dash animation on the path begins at
 * the same point as one on the shape:
 *
 *   rect     M x+rx y, H, (A), V, (A), H, (A), V, (A), Z — the spec's ten steps
 *   circle   M cx+r cy, then two half arcs (or the spec's four quarter arcs), Z
 *   ellipse  the same with rx and ry
 *   line     M x1 y1 L x2 y2
 *   polyline M first point, L each next one
 *   polygon  the same, closed with Z
 *
 * A shape the browser draws nothing for (a rect with no width, a circle with
 * r = 0, a polyline with no points) is not converted: a path with the same
 * numbers would draw a line where there was nothing.
 */

export type ShapeTag = 'rect' | 'circle' | 'ellipse' | 'line' | 'polyline' | 'polygon';
export const SHAPE_TAGS: readonly ShapeTag[] = ['rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'];

/** The attributes each shape's geometry comes from. The path gets `d` instead. */
export const GEOMETRY_ATTRS: Record<ShapeTag, readonly string[]> = {
  rect: ['x', 'y', 'width', 'height', 'rx', 'ry'],
  circle: ['cx', 'cy', 'r'],
  ellipse: ['cx', 'cy', 'rx', 'ry'],
  line: ['x1', 'y1', 'x2', 'y2'],
  polyline: ['points'],
  polygon: ['points'],
};

/** 'exact' keeps every digit the maths produces, minus floating-point noise. */
export type Precision = 'exact' | 3 | 2 | 1;
export type ConvertOptions = { arcs: 2 | 4; precision: Precision };
export const DEFAULT_OPTIONS: ConvertOptions = { arcs: 2, precision: 'exact' };

export type Get = (name: string) => string | null;
export type Segment = [string, ...number[]];
export type ShapeResult =
  | { ok: true; d: string; segments: Segment[]; length: number; notes: string[] }
  | { ok: false; reason: string };

// ── Reading attribute values ────────────────────────────────────────────────

/** CSS absolute units in user units (px). */
const UNITS: Record<string, number> = { '': 1, px: 1, in: 96, cm: 96 / 2.54, mm: 96 / 25.4, q: 96 / 101.6, pt: 4 / 3, pc: 16 };
// A digit is needed after a dot: Chrome, Firefox and Safari all reject
// width="40." and points="10.,10", and draw nothing.
const LENGTH = /^([+-]?(?:\d*\.\d+|\d+)(?:[eE][+-]?\d+)?)([a-zA-Z%]*)$/;

type Len = { n: number | null; unit?: string };

/**
 * An attribute as user units. `n: null` is a value the browser ignores
 * (missing, `auto`, not a number), and `unit` a relative one (%, em, vw…)
 * that needs the page's layout to resolve, so the shape is left alone.
 */
export function readLength(raw: string | null): Len {
  if (raw === null) return { n: null };
  const m = LENGTH.exec(raw.trim());
  if (!m) return { n: null };
  const unit = m[2].toLowerCase();
  if (!(unit in UNITS)) return { n: null, unit: m[2] };
  return { n: Number(m[1]) * UNITS[unit] };
}

/**
 * Reads the named attributes. A negative value is invalid for a size (width,
 * height, r, rx, ry), which the browser treats as not set.
 */
function lengths(get: Get, names: readonly string[], sizes: readonly string[] = []):
  { v: Record<string, number | null>; unit?: string; notes: string[] } {
  const v: Record<string, number | null> = {};
  const notes: string[] = [];
  for (const name of names) {
    const raw = get(name);
    const len = readLength(raw);
    if (len.unit) return { v, unit: `${name}="${raw}"`, notes };
    let n = len.n;
    if (n !== null && sizes.includes(name) && n < 0) {
      notes.push(`${name}="${raw}" is negative, which the browser ignores.`);
      n = null;
    }
    if (n !== null && raw !== null && /[a-z]$/i.test(raw.trim()) && !/px$/i.test(raw.trim())) {
      notes.push(`${name}="${raw}" is ${fmt(n, 'exact')} user units.`);
    }
    if (len.n === null && raw !== null && raw.trim() !== '' && raw.trim().toLowerCase() !== 'auto') {
      notes.push(`${name}="${raw}" is not a number the browser reads, so it is ignored.`);
    }
    v[name] = n;
  }
  return { v, notes };
}

/**
 * Why one radius takes the other's value: it is missing, `auto`, or a value
 * the browser ignores (already noted). For an explicit `auto` Chrome does not
 * take the other radius, and draws `chrome` instead (measured in Chromium,
 * Firefox and WebKit).
 */
function radiusNote(name: string, raw: string | null, other: string, value: number, chrome: string): string {
  const v = fmt(value, 'exact');
  if (raw === null) return `${name} is not set, so it is ${other} (${v}).`;
  if (raw.trim().toLowerCase() === 'auto') return `${name}="auto", so it is ${other} (${v}), as SVG 2 says. Chrome draws ${chrome} instead.`;
  return `So ${name} is ${other} (${v}).`;
}

const unresolved = (what: string): ShapeResult => ({
  ok: false,
  reason: `${what} depends on the page’s layout, which the converter cannot see. Left as it is.`,
});

// ── The shapes ──────────────────────────────────────────────────────────────

export function rectPath(get: Get): ShapeResult {
  const r = lengths(get, GEOMETRY_ATTRS.rect, ['width', 'height', 'rx', 'ry']);
  if (r.unit) return unresolved(r.unit);
  const x = r.v.x ?? 0;
  const y = r.v.y ?? 0;
  const w = r.v.width ?? 0;
  const h = r.v.height ?? 0;
  if (w <= 0 || h <= 0) {
    return { ok: false, reason: `${w <= 0 ? 'width' : 'height'} is 0, not set or not a number, so the browser draws nothing. Left as it is.` };
  }
  const notes = [...r.notes];

  // SVG 2 §10.2: an rx with no ry (or the reverse) is used for both, then each
  // is clamped to half its side on its own.
  const rxIn = r.v.rx;
  const ryIn = r.v.ry;
  let a = rxIn ?? ryIn ?? 0;
  let b = ryIn ?? rxIn ?? 0;
  if (rxIn !== null && ryIn === null) notes.push(radiusNote('ry', get('ry'), 'rx', a, 'the rect with square corners'));
  if (ryIn !== null && rxIn === null) notes.push(radiusNote('rx', get('rx'), 'ry', b, 'the rect with square corners'));
  if (a > w / 2) { notes.push(`rx ${fmt(a, 'exact')} is more than half the width, so it is ${fmt(w / 2, 'exact')}.`); a = w / 2; }
  if (b > h / 2) { notes.push(`ry ${fmt(b, 'exact')} is more than half the height, so it is ${fmt(h / 2, 'exact')}.`); b = h / 2; }

  if (a === 0 || b === 0) {
    // Square corners. The outline still starts rx along the top edge, as the
    // spec's moveto (x + rx, y) has it, and Firefox and Safari draw it.
    if (b && !a) notes.push('rx is 0, so the corners are square.');
    if (a && !b) notes.push(`ry is 0, so the corners are square. The outline starts ${fmt(a, 'exact')} along the top edge, as Firefox and Safari draw it; Chrome starts it at the corner.`);
    const segs: Segment[] = [['M', x + a, y], ['H', x + w], ['V', y + h], ['H', x]];
    if (a) segs.push(['V', y]);
    segs.push(['Z']);
    return done(segs, 2 * (w + h), notes);
  }
  const arc = (ex: number, ey: number): Segment => ['A', a, b, 0, 0, 1, ex, ey];
  const segs: Segment[] = [['M', x + a, y]];
  // Straight runs of zero length (a side that is all corner) are left out.
  if (w > 2 * a) segs.push(['H', x + w - a]);
  segs.push(arc(x + w, y + b));
  if (h > 2 * b) segs.push(['V', y + h - b]);
  segs.push(arc(x + w - a, y + h));
  if (w > 2 * a) segs.push(['H', x + a]);
  segs.push(arc(x, y + h - b));
  if (h > 2 * b) segs.push(['V', y + b]);
  segs.push(arc(x + a, y));
  segs.push(['Z']);
  return done(segs, 2 * (w - 2 * a) + 2 * (h - 2 * b) + ellipsePerimeter(a, b), notes);
}

export function circlePath(get: Get, arcs: 2 | 4 = 2): ShapeResult {
  const c = lengths(get, GEOMETRY_ATTRS.circle, ['r']);
  if (c.unit) return unresolved(c.unit);
  const r = c.v.r ?? 0;
  if (r <= 0) return { ok: false, reason: 'r is 0, not set or not a number, so the browser draws nothing. Left as it is.' };
  return done(oval(c.v.cx ?? 0, c.v.cy ?? 0, r, r, arcs), 2 * Math.PI * r, c.notes);
}

export function ellipsePath(get: Get, arcs: 2 | 4 = 2): ShapeResult {
  const e = lengths(get, GEOMETRY_ATTRS.ellipse, ['rx', 'ry']);
  if (e.unit) return unresolved(e.unit);
  const notes = [...e.notes];
  // SVG 2: a radius left as auto takes the other one.
  const rxIn = e.v.rx;
  const ryIn = e.v.ry;
  const rx = rxIn ?? ryIn;
  const ry = ryIn ?? rxIn;
  if (rx === null || ry === null || rx <= 0 || ry <= 0) {
    return { ok: false, reason: 'A radius is 0, not set or not a number, so the browser draws nothing. Left as it is.' };
  }
  if (rxIn === null) notes.push(radiusNote('rx', get('rx'), 'ry', ry, 'nothing'));
  if (ryIn === null) notes.push(radiusNote('ry', get('ry'), 'rx', rx, 'nothing'));
  return done(oval(e.v.cx ?? 0, e.v.cy ?? 0, rx, ry, arcs), ellipsePerimeter(rx, ry), notes);
}

export function linePath(get: Get): ShapeResult {
  const l = lengths(get, GEOMETRY_ATTRS.line);
  if (l.unit) return unresolved(l.unit);
  const [x1, y1, x2, y2] = GEOMETRY_ATTRS.line.map((k) => l.v[k] ?? 0);
  return done([['M', x1, y1], ['L', x2, y2]], Math.hypot(x2 - x1, y2 - y1), l.notes);
}

export function polyPath(get: Get, closed: boolean): ShapeResult {
  const { points, note, error } = readPoints(get('points'));
  if (error) return { ok: false, reason: error };
  if (!points.length) return { ok: false, reason: 'No points, so the browser draws nothing. Left as it is.' };
  const segs: Segment[] = points.map(([px, py], i) => [i ? 'L' : 'M', px, py]);
  let length = 0;
  for (let i = 1; i < points.length; i++) length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  if (closed) {
    segs.push(['Z']);
    const [first, last] = [points[0], points[points.length - 1]];
    length += Math.hypot(first[0] - last[0], first[1] - last[1]);
  }
  return done(segs, length, note ? [note] : []);
}

/** The path for any of the six shapes. */
export function shapePath(tag: ShapeTag, get: Get, options: ConvertOptions = DEFAULT_OPTIONS): ShapeResult {
  const res = tag === 'rect' ? rectPath(get)
    : tag === 'circle' ? circlePath(get, options.arcs)
    : tag === 'ellipse' ? ellipsePath(get, options.arcs)
    : tag === 'line' ? linePath(get)
    : polyPath(get, tag === 'polygon');
  return res.ok && options.precision !== 'exact' ? { ...res, d: format(res.segments, options.precision) } : res;
}

/**
 * Starting at (cx + rx, cy), clockwise: two half arcs, or the spec's four
 * quarter arcs (to the bottom, left, top and back). A half arc's two end
 * points are a diameter apart, so either large-arc flag gives the same arc.
 */
function oval(cx: number, cy: number, rx: number, ry: number, arcs: 2 | 4): Segment[] {
  const to = (large: 0 | 1, ex: number, ey: number): Segment => ['A', rx, ry, 0, large, 1, ex, ey];
  const segs: Segment[] = [['M', cx + rx, cy]];
  if (arcs === 4) segs.push(to(0, cx, cy + ry), to(0, cx - rx, cy), to(0, cx, cy - ry), to(0, cx + rx, cy));
  else segs.push(to(1, cx - rx, cy), to(1, cx + rx, cy));
  segs.push(['Z']);
  return segs;
}

function done(segments: Segment[], length: number, notes: string[]): ShapeResult {
  return { ok: true, d: format(segments, 'exact'), segments, length, notes };
}

// ── points="…" ─────────────────────────────────────────────────────────────

const NUMBER = /^[+-]?(?:\d*\.\d+|\d+)(?:[eE][+-]?\d+)?/;

/**
 * The coordinate pairs of a points attribute, read as Chrome and Safari read
 * it: numbers apart by spaces, or by one comma with spaces around it, a sign
 * or a second dot starting the next number ("10-5", "50.5.5"). Firefox reads
 * a second dot as an error and draws nothing, so that gets a note. An odd
 * last number is dropped (SVG 2 §10.6). A value that cannot be read (a stray
 * letter, a dot with no digit after it, two commas in a row, a comma at
 * either end) makes Firefox and Safari draw nothing, and Chrome too except
 * for a trailing comma, so it is not converted. Measured in Chromium, Firefox
 * and WebKit.
 */
export function readPoints(raw: string | null): { points: [number, number][]; note?: string; error?: string } {
  const nums: number[] = [];
  const s = raw ?? '';
  let i = 0;
  /** Whether a number ran straight into one starting with a dot ("50.5.5"). */
  let dotted = false;
  let sep = true;
  const ws = () => { while (i < s.length && /\s/.test(s[i])) { i++; sep = true; } };
  const fail = (what: string) => ({
    points: [] as [number, number][],
    error: `points ${what}, so the browser reads it as an error and draws nothing. Left as it is.`,
  });
  ws();
  while (i < s.length) {
    const m = NUMBER.exec(s.slice(i));
    if (!m) return fail(s[i] === ',' ? 'has a comma with no number before it' : `has “${s.slice(i, i + 10).trim()}” where a number should be`);
    if (!sep && m[0][0] === '.') dotted = true;
    nums.push(Number(m[0]));
    i += m[0].length;
    sep = false;
    ws();
    if (s[i] === ',') {
      sep = true;
      i++;
      ws();
      if (i >= s.length) {
        return { points: [], error: 'points ends in a comma, which Firefox and Safari read as an error and draw nothing (Chrome draws it). Left as it is.' };
      }
    }
  }
  const points: [number, number][] = [];
  for (let k = 0; k + 1 < nums.length; k += 2) points.push([nums[k], nums[k + 1]]);
  const notes = [
    nums.length % 2 ? 'points has an odd number of coordinates: the last one is dropped, as the browser does.' : '',
    dotted ? 'points runs two numbers together with a second dot (as in 50.5.5): Chrome and Safari read the next number there, and so does the path, but Firefox reads it as an error and draws nothing.' : '',
  ].filter(Boolean);
  return { points, note: notes.join(' ') || undefined };
}

// ── Writing numbers and paths ───────────────────────────────────────────────

/**
 * A number for path data. 'exact' keeps 12 significant digits, enough for any
 * coordinate an SVG holds, and drops the floating-point tail (30.299999999999997
 * is 30.3); a number of decimals rounds to that many.
 */
export function fmt(n: number, precision: Precision): string {
  if (precision === 'exact') return String(Math.abs(n) < 1e-9 ? 0 : Number(n.toPrecision(12)));
  const v = Number(n.toFixed(precision));
  return String(v === 0 ? 0 : v);
}

/**
 * A radius rounded down to that many decimals, and never to 0 (an arc with a
 * 0 radius is a straight line).
 */
function fmtDown(n: number, places: number): string {
  const k = 10 ** places;
  return String(Math.max(Math.floor(n * k + 1e-9), 1) / k);
}

/**
 * "M10 20 H90 A10 10 0 0 1 100 30 … Z". Arc flags stay 0 or 1.
 *
 * A half arc (large-arc 1: the two-arc circle and ellipse) has its end points
 * a diameter apart, and that is fragile once rounded: a radius rounded up past
 * half the rounded chord makes the browser swing a longer arc around an
 * off-centre point. Measured: r 5.06 at one decimal drew a circle 11.62 tall
 * and 10.2 wide. So its radii round down instead, and the rule every browser
 * applies to a radius too small for its chord (the SVG implementation notes'
 * out-of-range radii: scale both up until they fit) puts the arc back on the
 * diameter.
 */
export function format(segments: Segment[], precision: Precision): string {
  return segments
    .map(([cmd, ...n]) => {
      const half = cmd === 'A' && n[3] === 1 && precision !== 'exact';
      const radius = (v: number) => (half ? fmtDown(v, precision as number) : fmt(v, precision));
      const nums = cmd === 'A'
        ? [radius(n[0]), radius(n[1]), String(n[2]), String(n[3]), String(n[4]), fmt(n[5], precision), fmt(n[6], precision)]
        : n.map((v) => fmt(v, precision));
      return cmd + nums.join(' ');
    })
    .join(' ');
}

/** "M 1 · H 2 · A 4 · Z 1", as the path viewer writes it. */
export function summarize(segments: Segment[]): string {
  const counts = new Map<string, number>();
  for (const [c] of segments) counts.set(c, (counts.get(c) ?? 0) + 1);
  return [...counts].map(([k, n]) => `${k} ${n}`).join(' · ');
}

/**
 * The perimeter of an ellipse, exactly (to floating point): 4a·E(e) with the
 * complete elliptic integral E from the arithmetic–geometric mean, which
 * converges in a handful of steps. A circle gives 2πr.
 */
export function ellipsePerimeter(rx: number, ry: number): number {
  const a = Math.max(rx, ry);
  const b = Math.min(rx, ry);
  if (a === 0) return 0;
  if (b === 0) return 4 * a;
  let an = 1;
  let bn = b / a;
  let sum = (1 - bn * bn) / 2; // 2^-1 · c0², with c0² = 1 − (b/a)²
  let pow = 0.5;
  for (let k = 0; k < 32; k++) {
    const cn = (an - bn) / 2;
    if (cn < 1e-17) break;
    pow *= 2;
    sum += pow * cn * cn;
    [an, bn] = [(an + bn) / 2, Math.sqrt(an * bn)];
  }
  return 4 * a * (Math.PI / (2 * an)) * (1 - sum);
}
