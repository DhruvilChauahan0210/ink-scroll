/**
 * Chapter 05 — eight blueprint plates, one per instrument. Each is a small
 * technical drawing on a 400 × 300 sheet, built from geometry rather than
 * traced, in the same grammar as the calibre in chapter 02: a stroke
 * hierarchy (primary / secondary / hairline), four tones (ink / mute / faint /
 * accent), one accent element per plate, and leader-line notes whose values
 * are the real options of the instrument they describe.
 *
 * Pure geometry, no DOM and no randomness: the server and the client compute
 * byte-identical `d` strings, every number written with one decimal.
 *
 * Draw order is document order. The library staggers strokes in that order,
 * and a dash pattern restarts at every subpath, so anything that should sweep
 * is one continuous subpath; anything that should grow all at once (a row of
 * sprocket holes, a hatch) is several subpaths in one stroke.
 */

import type { CSSProperties } from 'react';

export type Weight = 'p' | 's' | 'h';
export type Tone = 'ink' | 'mute' | 'faint' | 'accent';

export interface Stroke {
  d: string;
  w: Weight;
  tone: Tone;
  /** A leader line: butt caps, hidden where its note cannot be read. */
  lead?: boolean;
  /** Key into the plate's masks: hidden where a nearer surface covers it. */
  mask?: string;
}

/** A blueprint note: a mono title over a value, sitting on its leader's shelf. */
export interface Note {
  at: number;
  dot: P;
  x: number;
  y: number;
  anchor: 'start' | 'end';
  title: string;
  value: string;
  accent?: boolean;
}

/** A free-standing scale figure or name (tick labels, guide names). */
export interface Tag {
  at: number;
  x: number;
  y: number;
  text: string;
  anchor: 'start' | 'middle' | 'end';
  accent?: boolean;
  /** A word rather than a figure: dropped on a plate too small to read it. */
  word?: boolean;
  /** Degrees, about (x, y): type engraved along a part rather than across the sheet. */
  rotate?: number;
}

export interface PlateDef {
  key: string;
  label: string;
  strokes: Stroke[];
  notes: Note[];
  tags: Tag[];
  masks: Record<string, string[]>;
}

type P = [number, number];

/* ── Timing, shared with the component ──────────────────────────────────── */

/** Every plate gives each stroke a quarter of its window. */
export const SPEED = 4;

/**
 * The stagger that lands a plate's last stroke just inside its window: with n
 * strokes the last one finishes at `(n − 1) × stagger + 1 / SPEED`. Rounded
 * down to three places so the option printed on the plate is the option used.
 */
export const staggerFor = (n: number): number =>
  Math.floor(((1 - 1 / SPEED) / Math.max(1, n - 1)) * 1000) / 1000;

/* ── Primitives ─────────────────────────────────────────────────────────── */

const f = (n: number): string => {
  const s = n.toFixed(1);
  return s === '-0.0' ? '0.0' : s;
};
const xy = (p: P): string => `${f(p[0])} ${f(p[1])}`;
const deg = (d: number): number => (d * Math.PI) / 180;
const polar = (c: P, r: number, a: number): P => [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];

