/**
 * resolveEasing: the one place an `easing` option becomes a curve (2.26.0+).
 *
 * Every engine used to resolve a string with `EASINGS[easing] ?? fallback`, so
 * `easing: 'cubic-bezier(.2,.8,.2,1)'` (what anyone coming from CSS writes) and
 * a typo like `'easeOut'` both ran as the fallback without a word. These tests
 * hold the parser to the CSS syntax, and the solver to an independent reference
 * at many points. The bound is 1e-5 of progress: the solver is kept small (eight
 * Newton steps, then a 30-step bisection where those miss) because it ships in
 * the main entry, and 1e-5 of a 1000px scroll is a hundredth of a pixel.
 * steps() is deliberately not parsed (rare in a scroll animation; it warns).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { EASINGS, resolveEasing, cssEasing } from '../core/easing';

afterEach(() => vi.restoreAllMocks());

/** x(u) and y(u) of a cubic-bézier, in plain Bernstein form (not the library's expansion). */
function bezierPoint(x1: number, y1: number, x2: number, y2: number, u: number): [number, number] {
  const b = (a: number, c: number) => 3 * a * u * (1 - u) ** 2 + 3 * c * u * u * (1 - u) + u ** 3;
  return [b(x1, x2), b(y1, y2)];
}

/** Reference solver: 200 bisection steps, far past double precision. */
function reference(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  return (x) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2;
      if (bezierPoint(x1, y1, x2, y2, mid)[0] < x) lo = mid;
      else hi = mid;
    }
    return bezierPoint(x1, y1, x2, y2, (lo + hi) / 2)[1];
  };
}

const CURVES: [number, number, number, number][] = [
  [0.2, 0.8, 0.2, 1],          // the one in the bug report
  [0.25, 0.1, 0.25, 1],        // CSS ease
  [0.42, 0, 1, 1],             // CSS ease-in
  [0, 0, 0.58, 1],             // CSS ease-out
  [0.42, 0, 0.58, 1],          // CSS ease-in-out
  [0, 0, 1, 1],                // linear as a bézier
  [0, 1, 0, 1],                // vertical at the start
  [1, 0, 0, 1],                // flat in the middle: x'(1/2) = 0, Newton's worst case
  [0, 0, 0, 0],                // x = u³: slope 0 at the start
  [1, 1, 1, 1],                // and at the end
  [0.68, -0.55, 0.265, 1.55],  // easeInOutBack: y outside [0, 1]
  [0.5, 2, 0.5, -1],           // a big overshoot both ways
];

describe('resolveEasing: names and functions', () => {
  it('returns a function easing as it is', () => {
    const fn = (t: number) => t ** 3;
    expect(resolveEasing(fn)).toBe(fn);
  });

  it('every library name is still its own curve, not the CSS keyword of the same name', () => {
    for (const name of Object.keys(EASINGS)) {
      expect(resolveEasing(name as never), name).toBe(EASINGS[name]);
    }
    // 'ease-out' is the quadratic t(2 - t), not CSS's cubic-bezier(0, 0, 0.58, 1).
    expect(resolveEasing('ease-out')(0.5)).toBe(0.75);
    expect(resolveEasing('ease-in')(0.5)).toBe(0.25);
  });

  it('undefined is the fallback, and the fallback defaults to linear', () => {
    expect(resolveEasing(undefined)).toBe(EASINGS.linear);
    expect(resolveEasing(undefined, 'ease-out')).toBe(EASINGS['ease-out']);
  });
});

