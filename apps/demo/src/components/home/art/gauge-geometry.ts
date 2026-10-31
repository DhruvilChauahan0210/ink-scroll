/**
 * Instrument panel — chapter 06's drawing: three matched chronograph sub-dials
 * (one per browser engine), a mechanical odometer for the unit tests, a
 * laboratory panel meter for the bundle budget and an engraved maker's plate.
 *
 * Built from geometry, not traced: every scale is laid out from its real range
 * (0–195 tests, 0–12 KB), every tick sits on its value, the redline starts at
 * the CI budget. Pure module, no DOM and no randomness, so the server and the
 * client compute byte-identical `d` strings. Every number has one decimal.
 *
 * Draw order matters: the library staggers strokes in document order, and a
 * dash restarts at every subpath, so anything that should sweep — a chapter
 * ring, a bezel's knurling, a hatch — is one continuous subpath.
 */

export type Weight = 'p' | 's' | 'h';
export type Tone = 'ink' | 'mute' | 'faint' | 'accent';
export type P = [number, number];

export interface Piece {
  d: string;
  w: Weight;
  tone: Tone;
  /** A leader line: butt caps, and its label fades in once it is inked. */
  lead?: boolean;
  /**
   * Consecutive pieces with the same key share a `<g>`: `needle` rotates,
   * `clip` is clipped to the instrument's `clip` region (evenodd).
   */
  g?: 'needle' | 'clip';
  /** Filled — with the dial colour, so it hides what it passes over, or with the accent. */
  solid?: true | 'accent';
  /** Left out of the pencil underdrawing (the needle gets a phantom instead). */
  moving?: boolean;
}

/** Type set into the drawing: numerals, plate names, engraving. */
export interface Engraving {
  x: number;
  y: number;
  text: string;
  /** Class suffix: `ga-e-<kind>`. */
  kind: 'num' | 'num-end' | 'plate' | 'unit' | 'small' | 'zero';
  anchor: 'start' | 'middle' | 'end';
  /** Local piece index; the type fades in once that piece is inked. */
  at: number;
  /** A key numeral, kept where the dial is too small for every one. */
  key?: boolean;
}

export interface Note {
  key: string;
  dot: P;
  text: P;
  anchor: 'start' | 'end';
  /** Local index of the leader piece. */
  at: number;
  accent?: boolean;
}

export interface Needle {
  /** Pivot. */
  c: P;
  /** Degrees swept at full scale. */
  sweep: number;
  /** The needle at rest, as a phantom line for the pencil underdrawing. */
  phantom: string;
  /** Local index of the needle body. */
  at: number;
}

export interface Drum {
  x: number;
  w: number;
}

export interface Odometer {
  drums: Drum[];
  /** Window top and height. */
  y: number;
  h: number;
  /** Distance between digits on a drum. */
  pitch: number;
  /** Baseline of the digit that sits in the reading line. */
  base: number;
  /** Local index of the last drum outline; the digits fade in after it. */
  at: number;
}

/** A dimension's text, set over its line once that line is inked. */
export interface Dim {
  key: string;
  x: number;
  y: number;
  /** Local index of the dimension line. */
  at: number;
}

export interface Instrument {
  w: number;
  h: number;
  /** Height of the label band across the top, cropped away where labels hide. */
  top: number;
  /** Height of the dimension band across the bottom, cropped away likewise. */
  bottom: number;
  pieces: Piece[];
  engr: Engraving[];
  notes: Note[];
  dims: Dim[];
  /** Engravings (and the odometer's digits) are layered just before this piece. */
  layerAt: number;
  needle?: Needle;
  odo?: Odometer;
  /** Region the `clip` group is cut to: the redline band, or a face with its windows cut out. */
  clip?: string;
  /** Vignette centre as fractions of the box. */
  glow: [number, number];
}

/* ── Primitives ───────────────────────────────────────────────────────────── */

