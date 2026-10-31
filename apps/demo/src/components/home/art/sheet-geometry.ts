/**
 * Sheet — the geometry of the sign-off's drafting sheet that is not laid out
 * by CSS: the signature plate (lettering guides, the signature line, the
 * dimension over the word and its two leaders), the two instruments that
 * flank it (a 14° set square on a T-square blade, a pen nib), and the two
 * symbols in the title block (third-angle projection, revision delta).
 *
 * The frame itself — borders, zone ticks, crop and centring marks, table
 * rules — is axis-aligned and lives in the page layout, drawn by one-axis
 * rules (see SignOff.tsx), so it follows any sheet size without distortion.
 *
 * Pure module, no DOM and no randomness: server and client compute the same
 * strings. Every number is written with one decimal.
 */

import { SCRIPT_DRAW } from './script';

type P = [number, number];

const f = (n: number): string => {
  const s = n.toFixed(1);
  return s === '-0.0' ? '0.0' : s;
};
const xy = (p: P): string => `${f(p[0])} ${f(p[1])}`;
const line = (a: P, b: P): string => `M${xy(a)}L${xy(b)}`;

/* ── The signature plate ──────────────────────────────────────────────────── */

/** The plate's own coordinate box. The hand-lettered word sits inside it. */
export const PLATE = { w: 1400, h: 440 } as const;

/** Where the script's 1000 × 420 box sits on the plate. */
export const SCRIPT_BOX = { x: 200, y: 20, w: 1000, h: 420 } as const;

/** The plate box as percentages, for the HTML layer that holds HeroScript. */
export const SCRIPT_BOX_PCT = {
  left: `${((SCRIPT_BOX.x / PLATE.w) * 100).toFixed(4)}%`,
  top: `${((SCRIPT_BOX.y / PLATE.h) * 100).toFixed(4)}%`,
  width: `${((SCRIPT_BOX.w / PLATE.w) * 100).toFixed(4)}%`,
} as const;

/* Read the pen's first and last points, and the curve count, out of the word
   itself, so the labels state the drawing's real numbers. */
