/**
 * What the easing visualizer (/easing-visualizer) shows, all of it
 * svg-scroll-draw's own (packages/svg-scroll-draw/src/core/easing.ts): the
 * seven keys of EASINGS, in its order, and the three factories with their
 * parameters, defaults and clamps.
 *
 * The functions here are copies of the library's, line for line, so a Server
 * Component can draw them without loading the library. The visualizer itself
 * swaps in the library's own createSpring / createBounce / createElastic once
 * its dynamic import has loaded, and its drawn preview is always eased by the
 * library: a copy that drifted would show as the marker leaving the curve.
 */

export type Curve = (t: number) => number;

export const EASING_NAMES = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'spring', 'bounce', 'elastic'] as const;
export type EasingName = (typeof EASING_NAMES)[number];

// ── The library's maths, copied (core/easing.ts) ────────────────────────────

/** createSpring, core/easing.ts:11. */
export function springCurve({ tension = 2.5, friction = 2.2 }: { tension?: number; friction?: number } = {}): Curve {
  return (t) => 1 - Math.cos(t * Math.PI * tension) * Math.pow(1 - t, friction);
}

/** createBounce, core/easing.ts:28. */
export function bounceCurve({ bounces = 3, decay = 0.5 }: { bounces?: number; decay?: number } = {}): Curve {
  const n = Math.max(1, Math.round(bounces));
  const d = Math.max(0.01, Math.min(0.99, decay));
  const sqrtD = Math.sqrt(d);
  let totalW = 0;
  const rawWidths: number[] = [];
  for (let i = 0; i < n; i++) {
    const w = Math.pow(sqrtD, i);
    rawWidths.push(w);
    totalW += w;
  }
  const boundaries = [0];
  let cum = 0;
  for (let i = 0; i < n; i++) {
    cum += rawWidths[i] / totalW;
    boundaries.push(cum);
  }
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    for (let i = 0; i < n; i++) {
      if (t <= boundaries[i + 1]) {
        const u = (t - boundaries[i]) / (boundaries[i + 1] - boundaries[i]);
        if (i === 0) return u * (2 - u);
        const trough = 1 - Math.pow(d, i);
        return trough + (1 - trough) * (2 * u - 1) * (2 * u - 1);
      }
    }
    return 1;
  };
}

/** createElastic, core/easing.ts:84. */
export function elasticCurve({ amplitude = 1, period = 0.4 }: { amplitude?: number; period?: number } = {}): Curve {
  const a = Math.max(1, amplitude);
  const p = Math.max(0.1, period);
  const s = a <= 1 ? p / 4 : (p / (2 * Math.PI)) * Math.asin(1 / a);
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return a * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
  };
}

/** EASINGS, core/easing.ts:102. 'spring' is createSpring() at its defaults, the others are the factories' own. */
export const NAMED: Record<EasingName, Curve> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  spring: springCurve(),
  bounce: bounceCurve(),
  elastic: elasticCurve(),
};

/** What each named easing is, for the reference table. */
export const NAMED_INFO: Record<EasingName, { formula: string; d: string }> = {
  linear: { formula: 't', d: 'Progress out equals progress in: the same speed all the way.' },
  'ease-in': { formula: 't²', d: 'Starts slow and speeds up, arriving at full speed.' },
  'ease-out': { formula: 't(2 − t)', d: 'Starts fast and slows to a stop. Reads as settling into place.' },
  'ease-in-out': { formula: '2t² to ½, then −1 + (4 − 2t)t', d: 'Slow at both ends, fastest in the middle, exactly half way at 0.5.' },
  spring: { formula: '1 − cos(2.5πt)(1 − t)^2.2', d: 'Runs past 1 and swings back, like a spring letting go. createSpring() at its defaults.' },
  bounce: { formula: 'rise, then 2 dips', d: 'Reaches 1, falls back to 0.5, then 0.75, landing at 1. Never goes past 1. createBounce() at its defaults.' },
  elastic: { formula: '2^(−10t) sin(…) + 1', d: 'Shoots past 1 early and rings down to it. createElastic() at its defaults.' },
};

/**
 * The CSS timing function for a named easing where one is exact, as the
 * library's own native path writes it (core/css-easing.ts:35-36, :84): the two
 * quadratics are cubic-béziers with x controls at 1/3 and 2/3. The rest have
 * no closed CSS form and are written as linear().
 */
export const EXACT_CSS: Partial<Record<EasingName, string>> = {
  linear: 'linear',
  'ease-in': 'cubic-bezier(0.333333, 0, 0.666667, 0.333333)',
  'ease-out': 'cubic-bezier(0.333333, 0.666667, 0.666667, 1)',
};

