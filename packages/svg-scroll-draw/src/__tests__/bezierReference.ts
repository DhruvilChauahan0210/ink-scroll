/**
 * An independent CSS cubic-bezier() for the engine tests: 200 bisection steps
 * on the plain Bernstein form, nothing shared with core/easing's solver.
 *
 * Each engine test runs the engine twice at the same scroll position, once with
 * the CSS string and once with this function, and expects the same output, and
 * a different one from linear: the bug was every engine running the string as
 * its fallback without a word.
 */
export function bezierReference(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const b = (a: number, c: number, u: number) => 3 * a * u * (1 - u) ** 2 + 3 * c * u * u * (1 - u) + u ** 3;
  return (x) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (b(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return b(y1, y2, (lo + hi) / 2);
  };
}

/** The curve from the bug report, as a string and as a reference function. */
export const SNAPPY = 'cubic-bezier(.2,.8,.2,1)' as const;
export const snappy = bezierReference(0.2, 0.8, 0.2, 1);