const ln = (a: P, b: P): string => `M${xy(a)}L${xy(b)}`;
const poly = (pts: P[], close = false): string =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${xy(p)}`).join('') + (close ? 'Z' : '');

/** A full ellipse as one subpath, starting at angle `a0`, clockwise. */
function ellipse(c: P, rx: number, ry: number, a0 = -Math.PI / 2): string {
  const at = (a: number): P => [c[0] + rx * Math.cos(a), c[1] + ry * Math.sin(a)];
  const s = at(a0);
  const m = at(a0 + Math.PI);
  return `M${xy(s)}A${f(rx)} ${f(ry)} 0 1 1 ${xy(m)}A${f(rx)} ${f(ry)} 0 1 1 ${xy(s)}`;
}
const circle = (c: P, r: number, a0 = -Math.PI / 2): string => ellipse(c, r, r, a0);

/** A rounded rectangle, one subpath, clockwise from the top-left corner. */
function rrect(x: number, y: number, w: number, h: number, r: number): string {
  const a = `A${f(r)} ${f(r)} 0 0 1`;
  return (
    `M${xy([x + r, y])}L${xy([x + w - r, y])}${a} ${xy([x + w, y + r])}` +
    `L${xy([x + w, y + h - r])}${a} ${xy([x + w - r, y + h])}` +
    `L${xy([x + r, y + h])}${a} ${xy([x, y + h - r])}` +
    `L${xy([x, y + r])}${a} ${xy([x + r, y])}Z`
  );
}

/** Two barbs at `tip`, continuing the current subpath so the head draws last. */
function barbs(tip: P, from: P, size = 5, spread = 0.42): string {
  const a = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
  const b1 = polar(tip, size, a + Math.PI - spread);
  const b2 = polar(tip, size, a + Math.PI + spread);
  return `L${xy(b1)}L${xy(tip)}L${xy(b2)}`;
}
const arrow = (from: P, to: P, size = 5): string => `M${xy(from)}L${xy(to)}${barbs(to, from, size)}`;

/** A dimension drawn from its middle outward: two strokes, each with a head. */
function dimension(a: P, b: P, size = 4.5): [string, string] {
  const m: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return [arrow(m, a, size), arrow(m, b, size)];
}

/**
 * A centre line in the drafting convention — long dash, dot, long dash — as
 * one stroke of many subpaths, so the whole line grows at once.
 */
function centerline(a: P, b: P, dash = 13, dot = 1.6, gap = 2.6): string {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const u: P = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const at = (t: number): P => [a[0] + u[0] * t, a[1] + u[1] * t];
  let d = '';
  let t = 0;
  while (t < len) {
    const e = Math.min(len, t + dash);
    d += ln(at(t), at(e));
    t = e + gap;
    if (t + dot < len) d += ln(at(t), at(t + dot));
    t += dot + gap;
  }
  return d;
}

/**
 * Section hatching at 45° inside a rectangle, `step` apart, solved exactly
 * rather than clipped: each line x + y = c runs between the rectangle's
 * edges. Many subpaths in one stroke, so the hatch wipes in all at once.
 */
function hatch(x0: number, y0: number, w: number, h: number, step: number): string {
  const x1 = x0 + w;
  const y1 = y0 + h;
  const dc = step * Math.SQRT2;
  let d = '';
  for (let c = x0 + y0 + dc / 2; c < x1 + y1; c += dc) {
    const xa = Math.max(x0, c - y1);
    const xb = Math.min(x1, c - y0);
    if (xb - xa > 0.4) d += ln([xa, c - xa], [xb, c - xb]);
  }
  return d;
}

/** A dashed line (hidden or projection lines): equal dashes, one stroke. */
function dashed(a: P, b: P, dash = 3, gap = 2.4): string {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const u: P = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  let d = '';
  for (let t = 0; t < len; t += dash + gap) {
    d += ln([a[0] + u[0] * t, a[1] + u[1] * t], [a[0] + u[0] * Math.min(len, t + dash), a[1] + u[1] * Math.min(len, t + dash)]);
  }
  return d;
}

/** Uniform Catmull–Rom through `pts` as one cubic subpath. */
function smooth(pts: P[]): string {
  let d = `M${xy(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${xy(c1)} ${xy(c2)} ${xy(p2)}`;
  }
  return d;
}

/**
 * Re-maps a path written in local coordinates (absolute M L C Q Z only)
 * through `map`. Used to draw an object upright and then place it — the nib,
 * the pushpin — or to wrap a numeral round an odometer drum.
 */
function mapPath(d: string, map: (p: P) => P): string {
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+/g) ?? [];
  let out = '';
  let nums: number[] = [];
  const flush = () => {
    for (let i = 0; i + 1 < nums.length; i += 2) {
      out += `${i ? ' ' : ''}${xy(map([nums[i], nums[i + 1]]))}`;
    }
    nums = [];
  };
  for (const t of tokens) {
    if (/[MLCQZ]/.test(t)) {
      flush();
      out += t;
    } else nums.push(Number(t));
  }
  flush();
  return out;
}

/** An affine placement: scale, rotate about the local origin, then translate. */
const placer = (k: number, rot: number, to: P) => (p: P): P => {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return [to[0] + k * (p[0] * c - p[1] * s), to[1] + k * (p[0] * s + p[1] * c)];
};

/* ── The sheet builder ──────────────────────────────────────────────────── */

function sheet(key: string, label: string) {
  const strokes: Stroke[] = [];
  const notes: Note[] = [];
  const tags: Tag[] = [];
  const masks: Record<string, string[]> = {};
  const put = (d: string, w: Weight, tone: Tone, mask?: string): number => {
    strokes.push(mask ? { d, w, tone, mask } : { d, w, tone });
    return strokes.length - 1;
  };
  /** A leader from `dot` through `elbow` to the shelf end `end`, then its note. */
  const note = (dot: P, elbow: P, end: P, title: string, value: string, accent = false): number => {
    const at = strokes.length;
    strokes.push({ d: `M${xy(dot)}L${xy(elbow)}L${xy(end)}`, w: 'h', tone: accent ? 'accent' : 'mute', lead: true });
    notes.push({
      at,
      dot,
      x: end[0],
      y: end[1],
      anchor: end[0] < elbow[0] ? 'start' : 'end',
      title,
      value,
      ...(accent ? { accent } : {}),
    });
    return notes.length - 1;
  };
  /** A figure that appears once the last-put stroke has drawn. */
  const tag = (x: number, y: number, text: string, anchor: Tag['anchor'] = 'middle', accent = false, word = false, rotate = 0) => {
    tags.push({
      at: strokes.length - 1,
      x,
      y,
      text,
      anchor,
      ...(accent ? { accent } : {}),
      ...(word ? { word } : {}),
      ...(rotate ? { rotate } : {}),
    });
  };
  const done = (): PlateDef => ({ key, label, strokes, notes, tags, masks });
  return { put, note, tag, masks, notes, strokes, done };
}

/* ── 01 · scrollDraw — a fountain-pen nib writing a line ────────────────── */

const DRAW: PlateDef = (() => {
  const s = sheet('draw', 'A fountain-pen nib, drawn in plan, writing a looped line that ends at its tip');
  // The nib is drawn tip-first along its own axis, then laid at 50° to the
  // writing line. Local x runs from the tip to the section; y across it.
  const TIP: P = [174, 226];
  const nib = placer(1, deg(-50), TIP);
  const L = (d: string) => mapPath(d, nib);

  const NIB =
    'M150 -33L108 -31C103 -31 102 -25 97 -24.5C70 -23.5 26 -11 6 -3.2C2.5 -2.4 0 -1.4 0 0' +
    'C0 1.4 2.5 2.4 6 3.2C26 11 70 23.5 97 24.5C102 25 103 31 108 31L150 33';
  const SECTION = 'M150 36L150 -36L232 -41C226 -28 238 -14 232 0C226 14 238 28 232 41Z';
  // the paper lies under the pen
  s.masks.paper = [L(`${NIB}Z`), L(SECTION)];

  // construction: the nib's axis as a centre line, and the ruled sheet it
  // writes on — baseline, x-height and ascender, with a double margin
  s.put(mapPath(centerline([-40, 0], [252, 0]), nib), 'h', 'faint');
  s.put(ln([16, 238], [384, 238]), 'h', 'faint', 'paper');
  s.put(ln([16, 196], [384, 196]), 'h', 'faint', 'paper');
  s.put(ln([16, 154], [384, 154]), 'h', 'faint', 'paper');
  s.put(`${ln([40, 62], [40, 284])}${ln([44, 62], [44, 284])}`, 'h', 'faint');

  // the nib, one sweep from one shoulder round the tip to the other
  s.put(L(NIB), 'p', 'ink');
  // the section it sits in, broken off where the sheet ends
  s.put(L(SECTION), 's', 'ink');
  s.put(L('M157 -36.4L157 36.4'), 'h', 'ink');
  // breather hole and the slit that runs from it to the tip
  s.put(circle(nib([92, 0]), 5.6, deg(130)), 's', 'ink');
  s.put(L('M86.4 0L1.4 0'), 'h', 'ink');
  // the tipping, where the iridium is welded on
  s.put(L('M10 -4.2Q7.4 0 10 4.2'), 'h', 'mute');
  // shading along one tine: the nib is curved in section
  s.put(
    L('M20 6.8C40 14 64 19.6 88 21M28 5.2C46 10.6 66 14.6 86 16M40 4.6C54 8 70 10.6 84 11.2'),
    'h',
    'faint',
  );
  // engraving: a border inside the body, and the gold mark struck within it
  s.put(L('M146 -26L118 -24.4C114 -24.2 112 -21 112 -17L112 17C112 21 114 24.2 118 24.4L146 26'), 'h', 'mute');
  {
    const a = nib([129, -5.2]);
    const b = nib([129, 7.6]);
    s.tag(a[0], a[1], '14K', 'middle', false, false, -50);
    s.tag(b[0], b[1], '585', 'middle', false, false, -50);
  }
  // the knurled grip
  {
    let d = '';
    for (let k = 0; k < 7; k++) d += L(`M${180 + k * 4} ${-38 - k * 0.2}L${180 + k * 4} ${38 + k * 0.2}`);
    s.put(d, 'h', 'mute');
  }
  // the cap thread, cut at a lead angle
  {
    let d = '';
    for (let k = 0; k < 5; k++) d += `M${214 + k * 3.4} -40.4L${210.6 + k * 3.4} 40.2`;
    s.put(L(d), 'h', 'faint');
  }

  // the line it writes: a loop, then on to the tip
  const KNOTS: P[] = [
    [22, 226],
    [48, 236],
    [80, 218],
    [104, 168],
    [110, 132],
    [98, 116],
    [84, 128],
    [86, 170],
    [104, 214],
    [128, 234],
    [154, 236],
    [174, 226],
  ];
  s.put(smooth(KNOTS), 'p', 'accent');
  // the path as an editor shows it: its own anchors, and the real control
  // points `smooth` wrote for them (Catmull–Rom: knot ± (next − previous) / 6)
  {
    let handles = '';
    let anchors = '';
    for (const i of [1, 3, 7, 9]) {
      const k = KNOTS[i];
      const t: P = [(KNOTS[i + 1][0] - KNOTS[i - 1][0]) / 6, (KNOTS[i + 1][1] - KNOTS[i - 1][1]) / 6];
      const h0: P = [k[0] - t[0], k[1] - t[1]];
      const h1: P = [k[0] + t[0], k[1] + t[1]];
      handles += `${ln(h0, h1)}${circle(h0, 1.3)}${circle(h1, 1.3)}`;
      anchors += rrect(k[0] - 1.9, k[1] - 1.9, 3.8, 3.8, 0.3);
    }
    s.put(handles, 'h', 'mute');
    s.put(anchors, 'h', 'ink');
  }

  s.note([98, 116.6], [86, 44], [16, 44], 'THE PATH', `speed ${SPEED}`, true);
  s.note(nib([92, 6.4]), [302, 268], [384, 268], 'NIB', 'stagger');
  const def = s.done();
  def.notes[1].value = `stagger ${staggerFor(def.strokes.length)}`;
  return def;
})();

/* ── 02 · scrollAnimate — a property timeline ───────────────────────────── */

const ANIMATE: PlateDef = (() => {
  const s = sheet('animate', 'A card rising into place with ghost outlines below it, above a timeline with three keyframes');
  const BX = 40;
  const BY = 54;
  const BW = 124;
  const BH = 70;
  const R = 8;

  // the timeline first: the axis everything else is read against
  const T0 = 40;
  const T1 = 360;
  const TY = 238;
  s.put(ln([T0, TY], [T1, TY]), 's', 'ink');
  {
    let d = '';
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const x = T0 + ((T1 - T0) * i) / n;
      const h = i % 20 === 0 ? 8 : i % 4 === 0 ? 5 : 2.6;
      d += `${i ? 'L' : 'M'}${xy([x, TY])}L${xy([x, TY - h])}L${xy([x, TY])}`;
    }
    s.put(d, 'h', 'mute');
  }
  s.tag(T0, TY + 15, '0');
  s.tag((T0 + T1) / 2, TY + 15, '0.5');
  s.tag(T1, TY + 15, '1');
  for (const x of [T0, (T0 + T1) / 2, T1]) {
    s.put(poly([[x, TY - 6], [x + 6, TY], [x, TY + 6], [x - 6, TY]], true), 's', 'ink');
  }
  // the value between keyframes, eased in and out of each, with the flat
  // tangent handles a graph editor shows for ease-in-out
  {
    const ys = [222, 207, 192];
    const m = (T0 + T1) / 2;
    const xs = [T0, m, T1];
    const k = (m - T0) * 0.5;
    s.put(xs.map((x, i) => ln([x, TY - 7], [x, ys[i] + 3])).join(''), 'h', 'faint');
    s.put(
      `M${xy([T0, ys[0]])}C${xy([T0 + k, ys[0]])} ${xy([m - k, ys[1]])} ${xy([m, ys[1]])}C${xy([m + k, ys[1]])} ${xy([T1 - k, ys[2]])} ${xy([T1, ys[2]])}`,
      'h',
      'mute',
    );
    xs.forEach((x, i) => {
      const a = Math.max(T0 - 14, x - 26);
      const b = Math.min(T1 + 14, x + 26);
      s.put(`${ln([a, ys[i]], [b, ys[i]])}${circle([a, ys[i]], 1.8)}${circle([b, ys[i]], 1.8)}`, 'h', 'mute');
    });
  }

  // the element at rest, and what it holds
  s.put(rrect(BX, BY, BW, BH, R), 'p', 'ink');
  s.put(circle([BX + 20, BY + 19], 8), 'h', 'ink');
  s.put(`${ln([BX + 36, BY + 15], [BX + 96, BY + 15])}${ln([BX + 36, BY + 25], [BX + 74, BY + 25])}`, 'h', 'mute');
  s.put(`${ln([BX + 12, BY + 44], [BX + 112, BY + 44])}${ln([BX + 12, BY + 55], [BX + 88, BY + 55])}`, 'h', 'mute');

  // where it came from: the trailing edges at 10, 21 and 32 below
  const ghost = (o: number): string => {
    const yb = BY + BH + o;
    return (
      `M${xy([BX, BY + BH])}L${xy([BX, yb - R])}A${f(R)} ${f(R)} 0 0 0 ${xy([BX + R, yb])}` +
      `L${xy([BX + BW - R, yb])}A${f(R)} ${f(R)} 0 0 0 ${xy([BX + BW, yb - R])}L${xy([BX + BW, BY + BH])}`
    );
  };
  s.put(ghost(10), 'h', 'mute');
  s.put(ghost(21), 'h', 'faint');
  s.put(ghost(32), 'h', 'faint');

  // the axis it travels on, through the card's centre
  s.put(centerline([BX + BW / 2, BY - 12], [BX + BW / 2, BY + BH + 44], 11, 1.4, 2.4), 'h', 'faint');

  // the 32 it travels, dimensioned
  const DX = BX + BW + 16;
  s.put(`${ln([BX + BW + 4, BY + BH], [DX + 6, BY + BH])}${ln([BX + BW + 4, BY + BH + 32], [DX + 6, BY + BH + 32])}`, 'h', 'mute');
  const [d1, d2] = dimension([DX, BY + BH], [DX, BY + BH + 32]);
  s.put(d1, 'h', 'mute');
  s.put(d2, 'h', 'mute');

  // opacity as a ramp: hatching that closes up from 0 to 1
  const OX = 216;
  const OY = 104;
  const OW = 156;
  const OH = 16;
  s.put(rrect(OX, OY, OW, OH, 2), 's', 'ink');
  {
    let d = '';
    let x = OX + 6;
    let gap = 15;
    let i = 0;
    while (x < OX + OW - 1.5) {
      const top = i % 2 === 0;
      d += i === 0 ? `M${xy([x, OY])}L${xy([x, OY + OH])}` : `L${xy([x, top ? OY : OY + OH])}L${xy([x, top ? OY + OH : OY])}`;
      gap = Math.max(2.4, gap * 0.8);
      x += gap;
      i++;
    }
    s.put(d, 'h', 'mute');
  }
  s.tag(OX, OY - 6, '0', 'start');
  s.tag(OX + OW, OY - 6, '1', 'end');

  // the dope sheet under it: one lane per property, a key at each end
  {
    const lanes: [number, string][] = [
      [268, 'opacity'],
      [284, 'translateY'],
    ];
    s.put(lanes.map(([y]) => ln([T0, y], [T1, y])).join(''), 'h', 'faint');
    lanes.forEach(([y, name]) => {
      const key = (x: number) => poly([[x, y - 3.4], [x + 3.4, y], [x, y + 3.4], [x - 3.4, y]], true);
      s.put(key(T0) + key(T1), 'h', 'ink');
      s.tag(T1 - 8, y - 3.6, name, 'end', false, true);
    });
  }

  // the playhead, scrubbed to 0.62
  const PH = 0.62;
  const PX = T0 + (T1 - T0) * PH;
  s.put(poly([[PX, 292], [PX, 186], [PX - 5.5, 180], [PX - 5.5, 172], [PX + 5.5, 172], [PX + 5.5, 180], [PX, 186]]), 's', 'accent');
  s.tag(PX + 9, 180.5, PH.toFixed(2), 'start', true);

  s.note([OX + 112, OY], [300, 48], [384, 48], 'PROPS', 'opacity 0→1');
  s.note([DX, BY + BH + 16], [214, 160], [384, 160], 'TRANSFORM', 'translateY 32→0');
  return s.done();
})();

/* ── 03 · scrollText — "Hello", split and staggered ─────────────────────── */

const TEXT: PlateDef = (() => {
  const s = sheet('text', 'The word Hello in outlined letters, each risen a step higher than the one before');
  const BASE = 232;
  const CAP = 84;
  const XH = 58;
  const STEP = 12;
  const STEM = 14;
  const GX = 28;

  // the type guides, named
  s.put(ln([GX, BASE], [372, BASE]), 'h', 'faint');
  s.tag(GX, BASE - 4, 'baseline', 'start', false, true);
  s.put(ln([GX, BASE - XH], [372, BASE - XH]), 'h', 'faint');
  s.tag(GX, BASE - XH - 4, 'x-height', 'start', false, true);
  s.put(ln([GX, BASE - CAP], [372, BASE - CAP]), 'h', 'faint');
  s.tag(GX, BASE - CAP - 4, 'cap', 'start', false, true);

  // letter positions: advance widths and the gaps between them
  const widths = [62, 58, 14, 14, 58];
  const gaps = [12, 10, 12, 10];
  const total = widths.reduce((a, b) => a + b, 0) + gaps.reduce((a, b) => a + b, 0);
  const xs: number[] = [];
  {
    let x = (400 - total) / 2;
    widths.forEach((w, i) => {
      xs.push(x);
      x += w + (gaps[i] ?? 0);
    });
  }
  const lift = (i: number): number => BASE - i * STEP;

  // each character's span box: the element scrollText wraps it in
  widths.forEach((w, i) => {
    s.put(rrect(xs[i] - 4, lift(i) - 96, w + 8, 104, 1.5), 'h', 'faint');
  });

  // H
  {
    const x = xs[0];
    const b = lift(0);
    const w = widths[0];
    const bar = b - 38;
    s.put(
      poly(
        [
          [x, b], [x, b - CAP], [x + STEM, b - CAP], [x + STEM, bar - 12], [x + w - STEM, bar - 12], [x + w - STEM, b - CAP],
          [x + w, b - CAP], [x + w, b], [x + w - STEM, b], [x + w - STEM, bar], [x + STEM, bar], [x + STEM, b],
        ],
        true,
      ),
      'p',
      'ink',
    );
  }
  // e: a ring with a bar across its eye and an aperture cut on the right
  {
    const r = widths[1] / 2;
    const c: P = [xs[1] + r, lift(1) - XH / 2];
    const ri = r - STEM;
    const t = 4.5;
    const a2 = deg(40);
    const aIn = Math.asin(t / ri);
    const outA = polar(c, r, a2);
    const outB: P = [c[0] + Math.sqrt(r * r - t * t), c[1] + t];
    const inL: P = [c[0] - Math.sqrt(ri * ri - t * t), c[1] + t];
    const inA = polar(c, ri, a2);
    s.put(
      `M${xy(outA)}A${f(r)} ${f(r)} 0 1 1 ${xy(outB)}L${xy(inL)}A${f(ri)} ${f(ri)} 0 0 0 ${xy(inA)}Z`,
      'p',
      'ink',
    );
    const eyeL = polar(c, ri, Math.PI + aIn);
    const eyeR = polar(c, ri, -aIn);
    s.put(`M${xy(eyeL)}A${f(ri)} ${f(ri)} 0 0 1 ${xy(eyeR)}Z`, 'p', 'ink');
  }
  // l, l
  for (const i of [2, 3]) {
    s.put(rrect(xs[i], lift(i) - 88, widths[i], 88, 2.5), 'p', 'ink');
  }
  // o — the last to arrive, in red
  {
    const r = widths[4] / 2;
    const c: P = [xs[4] + r, lift(4) - XH / 2];
    s.put(ellipse(c, r, XH / 2 + 1.5, deg(-90)), 'p', 'accent');
    s.put(ellipse(c, r - STEM + 1, XH / 2 + 1.5 - STEM + 0.5, deg(-90)), 's', 'accent');
  }

  // the stagger as a staircase of baselines, and the rise of each letter
  {
    let d = `M${xy([xs[0], BASE])}`;
    widths.forEach((w, i) => {
      const y = lift(i);
      d += `L${xy([xs[i] + w + 5, y])}`;
      if (i < widths.length - 1) d += `L${xy([xs[i] + w + 5, lift(i + 1)])}`;
    });
    d += `L${xy([346, lift(4)])}`;
    s.put(d, 'h', 'mute');
  }
  {
    let d = '';
    for (let i = 1; i < widths.length; i++) {
      const cx = xs[i] + widths[i] / 2;
      d += arrow([cx, BASE - 1], [cx, lift(i) + 2], 3.6);
    }
    s.put(d, 'h', 'mute');
  }
  widths.forEach((w, i) => s.tag(xs[i] + w / 2, BASE + 16, String(i)));

  // the scale the stagger is read off
  {
    const X = 352;
    let d = `M${xy([X - 4, BASE])}L${xy([X + 4, BASE])}L${xy([X, BASE])}`;
    for (let i = 1; i < widths.length; i++) {
      d += `L${xy([X, lift(i)])}L${xy([X - 4, lift(i)])}L${xy([X + 4, lift(i)])}L${xy([X, lift(i)])}`;
    }
    s.put(d, 'h', 'mute');
  }

  // the timing it comes from, exactly as scrollText computes it: with five
  // characters at stagger 0.05, character i runs from 0.05·i for 0.8
  {
    const G0 = xs[0];
    const G1 = xs[4] + widths[4];
    const GW = G1 - G0;
    const ST = 0.05;
    const RUN = 1 - (widths.length - 1) * ST;
    const gy = (i: number): number => 262 + i * 5.5;
    s.put(`${ln([G0, 291], [G1, 291])}${ln([G0, 288], [G0, 294])}${ln([G1, 288], [G1, 294])}`, 'h', 'faint');
    widths.forEach((_, i) => {
      const a = G0 + GW * ST * i;
      const b = a + GW * RUN;
      s.put(`M${xy([a, gy(i) - 1.8])}L${xy([a, gy(i) + 1.8])}L${xy([a, gy(i)])}L${xy([b, gy(i)])}`, 'h', 'mute');
    });
    s.tag(G0 - 5, 293, '0', 'end');
    s.tag(G1 + 5, 293, '1', 'start');
  }

  s.note([xs[1] + 18, lift(1) - XH + 1], [94, 44], [16, 44], 'SPLIT', 'chars');
  s.note([352, lift(4)], [344, 44], [384, 44], 'STAGGER', '0.05');
  return s.done();
})();

/* ── 04 · scrollPin — a pushpin holding a card while the page runs past ─── */

const PIN: PlateDef = (() => {
  const s = sheet('pin', 'A card held by a pushpin while a page column scrolls past beside it');
  // the page column, scrolling
  const CL = 290;
  const CR = 362;
  s.put(`${ln([CL, 14], [CL, 286])}${ln([CR, 14], [CR, 286])}`, 'h', 'mute');
  s.put(rrect(CL + 10, 24, CR - CL - 20, 28, 3), 'h', 'mute');
  s.put(rrect(CL + 10, 62, CR - CL - 34, 12, 3), 'h', 'mute');
  s.put(rrect(CL + 10, 226, CR - CL - 28, 12, 3), 'h', 'mute');
  s.put(rrect(CL + 10, 248, CR - CL - 20, 28, 3), 'h', 'mute');
  {
    const X = (CL + CR) / 2;
    for (let k = 0; k < 3; k++) {
      const y = 96 + k * 40;
      s.put(arrow([X, y], [X, y + 30], 7), 's', 'ink');
    }
  }

  // the card, and what is on it
  const CX = 44;
  const CY = 128;
  const CW = 196;
  const CH = 130;
  s.put(rrect(CX, CY, CW, CH, 7), 'p', 'ink');
  s.put(rrect(CX + 14, CY + 32, CW - 28, 58, 3), 's', 'ink');
  s.put(hatch(CX + 15.5, CY + 33.5, CW - 31, 55, 6), 'h', 'faint');
  s.put(`${ln([CX + 14, CY + 106], [CX + 150, CY + 106])}${ln([CX + 14, CY + 118], [CX + 108, CY + 118])}`, 'h', 'mute');

  // the pushpin, drawn upright and then leant 20° into the card
  const ENTRY: P = [142, 140];
  const K = 1.4;
  const ROT = deg(20);
  const base = placer(K, ROT, [0, 0]);
  const tipLocal = base([0, 80]);
  const pin = placer(K, ROT, [ENTRY[0] - tipLocal[0], ENTRY[1] - tipLocal[1]]);
  const L = (d: string) => mapPath(d, pin);
  s.put(ellipse(ENTRY, 4.2, 1.7, 0), 'h', 'ink');
  s.put(L('M-1.5 58L-0.4 80L0.4 80L1.5 58'), 's', 'ink');
  s.put(L('M-19 51L19 51L19 56C19 57.5 18 58 16.5 58L-16.5 58C-18 58 -19 57.5 -19 56Z'), 's', 'ink');
  s.put(L('M-10 18.5C-6 27 -6 41 -12.5 51L12.5 51C6 41 6 27 10 18.5'), 's', 'ink');
  s.put(L('M-7.4 29Q0 31.6 7.4 29M-8.1 40Q0 42.8 8.1 40'), 'h', 'mute');
  s.put(L('M-11 14L-11 18.5L11 18.5L11 14'), 's', 'ink');
  s.put(L('M-16 14L-16 6C-16 2.5 -13 0 -9 0L9 0C13 0 16 2.5 16 6L16 14Z'), 'p', 'accent');
  s.put(L('M-16 10L16 10M-11.5 3.2C-12.8 4.6 -13.2 6 -13.2 7.4'), 'h', 'mute');

  // held: the card's top edge is the datum the page runs past
  s.put(centerline([16, CY], [384, CY]), 'h', 'faint');

  // the distance it is held for, measured along the page
  const DX = 270;
  const D0 = 96;
  const D1 = 216;
  s.put(`${ln([CL - 4, D0], [DX - 6, D0])}${ln([CL - 4, D1], [DX - 6, D1])}`, 'h', 'mute');
  const [p1, p2] = dimension([DX, D0], [DX, D1], 4);
  s.put(p1, 'h', 'mute');
  s.put(p2, 'h', 'mute');

  s.note(pin([-19, 55]), [110, 40], [16, 40], 'PIN', 'top 0');
  s.note([DX, (D0 + D1) / 2 + 26], [258, 288], [16, 288], 'PAGE', 'pinDistance 800');
  return s.done();
})();

/* ── 05 · scrollParallax — three planes at their own speeds ─────────────── */

const PARALLAX: PlateDef = (() => {
  const s = sheet('parallax', 'Three stacked isometric planes, each moving at its own fraction of the scroll');
  const A = 104;
  const CXP = 158;
  const YS = [94, 150, 206];
  const SLAB = 5;
  /** A point on plane `k` in its own unit square, centred at 0. */
  const on = (k: number, u: number, v: number): P => [CXP + (u - v) * A * 0.866, YS[k] + (u + v) * A * 0.5];
  const corners = (k: number) => ({ t: on(k, -0.5, -0.5), r: on(k, 0.5, -0.5), b: on(k, 0.5, 0.5), l: on(k, -0.5, 0.5) });
  const region = (k: number): string => {
    const c = corners(k);
    return poly([c.t, c.r, add(c.r, [0, SLAB]), add(c.b, [0, SLAB]), add(c.l, [0, SLAB]), c.l], true);
  };
  s.masks.under0 = [region(0)];
  s.masks.under1 = [region(0), region(1)];

  // exploded-view lines through the corners
  {
    const a = corners(0);
    const c = corners(2);
    s.put(`${ln(a.l, c.l)}${ln(a.r, c.r)}${ln(add(a.b, [0, SLAB]), c.b)}`, 'h', 'faint');
  }

  const plane = (k: number, w: Weight, mask?: string) => {
    const c = corners(k);
    s.put(poly([c.l, c.t, c.r, c.b], true), w, 'ink', mask);
    s.put(poly([c.l, add(c.l, [0, SLAB]), add(c.b, [0, SLAB]), add(c.r, [0, SLAB]), c.r]) + ln(c.b, add(c.b, [0, SLAB])), 'h', 'ink', mask);
  };

  // the background at 0.2: a grid and a low sun
  plane(2, 's', 'under1');
  {
    let d = '';
    for (const t of [-0.25, 0, 0.25]) d += ln(on(2, t, -0.5), on(2, t, 0.5)) + ln(on(2, -0.5, t), on(2, 0.5, t));
    s.put(d, 'h', 'faint', 'under1');
  }
  {
    const c = on(2, -0.12, 0.24);
    s.put(ellipse(c, 0.13 * A * 1.2247, 0.13 * A * 0.7071, 0), 'h', 'mute', 'under1');
  }
  // the middle at 0.5: two rolling lines across its front
  plane(1, 's', 'under0');
  for (const [v0, amp, ph] of [[0.16, 0.05, 0], [0.32, 0.04, 1.4]] as const) {
    const pts: P[] = [];
    for (let i = 0; i <= 12; i++) {
      const u = -0.5 + i / 12;
      pts.push(on(1, u, v0 + amp * Math.sin(u * Math.PI * 3 + ph)));
    }
    s.put(smooth(pts), 'h', 'mute', 'under0');
  }
  // the foreground at 1.0, with a block standing on it
  plane(0, 'p');
  {
    const e = 30;
    const c: P = [CXP, YS[0] + 4];
    const hw = e * 0.866;
    const hh = e * 0.5;
    const top: P = [c[0], c[1] - hh - e];
    s.put(poly([top, [c[0] + hw, c[1] - e], [c[0] + hw, c[1]], [c[0], c[1] + hh], [c[0] - hw, c[1]], [c[0] - hw, c[1] - e]], true), 's', 'ink');
    const mid: P = [c[0], c[1] + hh - e];
    s.put(`${ln(mid, [c[0], c[1] + hh])}${ln(mid, [c[0] - hw, c[1] - e])}${ln(mid, [c[0] + hw, c[1] - e])}`, 'h', 'ink');
  }

  // the scroll itself, as the unit the speeds are fractions of
  {
    const x = 34;
    const y0 = YS[1] + 26;
    s.put(arrow([x, y0], [x, y0 - 52], 5.5) + ln([x - 4, y0], [x + 4, y0]), 's', 'mute');
    s.tag(x, y0 + 13, 'scroll', 'middle', false, true);
  }
  // the isometric axes the sheet is drawn on
  {
    const o: P = [40, 266];
    const k = 19;
    const ax: P = [o[0] + k * 0.866, o[1] + k * 0.5];
    const ay: P = [o[0] - k * 0.866, o[1] + k * 0.5];
    const az: P = [o[0], o[1] - k];
    s.put(arrow(o, ax, 3.4) + arrow(o, ay, 3.4) + arrow(o, az, 3.4), 'h', 'mute');
    s.tag(ax[0] + 5, ax[1] + 6, 'x', 'start');
    s.tag(ay[0] - 5, ay[1] + 6, 'y', 'end');
    s.tag(az[0], az[1] - 5, 'z');
  }
  // how far each one moves for the same scroll
  const AX = CXP + A * 0.866 + 18;
  const speeds = [1, 0.5, 0.2];
  speeds.forEach((sp, k) => {
    s.put(arrow([AX, YS[k]], [AX, YS[k] - 52 * sp], sp < 0.3 ? 3.6 : 5.5), 's', k === 0 ? 'accent' : 'ink');
  });
  speeds.forEach((sp, k) => {
    s.note([AX + 4, YS[k]], [AX + 14, YS[k]], [384, YS[k]], `LAYER ${k + 1}`, `speed ${sp.toFixed(1)}`, k === 0);
  });
  return s.done();
})();

/* ── 06 · scrollVideo — a film strip under a playhead ───────────────────── */

const VIDEO: PlateDef = (() => {
  const s = sheet('video', 'A strip of film with four frames of a sunrise, one per second, above a timeline and its playhead');
  const Y0 = 60;
  const Y1 = 156;
  const X0 = 16;
  const X1 = 384;
  // the timeline is the sheet's scale: 80 units to the second, 0 to 4
  const T0 = 40;
  const T1 = 360;
  const TY = 228;
  const SEC = (T1 - T0) / 4;

  s.put(ln([X0, Y0], [X1, Y0]), 's', 'ink');
  s.put(ln([X1, Y1], [X0, Y1]), 's', 'ink');
  for (const y of [Y0 + 6, Y1 - 11]) {
    let d = '';
    for (let x = 22; x + 6 <= X1 - 4; x += 13) d += rrect(x, y, 6, 5, 1.2);
    s.put(d, 'h', 'mute');
  }

  // one frame to each second, so the strip and the timeline share a scale
  const FY = 80;
  const FH = 56;
  const FW = SEC - 8;
  const fx = [0, 1, 2, 3].map((k) => T0 + SEC * k + 4);
  const k = FW / 76;
  const HILL: P[] = [[0, 46], [12, 36], [22, 41], [38, 21], [52, 37], [60, 31], [76, 45]];
  const hill = (x: number): P[] => HILL.map(([px, py]) => [x + px * k, FY + py]);
  // the sun sets behind the hills, so the hills mask it
  s.masks.hills = fx.map((x) => poly([...hill(x), [x + FW, FY + FH], [x, FY + FH]], true));
  fx.forEach((x) => s.put(rrect(x, FY, FW, FH, 2), 's', 'ink'));
  // a sunrise across the four frames: the hills hold still, the sun climbs
  const sun = [
    [22, 119],
    [25, 109],
    [27, 100],
    [29, 92],
  ];
  fx.forEach((x, i) => {
    s.put(poly(hill(x)), 'h', 'ink');
    s.put(circle([x + sun[i][0], sun[i][1]], 6), 'h', 'mute', 'hills');
  });

  // the timeline, 0 to 4 seconds
  s.put(ln([T0, TY], [T1, TY]), 's', 'ink');
  {
    let d = '';
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const x = T0 + ((T1 - T0) * i) / n;
      const h = i % 10 === 0 ? 8 : 3;
      d += `${i ? 'L' : 'M'}${xy([x, TY])}L${xy([x, TY + h])}L${xy([x, TY])}`;
    }
    s.put(d, 'h', 'mute');
  }
  for (let t = 0; t <= 4; t++) s.tag(T0 + SEC * t, TY + 20, `${t}s`);
  // each frame's edges projected down to the second they belong to
  s.put([0, 1, 2, 3, 4].map((t) => dashed([T0 + SEC * t, Y1 + 4], [T0 + SEC * t, TY - 9])).join(''), 'h', 'faint');

  const PX = fx[2] + FW / 2 + 4;
  const AT = (PX - T0) / SEC;
  // the frame the playhead is on, and the time it reads
  s.put(poly([[fx[2], Y0 - 6], [fx[2], Y0 - 12], [fx[2] + FW, Y0 - 12], [fx[2] + FW, Y0 - 6]]), 'h', 'mute');
  s.tag(fx[2] + FW / 2, Y0 - 17, `${AT.toFixed(2)}s`);
  s.put(ln([T0, TY - 3], [PX - 6, TY - 3]), 'p', 'ink');
  // one sweep: the head, down the stem, round the knob on the timeline
  {
    const tip: P = [PX, Y1 + 8];
    const b1 = polar(tip, 5, deg(90) - 0.42);
    const b2 = polar(tip, 5, deg(90) + 0.42);
    s.put(`M${xy(b1)}L${xy(tip)}L${xy(b2)}L${xy(tip)}L${xy([PX, TY - 6])}A6 6 0 1 0 ${xy([PX + 0.1, TY - 6])}`, 's', 'accent');
  }

  s.note([fx[1] + 6, FY], [100, 34], [16, 34], 'VIDEO', "preload 'auto'");
  s.note([PX + 5, TY + 3], [300, 286], [384, 286], 'PLAYHEAD', 'from 0, to 4');
  return s.done();
})();

/* ── 07 · scrollCounter — an odometer reading 623 ───────────────────────── */

/* Single-stroke numerals in a 20 × 30 box. */
const NUMERALS: Record<string, string> = {
  '1': 'M5 6L11 0L11 30',
  '2': 'M2 7.5C2 3 5.5 0 10 0C14.5 0 18 3 18 7.5C18 11.5 15 14.5 11 18L2 30L19 30',
  '3': 'M2.5 3.5C4.5 1.2 7 0 10 0C14.5 0 17.5 3 17.5 7.2C17.5 11.5 14 14 9 14C14.5 14 18.5 17 18.5 21.6C18.5 26.6 14.5 30 9.5 30C6 30 3 28.6 1.5 26',
  '4': 'M14 30L14 0L1 21L19 21',
  '5': 'M17 0L4 0L2.6 13C4.6 11.3 7 10.6 9.8 10.6C15 10.6 18.6 14.2 18.6 20C18.6 26 14.8 30 9.6 30C6 30 3.2 28.5 1.6 26',
  '6': 'M16 3C14.4 1 12.4 0 10 0C4.6 0 1.6 5.6 1.6 15L1.6 19.6C1.6 25.6 5 30 10 30C15 30 18.4 26.2 18.4 21C18.4 15.8 15 12.4 10.2 12.4C6 12.4 2.6 14.8 1.6 18.6',
  '7': 'M1 0L19 0L8 30',
};

export const COUNTER_VALUE = 623;

const COUNTER: PlateDef = (() => {
  const s = sheet('counter', 'A three-drum mechanical odometer reading 623');
  const CY = 150;
  const R = 70;
  const E = 7;
  const W = 62;
  const xL = [91, 169, 247];

  // the axle, as a centre line through the three drums and both bearings
  s.put(centerline([44, CY], [356, CY]), 'h', 'faint');
  // the frame it turns in
  s.put(ln([46, 246], [354, 246]), 's', 'ink');
  {
    let d = '';
    for (let x = 52; x <= 350; x += 10) d += ln([x, 246], [x - 7, 254]);
    s.put(d, 'h', 'faint');
  }
  for (const x of [62, 326]) {
    s.put(`M${xy([x, 246])}L${xy([x, 140])}A6 6 0 0 1 ${xy([x + 12, 140])}L${xy([x + 12, 246])}`, 's', 'ink');
    s.put(circle([x + 6, CY], 3), 'h', 'ink');
  }

  const digits = String(COUNTER_VALUE).split('');
  /** Wraps a numeral round the drum between angles a0 and a1 (from the front). */
  const wrap = (n: string, cx: number, a0: number, a1: number, sx: number): string =>
    mapPath(NUMERALS[n], (p) => {
      const a = a0 + (p[1] / 30) * (a1 - a0);
      return [cx + (p[0] - 10) * sx + E * Math.cos(a), CY + R * Math.sin(a)];
    });

  xL.forEach((x, k) => {
    const xr = x + W;
    // the drum: its silhouette, the near end face, the facets between digits
    s.put(`M${xy([x, CY - R])}L${xy([xr, CY - R])}A${f(E)} ${f(R)} 0 0 1 ${xy([xr, CY + R])}L${xy([x, CY + R])}`, 'p', 'ink');
    s.put(ellipse([x, CY], E, R, deg(-90)), 's', 'ink');
    {
      let d = '';
      for (const a of [-54, -18, 18, 54]) {
        const y = CY + R * Math.sin(deg(a));
        const dx = E * Math.cos(deg(a));
        d += ln([x + dx, y], [xr + dx, y]);
      }
      s.put(d, 'h', 'mute');
    }
    s.put(ellipse([x, CY], E * 0.42, R * 0.42), 'h', 'mute');
    const cx = (x + xr) / 2;
    const n = Number(digits[k]);
    s.put(wrap(String(n - 1), cx, deg(-50), deg(-24), 1.0), 'h', 'mute');
    s.put(wrap(String(n), cx, deg(-14), deg(14), 1.15), 's', k === 2 ? 'accent' : 'ink');
    s.put(wrap(String(n + 1), cx, deg(24), deg(50), 1.0), 'h', 'mute');
  });

  // the window in the face plate, drawn as a phantom line: only the middle
  // row of each drum is read
  {
    const x0 = xL[0] - 9;
    const x1 = xL[2] + W + E + 2;
    const y0 = CY - 25;
    const y1 = CY + 25;
    s.put(dashed([x0, y0], [x1, y0], 5, 2.6) + dashed([x1, y0], [x1, y1], 5, 2.6) + dashed([x1, y1], [x0, y1], 5, 2.6) + dashed([x0, y1], [x0, y0], 5, 2.6), 'h', 'mute');
  }

  s.note([xL[0] - 9, CY - 12], [66, 40], [16, 40], 'READING', `to ${COUNTER_VALUE}`);
  s.note([xL[2] + 38, CY + R], [300, 276], [384, 276], 'UNITS', 'decimals 0', true);
  return s.done();
})();

/* ── 08 · scrollSnap — a card pulled into its slot ──────────────────────── */

const SNAP: PlateDef = (() => {
  const s = sheet('snap', 'Three card slots; a horseshoe magnet pulls the middle card up into its slot');
  const SW = 76;
  const SH = 100;
  const SY = 136;
  const sx = [46, 162, 278];
  const DROP = 30;

  // the slots, marked by their corners
  sx.forEach((x) => {
    const o = 4;
    const l = 10;
    const x0 = x - o;
    const y0 = SY - o;
    const x1 = x + SW + o;
    const y1 = SY + SH + o;
    s.put(
      poly([[x0, y0 + l], [x0, y0], [x0 + l, y0]]) +
        poly([[x1 - l, y0], [x1, y0], [x1, y0 + l]]) +
        poly([[x1, y1 - l], [x1, y1], [x1 - l, y1]]) +
        poly([[x0 + l, y1], [x0, y1], [x0, y1 - l]]),
      'h',
      'mute',
    );
  });
  // the cards: two home, one still falling short of its slot
  sx.forEach((x, i) => {
    const y = SY + (i === 1 ? DROP : 0);
    s.put(rrect(x, y, SW, SH, 5), i === 1 ? 'p' : 's', 'ink');
    s.put(
      ln([x + 10, y + 16], [x + 46, y + 16]) + ln([x + 10, y + 27], [x + 62, y + 27]) + ln([x + 10, y + 36], [x + 40, y + 36]) +
        rrect(x + 10, y + 50, SW - 20, 38, 2),
      'h',
      'mute',
    );
  });

  // the clearance it still has to close, hatched
  s.put(hatch(sx[1] + 1, SY, SW - 2, DROP - 1.5, 5), 'h', 'faint');

  // the threshold: halfway down the slot
  const TH = SY + SH / 2;
  s.put(ln([sx[1] - 12, TH], [sx[1] + SW + 18, TH]), 'h', 'mute');
  const DXT = sx[1] + SW + 12;
  s.put(ln([sx[1] + SW + 6, SY], [DXT + 6, SY]), 'h', 'mute');
  const [t1, t2] = dimension([DXT, SY], [DXT, TH], 4);
  s.put(t1, 'h', 'mute');
  s.put(t2, 'h', 'mute');
  // how far the card is out: under the threshold, so it snaps back home
  {
    const x = sx[1] - 10;
    s.put(`${ln([sx[1] - 5, SY], [x - 5, SY])}${ln([sx[1] - 3, SY + DROP], [x - 5, SY + DROP])}`, 'h', 'faint');
    const [o1, o2] = dimension([x, SY], [x, SY + DROP], 3.6);
    s.put(o1 + o2, 'h', 'mute');
    s.tag(x - 5, SY + DROP / 2 + 2, (DROP / SH).toFixed(1), 'end');
  }

  // the magnet, its poles, and the field reaching down to the card
  const MX = 200;
  const MY = 50;
  const RO = 26;
  const RI = 12;
  const LEG = 96;
  s.put(
    `M${xy([MX - RO, LEG])}L${xy([MX - RO, MY])}A${RO} ${RO} 0 0 1 ${xy([MX + RO, MY])}L${xy([MX + RO, LEG])}` +
      `L${xy([MX + RI, LEG])}L${xy([MX + RI, MY])}A${RI} ${RI} 0 0 0 ${xy([MX - RI, MY])}L${xy([MX - RI, LEG])}Z`,
    'p',
    'accent',
  );
  s.put(ln([MX - RO, LEG - 12], [MX - RI, LEG - 12]) + ln([MX + RI, LEG - 12], [MX + RO, LEG - 12]), 'h', 'ink');
  s.tag(MX - (RO + RI) / 2, LEG - 3.4, 'N', 'middle', false, true);
  s.tag(MX + (RO + RI) / 2, LEG - 3.4, 'S', 'middle', false, true);
  for (const [k, tone] of [[0, 'mute'], [1, 'faint'], [2, 'faint']] as const) {
    const half = RI + 2 + k * 5;
    const depth = 14 + k * 14;
    const a: P = [MX - half, LEG + 1.5];
    const b: P = [MX + half, LEG + 1.5];
    s.put(`M${xy(a)}C${xy([a[0] - 2 - k * 3, LEG + depth])} ${xy([b[0] + 2 + k * 3, LEG + depth])} ${xy(b)}`, 'h', tone);
  }
  // the pull
  s.put(arrow([MX, SY + DROP - 4], [MX, SY + 4], 6), 's', 'ink');

  s.note([DXT, (SY + TH) / 2], [290, 100], [384, 100], 'THRESHOLD', '0.5');
  s.note([MX - RO, MY + 18], [138, 40], [16, 40], 'DURATION', '600');
  return s.done();
})();

export const PLATES = { draw: DRAW, animate: ANIMATE, text: TEXT, pin: PIN, parallax: PARALLAX, video: VIDEO, counter: COUNTER, snap: SNAP } as const;
export type PlateKey = keyof typeof PLATES;

/* ── Rendering ──────────────────────────────────────────────────────────── */

const VIEW = '0 0 400 300';

/** Progress through the plate's window at which stroke `i` has drawn. */
const doneAt = (i: number, stagger: number): number => Math.min(1, i * stagger + 1 / SPEED);
const startAt = (i: number, stagger: number): string => (i * stagger).toFixed(3);
/**
 * Where a note's fade begins: it runs over the last 4% before its stroke is
 * done (the CSS ramp is 25× progress), so even the last leader on a plate,
 * which lands at the very end of the window, is fully opaque by then.
 */
const fadeAt = (i: number, stagger: number): string => Math.max(i * stagger, doneAt(i, stagger) - 0.04).toFixed(3);

function Masks({ plate, id }: { plate: PlateDef; id: string }) {
  const keys = Object.keys(plate.masks);
  if (!keys.length) return null;
  return (
    <defs>
      {keys.map((k) => (
        <mask key={k} id={`${id}-${k}`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="300">
          <rect width="400" height="300" fill="#fff" />
          {plate.masks[k].map((d, j) => (
            <path key={j} d={d} fill="#000" stroke="#000" strokeWidth="3" />
          ))}
        </mask>
      ))}
    </defs>
  );
}

/* Consecutive strokes under the same mask share one group, so document order
   — the draw order — is kept exactly. */
function Strokes({ plate, id, ink }: { plate: PlateDef; id: string; ink?: string }) {
  const groups: { mask?: string; items: { st: Stroke; i: number }[] }[] = [];
  plate.strokes.forEach((st, i) => {
    if (!ink && st.lead) return;
    const last = groups[groups.length - 1];
    if (last && last.mask === st.mask) last.items.push({ st, i });
    else groups.push({ mask: st.mask, items: [{ st, i }] });
  });
  return (
    <>
      {groups.map((g, gi) => (
        <g key={gi} mask={g.mask ? `url(#${id}-${g.mask})` : undefined}>
          {g.items.map(({ st, i }) => (
            <path
              key={i}
              d={st.d}
              /* The tone classes set the real colour; the attributes only tell
                 the library's dev check these paths are stroked, not filled. */
              stroke={ink ? 'currentColor' : undefined}
              fill={ink ? 'none' : undefined}
              className={
                ink
                  ? `tk-ink ${ink} tk-w-${st.w} tk-t-${st.tone}${st.lead ? ' tk-lead' : ''}`
                  : `tk-pencil tk-w-${st.w}`
              }
            />
          ))}
        </g>
      ))}
    </>
  );
}