/** The named easings scrollDraw and scrollAnimate can hand to the browser's native scroll timeline (cssTimingFor, core/css-easing.ts:84). */
export const NATIVE_EASINGS: readonly EasingName[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out'];

// ── The factories ───────────────────────────────────────────────────────────

export const FACTORY_KEYS = ['spring', 'bounce', 'elastic'] as const;
export type FactoryKey = (typeof FACTORY_KEYS)[number];

export type ParamSpec = { k: string; def: number; min: number; max: number; step: number; d: string };

export const FACTORIES: Record<FactoryKey, { fn: string; params: readonly [ParamSpec, ParamSpec]; d: string }> = {
  spring: {
    fn: 'createSpring',
    d: 'Frequency and damping of the swing past 1.',
    params: [
      { k: 'tension', def: 2.5, min: 0.5, max: 6, step: 0.1, d: 'How many half-swings fit in the run. Higher swings more often.' },
      { k: 'friction', def: 2.2, min: 0.2, max: 5, step: 0.1, d: 'How fast the swing dies away. Higher settles sooner and overshoots less.' },
    ],
  },
  bounce: {
    fn: 'createBounce',
    d: 'How many times it lands, and how far it falls back each time.',
    params: [
      { k: 'bounces', def: 3, min: 1, max: 8, step: 1, d: 'Rounded to a whole number, at least 1. It counts the first rise: 3 is the rise and two dips.' },
      { k: 'decay', def: 0.5, min: 0.05, max: 0.95, step: 0.05, d: 'Dip i falls back to 1 − decay^i. Kept between 0.01 and 0.99.' },
    ],
  },
  elastic: {
    fn: 'createElastic',
    d: 'How far past 1 it shoots, and how fast it rings.',
    params: [
      { k: 'amplitude', def: 1, min: 1, max: 2, step: 0.05, d: 'Higher shoots further past 1, and sooner. Values under 1 count as 1.' },
      { k: 'period', def: 0.4, min: 0.1, max: 1, step: 0.01, d: 'Length of one oscillation, as a fraction of the run. Values under 0.1 count as 0.1.' },
    ],
  },
};

/** The factory's curve from the copies above. */
export function factoryCurve(key: FactoryKey, a: number, b: number): Curve {
  if (key === 'spring') return springCurve({ tension: a, friction: b });
  if (key === 'bounce') return bounceCurve({ bounces: a, decay: b });
  return elasticCurve({ amplitude: a, period: b });
}

// ── Where easing goes ───────────────────────────────────────────────────────

/**
 * The ten functions that take an `easing` option, with its default, read from
 * each one's options (file:line in packages/svg-scroll-draw/src). scrollTimeline
 * tracks, scrollDrawGroup, Cinematic and <scroll-draw> take one too, and are
 * left out here.
 */
export const EASING_APIS: { api: string; entry: string; def: EasingName; drives: string; src: string }[] = [
  { api: 'scrollDraw', entry: 'svg-scroll-draw', def: 'linear', drives: 'the drawn length', src: 'core/engine.ts:186' },
  { api: 'scrollAnimate', entry: 'svg-scroll-draw', def: 'ease-out', drives: 'every prop, from → to', src: 'animate/engine.ts:190' },
  { api: 'scrollParallax', entry: 'svg-scroll-draw', def: 'linear', drives: 'the travel', src: 'animate/index.ts:56' },
  { api: 'scrollCounter', entry: 'svg-scroll-draw', def: 'ease-out', drives: 'the number', src: 'counter/index.ts:51' },
  { api: 'scrollReveal', entry: 'svg-scroll-draw/reveal', def: 'ease-out', drives: 'each element’s reveal', src: 'reveal/index.ts:195' },
  { api: 'scrollText', entry: 'svg-scroll-draw/text', def: 'ease-out', drives: 'each word, letter or line', src: 'text/index.ts:188' },
  { api: 'scrollProgress', entry: 'svg-scroll-draw/progress', def: 'linear', drives: '--scroll-progress-eased only (--scroll-progress stays raw)', src: 'progress/index.ts:73, 121-123' },
  { api: 'scrollVideo', entry: 'svg-scroll-draw/video', def: 'linear', drives: 'the video time', src: 'video/index.ts:61' },
  { api: 'scrollHorizontal', entry: 'svg-scroll-draw/horizontal', def: 'linear', drives: 'the sideways travel', src: 'horizontal/index.ts:108' },
  { api: 'scrollSnap', entry: 'svg-scroll-draw/snap', def: 'ease-in-out', drives: 'the glide to a section, over time', src: 'snap/index.ts:75' },
];

// ── Measuring a curve ───────────────────────────────────────────────────────

export type CurveStats = { max: number; maxAt: number; min: number; minAt: number; reaches: number; after: number };

/**
 * Highest and lowest value and where; the first t at which it reaches 1
 * (within 1e-6); and the lowest value after that, which is under 1 when the
 * curve falls back (bounce, and spring and elastic after their overshoot).
 */
export function curveStats(f: Curve, n = 2000): CurveStats {
  let max = -Infinity, maxAt = 0, min = Infinity, minAt = 0, reaches = 1, after = 1;
  let found = false;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const v = f(t);
    if (v > max) { max = v; maxAt = t; }
    if (v < min) { min = v; minAt = t; }
    if (!found && v >= 1 - 1e-6) { reaches = t; found = true; }
    if (found) after = Math.min(after, v);
  }
  return { max, maxAt, min, minAt, reaches, after };
}