const f = (n: number): string => {
  const s = n.toFixed(1);
  return s === '-0.0' ? '0.0' : s;
};
const xy = (p: P): string => `${f(p[0])} ${f(p[1])}`;
const rad = (d: number): number => (d * Math.PI) / 180;
/** Angles are degrees, clockwise from +x — SVG's own sense. */
const polar = (c: P, r: number, a: number): P => [c[0] + r * Math.cos(rad(a)), c[1] + r * Math.sin(rad(a))];

/** A full circle as one subpath, starting at angle `a0`, drawn clockwise. */
function circle(c: P, r: number, a0 = -90): string {
  return `M${xy(polar(c, r, a0))}A${f(r)} ${f(r)} 0 1 1 ${xy(polar(c, r, a0 + 180))}A${f(r)} ${f(r)} 0 1 1 ${xy(polar(c, r, a0))}`;
}

/** Arc commands (no move) from `a0` to `a1`, in pieces of at most 90°. */
function arcTo(c: P, r: number, a0: number, a1: number): string {
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90));
  const sweep = a1 > a0 ? 1 : 0;
  let d = '';
  for (let i = 1; i <= n; i++) d += `A${f(r)} ${f(r)} 0 0 ${sweep} ${xy(polar(c, r, a0 + ((a1 - a0) * i) / n))}`;
  return d;
}

/**
 * A scale as one comb: along the arc at `r` from `a0` to `a1`, in to each
 * tick's inner radius and back out. One subpath, so it sweeps like a hand.
 */
function comb(c: P, r: number, a0: number, a1: number, ticks: [number, number][]): string {
  let d = `M${xy(polar(c, r, a0))}`;
  let cur = a0;
  for (const [a, r2] of ticks) {
    if (a > cur + 1e-6) d += arcTo(c, r, cur, a);
    d += `L${xy(polar(c, r2, a))}L${xy(polar(c, r, a))}`;
    cur = a;
  }
  if (a1 > cur + 1e-6) d += arcTo(c, r, cur, a1);
  return d;
}

/** A closed annular band from `a0` to `a1` between two radii. */
function band(c: P, r0: number, r1: number, a0: number, a1: number): string {
  return `M${xy(polar(c, r0, a0))}${arcTo(c, r0, a0, a1)}L${xy(polar(c, r1, a1))}${arcTo(c, r1, a1, a0)}Z`;
}

/** A rounded rectangle as one subpath, clockwise from the top-left corner. */
function rrect(x: number, y: number, w: number, h: number, r: number): string {
  const R = `A${f(r)} ${f(r)} 0 0 1`;
  return (
    `M${f(x + r)} ${f(y)}L${f(x + w - r)} ${f(y)}${R} ${f(x + w)} ${f(y + r)}` +
    `L${f(x + w)} ${f(y + h - r)}${R} ${f(x + w - r)} ${f(y + h)}` +
    `L${f(x + r)} ${f(y + h)}${R} ${f(x)} ${f(y + h - r)}` +
    `L${f(x)} ${f(y + r)}${R} ${f(x + r)} ${f(y)}Z`
  );
}

function screw(c: P, r: number, slot: number): string {
  return `${circle(c, r, slot + 90)}M${xy(polar(c, r * 0.72, slot))}L${xy(polar(c, r * 0.72, slot + 180))}`;
}

/**
 * Archimedean spiral from r0 to r1, as eighth-turn cubic Béziers (Hermite
 * from the analytic tangent): the snailed finish of a chronograph sub-dial.
 */
