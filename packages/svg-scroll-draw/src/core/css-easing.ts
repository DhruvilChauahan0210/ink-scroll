import { EASINGS } from './utils';

/**
 * CSS timing functions that reproduce this library's own easing curves.
 *
 * Both native fast paths — `scrollDraw`'s in core/engine and `scrollAnimate`'s
 * in animate — used to hand CSS the *keyword* of the same name: JS `'ease-out'`
 * became `animation-timing-function: ease-out`, under a comment claiming a "1:1
 * CSS timing-function".
 *
 * It is not 1:1, and it is not close. This library's `ease-in` / `ease-out` are
 * quadratics (`t²` and `t(2-t)`); the CSS keywords are the fixed cubic-béziers
 * `(0.42,0,1,1)` and `(0,0,0.58,1)`. They differ by up to **0.069** — nearly 7
 * points of progress mid-scroll. Since the fast path only engages where the
 * browser supports `animation-timeline: view()`, that meant the same page
 * animated one way in Chrome and Firefox and a measurably different way in
 * Safari, which always falls back to the JS engine. `scrollAnimate` defaults to
 * `ease-out`, so this was the *default* configuration, not an exotic one.
 *
 * The fix is to emit a timing function that actually matches the JS curve.
 */

/**
 * `t²` and `t(2-t)`, exactly, as cubic-béziers.
 *
 * A cubic-bézier timing function with x-control points at 1/3 and 2/3 has
 * `x(t) = t` exactly, so `y(t)` is the curve itself:
 *
 *   y(t) = 3·y₁·t(1-t)² + 3·y₂·t²(1-t) + t³
 *
 * Matching coefficients against `t²` gives (y₁, y₂) = (0, 1/3); against
 * `2t - t²` it gives (2/3, 1). Both reproduce the JS easing to within 3e-7 —
 * verified by sampling, not by eye.
 */
const QUAD_IN = 'cubic-bezier(0.333333, 0, 0.666667, 0.333333)';
const QUAD_OUT = 'cubic-bezier(0.333333, 0.666667, 0.666667, 1)';

/**
 * How many points to sample a curve at when it has no closed CSS form.
 *
 * `ease-in-out` is piecewise quadratic — its second derivative jumps sign at
 * t=0.5 — so no single cubic-bézier can express it. `linear()` can: it is a
 * piecewise-linear interpolation through the stops given. Error is bounded by
 * max|f''|·h²/8, which at 33 stops is 4.9e-4 — two orders of magnitude inside
 * the tolerance the parity tests hold the two engines to.
 */
const LINEAR_STOPS = 33;

/**
 * `linear()` landed in Chrome 113 and Firefox 112, both earlier than the
 * `animation-timeline: view()` support that gates the fast path in the first
 * place, so in practice this is always true where it is asked. It is still
 * checked rather than assumed: returning `null` costs a caller nothing but the
 * fast path, while guessing wrong would produce an invalid declaration and no
 * animation at all.
 */
function supportsLinearTiming(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('animation-timing-function: linear(0, 1)')
  );
}

function sampleAsLinear(fn: (t: number) => number): string {
  const stops: string[] = [];
  for (let i = 0; i < LINEAR_STOPS; i++) {
    const t = i / (LINEAR_STOPS - 1);
    stops.push(String(Math.round(fn(t) * 1e5) / 1e5));
  }
  return `linear(${stops.join(',')})`;
}

/**
 * The CSS timing function equivalent to a named easing, or `null` when there
 * is none — in which case the caller must stay on the JS engine rather than
 * substitute a curve the user did not ask for.
 *
 * Only the four named easings that had a (wrong) mapping before are handled.
 * `spring`, `bounce`, `elastic` and function easings deliberately return null:
 * `linear()` could sample those too, but widening which configurations take the
 * fast path is a behaviour change, not a correctness fix.
 */
export function cssTimingFor(easing: string): string | null {
  switch (easing) {
    case 'linear':
      return 'linear';
    case 'ease-in':
      return QUAD_IN;
    case 'ease-out':
      return QUAD_OUT;
    case 'ease-in-out':
      return supportsLinearTiming() ? sampleAsLinear(EASINGS['ease-in-out']) : null;
    default:
      return null;
  }
}
