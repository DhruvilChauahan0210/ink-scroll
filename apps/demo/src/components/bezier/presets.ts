import { EXACT_CSS } from '@/data/easing';
import { CSS_KEYWORDS, bezierEasing, exactCubic, parseBezier, type Bezier } from './bezier';

/**
 * The curves the generator starts from:
 *
 * - css: the five CSS keywords, as CSS Easing Functions Level 1 defines them.
 * - lib: svg-scroll-draw's own ease-in and ease-out, which are quadratics
 *   (t² and t(2 − t), core/easing.ts:105-106) and exactly these cubic-béziers
 *   (core/css-easing.ts:35-36, copied in data/easing.ts as EXACT_CSS).
 * - named: Robert Penner's easing equations as the cubic-béziers usually
 *   published for them, each with its equation, so the page can say how far
 *   the cubic-bezier is from the curve it is named after.
 */

export type Group = 'css' | 'lib' | 'named';
export type Preset = {
  key: string;
  name: string;
  group: Group;
  v: Bezier;
  /** The named curve's own equation; for lib, the library's easing. */
  f?: (t: number) => number;
  family?: string;
  /** How the formula is written, for the table. */
  formula?: string;
  /**
   * When the equation is a cubic polynomial c1·t + c2·t² + (1 − c1 − c2)·t³,
   * its c1 and c2: then a cubic-bezier is it exactly (exactCubic).
   */
  poly?: readonly [number, number];
};

const libValue = (name: 'ease-in' | 'ease-out'): Bezier => {
  const p = parseBezier(EXACT_CSS[name] ?? '');
  if (!p.ok) throw new Error(`EXACT_CSS['${name}'] is not a cubic-bezier`);
  return p.value;
};

const CSS: Preset[] = (['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear'] as const).map((k) => ({
  key: `css:${k}`,
  name: k,
  group: 'css',
  v: CSS_KEYWORDS[k],
}));

const LIB: Preset[] = [
  { key: 'lib:ease-in', name: 'ease-in', group: 'lib', v: libValue('ease-in'), f: (t) => t * t, formula: 't²' },
  { key: 'lib:ease-out', name: 'ease-out', group: 'lib', v: libValue('ease-out'), f: (t) => t * (2 - t), formula: 't(2 − t)' },
];

// Penner's equations, in the forms easings.net writes them.
const C1 = 1.70158;
const C2 = C1 * 1.525;
const C3 = C1 + 1;
const pow = Math.pow;
type Fn = (t: number) => number;
type Poly = readonly [number, number] | undefined;
type Family = { family: string; formula: string; v: [Bezier, Bezier, Bezier]; f: [Fn, Fn, Fn]; poly?: [Poly, Poly, Poly] };

const FAMILIES: Family[] = [
  {
    family: 'Sine', formula: 'sin / cos of t·π/2',
    v: [[0.12, 0, 0.39, 0], [0.61, 1, 0.88, 1], [0.37, 0, 0.63, 1]],
    f: [(t) => 1 - Math.cos((t * Math.PI) / 2), (t) => Math.sin((t * Math.PI) / 2), (t) => -(Math.cos(Math.PI * t) - 1) / 2],
  },
  {
    family: 'Quad', formula: 't²',
    v: [[0.11, 0, 0.5, 0], [0.5, 1, 0.89, 1], [0.45, 0, 0.55, 1]],
    f: [(t) => t * t, (t) => 1 - (1 - t) * (1 - t), (t) => (t < 0.5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2)],
    // t² and 2t − t².
    poly: [[0, 1], [2, -1], undefined],
  },
  {
    family: 'Cubic', formula: 't³',
    v: [[0.32, 0, 0.67, 0], [0.33, 1, 0.68, 1], [0.65, 0, 0.35, 1]],
    f: [(t) => t * t * t, (t) => 1 - pow(1 - t, 3), (t) => (t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2)],
    // t³ and 3t − 3t² + t³.
    poly: [[0, 0], [3, -3], undefined],
  },
  {
    family: 'Quart', formula: 't⁴',
    v: [[0.5, 0, 0.75, 0], [0.25, 1, 0.5, 1], [0.76, 0, 0.24, 1]],
    f: [(t) => pow(t, 4), (t) => 1 - pow(1 - t, 4), (t) => (t < 0.5 ? 8 * pow(t, 4) : 1 - pow(-2 * t + 2, 4) / 2)],
  },
  {
    family: 'Quint', formula: 't⁵',
    v: [[0.64, 0, 0.78, 0], [0.22, 1, 0.36, 1], [0.83, 0, 0.17, 1]],
    f: [(t) => pow(t, 5), (t) => 1 - pow(1 - t, 5), (t) => (t < 0.5 ? 16 * pow(t, 5) : 1 - pow(-2 * t + 2, 5) / 2)],
  },
  {
    family: 'Expo', formula: '2^(10t − 10)',
    v: [[0.7, 0, 0.84, 0], [0.16, 1, 0.3, 1], [0.87, 0, 0.13, 1]],
    f: [
      (t) => (t === 0 ? 0 : pow(2, 10 * t - 10)),
      (t) => (t === 1 ? 1 : 1 - pow(2, -10 * t)),
      (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? pow(2, 20 * t - 10) / 2 : (2 - pow(2, -20 * t + 10)) / 2),
    ],
  },
  {
    family: 'Circ', formula: '1 − √(1 − t²)',
    v: [[0.55, 0, 1, 0.45], [0, 0.55, 0.45, 1], [0.85, 0, 0.15, 1]],
    f: [
      (t) => 1 - Math.sqrt(1 - t * t),
      (t) => Math.sqrt(1 - pow(t - 1, 2)),
      (t) => (t < 0.5 ? (1 - Math.sqrt(1 - pow(2 * t, 2))) / 2 : (Math.sqrt(1 - pow(-2 * t + 2, 2)) + 1) / 2),
    ],
  },
  {
    family: 'Back', formula: '2.70158t³ − 1.70158t²',
    v: [[0.36, 0, 0.66, -0.56], [0.34, 1.56, 0.64, 1], [0.68, -0.6, 0.32, 1.6]],
    f: [
      (t) => C3 * t * t * t - C1 * t * t,
      (t) => 1 + C3 * pow(t - 1, 3) + C1 * pow(t - 1, 2),
      (t) => (t < 0.5 ? (pow(2 * t, 2) * ((C2 + 1) * 2 * t - C2)) / 2 : (pow(2 * t - 2, 2) * ((C2 + 1) * (t * 2 - 2) + C2) + 2) / 2),
    ],
    // C3·t³ − C1·t², and 1 + C3(t − 1)³ + C1(t − 1)² multiplied out.
    poly: [[0, -C1], [3 * C3 - 2 * C1, -3 * C3 + C1], undefined],
  },
];

