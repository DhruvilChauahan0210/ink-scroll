/**
 * Proof — a printer's proof sheet, drawn as a technical drawing, then marked
 * up by an editor in red pen.
 *
 * Everything here is measured off the live page: the sheet's trim box, the
 * paragraph's block and every marked phrase, all in px relative to the pinned
 * frame. The drawing is built in that same px space, so a stroke is never
 * stretched and a mark sits on its phrase at every width.
 *
 * Pure module: no DOM, no randomness. The same measure always produces the
 * same `d` strings, and every number is written with one decimal.
 *
 * ── Timing ──────────────────────────────────────────────────────────────────
 * The library gives every element the same window, `1 / SPEED` of the stage,
 * and starts element i at `i × STAGGER`. So the drawing is laid out in SLOTS
 * of one stagger each; a window is K slots long.
 *   · The sheet is the machine, many pens at once. Its long strokes (trim,
 *     shadow, both rulers) are cut into pieces set K slots apart, so each
 *     draws on without a break over several windows; the short furniture
 *     takes the free slots between them, one a slot — a cascade, like the
 *     calibre.
 *   · The red pen is the editor: one pen, so its strokes are cut into pieces
 *     of one length and set K slots apart, each piece starting the moment the
 *     last one lands. The slots between are filled with invisible rests.
 * The pen's piece length is solved so its last mark lands at PEN_DONE_BY,
 * leaving a hold on the finished proof before the stage releases.
 */

export const STAGGER = 0.004;
export const SPEED = 50;
/** Slots per window: a piece placed K slots after the last starts as it ends. */
export const K = Math.round(1 / (SPEED * STAGGER));
/** The pen should be done by here, leaving a hold on the finished proof. */
const PEN_DONE_BY = 0.86;

export type Pt = [number, number];
export type Seg = [Pt, Pt, Pt, Pt];
export type Weight = 'p' | 's' | 'h' | 'pen' | 'thin' | 'dot';
export type Tone = 'ink' | 'mute' | 'faint' | 'accent';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A marked phrase, in pin px: left, right, top, bottom of its box and its baseline. */
export interface Box {
  l: number;
  r: number;
  t: number;
  b: number;
  base: number;
}

export type Key = 'kb' | 'deps' | 'native' | 'mit' | 'frame' | 'yours';
export const KEYS: readonly Key[] = ['kb', 'deps', 'native', 'mit', 'frame', 'yours'];

export interface Measure {
  /** The pinned frame, which is the SVG's px space. */
  W: number;
  H: number;
  /** Trim box of the sheet. */
  sheet: Rect;
  /** The paragraph's block. */
  block: Rect;
  /** The paragraph's face as set, e.g. "Geist 500", for the type note. */
  face: string;
  /** Font size and line height of the paragraph. */
  fs: number;
  lh: number;
  /** Baseline of the first line. */
  base0: number;
  /** Per line: left and right edge of the set text. */
  lineL: number[];
  lineR: number[];
  box: Record<Key, Box>;
  /** Phone layout: simplified sheet furniture, notes under the text. */
  compact: boolean;
  /** Wide enough for the blueprint notes outside the sheet. */
  notes: boolean;
  sig: string;
}

export interface Stroke {
  d: string;
  w: Weight;
  tone: Tone;
  /** Leader lines get butt caps (no stray dot at zero length). */
  lead?: boolean;
  /** Butt caps, so the pieces of a cut straight stroke meet without a seam. */
  butt?: boolean;
}

export interface Label {
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  /** Small uppercase title over the value, as the calibre's notes. */
  title?: string;
  text: string;
  /** Stage progress at which it fades in. */
  at: number;
  kind: 'note' | 'num' | 'pen' | 'dim';
  /** Second line, for two-line pen notes. */
  text2?: string;
}

export interface Dot {
  x: number;
  y: number;
  at: number;
}

export interface Patch {
  x: number;
  y: number;
  w: number;
  h: number;
  at: number;
}

export interface Proof {
  /** One entry per slot, in draw order. `null` is a rest. */
  slots: (Stroke | null)[];
  /** The sheet as a pencil underdrawing: static, under the ink. */
  pencil: Stroke[];
  labels: Label[];
  dots: Dot[];
  patch: Patch;
  /** Stage progress at which each of the editor's marks is finished. */
  markDone: number[];
  /** Slot of every red stroke, in order, for the nib to follow. */
  pen: number[];
  sheetStrokes: number;
  penStrokes: number;
}

/** Stage progress at which slot i starts / is finished. */
export const startAt = (i: number): number => i * STAGGER;
export const doneAt = (i: number): number => Math.min(1, i * STAGGER + 1 / SPEED);

/**
 * Blueprint note type, in px, from the paragraph's size: the calibre's notes
 * render at about 0.36 of this chapter's text size at every desktop width, so
 * the two chapters' notes read as one hand. The title is set at 0.72 of the
 * value, as there. Geist Mono advances 0.6em a character.
 */
export const noteSize = (e: number, compact = false): number =>
  compact ? 12 : Math.min(17, Math.max(13, 0.36 * e));
/** The editor's notes in the margin: a size a pen writes at, a step under the blueprint values. */
export const penSize = (e: number, compact: boolean): number => (compact ? 11.5 : Math.min(15.5, Math.max(13, 0.32 * e)));
const monoW = (s: string, size: number): number => s.length * 0.6 * size;

/* ── Number formatting ───────────────────────────────────────────────────── */

const f = (n: number): string => {
  const s = n.toFixed(1);
  return s === '-0.0' ? '0.0' : s;
};
const xy = (p: Pt): string => `${f(p[0])} ${f(p[1])}`;

/* ── Curve kit ───────────────────────────────────────────────────────────── */