function spiral(c: P, r0: number, r1: number, turns: number, a0: number): string {
  const span = turns * 2 * Math.PI;
  const t0 = rad(a0);
  const rAt = (th: number): number => r0 + ((r1 - r0) * (th - t0)) / span;
  const at = (th: number): P => [c[0] + rAt(th) * Math.cos(th), c[1] + rAt(th) * Math.sin(th)];
  const tan = (th: number): P => {
    const r = rAt(th);
    const dr = (r1 - r0) / span;
    return [dr * Math.cos(th) - r * Math.sin(th), dr * Math.sin(th) + r * Math.cos(th)];
  };
  const seg = Math.PI / 4;
  const steps = Math.round(span / seg);
  let d = `M${xy(at(t0))}`;
  for (let i = 0; i < steps; i++) {
    const ta = t0 + i * seg;
    const tb = ta + seg;
    const pa = at(ta);
    const pb = at(tb);
    const da = tan(ta);
    const db = tan(tb);
    d += `C${xy([pa[0] + (da[0] * seg) / 3, pa[1] + (da[1] * seg) / 3])} ${xy([pb[0] - (db[0] * seg) / 3, pb[1] - (db[1] * seg) / 3])} ${xy(pb)}`;
  }
  return d;
}

/** Parallel lines at `ang` across a box as one serpentine (clipped by the caller). */
function hatch(x0: number, y0: number, x1: number, y1: number, ang: number, gap: number): string {
  const u: P = [Math.cos(rad(ang)), Math.sin(rad(ang))];
  const v: P = [-u[1], u[0]];
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const half = Math.hypot(x1 - x0, y1 - y0) / 2;
  const n = Math.ceil(half / gap);
  let d = '';
  for (let i = -n, k = 0; i <= n; i++, k++) {
    const o: P = [cx + v[0] * i * gap, cy + v[1] * i * gap];
    const a: P = [o[0] - u[0] * half, o[1] - u[1] * half];
    const b: P = [o[0] + u[0] * half, o[1] + u[1] * half];
    const [p, q] = k % 2 === 0 ? [a, b] : [b, a];
    d += `${k === 0 ? 'M' : 'L'}${xy(p)}L${xy(q)}`;
  }
  return d;
}

/** A point in a needle's frame: `a` along it, `x` across it. */
const frame = (c: P, ang: number) => {
  const u: P = [Math.cos(rad(ang)), Math.sin(rad(ang))];
  return (a: number, x: number): P => [c[0] + u[0] * a - u[1] * x, c[1] + u[1] * a + u[0] * x];
};

/**
 * A counterweighted pointer: a tapered blade to `tip`, a straight tail to a
 * round counterweight. One closed subpath.
 */
function pointer(c: P, ang: number, tip: number, half: number, cwAt: number, cwR: number): string {
  const L = frame(c, ang);
  const tailHalf = half * 0.9;
  const meet = cwAt + Math.sqrt(cwR * cwR - tailHalf * tailHalf);
  return (
    `M${xy(L(tip, 0))}L${xy(L(18, half))}L${xy(L(-meet, tailHalf))}` +
    `A${f(cwR)} ${f(cwR)} 0 1 1 ${xy(L(-meet, -tailHalf))}L${xy(L(18, -half))}Z`
  );
}

/* ── Build helper ─────────────────────────────────────────────────────────── */

class Sheet {
  pieces: Piece[] = [];
  engr: Engraving[] = [];
  notes: Note[] = [];
  dims: Dim[] = [];
  put(d: string, w: Weight, tone: Tone, extra: Partial<Piece> = {}): number {
    this.pieces.push({ d, w, tone, ...extra });
    return this.pieces.length - 1;
  }
  /** Leader from `dot` to an elbow, then along a shelf to `end`; the label sits above the shelf. */
  note(key: string, dot: P, elbow: P, end: P, accent = false): void {
    const at = this.put(`M${xy(dot)}L${xy(elbow)}L${xy(end)}`, 'h', accent ? 'accent' : 'mute', { lead: true });
    this.notes.push({ key, dot, text: [end[0], end[1] - 8], anchor: end[0] < elbow[0] ? 'start' : 'end', at, accent });
  }
}

/* ── Browser gauge: a chronograph sub-dial ────────────────────────────────── */