const NUMS = (SCRIPT_DRAW.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
const onPlate = (x: number, y: number): P => [x + SCRIPT_BOX.x, y + SCRIPT_BOX.y];
/** Where the nib touches the paper. */
export const PEN_DOWN: P = onPlate(NUMS[0], NUMS[1]);
/** Where it lifts. */
export const PEN_UP: P = onPlate(NUMS[NUMS.length - 2], NUMS[NUMS.length - 1]);
/** Cubic segments in the single stroke. */
export const CURVES = (SCRIPT_DRAW.d.match(/C/g) ?? []).length;

/* Lettering guides, from art/script.ts: ascender y 72, x-line y 213, baseline
   y 348 in the script's box; letters slant 14°. */
const ASC = 72 + SCRIPT_BOX.y;
const XLINE = 213 + SCRIPT_BOX.y;
const BASE = 348 + SCRIPT_BOX.y;
export const SLANT_DEG = 14;
const G0 = SCRIPT_BOX.x;
const G1 = SCRIPT_BOX.x + SCRIPT_BOX.w;
/** The line the word is signed on, a little under its baseline. */
const SIG_Y = BASE + 30;
const SIG_X0 = PEN_DOWN[0] + 46;
const SIG_X1 = G1 - 30;

export type Weight = 'p' | 's' | 'h';
export type Tone = 'ink' | 'mute' | 'faint' | 'accent';

export interface PlatePiece {
  d: string;
  w: Weight;
  tone: Tone;
  /** Notes are leaders and dimensions: hidden where their labels cannot be read. */
  note?: boolean;
}

/** The pencil construction the word is lettered over: guides and slant lines. */
export const PLATE_PENCIL: readonly string[] = (() => {
  const out: string[] = [];
  const dx = (BASE - ASC) * Math.tan((SLANT_DEG * Math.PI) / 180);
  for (let x = G0 + 8; x + dx <= G1; x += 44) out.push(line([x, BASE], [x + dx, ASC]));
  out.push(line([G0, ASC], [G1, ASC]));
  out.push(line([G0, XLINE], [G1, XLINE]));
  out.push(line([G0, BASE], [G1, BASE]));
  out.push(line([SIG_X0, SIG_Y], [SIG_X1, SIG_Y]));
  return out;
})();

/* Dimension over the word: from the pen-down point to the pen-up point. */
const DIM_Y = 50;
const DIM_C = (PEN_DOWN[0] + PEN_UP[0]) / 2;

/* Leaders hang off the plate's outer margins, clear of the guides. */
const EDGE_L = 12;
const EDGE_R = PLATE.w - 12;
const SHELF_DOWN = PLATE.h - 16;
/* Both shelves sit under the word, so the two pen labels read as a pair. */
const SHELF_UP = SHELF_DOWN;

export interface PlateNote {
  key: 'down' | 'up';
  dot: P;
  text: P;
  anchor: 'start' | 'end';
  title: string;
}

export const PLATE_NOTES: readonly PlateNote[] = [
  { key: 'down', dot: PEN_DOWN, text: [EDGE_L, SHELF_DOWN - 10], anchor: 'start', title: 'PEN DOWN' },
  { key: 'up', dot: PEN_UP, text: [EDGE_R, SHELF_UP - 10], anchor: 'end', title: 'PEN UP' },
];

/** The plate's inked strokes, in drawing order. */
export const PLATE_PIECES: readonly PlatePiece[] = [
  // guides, top down, then the line it is signed on and its ×
  { d: line([G0, ASC], [G1, ASC]), w: 'h', tone: 'faint' },
  { d: line([G0, XLINE], [G1, XLINE]), w: 'h', tone: 'faint' },
  { d: line([G0, BASE], [G1, BASE]), w: 'h', tone: 'faint' },
  { d: line([SIG_X0, SIG_Y], [SIG_X1, SIG_Y]), w: 's', tone: 'mute' },
  {
    d: `${line([SIG_X0 - 34, SIG_Y - 20], [SIG_X0 - 14, SIG_Y])}${line([SIG_X0 - 14, SIG_Y - 20], [SIG_X0 - 34, SIG_Y])}`,
    w: 's',
    tone: 'ink',
  },
  // the dimension: extension lines, then the line from the centre outward
  { d: line([PEN_DOWN[0], PEN_DOWN[1] - 16], [PEN_DOWN[0], DIM_Y - 12]), w: 'h', tone: 'mute', note: true },
  { d: line([PEN_UP[0], PEN_UP[1] - 16], [PEN_UP[0], DIM_Y - 12]), w: 'h', tone: 'mute', note: true },
  {
    d: `M${xy([DIM_C, DIM_Y])}L${xy([PEN_DOWN[0], DIM_Y])}l9 -4.5L${xy([PEN_DOWN[0], DIM_Y])}l9 4.5`,
    w: 'h',
    tone: 'mute',
    note: true,
  },
  {
    d: `M${xy([DIM_C, DIM_Y])}L${xy([PEN_UP[0], DIM_Y])}l-9 -4.5L${xy([PEN_UP[0], DIM_Y])}l-9 4.5`,
    w: 'h',
    tone: 'mute',
    note: true,
  },
  // the two leaders
  {
    d: `M${xy(PEN_DOWN)}L${xy([PEN_DOWN[0] - 58, SHELF_DOWN])}L${xy([EDGE_L, SHELF_DOWN])}`,
    w: 'h',
    tone: 'mute',
    note: true,
  },
  {
    d: `M${xy(PEN_UP)}L${xy([PEN_UP[0] + 58, SHELF_UP])}L${xy([EDGE_R, SHELF_UP])}`,
    w: 'h',
    tone: 'mute',
    note: true,
  },
];

/** Index in PLATE_PIECES of the dimension's last stroke and of each leader. */
export const PLATE_DIM_AT = 8;
export const PLATE_LEADER_AT: Readonly<Record<PlateNote['key'], number>> = { down: 9, up: 10 };
export const PLATE_DIM = { x: DIM_C, y: DIM_Y - 12, text: `1 stroke · ${CURVES} curves` } as const;

/* ── Title-block symbols ──────────────────────────────────────────────────── */

/** Circle as one subpath, from the top, clockwise. */
function circle(c: P, r: number): string {
  return `M${xy([c[0], c[1] - r])}A${f(r)} ${f(r)} 0 1 1 ${xy([c[0], c[1] + r])}A${f(r)} ${f(r)} 0 1 1 ${xy([c[0], c[1] - r])}`;
}

/**
 * Third-angle projection symbol (ISO 128): the end view of a truncated cone,
 * two circles, on the left; its side view on the right, narrow end towards
 * them. viewBox 0 0 120 56.
 */
export const PROJECTION = {
  viewBox: '0 0 120 56',
  pieces: [
    { d: `${line([4, 28], [116, 28])}${line([28, 6], [28, 50])}`, w: 'h' as Weight, tone: 'faint' as Tone },
    { d: `${circle([28, 28], 17)}${circle([28, 28], 9.5)}`, w: 's' as Weight, tone: 'ink' as Tone },
    { d: 'M62.0 18.5L108.0 11.0L108.0 45.0L62.0 37.5Z', w: 's' as Weight, tone: 'ink' as Tone },
  ],
} as const;

/** The revision delta beside REV. viewBox 0 0 24 22. */
export const DELTA = { viewBox: '0 0 24 22', d: 'M12.0 2.0L22.0 20.0L2.0 20.0Z' } as const;

/* ── The flanks: the two instruments that drew the plate ──────────────────── */

/**
 * Either side of the plate the sheet carries a view of an instrument, drawn
 * at one scale in a 240 × 440 box: on the left the set square that ruled the
 * slant guides (its hypotenuse is the guides' own 14°), resting on a T-square
 * blade; on the right the nib that signed the word, held at a writing angle.
 * Each view is construction first, then outlines, then detail, then leaders,
 * which is the order the sheet inks them in.
 */
export const FLANK = { w: 240, h: 440 } as const;

export interface FlankPiece {
  d: string;
  w: Weight;
  tone: Tone;
  /** Leaders and dimensions: their label fades in once they are inked. */
  note?: boolean;
}

export interface FlankNote {
  key: string;
  dot: P;
  /** Where the label's text sits: just above its shelf. */
  text: P;
  anchor: 'start' | 'end';
  title: string;
}

export interface FlankView {
  pieces: readonly FlankPiece[];
  notes: readonly FlankNote[];
  /** Index in `pieces` of each note's leader. */
  leaderAt: Readonly<Record<string, number>>;
  /** A dimension's own value, set at its arc. */
  dim?: { x: number; y: number; text: string; at: number };
}

const rad = (deg: number): number => (deg * Math.PI) / 180;
const poly = (pts: readonly P[]): string => `M${pts.map(xy).join('L')}Z`;
/** A leader: from the dot, a dog-leg, then the shelf the label sits on. */
const leader = (dot: P, knee: P, end: P): string => `M${xy(dot)}L${xy(knee)}L${xy(end)}`;

/** Lines `a`–`b` and `c`–`d` meet here. */
function meet(a: P, b: P, c: P, d: P): P {
  const den = (a[0] - b[0]) * (c[1] - d[1]) - (a[1] - b[1]) * (c[0] - d[0]);
  const s = ((a[0] - c[0]) * (c[1] - d[1]) - (a[1] - c[1]) * (c[0] - d[0])) / den;
  return [a[0] + s * (b[0] - a[0]), a[1] + s * (b[1] - a[1])];
}

/** A triangle moved `k` units in from every edge (vertices given clockwise on screen). */
function inset(tri: readonly [P, P, P], k: number): [P, P, P] {
  const edges = tri.map((p, i): [P, P] => {
    const q = tri[(i + 1) % 3];
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
    // Clockwise on screen (y down): the inward normal is the edge turned right.
    const nx = -(q[1] - p[1]) / len;
    const ny = (q[0] - p[0]) / len;
    return [
      [p[0] + nx * k, p[1] + ny * k],
      [q[0] + nx * k, q[1] + ny * k],
    ];
  });
  return [0, 1, 2].map((i) => {
    const e0 = edges[(i + 2) % 3];
    const e1 = edges[i];
    return meet(e0[0], e0[1], e1[0], e1[1]);
  }) as [P, P, P];
}

/* Left: a 14° set square on a T-square blade. */
const SQ_FOOT = 396;
const SQ_RIGHT = 200;
const SQ_TOP = 116;
const SQ_RUN = (SQ_FOOT - SQ_TOP) * Math.tan(rad(SLANT_DEG));
/** Top, right-angle corner, foot of the slant — clockwise on screen. */
const SQ: [P, P, P] = [
  [SQ_RIGHT, SQ_TOP],
  [SQ_RIGHT, SQ_FOOT],
  [SQ_RIGHT - SQ_RUN, SQ_FOOT],
];
const SLANT_U: P = [Math.sin(rad(SLANT_DEG)), -Math.cos(rad(SLANT_DEG))];
const ARC_R = 70;
/** Extension lines run a little past the arc; the value sits above them. */
const EXT_R = 84;
const arcPt = (deg: number, r = ARC_R): P => [SQ_RIGHT + r * Math.sin(rad(deg)), SQ_TOP - r * Math.cos(rad(deg))];

/** Slant guides ruled on the plate, counted from the pencil construction. */
export const SLANT_GUIDES = PLATE_PENCIL.length - 4;

function ticks(count: number, at: (i: number) => [P, P]): string {
  return Array.from({ length: count }, (_, i) => line(...at(i))).join('');
}

export const FLANK_SQUARE: FlankView = (() => {
  // The point on the slant at y 300, for the guides' leader.
  const onSlant = (y: number): P => [SQ[2][0] + (SQ_FOOT - y) * Math.tan(rad(SLANT_DEG)), y];
  const dot = onSlant(300);
  const pieces: FlankPiece[] = [
    // construction: the vertical leg and the slant carried up past the corner
    { d: line([SQ_RIGHT, SQ_TOP], [SQ_RIGHT, SQ_TOP - EXT_R]), w: 'h', tone: 'faint' },
    { d: line([SQ_RIGHT, SQ_TOP], [SQ_RIGHT + SLANT_U[0] * EXT_R, SQ_TOP + SLANT_U[1] * EXT_R]), w: 'h', tone: 'faint' },
    // the T-square blade and its graduations
    { d: poly([[2, SQ_FOOT], [238, SQ_FOOT], [238, SQ_FOOT + 22], [2, SQ_FOOT + 22]]), w: 'p', tone: 'ink' },
    {
      d: ticks(39, (i) => {
        const x = 6 + i * 6;
        return [[x, SQ_FOOT + 22], [x, SQ_FOOT + 22 - (i % 5 === 0 ? 9 : 4.5)]];
      }),
      w: 'h',
      tone: 'mute',
    },
    // the set square: outline, edge bevel, the cut-out and its bevel
    { d: poly(SQ), w: 'p', tone: 'ink' },
    { d: poly(inset(SQ, 3.5)), w: 'h', tone: 'mute' },
    { d: poly(inset(SQ, 12)), w: 's', tone: 'ink' },
    { d: poly(inset(SQ, 15.5)), w: 'h', tone: 'faint' },
    // the scale down its vertical edge
    {
      d: ticks(34, (i) => {
        const y = SQ_FOOT - 8 - i * 8;
        return [[SQ_RIGHT, y], [SQ_RIGHT - (i % 5 === 0 ? 9 : 4.5), y]];
      }),
      w: 'h',
      tone: 'mute',
    },
    // the 14° between the vertical and the slant. Too narrow for arrows
    // inside, so — as a draughtsman would — the arc runs on past both
    // extension lines and the arrows point in at them from outside.
    {
      d:
        `M${xy(arcPt(-12))}A${f(ARC_R)} ${f(ARC_R)} 0 0 1 ${xy(arcPt(SLANT_DEG + 12))}` +
        `M${xy(arcPt(0))}L${xy(arcPt(-5.6, ARC_R + 2.6))}M${xy(arcPt(0))}L${xy(arcPt(-5.6, ARC_R - 2.6))}` +
        `M${xy(arcPt(SLANT_DEG))}L${xy(arcPt(SLANT_DEG + 5.6, ARC_R + 2.6))}M${xy(arcPt(SLANT_DEG))}L${xy(arcPt(SLANT_DEG + 5.6, ARC_R - 2.6))}`,
      w: 'h',
      tone: 'mute',
      note: true,
    },
    // the leader to the guides it ruled
    { d: leader(dot, [dot[0] - 26, 336], [0, 336]), w: 'h', tone: 'mute', note: true },
  ];
  return {
    pieces,
    notes: [{ key: 'guides', dot, text: [0, 326], anchor: 'start', title: 'SLANT GUIDES' }],
    leaderAt: { guides: pieces.length - 1 },
    dim: { x: arcPt(SLANT_DEG / 2, EXT_R + 12)[0], y: SQ_TOP - EXT_R - 7, text: `${SLANT_DEG}°`, at: pieces.length - 2 },
  };
})();

/* Right: the nib, held at a writing angle, tip up and to the left. */
const NIB_TIP: P = [58, 72];
const NIB_TILT = 16;
/** Nib space (u across, v down the axis from the tip) to the flank box. */
const nib = (u: number, v: number): P => {
  const s = Math.sin(rad(NIB_TILT));
  const c = Math.cos(rad(NIB_TILT));
  return [NIB_TIP[0] + v * s + u * c, NIB_TIP[1] + v * c - u * s];
};
/** A path written in nib space: `M`, `L` and `C` with absolute u v pairs. */
function nibPath(cmds: readonly (string | number)[]): string {
  let out = '';
  for (let i = 0; i < cmds.length; ) {
    const op = cmds[i++] as string;
    const n = op === 'C' ? 3 : 1;
    const pts: string[] = [];
    for (let k = 0; k < n; k++) {
      pts.push(xy(nib(cmds[i] as number, cmds[i + 1] as number)));
      i += 2;
    }
    out += op + pts.join(' ');
  }
  return out;
}
const nibCircle = (v: number, r: number): string => circle(nib(0, v), r);
const nibArc = (v: number, r: number, a0: number, a1: number): string => {
  const p = (a: number): P => nib(r * Math.sin(rad(a)), v + r * Math.cos(rad(a)));
  return `M${xy(p(a0))}A${f(r)} ${f(r)} 0 0 0 ${xy(p(a1))}`;
};
/** Half-width of the section at `v`: it swells from 34 to 38. */
const gripW = (v: number): number => 34 + (4 * (v - 196)) / 90;

export const FLANK_NIB: FlankView = (() => {
  const tip = nib(0, 5);
  const hole = nib(0, 98);
  const pieces: FlankPiece[] = [
    // construction: the pen's axis
    { d: line(nib(0, -30), nib(0, 382)), w: 'h', tone: 'faint' },
    // the nib: right tine, shoulder, down to the section; then the left, back to the tip
    {
      d: nibPath([
        'M', 28, 196, 'L', 28, 158, 'C', 28, 153, 32, 150, 32, 142, 'C', 32, 132, 28, 124, 25, 104,
        'C', 22, 82, 9, 40, 2, 0, 'L', -2, 0, 'C', -9, 40, -22, 82, -25, 104, 'C', -28, 124, -32, 132, -32, 142,
        'C', -32, 150, -28, 153, -28, 158, 'L', -28, 196,
      ]),
      w: 'p',
      tone: 'ink',
    },
    { d: nibCircle(5, 4), w: 's', tone: 'ink' },
    { d: line(nib(0, 9), nib(0, 93)), w: 's', tone: 'ink' },
    { d: nibCircle(98, 5), w: 's', tone: 'ink' },
    // the imprint: two arcs under the breather, two bands across the base
    { d: `${nibArc(98, 15, -58, 58)}${nibArc(98, 21, -50, 50)}`, w: 'h', tone: 'mute' },
    { d: `${line(nib(-28, 176), nib(28, 176))}${line(nib(-28, 182), nib(28, 182))}`, w: 'h', tone: 'faint' },
    // the section, its grip rings, the thread, the barrel and its break
    { d: poly([nib(-34, 196), nib(34, 196), nib(38, 286), nib(-38, 286)]), w: 'p', tone: 'ink' },
    {
      d: Array.from({ length: 8 }, (_, i) => {
        const v = 212 + i * 8;
        return line(nib(-gripW(v), v), nib(gripW(v), v));
      }).join(''),
      w: 'h',
      tone: 'mute',
    },
    { d: poly([nib(-33, 286), nib(33, 286), nib(33, 298), nib(-33, 298)]), w: 's', tone: 'ink' },
    { d: Array.from({ length: 5 }, (_, i) => line(nib(-26 + i * 13, 298), nib(-20 + i * 13, 286))).join(''), w: 'h', tone: 'mute' },
    { d: nibPath(['M', -38, 362, 'L', -38, 298, 'L', 38, 298, 'L', 38, 362]), w: 'p', tone: 'ink' },
    { d: line(nib(-38, 314), nib(38, 314)), w: 'h', tone: 'mute' },
    {
      d: nibPath(['M', -38, 362, 'C', -25, 374, -12, 374, 0, 362, 'C', 12, 350, 25, 350, 38, 362, 'M', -38, 362, 'C', -25, 350, -12, 350, 0, 362]),
      w: 's',
      tone: 'ink',
    },
    // leaders: the tip to its width, the breather to the ink's flow
    { d: leader(tip, [96, 44], [FLANK.w, 44]), w: 'h', tone: 'mute', note: true },
    { d: leader(hole, [146, 216], [FLANK.w, 216]), w: 'h', tone: 'mute', note: true },
  ];
  return {
    pieces,
    notes: [
      { key: 'tip', dot: tip, text: [FLANK.w, 34], anchor: 'end', title: 'NIB' },
      { key: 'flow', dot: hole, text: [FLANK.w, 206], anchor: 'end', title: 'INK FLOW' },
    ],
    leaderAt: { tip: pieces.length - 2, flow: pieces.length - 1 },
  };
})();
