/**
 * The SVG blob generator's maths: pure and deterministic, so the server render,
 * the client render, the figures and the code quoted on the page all come from
 * the same numbers.
 *
 * A blob is `points` spokes at equal angles from the top, clockwise; a radius
 * on each from a seeded PRNG (mulberry32); and a closed Catmull-Rom curve
 * through the spokes' ends, written as one cubic Bézier per point and a Z.
 * The curve's tangent at each point runs parallel to the line between its two
 * neighbours, on both sides of it, so there is no corner anywhere, the seam
 * where the path closes included.
 */

export type Pt = readonly [number, number];
/** One cubic Bézier: start, control 1, control 2, end. */
export type Cubic = readonly [Pt, Pt, Pt, Pt];
export type BlobMode = 'fill' | 'outline';

export type BlobSettings = {
  points: number;
  /** 0 to MAX_RANDOMNESS: how much shorter than the longest a radius may be. */
  randomness: number;
  /** The SVG's width and height, in px. */
  size: number;
  seed: number;
  mode: BlobMode;
  /** The outline's stroke-width, in px (also the drawn outline's). */
  line: number;
  /** 'currentColor', or a #rrggbb colour. */
  color: string;
};

export const MIN_POINTS = 3;
export const MAX_POINTS = 12;
/**
 * Past this, a short radius between two long ones can fold the curve back on
 * itself. Checked by brute force over every pattern of neighbouring radii
 * that matters (each segment depends on four), 3 to 12 points: up to 0.7 the
 * curve's angle around the centre always increases, so it never crosses
 * itself; at 0.8 it can turn back.
 */
export const MAX_RANDOMNESS = 0.7;
export const MIN_SIZE = 120;
export const MAX_SIZE = 640;
export const MIN_LINE = 1;
export const MAX_LINE = 20;
export const MAX_SEED = 99999;
/** Catmull-Rom's tangent scale, as a Bézier handle: a sixth of the neighbours' chord. */
export const HANDLE = 1 / 6;

export const DEFAULTS: BlobSettings = {
  points: 6,
  randomness: 0.4,
  size: 400,
  seed: 4127,
  mode: 'fill',
  line: 4,
  color: 'currentColor',
};

/** Six seeds to start from. Each loads its seed, points and randomness. */
export const GALLERY: { seed: number; points: number; randomness: number }[] = [
  { seed: 4127, points: 6, randomness: 0.4 },
  { seed: 812, points: 5, randomness: 0.3 },
  { seed: 2026, points: 8, randomness: 0.5 },
  { seed: 7, points: 4, randomness: 0.2 },
  { seed: 31337, points: 10, randomness: 0.6 },
  { seed: 555, points: 12, randomness: 0.35 },
];

// ── The seeded radii ────────────────────────────────────────────────────────

/** mulberry32: a 32-bit seed in, the same stream of numbers in [0, 1) out, every time. */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One radius per point, each between 1 − randomness and 1 (a share of the longest possible). */
export function blobRadii(seed: number, points: number, randomness: number): number[] {
  const rand = mulberry32(seed);
  return Array.from({ length: points }, () => 1 - randomness * rand());
}

/** Two blobs' radii part way: t 0 is a, t 1 is b. Both must have as many points. */
export function lerpRadii(a: readonly number[], b: readonly number[], t: number): number[] {
  return a.map((r, i) => r + ((b[i] ?? r) - r) * t);
}

/** The next seed, for the morph: one up, back to 1 after MAX_SEED. */
export const nextSeed = (seed: number) => (seed >= MAX_SEED ? 1 : seed + 1);

// ── The curve ───────────────────────────────────────────────────────────────

/** Spoke i's angle, in radians: from the top (−90°), clockwise on screen. */
export const spokeAngle = (i: number, n: number) => -Math.PI / 2 + (i / n) * 2 * Math.PI;

/** The spokes' ends, around (cx, cy), with radii already in px. */
export function polarPoints(radii: readonly number[], cx: number, cy: number): Pt[] {
  const n = radii.length;
  return radii.map((r, i) => {
    const a = spokeAngle(i, n);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
}

/**
 * A closed Catmull-Rom curve through `pts` as cubic Béziers, one per point:
 * the piece from p1 to p2 has handles p1 + (p2 − p0) / 6 and p2 − (p3 − p1) / 6,
 * so the tangent at every point is parallel to the chord between its neighbours.
 */
export function closedCatmullRom(pts: readonly Pt[]): Cubic[] {
  const n = pts.length;
  const at = (i: number) => pts[((i % n) + n) % n];
  return pts.map((_, i) => {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * HANDLE, p1[1] + (p2[1] - p0[1]) * HANDLE];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * HANDLE, p2[1] - (p3[1] - p1[1]) * HANDLE];
    return [p1, c1, c2, p2] as const;
  });
}

export function bezierAt(c: Cubic, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return [a * c[0][0] + b * c[1][0] + d * c[2][0] + e * c[3][0], a * c[0][1] + b * c[1][1] + d * c[2][1] + e * c[3][1]];
}

