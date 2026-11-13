/**
 * The CSS timing functions the native fast paths emit must reproduce this
 * library's own easing curves.
 *
 * This is the arithmetic half of the claim `e2e/animate-parity.spec.ts` checks
 * in a real browser: here the emitted declaration is evaluated the way a browser
 * evaluates it and compared against `EASINGS` point by point, so a wrong
 * constant fails in milliseconds instead of only under Playwright.
 *
 * The mapping this replaced — the CSS keyword of the same name — is off by up to
 * 0.069, and is asserted below to be off, so nobody can quietly restore it.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cssTimingFor } from '../core/css-easing';
import { EASINGS, resolveEasing } from '../core/utils';

/**
 * Evaluate a CSS `cubic-bezier(x1,y1,x2,y2)` at x, the way a browser does:
 * solve x(t) = x for t by bisection, then return y(t).
 */
function evalCubicBezier(decl: string): (x: number) => number {
  const [x1, y1, x2, y2] = decl
    .slice(decl.indexOf('(') + 1, decl.lastIndexOf(')'))
    .split(',')
    .map((n) => parseFloat(n));

  const cx = (t: number) => 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3;
  const cy = (t: number) => 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3;

  return (x: number) => {
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 60; i++) {
      t = (lo + hi) / 2;
      if (cx(t) < x) lo = t;
      else hi = t;
    }
    return cy(t);
  };
}

/** Evaluate a CSS `linear(a, b, c, …)`: piecewise-linear through evenly spaced stops. */
function evalLinear(decl: string): (x: number) => number {
  const stops = decl
    .slice(decl.indexOf('(') + 1, decl.lastIndexOf(')'))
    .split(',')
    .map((n) => parseFloat(n));

  return (x: number) => {
    const pos = Math.min(1, Math.max(0, x)) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(pos));
    return stops[i] + (stops[i + 1] - stops[i]) * (pos - i);
  };
}

function evaluate(decl: string): (x: number) => number {
  if (decl === 'linear') return (x) => x;
  if (decl.startsWith('cubic-bezier')) return evalCubicBezier(decl);
  if (decl.startsWith('linear(')) return evalLinear(decl);
  throw new Error(`unrecognised timing function: ${decl}`);
}

/** Worst absolute difference between two curves over [0, 1]. */
function worstError(a: (t: number) => number, b: (t: number) => number): number {
  let worst = 0;
  for (let i = 0; i <= 500; i++) {
    const t = i / 500;
    worst = Math.max(worst, Math.abs(a(t) - b(t)));
  }
  return worst;
}

// Every browser that supports `animation-timeline: view()` also supports
// `linear()`; the fixture says so explicitly rather than relying on jsdom.
function stubSupport(supported: boolean): void {
  vi.stubGlobal('CSS', { supports: vi.fn(() => supported) });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('cssTimingFor', () => {
  it.each(['linear', 'ease-in', 'ease-out', 'ease-in-out'])(
    '%s reproduces the JS easing curve',
    (name) => {
      stubSupport(true);
      const decl = cssTimingFor(name);
      expect(decl, `${name} has no CSS timing function`).not.toBeNull();

      // 1e-3 is two orders of magnitude tighter than the 0.02 the browser
      // parity tests allow for sub-frame timing differences.
      expect(worstError(evaluate(decl!), EASINGS[name])).toBeLessThan(1e-3);
    },
  );

  /**
   * The regression this module exists for. If someone "simplifies" the map back
   * to the same-named CSS keywords, this fails with the size of the error.
   */
  it.each([
    ['ease-in', 'ease-in'],
    ['ease-out', 'ease-out'],
  ])('the CSS keyword %s is NOT the same curve', (name, keyword) => {
    const keywordCurve = evaluate(
      keyword === 'ease-in' ? 'cubic-bezier(0.42, 0, 1, 1)' : 'cubic-bezier(0, 0, 0.58, 1)',
    );
    expect(worstError(keywordCurve, EASINGS[name])).toBeGreaterThan(0.06);
  });

  it('declines easings CSS cannot express, so they stay on the JS engine', () => {
    stubSupport(true);
    for (const name of ['spring', 'bounce', 'elastic', 'nonsense']) {
      expect(cssTimingFor(name), `${name} should not have a CSS equivalent`).toBeNull();
    }
  });

  it('declines ease-in-out rather than approximating it when linear() is unsupported', () => {
    stubSupport(false);
    expect(cssTimingFor('ease-in-out')).toBeNull();
    // The two that need no feature detection are still available.
    expect(cssTimingFor('ease-out')).toContain('cubic-bezier');
    expect(cssTimingFor('linear')).toBe('linear');
  });

  /**
   * 2.26.0: a cubic-bezier() the user wrote goes to CSS as written
   * (normalized), so the native path runs the very curve the JS engine parsed.
   * Before, every one of them returned null here and ran on the JS engine as
   * linear, while the parity tests compared linear with linear.
   */
  it('passes a cubic-bezier() string through, normalized, as the same curve resolveEasing runs', () => {
    const decl = cssTimingFor('cubic-bezier(.2, .8, .2, 1)');
    expect(decl).toBe('cubic-bezier(0.2,0.8,0.2,1)');
    expect(worstError(evaluate(decl!), resolveEasing('cubic-bezier(.2, .8, .2, 1)'))).toBeLessThan(1e-5);
    expect(cssTimingFor('ease')).toBe('cubic-bezier(0.25,0.1,0.25,1)');
  });

  // steps() is not parsed (2.26.0 keeps the main entry small), so it declines
  // here and warns where an engine resolves it.
  it('declines steps(), which resolveEasing does not parse either', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const s of ['steps(4)', 'steps(4, jump-end)', 'steps(1, start)']) expect(cssTimingFor(s), s).toBeNull();
  });

  it('declines a malformed CSS string rather than emitting an invalid declaration', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const s of ['cubic-bezier(1.5, 0, 0, 1)', 'cubic-bezier(.2,.8,.2)', 'steps(0)', 'easeOut']) {
      expect(cssTimingFor(s), s).toBeNull();
    }
  });
});