export const GAUGE = { w: 400, h: 484, top: 64, bottom: 36 } as const;
const GC: P = [200, 248];
/** Scale runs clockwise from the lower left, through the top, to the lower right. */
const G_A0 = 135;
const G_SWEEP = 270;
/** Outer edge of the tick track. */
const G_TRACK = 124;
/** The row's dimension line, under the dials; its text sits under the middle one. */
const G_DIM = 448;

/**
 * A matched sub-dial for one engine. `max` is the number of browser tests:
 * minor ticks every 5, majors every 25, and the full-scale mark at `max`.
 * `side` is where its leader note goes, so the outer dials of a row frame it.
 * `dim` is the dial's place in a row of three: the row shares one dimension
 * line from the first centre to the last, arrowed at both ends, and each dial
 * draws its own stretch of it, so it grows across the row as the dials ink.
 */
export function buildGauge(
  max: number,
  name: string,
  side: 'left' | 'right' = 'left',
  dim: 'start' | 'mid' | 'end' = 'mid',
): Instrument {
  const s = new Sheet();
  const ang = (v: number): number => G_A0 + (G_SWEEP * v) / max;

  // 1 · Centre lines: the datum all three dials share.
  s.put(`M0.0 ${f(GC[1])}L${f(GAUGE.w)} ${f(GC[1])}`, 'h', 'faint');
  s.put(`M${f(GC[0])} ${f(GC[1] - 184)}L${f(GC[0])} ${f(G_DIM)}`, 'h', 'faint');

  // 2 · Bezel: outer edge, a coin-edge knurl as one comb, the inner edge.
  s.put(circle(GC, 172, 180), 'p', 'ink');
  {
    const ticks: [number, number][] = [];
    for (let a = 183; a < 540; a += 3) ticks.push([a, 162]);
    s.put(comb(GC, 168, 180, 540, ticks), 'h', 'mute');
  }
  s.put(circle(GC, 156, 180), 's', 'ink');

  // 3 · Chapter ring: minors as a hairline comb, majors traced over it. The
  //     numerals stand outside the track, where the needle never covers them.
  const vals: number[] = [];
  for (let v = 0; v < max; v += 5) vals.push(v);
  vals.push(max);
  const isMajor = (v: number): boolean => v % 25 === 0 || v === max;
  s.put(
    comb(GC, G_TRACK, ang(0), ang(max), vals.filter((v) => !isMajor(v)).map((v) => [ang(v), G_TRACK - 8])),
    'h',
    'mute',
  );
  // The inner rail closes the minors into a railway track.
  s.put(`M${xy(polar(GC, G_TRACK - 8, ang(0)))}${arcTo(GC, G_TRACK - 8, ang(0), ang(max))}`, 'h', 'mute');
  const ring = s.put(
    comb(GC, G_TRACK, ang(0), ang(max), vals.filter(isMajor).map((v) => [ang(v), G_TRACK - 19])),
    's',
    'ink',
  );
  const mid = Math.round(max / 50) * 25;
  for (const v of vals.filter(isMajor)) {
    const p = polar(GC, 140, ang(v));
    const key = v === 0 || v === mid || v === max;
    s.engr.push({ x: p[0], y: p[1], text: String(v), kind: v === max ? 'num-end' : 'num', anchor: 'middle', at: ring, key });
  }

  // 4 · Snailed centre, cut as one spiral and sunk into a recessed register.
  s.put(spiral(GC, 16, 72, 7, -90), 'h', 'faint');
  s.put(circle(GC, 78, 90), 'h', 'mute');

  // 5 · Name plate in the lower gap of the scale.
  const plate = s.put(rrect(GC[0] - 70, GC[1] + 94, 140, 30, 6), 'h', 'ink');
  s.engr.push({ x: GC[0], y: GC[1] + 109, text: name, kind: 'plate', anchor: 'middle', at: plate });
  s.engr.push({ x: GC[0], y: GC[1] - 88, text: 'TESTS', kind: 'unit', anchor: 'middle', at: ring });

  // 6 · Leader to the engine, from the bezel's upper left (or right).
  if (side === 'left') s.note('engine', polar(GC, 172, -122), [70, 44], [16, 44]);
  else s.note('engine', polar(GC, 172, -58), [GAUGE.w - 70, 44], [GAUGE.w - 16, 44]);

  // 7 · This dial's stretch of the row's dimension line, drawn left to right:
  //     an arrowhead on the first centre line, one on the last.
  {
    const y = G_DIM;
    const x = GC[0];
    const d =
      dim === 'start'
        ? `M${f(x + 9)} ${f(y - 4)}L${f(x)} ${f(y)}L${f(x + 9)} ${f(y + 4)}L${f(x)} ${f(y)}L${f(GAUGE.w)} ${f(y)}`
        : dim === 'end'
          ? `M0.0 ${f(y)}L${f(x)} ${f(y)}L${f(x - 9)} ${f(y - 4)}L${f(x)} ${f(y)}L${f(x - 9)} ${f(y + 4)}`
          : `M0.0 ${f(y)}L${f(GAUGE.w)} ${f(y)}`;
    const at = s.put(d, 'h', 'mute', { lead: true });
    if (dim === 'mid') s.dims.push({ key: 'dim', x, y: y + 20, at });
  }

  // 8 · Needle, counterweight, cap.
  const layerAt = s.pieces.length;
  const needleAt = s.put(pointer(GC, ang(0), G_TRACK + 2, 2.8, 30, 8.5), 's', 'ink', { g: 'needle', solid: true, moving: true });
  s.put(circle(frame(GC, ang(0))(-30, 0), 3.2), 'h', 'ink', { g: 'needle', moving: true });
  {
    // The blade's lume slot.
    const L = frame(GC, ang(0));
    s.put(`M${xy(L(24, 0))}L${xy(L(98, 0))}`, 'h', 'mute', { g: 'needle', moving: true });
  }
  s.put(circle(GC, 12), 's', 'ink', { solid: true });
  s.put(circle(GC, 4.4), 'h', 'ink');

  return {
    w: GAUGE.w,
    h: GAUGE.h,
    top: GAUGE.top,
    bottom: GAUGE.bottom,
    pieces: s.pieces,
    engr: s.engr,
    notes: s.notes,
    dims: s.dims,
    layerAt,
    needle: { c: GC, sweep: G_SWEEP, phantom: pointer(GC, ang(0), G_TRACK + 2, 2.8, 30, 8.5), at: needleAt },
    glow: [GC[0] / GAUGE.w, GC[1] / GAUGE.h],
  };
}