function speedAt(c: Cubic, t: number): number {
  const u = 1 - t;
  const dx = 3 * u * u * (c[1][0] - c[0][0]) + 6 * u * t * (c[2][0] - c[1][0]) + 3 * t * t * (c[3][0] - c[2][0]);
  const dy = 3 * u * u * (c[1][1] - c[0][1]) + 6 * u * t * (c[2][1] - c[1][1]) + 3 * t * t * (c[3][1] - c[2][1]);
  return Math.hypot(dx, dy);
}

/** The outline's length: Simpson's rule on each piece's speed, close to getTotalLength(). */
export function pathLength(cubics: readonly Cubic[]): number {
  const N = 32;
  let total = 0;
  for (const c of cubics) {
    let s = speedAt(c, 0) + speedAt(c, 1);
    for (let k = 1; k < N; k++) s += speedAt(c, k / N) * (k % 2 ? 4 : 2);
    total += s / (3 * N);
  }
  return total;
}

// ── Numbers ─────────────────────────────────────────────────────────────────

/** Rounded to `dec` places, written as short as it goes: 200, 12.5, never -0. */
export function fmt(n: number, dec: number): string {
  const v = Number(n.toFixed(dec));
  return Object.is(v, -0) ? '0' : String(v);
}

/** One decimal is a tenth of a px at 200 px and up; smaller blobs get two. */
export const decimalsFor = (size: number) => (size >= 200 ? 1 : 2);

const pt = (p: Pt, dec: number) => `${fmt(p[0], dec)},${fmt(p[1], dec)}`;

/** The path data: M at the first point, one C per point, Z. */
export function pathData(cubics: readonly Cubic[], dec: number): string {
  if (!cubics.length) return '';
  const cs = cubics.map((c) => `C${pt(c[1], dec)} ${pt(c[2], dec)} ${pt(c[3], dec)}`);
  return `M${pt(cubics[0][0], dec)} ${cs.join(' ')} Z`;
}

/** The same path data, one command per line, for an SVG file people will read. */
export function pathDataLines(cubics: readonly Cubic[], dec: number): string[] {
  if (!cubics.length) return [];
  return [`M${pt(cubics[0][0], dec)}`, ...cubics.map((c) => `C${pt(c[1], dec)} ${pt(c[2], dec)} ${pt(c[3], dec)}`), 'Z'];
}

// ── A whole blob ────────────────────────────────────────────────────────────

export type BlobGeometry = {
  size: number;
  /** The centre, in px: the middle of the box. */
  c: number;
  /** px per unit radius: the longest possible spoke (radius 1) is this long. */
  scale: number;
  /** The unit radii the seed gave. */
  radii: number[];
  /** The spokes' ends, in px. */
  points: Pt[];
  cubics: Cubic[];
  d: string;
  length: number;
};

/** The margin inside the box: 5% of it, plus half the line so an outline is not cut off. */
export const padFor = (size: number, line: number) => size * 0.05 + line / 2;

/**
 * A blob from unit radii, fitted to the box: the centre stays in the middle and
 * the whole shape is scaled so the curve's farthest point from the centre is
 * `pad` inside the edge. (The curve bulges past its points, so the points alone
 * would not do.) Fitting is continuous in the radii, so a morph stays smooth.
 */
export function blobFromRadii(radii: readonly number[], size: number, line: number): BlobGeometry {
  const unit = closedCatmullRom(polarPoints(radii, 0, 0));
  let far = 0;
  for (const c of unit) {
    for (let k = 0; k <= 24; k++) {
      const [x, y] = bezierAt(c, k / 24);
      far = Math.max(far, Math.hypot(x, y));
    }
  }
  const c = size / 2;
  const scale = far > 0 ? (c - padFor(size, line)) / far : 0;
  const points = polarPoints(radii.map((r) => r * scale), c, c);
  const cubics = closedCatmullRom(points);
  return { size, c, scale, radii: [...radii], points, cubics, d: pathData(cubics, decimalsFor(size)), length: pathLength(cubics) };
}

export function blobGeometry(s: Pick<BlobSettings, 'seed' | 'points' | 'randomness' | 'size' | 'line'>): BlobGeometry {
  return blobFromRadii(blobRadii(s.seed, s.points, s.randomness), s.size, s.line);
}

/** The path's commands, counted: "M · 6 × C · Z". */
export const commandSummary = (n: number) => `M · ${n} × C · Z`;

/** Keep a setting in range and on its step. */
export function clampSettings(s: BlobSettings): BlobSettings {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return {
    ...s,
    points: Math.round(clamp(s.points, MIN_POINTS, MAX_POINTS)),
    randomness: clamp(s.randomness, 0, MAX_RANDOMNESS),
    size: Math.round(clamp(s.size, MIN_SIZE, MAX_SIZE)),
    seed: Math.round(clamp(s.seed, 1, MAX_SEED)),
    line: clamp(s.line, MIN_LINE, MAX_LINE),
  };
}