/** Samples of f as an SVG polyline in a box: x from t, y from the value, inside [lo, hi]. */
export function curvePath(f: Curve, box: { x: number; y: number; w: number; h: number }, lo: number, hi: number, n = 240): string {
  const out: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = box.x + t * box.w;
    const y = box.y + (1 - (f(t) - lo) / (hi - lo)) * box.h;
    out.push(`${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`);
  }
  return out.join('');
}

export const r2 = (n: number) => Math.round(n * 100) / 100;

/** A number for display: at most `d` decimals, no trailing zeros, no "-0". */
export function num(n: number, d = 2): string {
  const s = n.toFixed(d).replace(/\.?0+$/, '');
  return s === '-0' ? '0' : s;
}

// ── A curve as CSS linear() ─────────────────────────────────────────────────

/**
 * f as a CSS linear() timing function: f sampled every 0.005% of the run, then
 * thinned to the fewest points whose straight segments stay within `tol` of
 * every sample (Ramer–Douglas–Peucker, measured vertically, since the error
 * that matters is in progress, not along the curve).
 *
 * The error is measured again on what is written (the rounded stops) against
 * f on a grid four times finer than the one the stops came from, so the
 * corners between samples count too (on a 2000-sample grid a createBounce({
 * bounces: 8, decay: 0.95 }) reported 0.0013 while missing its landings by
 * 0.0068), plus points closing in on 0 and 1 down to 1e-12. `error` is the
 * largest gap up to 99.9% of the run, `tailError` the largest after it: a
 * spring with friction under 1 rises to 1 with a vertical tangent in its last
 * instant, which no list of points can follow, so its tail is far off while
 * the rest is within `tol`.
 */
export function linearCss(f: Curve, tol = 0.002, n = 20000): { stops: [number, number][]; error: number; tailError: number } {
  const ys = new Float64Array(n + 1);
  for (let i = 0; i <= n; i++) ys[i] = f(i / n);
  const keep = new Uint8Array(n + 1);
  keep[0] = 1;
  keep[n] = 1;
  const stack: [number, number][] = [[0, n]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const slope = (ys[b] - ys[a]) / (b - a);
    let worst = 0, at = -1;
    for (let i = a + 1; i < b; i++) {
      const e = Math.abs(ys[i] - (ys[a] + slope * (i - a)));
      if (e > worst) { worst = e; at = i; }
    }
    if (worst > tol && at > 0) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  // x as a percentage to 3 decimals (the grid is 0.005%), y to 4.
  const stops: [number, number][] = [];
  for (let i = 0; i <= n; i++) if (keep[i]) stops.push([Math.round((i / n) * 1e5) / 1e3, Math.round(ys[i] * 1e4) / 1e4]);
  // What the written linear() gives at t, in segment k (stops[k] to stops[k + 1]).
  const xs = stops.map((s) => s[0]);
  const written = (t: number, k: number) => {
    const [x0, y0] = stops[k];
    const [x1, y1] = stops[k + 1];
    return x1 === x0 ? y1 : y0 + ((y1 - y0) * (t * 100 - x0)) / (x1 - x0);
  };
  let error = 0, tailError = 0;
  const check = (t: number, k: number) => {
    const e = Math.abs(f(t) - written(t, k));
    if (t > 0.999) tailError = Math.max(tailError, e);
    else error = Math.max(error, e);
  };
  const m = n * 4;
  for (let i = 0, k = 0; i <= m; i++) {
    while (k < xs.length - 2 && xs[k + 1] < (i / m) * 100) k++;
    check(i / m, k);
  }
  // Closing in on each end, where a curve can turn faster than any grid.
  for (let j = 40; j <= 120; j++) {
    const d = 10 ** (-j / 10);
    let a = 0;
    while (a < xs.length - 2 && xs[a + 1] < d * 100) a++;
    let b = xs.length - 2;
    while (b > 0 && xs[b] > (1 - d) * 100) b--;
    check(d, a);
    check(1 - d, b);
  }
  return { stops, error, tailError };
}

/** The stops as written inside linear( … ), a few to a line. */
export function linearText(stops: [number, number][], perLine = 5, indent = '    '): string {
  const parts = stops.map(([x, y], i) => (i === 0 || i === stops.length - 1 ? num(y, 4) : `${num(y, 4)} ${num(x, 3)}%`));
  const lines: string[] = [];
  for (let i = 0; i < parts.length; i += perLine) lines.push(indent + parts.slice(i, i + perLine).join(', '));
  return lines.join(',\n');
}