/* ── Odometer: the unit-test totaliser ────────────────────────────────────── */

export const ODO = { w: 760, h: 316, top: 70 } as const;

/** `drums` digit drums, read through a bezelled window, wound by a side knob. */
export function buildOdometer(drums: number): Instrument {
  const s = new Sheet();
  const DW = 72;
  const GAP = 12;
  const winW = drums * DW + (drums - 1) * GAP;
  const hx0 = 52;
  const hx1 = 700;
  const x0 = (hx0 + hx1) / 2 - winW / 2;
  const x1 = x0 + winW;
  const cy = 192;
  const DH = 116;
  const y0 = cy - DH / 2;

  // 1 · Housing, its bevel, the four mounting screws.
  s.put(`M${f(hx0 - 40)} ${f(cy)}L${f(x0 - 16)} ${f(cy)}M${f(x1 + 16)} ${f(cy)}L${f(ODO.w)} ${f(cy)}`, 'h', 'faint');
  s.put(rrect(hx0, cy - 112, hx1 - hx0, 224, 22), 'p', 'ink');
  s.put(rrect(hx0 + 10, cy - 102, hx1 - hx0 - 20, 204, 14), 'h', 'mute');
  // Côtes de Genève across the face, as one serpentine: cut away at the
  // window and under the engraving, the way chapter 02 stripes its bridges.
  const face =
    rrect(hx0 + 10, cy - 102, hx1 - hx0 - 20, 204, 14) +
    rrect(x0 - 20, y0 - 20, winW + 40, DH + 40, 15) +
    rrect((x0 + x1) / 2 - 120, cy + DH / 2 + 22, 240, 18, 4);
  s.put(hatch(hx0 + 10, cy - 102, hx1 - 10, cy + 102, -58, 15), 'h', 'faint', { g: 'clip' });
  s.put(screw([hx0 + 32, cy - 80], 8.5, 35), 'h', 'ink');
  s.put(screw([hx1 - 32, cy - 80], 8.5, -20), 'h', 'ink');
  s.put(screw([hx1 - 32, cy + 80], 8.5, 60), 'h', 'ink');
  s.put(screw([hx0 + 32, cy + 80], 8.5, 10), 'h', 'ink');

  // 2 · Window bezel, in two steps.
  s.put(rrect(x0 - 16, y0 - 16, winW + 32, DH + 32, 12), 's', 'ink');
  s.put(rrect(x0 - 9, y0 - 9, winW + 18, DH + 18, 7), 'h', 'mute');

  // 3 · The drums: an outline each, then cylinder shading — lines that close
  //     up toward the edges, where the drum turns away — as one serpentine.
  const out: Drum[] = [];
  let lastDrum = 0;
  for (let i = 0; i < drums; i++) {
    const x = x0 + i * (DW + GAP);
    out.push({ x, w: DW });
    lastDrum = s.put(rrect(x, y0, DW, DH, 5), 's', 'ink');
  }
  for (const { x } of out) {
    const ys = [y0 + 4, y0 + 9, y0 + 16, y0 + DH - 16, y0 + DH - 9, y0 + DH - 4];
    let d = '';
    ys.forEach((y, k) => {
      const [a, b] = k % 2 === 0 ? [x, x + DW] : [x + DW, x];
      d += `${k === 0 ? 'M' : 'L'}${f(a)} ${f(y)}L${f(b)} ${f(y)}`;
    });
    s.put(d, 'h', 'mute');
  }
  const layerAt = s.pieces.length;

  // 4 · Reading index on both sides of the window.
  s.put(
    `M${f(x0 - 30)} ${f(cy - 6)}L${f(x0 - 20)} ${f(cy)}L${f(x0 - 30)} ${f(cy + 6)}` +
      `M${f(x1 + 30)} ${f(cy - 6)}L${f(x1 + 20)} ${f(cy)}L${f(x1 + 30)} ${f(cy + 6)}`,
    'h',
    'ink',
  );

  // 5 · Winding knob on its stem, knurled like a crown.
  s.put(`M${f(hx1 - 1)} ${f(cy - 9)}L${f(hx1 + 14)} ${f(cy - 9)}L${f(hx1 + 14)} ${f(cy + 9)}L${f(hx1 - 1)} ${f(cy + 9)}`, 'h', 'mute');
  const kx0 = hx1 + 14;
  const kx1 = kx0 + 30;
  s.put(rrect(kx0, cy - 44, kx1 - kx0, 88, 7), 'p', 'ink');
  {
    let d = '';
    const rows = 13;
    for (let i = 0; i < rows; i++) {
      const y = cy - 34 + (68 / (rows - 1)) * i;
      const [a, b] = i % 2 === 0 ? [kx0 + 6, kx1 - 6] : [kx1 - 6, kx0 + 6];
      d += `${i === 0 ? 'M' : 'L'}${f(a)} ${f(y)}L${f(b)} ${f(y)}`;
    }
    s.put(d, 'h', 'mute');
  }

  // 6 · Engraving under the window.
  s.engr.push({ x: (x0 + x1) / 2, y: cy + DH / 2 + 31, text: 'SRC/__TESTS__', kind: 'small', anchor: 'middle', at: lastDrum });

  // 7 · Leaders.
  s.note('drums', [x0 + 14, y0 + 6], [x0 - 44, 44], [16, 44]);
  s.note('env', [x1 - 14, y0 + 6], [x1 + 30, 44], [ODO.w - 8, 44]);

  return {
    w: ODO.w,
    h: ODO.h,
    top: ODO.top,
    bottom: 0,
    pieces: s.pieces,
    engr: s.engr,
    notes: s.notes,
    dims: s.dims,
    layerAt,
    odo: { drums: out, y: y0, h: DH, pitch: 78, base: cy + 26, at: lastDrum },
    clip: face,
    glow: [0.5, cy / ODO.h],
  };
}