const KINDS = ['In', 'Out', 'InOut'] as const;

const NAMED: Preset[] = FAMILIES.flatMap((fam) =>
  KINDS.map((kind, i) => ({
    key: `named:ease${kind}${fam.family}`,
    name: `ease${kind}${fam.family}`,
    group: 'named' as const,
    v: fam.v[i],
    f: fam.f[i],
    family: fam.family,
    formula: fam.formula,
    poly: fam.poly?.[i],
  })),
);

export const PRESETS: Preset[] = [...CSS, ...LIB, ...NAMED];
export const CSS_PRESETS = CSS;
export const LIB_PRESETS = LIB;
export const NAMED_PRESETS = NAMED;
export const FAMILY_NAMES = FAMILIES.map((f) => f.family);

export const presetByKey = (key: string) => PRESETS.find((p) => p.key === key);

/** The cubic-bezier that is the preset's equation exactly, when its equation is a cubic polynomial. */
export const exactOf = (p: Preset): Bezier | null => (p.poly ? exactCubic(p.poly[0], p.poly[1]) : null);

/** How the preset is written in a list: the library's names say whose they are. */
export const presetLabel = (p: Preset) =>
  p.group === 'css' ? `${p.name} (CSS)` : p.group === 'lib' ? `${p.name} · ${p.formula} (svg-scroll-draw)` : p.name;

/**
 * The largest gap between a preset's cubic-bezier and the curve it stands for,
 * sampled at n + 1 times: how good the published approximation is.
 */
export function gapOf(p: Preset, n = 4000): { gap: number; at: number } {
  if (!p.f) return { gap: 0, at: 0 };
  const g = bezierEasing(p.v);
  let gap = 0, at = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const e = Math.abs(g(t) - p.f(t));
    if (e > gap) { gap = e; at = t; }
  }
  return { gap, at };
}

/** The largest gap between two cubic-béziers, sampled the same way. */
export function gapBetween(a: Bezier, b: Bezier | ((t: number) => number), n = 4000): { gap: number; at: number } {
  const fa = bezierEasing(a);
  const fb = typeof b === 'function' ? b : bezierEasing(b);
  let gap = 0, at = 0;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const e = Math.abs(fa(t) - fb(t));
    if (e > gap) { gap = e; at = t; }
  }
  return { gap, at };
}

/** A small number written so "within" is never an understatement: rounded up at its first significant digit. */
export function ceil1(n: number): string {
  if (!(n > 0)) return '0';
  const e = Math.floor(Math.log10(n));
  const m = Math.ceil(n / 10 ** e - 1e-9);
  // 0.0099999 rounds up to 0.010: write it as 0.01.
  const s = e >= 0 ? String(m * 10 ** e) : (m * 10 ** e).toFixed(-e);
  return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s;
}