describe('resolveEasing: cubic-bezier()', () => {
  it.each(CURVES)('cubic-bezier(%s, %s, %s, %s) matches the curve to 1e-5 at 1,000 points of the curve itself', (x1, y1, x2, y2) => {
    const f = resolveEasing(`cubic-bezier(${x1}, ${y1}, ${x2}, ${y2})`);
    let worst = 0;
    for (let i = 0; i <= 1000; i++) {
      const [x, y] = bezierPoint(x1, y1, x2, y2, i / 1000);
      worst = Math.max(worst, Math.abs(f(x) - y));
    }
    expect(worst).toBeLessThan(1e-5);
  });

  it.each(CURVES)('cubic-bezier(%s, %s, %s, %s) matches a reference solver to 1e-5 at 997 inputs', (x1, y1, x2, y2) => {
    const f = resolveEasing(`cubic-bezier(${x1},${y1},${x2},${y2})`);
    const ref = reference(x1, y1, x2, y2);
    let worst = 0;
    for (let i = 0; i <= 997; i++) worst = Math.max(worst, Math.abs(f(i / 997) - ref(i / 997)));
    expect(worst).toBeLessThan(1e-5);
  });

  it('starts at 0 and ends at 1 exactly', () => {
    for (const [x1, y1, x2, y2] of CURVES) {
      const f = resolveEasing(`cubic-bezier(${x1},${y1},${x2},${y2})`);
      expect(f(0)).toBe(0);
      // Not 1 - 1e-16: the engines complete on alpha >= 1.
      expect(f(1)).toBe(1);
    }
  });

  it('reads CSS number forms and spacing', () => {
    const want = resolveEasing('cubic-bezier(0.2,0.8,0.2,1)')(0.3);
    for (const s of ['cubic-bezier(.2,.8,.2,1)', '  cubic-bezier( 0.2 , 0.8 ,0.2,  1 )  ', 'cubic-bezier(2e-1, 8e-1, 0.20, 1.0)']) {
      expect(resolveEasing(s as never)(0.3), s).toBe(want);
    }
  });

  it('ease is the CSS keyword, cubic-bezier(0.25, 0.1, 0.25, 1)', () => {
    const ref = reference(0.25, 0.1, 0.25, 1);
    for (let i = 0; i <= 100; i++) expect(Math.abs(resolveEasing('ease')(i / 100) - ref(i / 100))).toBeLessThan(1e-5);
  });

  it('hands the native paths the same function as normalized CSS', () => {
    expect(cssEasing('cubic-bezier(.2, .8, .2, 1)')?.[1]).toBe('cubic-bezier(0.2,0.8,0.2,1)');
    expect(cssEasing('ease')?.[1]).toBe('cubic-bezier(0.25,0.1,0.25,1)');
    expect(cssEasing('steps(4)')).toBeUndefined();
    expect(cssEasing('easeOut')).toBeUndefined();
  });
});

describe('resolveEasing: anything else warns and falls back', () => {
  const BAD = [
    'easeOut',                        // the typo
    'EASE-OUT',                       // case matters, as in the names
    'cubic-bezier(1.2, 0, 0, 1)',     // x1 outside [0, 1]
    'cubic-bezier(0, 0, -0.1, 1)',    // x2 outside [0, 1]
    'cubic-bezier(.2, .8, .2)',       // three numbers
    'cubic-bezier(.2, .8, .2, 1, 0)', // five
    'cubic-bezier(a, b, c, d)',
    'cubic-bezier(, .8, .2, 1)',      // an empty number is not 0
    'cubic-bezier(.2, .8, .2, Infinity)',
    'cubic-bezier(.2 .8 .2 1)',
    'steps(4)',                       // not parsed: rare in a scroll animation
    'steps(4, jump-start)',
    'linear(0, 1)',                   // not parsed either
    'step-start',
    'toString',                       // not a name, though EASINGS inherits it
    'constructor',
    '',
  ];

  it.each(BAD)('%j warns, naming it and the valid forms, then runs the fallback', (s) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveEasing(s as never)).toBe(EASINGS.linear);
    expect(warn).toHaveBeenCalledTimes(1);
    const msg = String(warn.mock.calls[0][0]);
    expect(msg).toContain(JSON.stringify(s));
    expect(msg).toContain('a name');
    expect(msg).toContain('cubic-bezier()');
    expect(msg).toContain('a function');
  });

  it("falls back to the engine's own default, not always linear", () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveEasing('easeInOut' as never, 'ease-in-out')).toBe(EASINGS['ease-in-out']);
    expect(resolveEasing('easeIn' as never, 'ease-out')).toBe(EASINGS['ease-out']);
  });

  it('warns once per value, so a hook resolving it every frame does not flood the console', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (let i = 0; i < 5; i++) resolveEasing('bouncy' as never);
    expect(warn).toHaveBeenCalledTimes(1);
    resolveEasing('springy' as never);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('does not warn for any valid form', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const s of [...Object.keys(EASINGS), 'ease', 'cubic-bezier(0,0,1,1)', ' cubic-bezier(1, 0, 0, 1) ']) {
      resolveEasing(s as never);
    }
    resolveEasing((t) => t);
    expect(warn).not.toHaveBeenCalled();
  });

  it('is silent in a production build', async () => {
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'production');
    try {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const fresh = await import('../core/easing');
      expect(fresh.resolveEasing('easeOut' as never)).toBe(fresh.EASINGS.linear);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
