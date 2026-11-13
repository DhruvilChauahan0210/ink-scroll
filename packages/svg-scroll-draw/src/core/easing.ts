import type { Easing, EasingName } from './types';
import { warn } from './env';

// ── Easing factories ─────────────────────────────────────────────────────────

/**
 * Returns a custom spring easing function.
 * - `tension` controls oscillation frequency (default 2.5 — higher = more bouncy)
 * - `friction` controls damping (default 2.2 — higher = less bouncy)
 *
 * @example
 * scrollDraw('#svg', { easing: createSpring({ tension: 3, friction: 1.8 }) });
 */
export function createSpring({
  tension = 2.5,
  friction = 2.2,
}: { tension?: number; friction?: number } = {}): (t: number) => number {
  return (t: number) => 1 - Math.cos(t * Math.PI * tension) * Math.pow(1 - t, friction);
}

/**
 * Returns a bounce-out easing function.
 * The animation rises to 1 and then makes `bounces − 1` dips below 1 that settle:
 * the rise is the first of the `bounces` segments.
 * - `bounces` — segments, the first rise included (default 3: a rise, then 2 dips)
 * - `decay`   — amplitude reduction per bounce (0–1, default 0.5)
 *
 * @example
 * scrollDraw('#svg', { easing: createBounce() });
 * scrollDraw('#svg', { easing: createBounce({ bounces: 5, decay: 0.4 }) });
 */
export function createBounce({
  bounces = 3,
  decay = 0.5,
}: { bounces?: number; decay?: number } = {}): (t: number) => number {
  const n = Math.max(1, Math.round(bounces));
  const d = Math.max(0.01, Math.min(0.99, decay));
  const sqrtD = Math.sqrt(d);

  // Segment time widths proportional to sqrtD^i so that
  // higher-amplitude (earlier) bounces get more time.
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

  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    for (let i = 0; i < n; i++) {
      if (t <= boundaries[i + 1]) {
        const u = (t - boundaries[i]) / (boundaries[i + 1] - boundaries[i]);
        if (i === 0) {
          // Initial approach: ease-out quadratic (0 → 1)
          return u * (2 - u);
        }
        // Bounce i: upward parabola from 1 → trough → 1
        // trough = 1 - d^i, so each successive bounce dips less
        const trough = 1 - Math.pow(d, i);
        return trough + (1 - trough) * (2 * u - 1) * (2 * u - 1);
      }
    }
    return 1;
  };
}

/**
 * Returns an elastic-out easing function.
 * The animation overshoots past 1 and oscillates back, settling at 1.
 * Can produce values outside [0, 1] — the overshoot is the effect.
 * - `amplitude` — overshoot magnitude (>=1, default 1 → overshoots to ~1.25)
 * - `period`    — oscillation period in [0, 1] time (default 0.4)
 *
 * @example
 * scrollDraw('#svg', { easing: createElastic() });
 * scrollDraw('#svg', { easing: createElastic({ amplitude: 1.5, period: 0.3 }) });
 */
export function createElastic({
  amplitude = 1,
  period = 0.4,
}: { amplitude?: number; period?: number } = {}): (t: number) => number {
  const a = Math.max(1, amplitude);
  const p = Math.max(0.1, period);
  // Phase shift so that f(0) = 0 exactly.
  const s = a <= 1 ? p / 4 : (p / (2 * Math.PI)) * Math.asin(1 / a);

  return (t: number): number => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    return a * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
  };
}

// ── Named easing map (used by the engine for string easing values) ────────────