/* ── Panel meter: the bundle budget ───────────────────────────────────────── */

export const METER = { w: 520, h: 404, top: 76 } as const;
const MP: P = [260, 326];
/** The scale's arc; ticks hang inward from it, numerals stand outside it. */
const M_R = 170;
/** Radius of the hood over the movement. */
const M_HOOD = 62;

/**
 * A laboratory panel meter, 0 to `full` KB over a half circle, with a redline
 * from `budget` to full scale. The numerals stand outside the arc, so the
 * needle never covers the one it settles beside.
 */
export function buildMeter(full: number, budget: number): Instrument {
  const s = new Sheet();
  const ang = (v: number): number => 180 + (180 * v) / full;

  // 1 · Housing, bevel, screws.
  s.put(rrect(20, 84, 480, 308, 20), 'p', 'ink');
  s.put(rrect(30, 94, 460, 288, 12), 'h', 'mute');
  s.put(screw([48, 112], 8, 30), 'h', 'ink');
  s.put(screw([472, 112], 8, -15), 'h', 'ink');
  s.put(screw([472, 364], 8, 70), 'h', 'ink');
  s.put(screw([48, 364], 8, 5), 'h', 'ink');

  // 2 · Scale: quarter-KB hairlines, then whole KB traced over them.
  {
    const minor: [number, number][] = [];
    for (let q = 1; q < full * 4; q++) if (q % 4 !== 0) minor.push([ang(q / 4), q % 2 === 0 ? M_R - 9 : M_R - 6]);
    s.put(comb(MP, M_R, ang(0), ang(full), minor), 'h', 'mute');
  }
  const major: [number, number][] = [];
  for (let v = 0; v <= full; v++) major.push([ang(v), v % 2 === 0 ? M_R - 22 : M_R - 14]);
  const scale = s.put(comb(MP, M_R, ang(0), ang(full), major), 's', 'ink');
  for (let v = 0; v <= full; v += 2) {
    const p = polar(MP, M_R + 38, ang(v));
    s.engr.push({ x: p[0], y: p[1], text: String(v), kind: 'num', anchor: 'middle', at: scale });
  }

  // 3 · Anti-parallax mirror strip under the ticks.
  s.put(band(MP, M_R - 34, M_R - 28, ang(0), ang(full)), 'h', 'faint');

  // 4 · The redline: a band from the budget to full scale, and its hatching.
  const redRegion = band(MP, M_R + 3, M_R + 25, ang(budget), ang(full));
  s.put(redRegion, 's', 'accent');
  {
    const a = polar(MP, M_R + 26, ang(budget));
    const b = polar(MP, M_R + 26, ang(full));
    s.put(hatch(Math.min(a[0], b[0]) - 30, a[1] - 10, b[0] + 2, MP[1] + 4, -50, 5.5), 'h', 'accent', { g: 'clip' });
  }

  // 5 · The hood over the movement: a half disc on the baseline, striped
  //     like the watch's bridges. It shares the clip with the redline, which
  //     it never meets.
  const hoodRegion = `M${xy(polar(MP, M_HOOD, 180))}${arcTo(MP, M_HOOD, 180, 360)}Z`;
  s.put(hoodRegion, 's', 'ink');
  s.put(hatch(MP[0] - M_HOOD, MP[1] - M_HOOD, MP[0] + M_HOOD, MP[1], -58, 9), 'h', 'faint', { g: 'clip' });

  // 6 · Engraving, above the hood.
  s.engr.push({ x: MP[0], y: MP[1] - 104, text: 'KB · GZIP', kind: 'unit', anchor: 'middle', at: scale });

  // 7 · Leaders: the scale on the left, the redline (in red) on the right.
  s.note('scale', polar(MP, M_R + 3, ang(1)), [120, 48], [16, 48]);
  s.note('budget', polar(MP, M_R + 25, ang(full - (full - budget) * 0.27)), [356, 48], [METER.w - 8, 48], true);

  // 8 · Needle with its red tip, the pivot cover, the zero adjuster.
  const layerAt = s.pieces.length;
  const L = frame(MP, ang(0));
  const body = `M${xy(L(128, 1.8))}L${xy(L(24, 3))}L${xy(L(-12, 3))}A3 3 0 0 1 ${xy(L(-12, -3))}L${xy(L(24, -3))}L${xy(L(128, -1.8))}Z`;
  const tip = `M${xy(L(128, 1.8))}L${xy(L(M_R + 2, 0.5))}L${xy(L(M_R + 2, -0.5))}L${xy(L(128, -1.8))}Z`;
  const needleAt = s.put(body, 's', 'ink', { g: 'needle', solid: true, moving: true });
  s.put(tip, 's', 'accent', { g: 'needle', solid: 'accent', moving: true });
  s.put(circle(MP, 28, 180), 's', 'ink', { solid: true });
  s.put(circle(MP, 6.5), 'h', 'ink');
  s.put(screw([MP[0], MP[1] + 42], 7.5, 25), 'h', 'ink');

  return {
    w: METER.w,
    h: METER.h,
    top: METER.top,
    bottom: 0,
    pieces: s.pieces,
    engr: s.engr,
    notes: s.notes,
    dims: s.dims,
    layerAt,
    needle: { c: MP, sweep: 180, phantom: `${body}${tip}`, at: needleAt },
    clip: redRegion + hoodRegion,
    glow: [0.5, 0.64],
  };
}