/**
 * One plate: the pencil underdrawing (static, its own SVG so the per-frame ink
 * updates never repaint it) and the ink the library draws over it, with its
 * notes set in type. Notes fade in from `--tk-p`, the plate's own progress.
 */
export function PlateArt({ plate, ink, stagger }: { plate: PlateDef; ink: string; stagger: number }) {
  const id = `tk-${plate.key}`;
  return (
    <>
      <svg className="tk-svg tk-svg-pencil" viewBox={VIEW} aria-hidden="true" focusable="false">
        <Masks plate={plate} id={`${id}-p`} />
        <Strokes plate={plate} id={`${id}-p`} />
      </svg>
      <svg className="tk-svg" viewBox={VIEW} role="img" aria-label={plate.label}>
        <Masks plate={plate} id={`${id}-i`} />
        <Strokes plate={plate} id={`${id}-i`} ink={ink} />
        <g className="tk-notes" aria-hidden="true">
          {plate.tags.map((t, k) => (
            <text
              key={`t${k}`}
              className={`tk-note tk-tag${t.accent ? ' tk-tag-accent' : ''}${t.word ? ' tk-tag-w' : ''}`}
              x={t.x.toFixed(1)}
              y={t.y.toFixed(1)}
              textAnchor={t.anchor}
              transform={t.rotate ? `rotate(${t.rotate} ${t.x.toFixed(1)} ${t.y.toFixed(1)})` : undefined}
              style={{ '--tk-at': fadeAt(t.at, stagger) } as CSSProperties}
            >
              {t.text}
            </text>
          ))}
          {plate.notes.map((n, k) => (
            <g key={`n${k}`} className="tk-lead-note">
              <circle
                className={`tk-note tk-dot${n.accent ? ' tk-dot-accent' : ''}`}
                cx={n.dot[0].toFixed(1)}
                cy={n.dot[1].toFixed(1)}
                r="1.9"
                style={{ '--tk-at': startAt(n.at, stagger) } as CSSProperties}
              />
              <text
                className="tk-note tk-label"
                x={n.x.toFixed(1)}
                y={n.y.toFixed(1)}
                textAnchor={n.anchor}
                style={{ '--tk-at': fadeAt(n.at, stagger) } as CSSProperties}
              >
                {/* Offsets in em, so the pair keeps its spacing at every size:
                    the value sits half a line above the shelf, the title a
                    line and a half above the value. */}
                <tspan className="tk-label-t" x={n.x.toFixed(1)} y={n.y.toFixed(1)} dy="-2.2em">
                  {n.title}
                </tspan>
                <tspan className="tk-label-v" x={n.x.toFixed(1)} y={n.y.toFixed(1)} dy="-0.5em">
                  {n.value}
                </tspan>
              </text>
            </g>
          ))}
        </g>
      </svg>
    </>
  );
}