export const EASINGS: Record<string, (t: number) => number> = {
  linear:        (t) => t,
  'ease-in':     (t) => t * t,
  'ease-out':    (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  // createSpring's defaults, the same arithmetic in the same order.
  spring:        createSpring(),
  bounce:        createBounce(),
  elastic:       createElastic(),
};

// ── CSS timing functions (2.26.0+) ───────────────────────────────────────────
//
// Every engine used to resolve a string with `EASINGS[easing] ?? fallback`, so
// `easing: 'cubic-bezier(.2,.8,.2,1)'` (what anyone coming from CSS writes) and
// a typo like 'easeOut' both quietly ran as the fallback curve. resolveEasing
// is the one place a string becomes a curve: a name, then a CSS timing function,
// then a dev warning and the fallback.
//
// The library's own names win. Its 'ease-in', 'ease-out' and 'ease-in-out' are
// quadratics, not the CSS keywords' béziers (core/css-easing), and stay that
// way; only strings that are not names are read as CSS.

type Ease = (t: number) => number;

/**
 * CSS `cubic-bezier(x1, y1, x2, y2)`: y at the parameter u where x(u) = x.
 * Eight Newton steps from u = x; where they do not land in [0, 1] within 1e-9
 * of x (a slope near 0 throws them off), 30 bisection steps on [0, 1] do, since
 * x(u) is monotonic there whenever x1 and x2 are in [0, 1]. Within 1e-5 of the
 * curve everywhere (the unit tests' bound), far below a pixel.
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number): Ease {
  // One coordinate at u, the Bernstein form expanded: ((1+3a-3b)u + 3b-6a)u² + 3au.
  const at = (a: number, b: number, u: number) => ((1 + 3 * a - 3 * b) * u + 3 * b - 6 * a) * u * u + 3 * a * u;
  return (x) => {
    // The ends exactly: engines complete on alpha >= 1.
    if (x <= 0 || x >= 1) return +(x > 0);
    let u = x;
    for (let i = 0; i < 8; i++)
      u -= (at(x1, x2, u) - x) / ((3 * (1 + 3 * x1 - 3 * x2) * u + 6 * x2 - 12 * x1) * u + 3 * x1);
    if (!(u >= 0 && u <= 1 && Math.abs(at(x1, x2, u) - x) < 1e-9))
      for (let i = 0, lo = 0, hi = 1; i < 30; i++) {
        u = (lo + hi) / 2;
        if (at(x1, x2, u) < x) lo = u;
        else hi = u;
      }
    return at(y1, y2, u);
  };
}

/**
 * A CSS timing function string as [the curve, the same function as CSS the
 * native paths can hand the browser], or undefined when it is not one:
 * `cubic-bezier()`, and `ease`, the one CSS keyword the names above do not
 * already claim. (Not `steps()`: rare in a scroll animation, so a steps()
 * string warns like any other unknown easing.)
 */
export function cssEasing(s: string): [Ease, string] | undefined {
  const m = /^cubic-bezier\((.*)\)$/.exec(s === 'ease' ? 'cubic-bezier(.25,.1,.25,1)' : s.trim());
  // parseFloat, not Number: an empty argument is NaN, not 0.
  const v = m ? m[1].split(',').map(parseFloat) : [];
  // x(1 - x) >= 0 is x in [0, 1].
  if (v.length === 4 && v.every(Number.isFinite) && v[0] * (1 - v[0]) >= 0 && v[2] * (1 - v[2]) >= 0)
    return [cubicBezier(v[0], v[1], v[2], v[3]), `cubic-bezier(${v})`];
}

const warned = new Set<unknown>();

/**
 * The curve an `easing` option names: a function as is, a library name, or a
 * CSS `cubic-bezier()` / `ease`. Anything else warns once in development and
 * runs as `fallback`, the engine's default easing.
 */
export function resolveEasing(easing: Easing | undefined, fallback: EasingName = 'linear'): Ease {
  if (typeof easing === 'function') return easing;
  if (easing == null) return EASINGS[fallback];
  if ({}.hasOwnProperty.call(EASINGS, easing)) return EASINGS[easing];
  const css = cssEasing(String(easing));
  if (css) return css[0];
  if (!warned.has(easing) && warned.add(easing))
    warn(`Unknown easing ${JSON.stringify(easing)}: use a name, cubic-bezier() or a function.`);
  return EASINGS[fallback];
}