const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function split(s: Seg, t: number): [Seg, Seg] {
  const a = lerp(s[0], s[1], t), b = lerp(s[1], s[2], t), c = lerp(s[2], s[3], t);
  const d = lerp(a, b, t), e = lerp(b, c, t), g = lerp(d, e, t);
  return [[s[0], a, d, g], [g, e, c, s[3]]];
}

function bez(s: Seg, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
    u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1],
  ];
}

function segLen(s: Seg): number {
  let len = 0;
  let p = s[0];
  for (let i = 1; i <= 24; i++) {
    const q = bez(s, i / 24);
    len += Math.hypot(q[0] - p[0], q[1] - p[1]);
    p = q;
  }
  return len;
}

const strokeLen = (stroke: Seg[]): number => stroke.reduce((s, g) => s + segLen(g), 0);

/** An explicit cubic chain: a start point, then [c1, c2, end] per segment. */
function chain(start: Pt, ...rest: [Pt, Pt, Pt][]): Seg[] {
  const out: Seg[] = [];
  let p = start;
  for (const [c1, c2, e] of rest) {
    out.push([p, c1, c2, e]);
    p = e;
  }
  return out;
}

/** A straight run as a cubic, so it can be cut into pieces like any other. */
const line = (a: Pt, b: Pt): Seg => [a, lerp(a, b, 1 / 3), lerp(a, b, 2 / 3), b];