/* ── Maker's plate ────────────────────────────────────────────────────────── */

export const PLATE = { w: 380, h: 120, top: 0 } as const;

/** A riveted plate whose zero is drawn, not typeset. */
export function buildPlate(): Instrument {
  const s = new Sheet();
  s.put(rrect(6, 8, 368, 104, 10), 's', 'ink');
  s.put(rrect(14, 16, 352, 88, 5), 'h', 'mute');
  for (const c of [[28, 30], [352, 30], [352, 90], [28, 90]] as P[]) s.put(circle(c, 4.5), 'h', 'ink');
  // The zero, drawn like a slashed numeral.
  s.put(`M78.0 26.0C98.0 26.0 104.0 44.0 104.0 60.0C104.0 76.0 98.0 94.0 78.0 94.0C58.0 94.0 52.0 76.0 52.0 60.0C52.0 44.0 58.0 26.0 78.0 26.0Z`, 'p', 'ink');
  const slash = s.put('M66.0 84.0L90.0 36.0', 's', 'ink');
  s.put('M128.0 30.0L128.0 90.0', 'h', 'mute');
  s.engr.push({ x: 148, y: 55, text: 'RUNTIME', kind: 'plate', anchor: 'start', at: slash });
  s.engr.push({ x: 148, y: 81, text: 'DEPENDENCIES', kind: 'plate', anchor: 'start', at: slash });
  return {
    w: PLATE.w,
    h: PLATE.h,
    top: PLATE.top,
    bottom: 0,
    pieces: s.pieces,
    engr: s.engr,
    notes: s.notes,
    dims: s.dims,
    layerAt: s.pieces.length,
    glow: [0.5, 0.5],
  };
}