function rotate(stroke: Seg[], deg: number, c: Pt): Seg[] {
  const a = (deg * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
  const r = (p: Pt): Pt => {
    const x = p[0] - c[0], y = p[1] - c[1];
    return [c[0] + x * cos - y * sin, c[1] + x * sin + y * cos];
  };
  return stroke.map((s) => s.map(r) as Seg);
}

/** Cut a stroke into `count` pieces of equal length, so every piece draws at one pen speed. */
function cut(stroke: Seg[], count: number): Seg[][] {
  const fine: { s: Seg; len: number }[] = [];
  for (const s of stroke) {
    const n = Math.max(1, Math.ceil(segLen(s) / 6));
    let rest = s;
    for (let i = n; i > 1; i--) {
      const [a, b] = split(rest, 1 / i);
      fine.push({ s: a, len: segLen(a) });
      rest = b;
    }
    fine.push({ s: rest, len: segLen(rest) });
  }
  const total = fine.reduce((sum, x) => sum + x.len, 0);
  const groups: Seg[][] = [[]];
  let acc = 0;
  for (const x of fine) {
    groups[groups.length - 1].push(x.s);
    acc += x.len;
    if (groups.length < count && acc >= (groups.length * total) / count - x.len / 2) groups.push([]);
  }
  return groups.filter((g) => g.length > 0);
}

function toD(g: Seg[]): string {
  let d = `M${xy(g[0][0])}`;
  for (const s of g) d += `C${xy(s[1])} ${xy(s[2])} ${xy(s[3])}`;
  return d;
}

/** Axis-aligned bounds of a stroke, for keeping the routed hairlines off the marks. */
function bounds(stroke: Seg[]): Rect {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of stroke) {
    for (let i = 0; i <= 12; i++) {
      const p = bez(s, i / 12);
      x0 = Math.min(x0, p[0]);
      y0 = Math.min(y0, p[1]);
      x1 = Math.max(x1, p[0]);
      y1 = Math.max(y1, p[1]);
    }
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

const hits = (r: Rect, x0: number, x1: number, y: number, pad: number): boolean =>
  y > r.y - pad && y < r.y + r.h + pad && x1 > r.x - pad && x0 < r.x + r.w + pad;

/* ── Sheet primitives ────────────────────────────────────────────────────── */

const M = (p: Pt): string => `M${xy(p)}`;
const L = (p: Pt): string => `L${xy(p)}`;

/** A full circle as one subpath, from angle a0, clockwise. */
function circle(c: Pt, r: number, a0 = -Math.PI / 2): string {
  const s: Pt = [c[0] + r * Math.cos(a0), c[1] + r * Math.sin(a0)];
  const m: Pt = [c[0] - r * Math.cos(a0), c[1] - r * Math.sin(a0)];
  return `M${xy(s)}A${f(r)} ${f(r)} 0 1 1 ${xy(m)}A${f(r)} ${f(r)} 0 1 1 ${xy(s)}`;
}

/** A dimension half: from the centre out to `end`, with an open arrowhead there. */
function dimHalf(c: Pt, end: Pt, head: number): string {
  const dir = Math.sign(end[0] - c[0]) || 1;
  return `${M(c)}${L(end)}l${f(-dir * head)} -${f(head * 0.55)}${L(end)}l${f(-dir * head)} ${f(head * 0.55)}`;
}

/* ── The editor's marks ──────────────────────────────────────────────────
   Offsets are in em, read off Geist at weight 500: caps and ascenders reach
   0.71em above the baseline, descenders 0.16em below, and at line-height 1.28
   that leaves a clear band of about 0.41em between lines for the pen.
   ──────────────────────────────────────────────────────────────────────── */

/** "10 KB" — one confident stroke, rising a touch, that overshoots and flicks back. */
function underline(b: Box, e: number): Seg[] {
  const y = b.base + 0.14 * e;
  const p0: Pt = [b.l - 0.06 * e, y + 0.03 * e];
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

/** "zero dependencies." — a long pen loop that takes in the full stop and overruns its own start. */
function loop(b: Box, e: number): Seg[] {
  const Lx = b.l - 0.26 * e;
  const R = b.r + 0.285 * e;
  const cy = b.base - 0.28 * e;
  const T = cy - 0.55 * e, B = cy + 0.55 * e;
  const ex = Math.min(0.82 * e, (R - Lx) / 4);
  const k = 0.5523;
  const w = R - Lx - 2 * ex;
  // The pen sets down a touch inside the top edge and, coming round, crosses
  // its own start at a shallow angle and lifts away: two lines that cross,
  // never two that lie side by side and fatten into a blot.
  const S: Pt = [R - ex - 0.9 * e, T + 0.05 * e];
  const tl: Pt = [Lx + ex, T];
  const bl: Pt = [Lx + ex, B];
  const br: Pt = [R - ex, B - 0.015 * e];
  const tr: Pt = [R - ex * 1.04, T - 0.03 * e];
  const E: Pt = [S[0] - 0.62 * e, T - 0.15 * e];
  const stroke = chain(
    S,
    [[S[0] - (S[0] - tl[0]) * 0.34, T + 0.012 * e], [tl[0] + (S[0] - tl[0]) * 0.28, T - 0.004 * e], tl],
    [[tl[0] - ex * k, T], [Lx, cy - (cy - T) * k], [Lx, cy]],
    [[Lx, cy + (B - cy) * k], [bl[0] - ex * k, B], bl],
    [[bl[0] + w * 0.32, B + 0.03 * e], [bl[0] + w * 0.72, B + 0.022 * e], br],
    [[br[0] + ex * k, br[1]], [R, cy + (br[1] - cy) * k], [R, cy - 0.01 * e]],
    [[R, cy - (cy - tr[1]) * k], [tr[0] + ex * k * 1.04, tr[1]], tr],
    [[tr[0] - (tr[0] - E[0]) * 0.45, tr[1] - 0.012 * e], [E[0] + (tr[0] - E[0]) * 0.22, E[1] + 0.07 * e], E],
  );
  return rotate(stroke, -0.9, [(Lx + R) / 2, cy]);
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

/** "MIT" — a quick pen box with soft corners; the pen closes it and overshoots its start a little. */
function penBox(b: Box, e: number): Seg[] {
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
    [[x0 + r + 0.07 * e, y0 - 0.014 * e], [x0 + r + 0.15 * e, y0 - 0.026 * e], [x0 + r + 0.22 * e, y0 - 0.05 * e]],
  );
  return rotate(stroke, 0.8, [(x0 + x1) / 2, (y0 + y1) / 2]);
}

/** A hand-drawn ring round a word in the margin: proofreaders circle an instruction. */
function ring(cx: number, cy: number, rx: number, ry: number): Seg[] {
  const k = 0.5523;
  const s: Pt = [cx + rx * 0.35, cy - ry * 1.02];
  const stroke = chain(
    s,
    [[cx - rx * 0.2, cy - ry * 1.06], [cx - rx, cy - ry * k], [cx - rx, cy + 0.02 * ry]],
    [[cx - rx, cy + ry * k], [cx - rx * k, cy + ry], [cx + 0.02 * rx, cy + ry]],
    [[cx + rx * k, cy + ry], [cx + rx * 1.02, cy + ry * k], [cx + rx * 1.02, cy - 0.04 * ry]],
    [[cx + rx * 1.02, cy - ry * k], [cx + rx * 0.62, cy - ry * 1.04], [cx - rx * 0.05, cy - ry * 1.14]],
  );
  return rotate(stroke, -4, [cx, cy]);
}

/** Arrowhead: two wings about the direction the shaft arrives in, drawn wing → tip → wing. */
function head(tip: Pt, from: Pt, hl: number): Seg[] {
  const dx = tip[0] - from[0], dy = tip[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const spread = 0.5;
  const wing = (sgn: number): Pt => [
    tip[0] - hl * (ux * Math.cos(spread) - sgn * uy * Math.sin(spread)),
    tip[1] - hl * (uy * Math.cos(spread) + sgn * ux * Math.sin(spread)),
  ];
  const w1 = wing(1), w2 = wing(-1);
  return chain(w1, [lerp(w1, tip, 0.33), lerp(w1, tip, 0.7), tip], [lerp(tip, w2, 0.3), lerp(tip, w2, 0.67), w2]);
}

/** A proofreader's caret: feet on `y`, apex `h` above, drawn foot → apex → foot. */
function caretAt(x: number, y: number, w: number, h: number): Seg[] {
  const a: Pt = [x - w, y], t: Pt = [x, y - h], b: Pt = [x + w, y + 0.03 * h];
  return chain(a, [lerp(a, t, 0.35), lerp(a, t, 0.75), t], [lerp(t, b, 0.3), lerp(t, b, 0.7), b]);
}

/** The editor's sign-off: a cursive "ok" in one stroke, and a flourish under it. `u` is the x-height. */
function okMark(o: Pt, u: number): [Seg[], Seg[]] {
  const P = (x: number, y: number): Pt => [o[0] + x * u, o[1] + y * u];
  const ok = chain(
    P(0.7, -0.92),
    [P(0.45, -1.12), P(0.0, -0.92), P(0.0, -0.5)],
    [P(0.0, -0.15), P(0.18, 0.02), P(0.38, 0.02)],
    [P(0.62, 0.02), P(0.82, -0.22), P(0.8, -0.5)],
    [P(0.79, -0.78), P(0.68, -0.98), P(0.52, -0.98)],
    [P(0.75, -0.98), P(1.05, -0.7), P(1.3, -0.8)],
    [P(1.55, -0.95), P(1.78, -1.75), P(1.62, -2.05)],
    [P(1.45, -2.35), P(1.3, -1.2), P(1.28, 0.0)],
    [P(1.29, -0.14), P(1.31, -0.3), P(1.33, -0.42)],
    [P(1.55, -0.75), P(1.95, -1.05), P(1.95, -0.85)],
    [P(1.95, -0.6), P(1.65, -0.42), P(1.4, -0.42)],
    [P(1.65, -0.4), P(1.85, -0.05), P(2.05, 0.0)],
    [P(2.2, 0.03), P(2.32, -0.08), P(2.4, -0.18)],
  );
  const flourish = chain(P(-0.25, 0.46), [P(0.6, 0.34), P(1.7, 0.3), P(2.8, 0.2)]);
  const c = P(1.2, -0.6);
  return [rotate(ok, -5, c), rotate(flourish, -5, c)];
}

/* ── The build ───────────────────────────────────────────────────────────── */

const MM = 96 / 25.4;

export function buildProof(m: Measure): Proof {
  const { sheet: S, block: B, fs: e, lh, compact } = m;
  const slots: (Stroke | null)[] = [];
  const pencil: Stroke[] = [];
  const labels: Label[] = [];
  const dots: Dot[] = [];

  const lines = m.lineR.length;
  const baseOf = (k: number): number => m.base0 + k * lh;
  const lineOf = (b: Box): number => Math.max(0, Math.min(lines - 1, Math.round((b.base - m.base0) / lh)));
  const Bx1 = B.x + B.w;
  const Bfoot = B.y + B.h;
  const Sx1 = S.x + S.w;
  const Sy1 = S.y + S.h;
  const nfs = noteSize(e, compact);
  /* A margin wide enough for notes beside the text, and the column they set in. */
  const wide = Sx1 - Bx1 >= 0.95 * e + 140;
  const mx = Bx1 + 0.95 * e;
  const nLine = lineOf(m.box.native);

  /* ── The machine ─────────────────────────────────────────────────────
     Long strokes — the trim, its shadow, the ruler — run as TRACKS: cut into
     pieces placed K slots apart, so each draws continuously over several
     windows. Everything short is LOOSE and takes the free slots in between,
     in order, so the furniture cascades in while the edges are still being
     drawn. Labels are timed off the slot their stroke lands in. */
  type Track = { id: string; segs: Seg[]; n: number; from: number; w: Weight; tone: Tone };
  type Loose = { id?: string; d: string; w: Weight; tone: Tone; lead?: boolean };
  const tracks: Track[] = [];
  const loose: Loose[] = [];
  const later: (() => void)[] = [];
  const first: Record<string, number> = {};
  const last: Record<string, number> = {};
  const poly = (pts: Pt[]): Seg[] => {
    const out: Seg[] = [];
    for (let i = 1; i < pts.length; i++) {
      if (pts[i][0] !== pts[i - 1][0] || pts[i][1] !== pts[i - 1][1]) out.push(line(pts[i - 1], pts[i]));
    }
    return out;
  };
  const put = (d: string, w: Weight, tone: Tone, id?: string, lead = false) => loose.push({ d, w, tone, id, lead });

  // 1 · The trim: two pens leave the top-left corner and meet at the bottom-right.
  const trimN = compact ? 5 : 7;
  // Butt-capped, so each run starts and ends half a stroke past its corner.
  const hw = 0.75;
  tracks.push({ id: 'trimA', segs: poly([[S.x - hw, S.y], [Sx1, S.y], [Sx1, Sy1 + hw]]), n: trimN, from: 0, w: 'p', tone: 'ink' });
  tracks.push({ id: 'trimB', segs: poly([[S.x, S.y - hw], [S.x, Sy1], [Sx1 + hw, Sy1]]), n: trimN, from: 1, w: 'p', tone: 'ink' });

  // 2 · The offset shadow on the two far sides, chasing the trim round.
  const o = compact ? 4 : 6;
  tracks.push({
    id: 'shadow',
    segs: poly([[Sx1 + o, S.y + o * 2], [Sx1 + o, Sy1 + o], [S.x + o * 2, Sy1 + o]]),
    n: compact ? 3 : 4,
    from: 2 + K * (trimN - 3),
    w: 's',
    tone: 'mute',
  });

  // 3 · Crop marks, drawn from their outer ends in towards each corner.
  const c0 = compact ? 7 : 13;
  const cl = compact ? 9 : 22;
  const corners: [Pt, number, number][] = [
    [[S.x, S.y], -1, -1],
    [[Sx1, S.y], 1, -1],
    [[Sx1, Sy1], 1, 1],
    [[S.x, Sy1], -1, 1],
  ];
  for (const [c, sx, sy] of corners) {
    put(`${M([c[0] + sx * (c0 + cl), c[1]])}${L([c[0] + sx * c0, c[1]])}`, 's', 'ink');
    put(`${M([c[0], c[1] + sy * (c0 + cl)])}${L([c[0], c[1] + sy * c0])}`, 's', 'ink');
  }

  // 4 · Registration targets, centred on each edge in the slug.
  const rd = c0 + cl / 2;
  const rr = compact ? 4.5 : 7.5;
  const rx = rr + (compact ? 4 : 7);
  const targets: Pt[] = compact
    ? [[S.x + S.w / 2, S.y - rd], [S.x + S.w / 2, Sy1 + rd + o]]
    : [[S.x + S.w / 2, S.y - rd], [Sx1 + rd + o, S.y + S.h / 2], [S.x + S.w / 2, Sy1 + rd + o], [S.x - rd, S.y + S.h / 2]];
  for (const t of targets) {
    put(circle(t, rr), 's', 'ink');
    put(`${M([t[0] - rx, t[1]])}${L([t[0] + rx, t[1]])}`, 'h', 'ink');
    put(`${M([t[0], t[1] - rx])}${L([t[0], t[1] + rx])}`, 'h', 'ink');
    if (!compact) put(circle(t, rr * 0.45, Math.PI / 2), 'h', 'ink');
  }

  // 5 · The margin ruler: zero on the text's left edge, a tick a millimetre,
  //     one continuous stroke so it sweeps left to right.
  const ry = S.y + (compact ? 34 : 50);
  const r0 = B.x;
  const r1 = Sx1 - (compact ? 10 : 22);
  const rL = compact ? 2.4 : 4;
  const rLm = compact ? 4 : 6.5;
  const rLl = compact ? 6.5 : 10.5;
  const rulerPts: Pt[] = [[S.x + (compact ? 10 : 22), ry], [r0, ry]];
  const nmm = Math.floor((r1 - r0) / MM);
  const tickLen: number[] = [];
  let run = r0 - rulerPts[0][0];
  const runAt: number[] = [];
  for (let k = 0; k <= nmm; k++) {
    const x = r0 + k * MM;
    const len = k % 10 === 0 ? rLl : k % 5 === 0 ? rLm : rL;
    if (k > 0) run += MM;
    runAt.push(run);
    run += 2 * len;
    tickLen.push(len);
    rulerPts.push([x, ry], [x, ry + len], [x, ry]);
  }
  rulerPts.push([r1, ry]);
  run += r1 - (r0 + nmm * MM);
  const rulerN = compact ? 4 : 7;
  tracks.push({ id: 'ruler', segs: poly(rulerPts), n: rulerN, from: 3 + K * 3, w: 'h', tone: 'mute' });
  const numY = ry + rLl + (compact ? 9 : 11);
  const step = compact ? 20 : 10;
  // Numerals every centimetre, except where one would run into the unit.
  const numFs = compact ? 8.5 : 9.5;
  const unitL = r1 - monoW('mm', numFs) - 0.8 * numFs;
  for (let k = 0; k <= nmm; k += step) {
    if (k > 0 && r0 + k * MM + monoW(String(k), numFs) / 2 > unitL) continue;
    const frac = runAt[k] / run;
    later.push(() => {
      const j = Math.min(rulerN - 1, Math.floor(frac * rulerN));
      labels.push({
        x: r0 + k * MM,
        y: numY,
        anchor: 'middle',
        text: String(k),
        at: startAt(first.ruler + j * K) + (frac * rulerN - j) / SPEED,
        kind: 'num',
      });
    });
  }
  later.push(() =>
    labels.push({ x: r1, y: numY, anchor: 'end', text: 'mm', at: doneAt(last.ruler), kind: 'num' }),
  );

  // 5b · Its square: a vertical rule down the left margin, zero on the text's
  //      top edge, meeting the top rule in a corner. Ticks only — the line
  //      numbers do the reading on this side.
  if (!compact) {
    const vx = S.x + 22;
    const v0 = B.y;
    const v1 = Sy1 - 22;
    const pts: Pt[] = [[vx, ry], [vx, v0]];
    const nv = Math.floor((v1 - v0) / MM);
    for (let k = 0; k <= nv; k++) {
      const y = v0 + k * MM;
      const len = k % 10 === 0 ? rLl : k % 5 === 0 ? rLm : rL;
      pts.push([vx, y], [vx + len, y], [vx, y]);
    }
    pts.push([vx, v1]);
    tracks.push({ id: 'vruler', segs: poly(pts), n: 4, from: 4 + K * 5, w: 'h', tone: 'mute' });
  }

  // 6 · The measure: a dimension across the text column, under the ruler.
  if (!compact) {
    const dy = ry + 36;
    const mid: Pt = [B.x + B.w / 2, dy];
    put(`${M([B.x, ry + rLl + 16])}${L([B.x, dy + 6])}`, 'h', 'mute');
    put(`${M([Bx1, ry + rLl + 16])}${L([Bx1, dy + 6])}`, 'h', 'mute');
    const gap = 46;
    put(dimHalf([mid[0] - gap, dy], [B.x, dy], 7), 'h', 'mute');
    put(dimHalf([mid[0] + gap, dy], [Bx1, dy], 7), 'h', 'mute', 'dim');
    later.push(() =>
      labels.push({ x: mid[0], y: dy + 4, anchor: 'middle', text: `${Math.round(B.w)} px`, at: doneAt(first.dim), kind: 'dim' }),
    );
  }

  // 7 · Column guides and baseline guides, faint, as the compositor set them.
  const gTop = compact ? ry + 20 : ry + 50;
  const gBot = Sy1 - (compact ? 30 : 44);
  put(`${M([B.x, gTop])}${L([B.x, gBot])}`, 'h', 'faint');
  put(`${M([Bx1, gTop])}${L([Bx1, gBot])}`, 'h', 'faint');
  for (let k = 0; k < lines; k++) {
    const y = baseOf(k);
    const id = `base${k}`;
    put(`${M([B.x - (compact ? 4 : 10), y])}${L([Bx1 + (compact ? 4 : 10), y])}`, 'h', 'faint', id);
    if (!compact) {
      later.push(() =>
        labels.push({ x: B.x - 22, y, anchor: 'end', text: String(k + 1).padStart(2, '0'), at: doneAt(first[id]), kind: 'num' }),
      );
    }
  }

  // 7b · The compositor's notes, in grey, in the margin beside the first two
  //      lines; the editor's red notes take the lines below. Every value is
  //      the paragraph's own, read off the page: its face and size on a
  //      leader from the end of line 1, and its leading as a dimension
  //      between the first two baselines.
  if (wide && nLine >= 1 && lines >= 2) {
    const value = `${m.face} · ${f(e)} px`;
    const ly = baseOf(0) - 0.3 * e;
    const x1 = Math.min(Sx1 - 14, mx + Math.max(monoW(value, nfs), monoW('TYPE', nfs * 0.72)) + 4);
    const dot: Pt = [m.lineR[0] + 0.34 * e, ly];
    put(`${M(dot)}${L([x1, ly])}`, 'h', 'mute', 'typeLead', true);
    later.push(() => {
      dots.push({ x: dot[0], y: dot[1], at: startAt(first.typeLead) });
      labels.push({ x: mx, y: ly - 0.45 * nfs, anchor: 'start', title: 'TYPE', text: value, at: doneAt(first.typeLead), kind: 'note' });
    });
  }
  if (wide && nLine >= 2 && lines >= 2) {
    const y0 = baseOf(0), y1 = baseOf(1);
    const vx = Bx1 + 0.6 * e;
    // Extension lines carry the two baselines out, then the dimension is
    // drawn from its middle out to an arrowhead at each.
    put(`${M([Bx1 + 14, y0])}${L([vx + 9, y0])}`, 'h', 'mute');
    put(`${M([Bx1 + 14, y1])}${L([vx + 9, y1])}`, 'h', 'mute');
    const mid = (y0 + y1) / 2;
    const ah = Math.min(7, (y1 - y0) * 0.16);
    put(`${M([vx, mid])}${L([vx, y0])}l-${f(ah * 0.55)} ${f(ah)}${M([vx, y0])}l${f(ah * 0.55)} ${f(ah)}`, 'h', 'mute');
    put(`${M([vx, mid])}${L([vx, y1])}l-${f(ah * 0.55)} -${f(ah)}${M([vx, y1])}l${f(ah * 0.55)} -${f(ah)}`, 'h', 'mute', 'lead2');
    later.push(() =>
      labels.push({ x: vx + 9, y: mid + 4, anchor: 'start', text: `${f(lh)} px`, at: doneAt(first.lead2), kind: 'dim' }),
    );
  }

  // 8 · The colour bar: one strip, its dividers swept left to right, one patch in the accent.
  const cs = compact ? 10 : 14;
  const cn = compact ? 8 : 12;
  const cx0 = B.x;
  const cy0 = Sy1 - (compact ? 22 : 30) - cs / 2;
  const accentPatch = 3;
  put(
    `${M([cx0, cy0])}${L([cx0 + cs * cn, cy0])}${L([cx0 + cs * cn, cy0 + cs])}${L([cx0, cy0 + cs])}${L([cx0, cy0])}`,
    's',
    'mute',
  );
  for (let k = 1; k < cn; k++) {
    put(`${M([cx0 + k * cs, cy0])}${L([cx0 + k * cs, cy0 + cs])}`, 'h', 'mute', k === accentPatch + 1 ? 'patch' : undefined);
  }

  // 9 · Blueprint notes outside the sheet, where there is room for them.
  if (m.notes) {
    // Top right: the trim, with a dot on the corner the crop marks point at.
    // As on the calibre, the leader leaves the dot, rises at a steady angle
    // clear of the crop mark, and turns into a shelf under its label.
    const value = `${Math.round(S.w)} × ${Math.round(S.h)} px`;
    const ly = S.y - rd - 26;
    const bend = Sx1 - 1.2 * (S.y - ly);
    const lx0 = bend - monoW(value, nfs) - 12;
    put(`${M([Sx1, S.y])}${L([bend, ly])}${L([lx0, ly])}`, 'h', 'mute', 'trimLead', true);
    later.push(() => {
      dots.push({ x: Sx1, y: S.y, at: startAt(first.trimLead) });
      labels.push({
        x: lx0,
        y: ly - 0.45 * nfs,
        anchor: 'start',
        title: 'TRIM',
        text: value,
        at: doneAt(first.trimLead),
        kind: 'note',
      });
    });
  }

  // Schedule: tracks on their fixed slots, loose strokes in the gaps.
  const grid: (Stroke | undefined)[] = [];
  for (const t of tracks) {
    const parts = cut(t.segs, t.n);
    parts.forEach((g, j) => {
      grid[t.from + j * K] = { d: toD(g), w: t.w, tone: t.tone, butt: true };
    });
    first[t.id] = t.from;
    last[t.id] = t.from + (parts.length - 1) * K;
    pencil.push({ d: toD(t.segs), w: t.w, tone: t.tone });
  }
  let free = 3;
  for (const l of loose) {
    while (grid[free]) free++;
    grid[free] = { d: l.d, w: l.w, tone: l.tone, lead: l.lead };
    if (l.id) first[l.id] = free;
    if (!l.lead) pencil.push({ d: l.d, w: l.w, tone: l.tone });
    free++;
  }
  for (let i = 0; i < grid.length; i++) slots.push(grid[i] ?? null);
  for (const f of later) f();
  const patch: Patch = { x: cx0 + accentPatch * cs, y: cy0, w: cs, h: cs, at: doneAt(first.patch) };
  const sheetStrokes = tracks.reduce((n, t) => n + t.n, 0) + loose.length;

  /* ── The pen ─────────────────────────────────────────────────────────── */

  const rest = (n: number) => {
    for (let i = 0; i < n; i++) slots.push(null);
  };
  // Hold for the sheet to finish before the pen touches it.
  rest(K + 1);
  const penStart = slots.length;

  const keep: Rect[] = [];
  const ul = underline(m.box.kb, e);
  const lp = loop(m.box.deps, e);
  const dr = doubleRule(m.box.native, e);
  const bx = penBox(m.box.mit, e);
  keep.push(bounds(ul), bounds(lp), bounds(dr[0]), bounds(dr[1]), bounds(bx));

  // Stet: dots under "a frame loop", "stet" ringed in the margin, a hairline
  // between. Worked out before the arrow, since on a phone the ring may sit
  // on the phrase's own line and the arrow's shaft must clear it.
  const fb = m.box.frame;
  const fLine = lineOf(fb);
  const dotY = fb.base + 0.21 * e;
  const dotGap = Math.max(7, 0.3 * e);
  const nDots = Math.max(3, Math.floor((fb.r - fb.l) / dotGap));
  const dotX0 = fb.l + (fb.r - fb.l - (nDots - 1) * dotGap) / 2;
  const nf = penSize(e, compact);
  const stetW = nf * 0.6 * 4;
  const ringRx = stetW / 2 + 0.24 * e;
  let stetC: Pt;
  let stetTie: Seg[] | null = null;
  // Phone: where the phrase ends its line and the rest of the line is free,
  // "stet" is ringed right there, beside it, as in a margin.
  const inlineAt = Math.max(m.lineR[fLine], fb.r) + 0.34 * e;
  const stetInline = !wide && inlineAt + 2 * ringRx <= Bx1 + 4 && m.lineR[fLine] - fb.r < 0.3 * e;

  // The margin arrow: the note sits beside the line on a wide sheet, under the text on a phone.
  const nb = m.box.native;
  const lineEnd = m.lineR[nLine] ?? nb.r;
  let rightBelow = nb.r;
  for (let k = nLine; k < lines; k++) rightBelow = Math.max(rightBelow, m.lineR[k]);
  if (stetInline) rightBelow = Math.max(rightBelow, inlineAt + 2 * ringRx);
  const gapY = nb.base + 0.37 * e;
  const tip: Pt = [nb.r + 0.3 * e, nb.base + 0.25 * e];
  const ny = Bfoot + 0.86 * e;
  let shaft: Seg[];
  let noteAt: Pt;
  if (wide) {
    const tail: Pt = [Bx1 + 0.68 * e, nb.base - 0.2 * e];
    const turn: Pt = [Math.max(lineEnd + 0.2 * e, tip[0] + 0.9 * e), gapY];
    noteAt = [mx, nb.base - 0.28 * e];
    const run = turn[0] - tip[0];
    shaft = chain(
      tail,
      [[tail[0] - 0.06 * e, tail[1] + 0.42 * e], [turn[0] + Math.min(0.6 * e, (tail[0] - turn[0]) * 0.7), gapY], turn],
      [[turn[0] - run * 0.4, gapY + 0.006 * e], [tip[0] + Math.min(0.9 * e, run * 0.35), gapY + 0.01 * e], tip],
    );
  } else {
    // The shaft climbs the right edge, just outside the text, then turns in under the line.
    const gx = Math.min(Bx1 + 11, Math.max(rightBelow, tip[0] + 0.6 * e) + 0.42 * e);
    const r = Math.max(0.2 * e, Math.min(0.5 * e, (gx - tip[0]) / 3));
    const tail: Pt = [Bx1 - 0.22 * e, ny];
    noteAt = [Bx1 - 0.42 * e, ny];
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
  keep.push(bounds(shaft));
  const arrowHead = head(tip, shaft[shaft.length - 1][2], 0.3 * e);

  // Caret: inserts "all" before "yours". Apex on the baseline, in the word space.
  const yb = m.box.yours;
  const caretX = yb.l - 0.13 * e;
  const caret = caretAt(caretX, yb.base + 0.3 * e, 0.15 * e, 0.28 * e);
  let allX: number;
  let allY: number;
  let caretTie: Seg[];

  if (wide) {
    // Notes in the margin column, in line with the line they refer to — or,
    // where two would share a line, the later one just under the earlier.
    const sy = Math.max(baseOf(fLine) - 0.28 * e, noteAt[1] + nf * 2.4);
    stetC = [mx + stetW / 2, sy];
    // The tie runs under its line, in the clear band, then rises to the ring.
    const band = baseOf(fLine) + 0.42 * e;
    const x0 = dotX0 + (nDots - 1) * dotGap + 0.2 * e;
    const x1 = mx - 0.55 * e;
    const clear = !keep.some((r) => hits(r, x0, x1, band, 0.06 * e)) && x1 - x0 > 0.6 * e;
    if (clear) {
      stetTie = [line([x0, band], [x1 - 0.25 * e, band]), line([x1 - 0.25 * e, band], [mx - 0.42 * e, sy + 0.1 * e])];
    } else {
      // Fall back to a leader from the end of the line, at x-height.
      const le = Math.max(m.lineR[fLine], ...keep.filter((r) => r.y < sy && r.y + r.h > sy).map((r) => r.x + r.w));
      if (mx - 0.5 * e - (le + 0.3 * e) > 0.5 * e) stetTie = [line([le + 0.3 * e, sy], [mx - 0.5 * e, sy])];
    }
    allX = mx + 0.12 * e;
    allY = Math.max(baseOf(lineOf(yb)) - 0.28 * e, sy + nf * 2.2);
    const cBand = yb.base + 0.46 * e;
    const cx1 = mx - 0.2 * e;
    caretTie = [
      line([caretX + 0.27 * e, yb.base + 0.36 * e], [caretX + 0.5 * e, cBand]),
      line([caretX + 0.5 * e, cBand], [cx1 - 0.3 * e, cBand]),
      line([cx1 - 0.3 * e, cBand], [cx1, allY + 0.3 * e]),
    ];
  } else {
    // Phone: the notes go in a row under the text — these on the left, the
    // arrow's on the right — unless "stet" fitted on its own line.
    let rowX = B.x + 0.3 * e;
    if (stetInline) {
      stetC = [inlineAt + ringRx, fb.base - 0.3 * e];
    } else {
      stetC = [rowX + stetW / 2, ny];
      rowX = stetC[0] + stetW / 2 + 0.5 * e + 18;
      // A tie up the left margin and in under the line, only where it would
      // not underline words the editor left alone.
      const lx = B.x - Math.min(9, (B.x - S.x) * 0.55);
      const band = fb.base + 0.42 * e;
      const clear =
        fb.l - m.lineL[fLine] < 0.5 * e && !keep.some((r) => hits(r, lx, dotX0 - 0.15 * e, band, 0.05 * e));
      if (clear) {
        const ringL = stetC[0] - ringRx;
        stetTie = [
          line([ringL - 1, ny - 0.1 * e], [lx, ny - 0.55 * e]),
          line([lx, ny - 0.55 * e], [lx, band + 0.2 * e]),
          line([lx, band + 0.2 * e], [lx + 0.2 * e, band]),
          line([lx + 0.2 * e, band], [dotX0 - 0.15 * e, band]),
        ];
      }
    }
    // "all" goes straight under its caret where the row has room — clear of
    // the arrow's note on the right — so the tie between them stays short.
    const noteL = noteAt[0] - monoW('does the work', nf) - 0.6 * e;
    const allR = nf * 0.5 + 3 + monoW('all', nf);
    allX = Math.max(rowX + nf * 0.3, Math.min(caretX - 0.25 * e, noteL - allR));
    allY = ny;
    caretTie = [line([caretX, yb.base + 0.42 * e], [allX, allY - nf * 0.75])];
  }
  // The marginal caret before the inserted word.
  const marginCaret = caretAt(allX, allY + nf * 0.36, nf * 0.3, nf * 0.78);

  // The sign-off: "ok", and a flourish under it, at the foot of the margin.
  const u = compact ? 0.4 * e : 0.46 * e;
  const okBase = cy0 + cs;
  const okAt: Pt = wide ? [mx + 0.3 * e, okBase] : [Bx1 - 2.7 * u, okBase];
  const ok = okMark(okAt, u);

  type Pen = { s: Seg[]; w: Weight; fixed?: boolean; tag?: string };
  const marks: Pen[][] = [
    [{ s: ul, w: 'pen' }],
    [{ s: lp, w: 'pen' }],
    dr.map((s) => ({ s, w: 'pen' as const })),
    [{ s: bx, w: 'pen' }],
    [{ s: shaft, w: 'thin' }, { s: arrowHead, w: 'thin', fixed: true, tag: 'head' }],
    [
      ...Array.from({ length: nDots }, (_, i): Pen => {
        const x = dotX0 + i * dotGap;
        return { s: [line([x, dotY], [x + 0.6, dotY])], w: 'dot', fixed: true };
      }),
      { s: ring(stetC[0], stetC[1], ringRx, nf * 0.95), w: 'thin', tag: 'ring' },
      ...(stetTie ? [{ s: stetTie, w: 'thin' as const, fixed: true }] : []),
    ],
    [
      { s: caret, w: 'pen', fixed: true },
      { s: caretTie, w: 'thin', fixed: true },
      { s: marginCaret, w: 'thin', fixed: true, tag: 'caret' },
    ],
    [
      { s: ok[0], w: 'pen' },
      { s: ok[1], w: 'thin', fixed: true },
    ],
  ];

  // One pen speed for everything that is cut. The piece length is solved by
  // dry run: the shortest piece (so the smoothest pen) for which the last mark
  // still lands by PEN_DONE_BY, and never shorter than 1.6em.
  const PAUSE = 3;
  const piecesOf = (st: Pen, unit: number): number =>
    st.fixed ? 1 : Math.max(1, Math.round(strokeLen(st.s) / unit));
  const slotsFor = (unit: number): number => {
    let n = 0;
    for (const mk of marks) {
      mk.forEach((st, si) => {
        if (st.w === 'dot') n += mk[si + 1]?.w === 'dot' ? 1 : K;
        else n += K * piecesOf(st, unit);
      });
      n += PAUSE;
    }
    return n - PAUSE;
  };
  const lastSlot = Math.floor((PEN_DONE_BY - 1 / SPEED) / STAGGER) + 1;
  let unit = 1.6 * e;
  for (let i = 0; i < 60 && penStart + slotsFor(unit) > lastSlot; i++) unit *= 1.06;

  const markDone: number[] = [];
  const tagAt: Record<string, number> = {};
  let penStrokes = 0;
  // Each stroke is followed by K - 1 rests, so the next starts as it lands.
  const pen: number[] = [];
  const place = (st: Stroke, wait: number, tag?: string) => {
    if (tag && tagAt[tag] === undefined) tagAt[tag] = slots.length;
    pen.push(slots.length);
    slots.push(st);
    penStrokes++;
    rest(wait);
  };
  for (const mk of marks) {
    mk.forEach((st, si) => {
      if (st.w === 'dot') {
        // Dots are tapped, one a slot; the pen waits for the last before moving on.
        place({ d: toD(st.s), w: 'dot', tone: 'accent' }, mk[si + 1]?.w === 'dot' ? 0 : K - 1);
        return;
      }
      const parts = st.fixed ? [st.s] : cut(st.s, piecesOf(st, unit));
      parts.forEach((g) => place({ d: toD(g), w: st.w, tone: 'accent' }, K - 1, st.tag));
    });
    let last = slots.length - 1;
    while (last >= 0 && slots[last] === null) last--;
    markDone.push(doneAt(last));
    rest(PAUSE);
  }

  labels.push({
    x: noteAt[0],
    y: noteAt[1],
    anchor: wide ? 'start' : 'end',
    text: 'the browser',
    text2: 'does the work',
    at: doneAt(tagAt.head) - 0.004,
    kind: 'pen',
  });
  labels.push({ x: stetC[0], y: stetC[1], anchor: 'middle', text: 'stet', at: startAt(tagAt.ring), kind: 'pen' });
  labels.push({ x: allX + nf * 0.5 + 3, y: allY, anchor: 'start', text: 'all', at: doneAt(tagAt.caret) - 0.004, kind: 'pen' });

  return { slots, pencil, labels, dots, patch, markDone, pen, sheetStrokes, penStrokes };
}
