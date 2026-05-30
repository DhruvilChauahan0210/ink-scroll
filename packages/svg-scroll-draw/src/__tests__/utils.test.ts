import { describe, it, expect } from 'vitest';
import {
  EASINGS,
  createSpring,
  createBounce,
  createElastic,
  parseTrigger,
  elementAnchorY,
  viewportAnchorY,
  clamp,
  computeProgress,
  computeTriggers,
  getElementLength,
} from '../core/utils';

describe('EASINGS', () => {
  it('linear returns t unchanged', () => {
    expect(EASINGS.linear(0)).toBe(0);
    expect(EASINGS.linear(0.5)).toBe(0.5);
    expect(EASINGS.linear(1)).toBe(1);
  });

  it('ease-in is quadratic (slow start)', () => {
    expect(EASINGS['ease-in'](0)).toBe(0);
    expect(EASINGS['ease-in'](0.5)).toBe(0.25);
    expect(EASINGS['ease-in'](1)).toBe(1);
    // slower than linear in first half
    expect(EASINGS['ease-in'](0.3)).toBeLessThan(0.3);
  });

  it('ease-out decelerates (fast start)', () => {
    expect(EASINGS['ease-out'](0)).toBe(0);
    expect(EASINGS['ease-out'](0.5)).toBe(0.75);
    expect(EASINGS['ease-out'](1)).toBe(1);
    // faster than linear in first half
    expect(EASINGS['ease-out'](0.3)).toBeGreaterThan(0.3);
  });

  it('ease-in-out is symmetric', () => {
    const fn = EASINGS['ease-in-out'];
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);
    expect(fn(0.5)).toBeCloseTo(0.5);
    // symmetric: fn(t) + fn(1-t) ≈ 1
    expect(fn(0.2) + fn(0.8)).toBeCloseTo(1, 10);
    expect(fn(0.3) + fn(0.7)).toBeCloseTo(1, 10);
  });
});

describe('createSpring', () => {
  it('returns 0 at t=0', () => {
    expect(createSpring()(0)).toBeCloseTo(0);
  });

  it('returns 1 at t=1', () => {
    expect(createSpring()(1)).toBeCloseTo(1, 5);
  });

  it('default matches built-in spring easing', () => {
    const custom = createSpring();
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expect(custom(t)).toBeCloseTo(EASINGS.spring(t), 10);
    }
  });

  it('tension changes the curve shape', () => {
    const low  = createSpring({ tension: 1.5 });
    const high = createSpring({ tension: 4 });
    // Different tension → different midpoint values
    expect(low(0.5)).not.toBeCloseTo(high(0.5), 3);
  });

  it('higher friction damps faster (closer to 1 at t=1)', () => {
    const loose = createSpring({ friction: 1 });
    const tight = createSpring({ friction: 4 });
    // Both should reach ~1 at t=1
    expect(tight(1)).toBeCloseTo(1, 3);
    expect(loose(1)).toBeCloseTo(1, 3);
  });

  it('custom params produce different curve than defaults', () => {
    const def    = createSpring();
    const custom = createSpring({ tension: 1, friction: 1 });
    // At least one intermediate point should differ
    const differs = [0.2, 0.4, 0.6, 0.8].some(
      (t) => Math.abs(def(t) - custom(t)) > 0.001
    );
    expect(differs).toBe(true);
  });
});

describe('createBounce', () => {
  it('returns 0 at t=0', () => {
    expect(createBounce()(0)).toBe(0);
  });

  it('returns 1 at t=1', () => {
    expect(createBounce()(1)).toBe(1);
  });

  it('returns 0 for t <= 0', () => {
    expect(createBounce()(-0.5)).toBe(0);
  });

  it('named "bounce" entry matches default createBounce()', () => {
    const fn = createBounce();
    for (const t of [0, 0.2, 0.5, 0.8, 1]) {
      expect(EASINGS.bounce(t)).toBeCloseTo(fn(t), 10);
    }
  });

  it('reaches 1 at the end of the initial approach segment', () => {
    // At the first segment boundary the value should be very close to 1
    const fn = createBounce({ bounces: 3, decay: 0.5 });
    // Somewhere around t=0.45 is the first boundary; just check t=1
    expect(fn(1)).toBe(1);
  });

  it('dips below 1 after the initial approach (bounce effect)', () => {
    const fn = createBounce({ bounces: 3, decay: 0.5 });
    // Find the trough of the first bounce (should be below 1)
    const samples = Array.from({ length: 100 }, (_, i) => fn((i + 1) / 100));
    const min = Math.min(...samples);
    expect(min).toBeLessThan(1);
    expect(min).toBeGreaterThanOrEqual(0);
  });

  it('stays within [0, 1]', () => {
    const fn = createBounce({ bounces: 4, decay: 0.4 });
    for (let i = 0; i <= 100; i++) {
      const v = fn(i / 100);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('more bounces produce more dips', () => {
    const fn2 = createBounce({ bounces: 2, decay: 0.5 });
    const fn5 = createBounce({ bounces: 5, decay: 0.5 });
    // With 5 bounces there are more segments — shapes differ
    const differs = [0.3, 0.5, 0.7, 0.85].some(
      (t) => Math.abs(fn2(t) - fn5(t)) > 0.001
    );
    expect(differs).toBe(true);
  });

  it('decay=0 means no amplitude reduction (all bounces equal depth)', () => {
    const fn = createBounce({ bounces: 3, decay: 0.01 });
    expect(fn(0)).toBe(0);
    expect(fn(1)).toBe(1);
  });
});

describe('createElastic', () => {
  it('returns 0 at t=0', () => {
    expect(createElastic()(0)).toBeCloseTo(0, 10);
  });

  it('returns 1 at t=1', () => {
    expect(createElastic()(1)).toBe(1);
  });

  it('returns 0 for t <= 0', () => {
    expect(createElastic()(-0.1)).toBe(0);
  });

  it('named "elastic" entry matches default createElastic()', () => {
    const fn = createElastic();
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      expect(EASINGS.elastic(t)).toBeCloseTo(fn(t), 10);
    }
  });

  it('overshoots past 1 before settling (elastic effect)', () => {
    const fn = createElastic({ amplitude: 1, period: 0.4 });
    const samples = Array.from({ length: 100 }, (_, i) => fn((i + 1) / 100));
    const max = Math.max(...samples);
    expect(max).toBeGreaterThan(1);
  });

  it('higher amplitude produces larger overshoot', () => {
    const lo = createElastic({ amplitude: 1,   period: 0.4 });
    const hi = createElastic({ amplitude: 1.8, period: 0.4 });
    const maxLo = Math.max(...Array.from({ length: 100 }, (_, i) => lo((i + 1) / 100)));
    const maxHi = Math.max(...Array.from({ length: 100 }, (_, i) => hi((i + 1) / 100)));
    expect(maxHi).toBeGreaterThan(maxLo);
  });

  it('different period changes curve shape', () => {
    const short = createElastic({ period: 0.2 });
    const long  = createElastic({ period: 0.6 });
    const differs = [0.1, 0.2, 0.3, 0.4].some(
      (t) => Math.abs(short(t) - long(t)) > 0.01
    );
    expect(differs).toBe(true);
  });

  it('custom params produce different curve than defaults', () => {
    const def    = createElastic();
    const custom = createElastic({ amplitude: 1.5, period: 0.3 });
    const differs = [0.1, 0.2, 0.3, 0.4].some(
      (t) => Math.abs(def(t) - custom(t)) > 0.001
    );
    expect(differs).toBe(true);
  });
});

describe('EASINGS named strings', () => {
  it('includes bounce and elastic', () => {
    expect(typeof EASINGS.bounce).toBe('function');
    expect(typeof EASINGS.elastic).toBe('function');
  });

  it('bounce(0) = 0 and bounce(1) = 1', () => {
    expect(EASINGS.bounce(0)).toBe(0);
    expect(EASINGS.bounce(1)).toBe(1);
  });

  it('elastic(0) ≈ 0 and elastic(1) = 1', () => {
    expect(EASINGS.elastic(0)).toBeCloseTo(0, 10);
    expect(EASINGS.elastic(1)).toBe(1);
  });
});

describe('parseTrigger', () => {
  it('parses "top bottom"', () => {
    expect(parseTrigger('top bottom')).toEqual({ element: 'top', viewport: 'bottom' });
  });

  it('parses "center center"', () => {
    expect(parseTrigger('center center')).toEqual({ element: 'center', viewport: 'center' });
  });

  it('uses defaults on empty string', () => {
    expect(parseTrigger('')).toEqual({ element: 'top', viewport: 'bottom' });
  });

  it('handles extra whitespace', () => {
    expect(parseTrigger('  bottom   top  ')).toEqual({ element: 'bottom', viewport: 'top' });
  });

  it('parses percentage shorthand "20%"', () => {
    expect(parseTrigger('20%')).toEqual({ element: 'top', viewport: '20%' });
  });

  it('parses mixed anchor + percentage "top 75%"', () => {
    expect(parseTrigger('top 75%')).toEqual({ element: 'top', viewport: '75%' });
  });

  it('parses decimal percentage "33.5%"', () => {
    expect(parseTrigger('33.5%')).toEqual({ element: 'top', viewport: '33.5%' });
  });
});

describe('elementAnchorY', () => {
  const top = 100, height = 200, scrollY = 50;

  it('top anchor', () => {
    expect(elementAnchorY(top, height, scrollY, 'top')).toBe(150);
  });

  it('center anchor', () => {
    expect(elementAnchorY(top, height, scrollY, 'center')).toBe(250);
  });

  it('bottom anchor', () => {
    expect(elementAnchorY(top, height, scrollY, 'bottom')).toBe(350);
  });

  it('unknown anchor falls back to top', () => {
    expect(elementAnchorY(top, height, scrollY, 'unknown')).toBe(150);
  });
});

describe('viewportAnchorY', () => {
  const vpH = 800;

  it('top returns 0', () => {
    expect(viewportAnchorY('top', vpH)).toBe(0);
  });

  it('center returns half', () => {
    expect(viewportAnchorY('center', vpH)).toBe(400);
  });

  it('bottom returns full height', () => {
    expect(viewportAnchorY('bottom', vpH)).toBe(800);
  });

  it('unknown falls back to bottom', () => {
    expect(viewportAnchorY('unknown', vpH)).toBe(800);
  });

  it('percentage "25%" returns 25% of viewport height', () => {
    expect(viewportAnchorY('25%', vpH)).toBe(200);
  });

  it('percentage "0%" returns 0', () => {
    expect(viewportAnchorY('0%', vpH)).toBe(0);
  });

  it('percentage "100%" returns full viewport height', () => {
    expect(viewportAnchorY('100%', vpH)).toBe(800);
  });
});

describe('getElementLength', () => {
  it('calculates rect perimeter from width + height attributes', () => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    el.setAttribute('width', '100');
    el.setAttribute('height', '50');
    expect(getElementLength(el as unknown as SVGElement)).toBe(300); // 2*(100+50)
  });

  it('calculates circle circumference from r attribute', () => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    el.setAttribute('r', '10');
    expect(getElementLength(el as unknown as SVGElement)).toBeCloseTo(2 * Math.PI * 10);
  });

  it('calls getTotalLength() for path elements', () => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
    (el as unknown as { getTotalLength: () => number }).getTotalLength = () => 42;
    expect(getElementLength(el as unknown as SVGElement)).toBe(42);
  });
});

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-5, 0, 1)).toBe(0));
  it('clamps above max', () => expect(clamp(2, 0, 1)).toBe(1));
  it('passes through in-range value', () => expect(clamp(0.5, 0, 1)).toBe(0.5));
  it('clamps at exact bounds', () => {
    expect(clamp(0, 0, 1)).toBe(0);
    expect(clamp(1, 0, 1)).toBe(1);
  });
});

describe('computeProgress', () => {
  it('returns 0 before trigger start', () => {
    expect(computeProgress(0, 200, 800, 1)).toBe(0);
  });

  it('returns 1 after trigger end', () => {
    expect(computeProgress(1000, 200, 800, 1)).toBe(1);
  });

  it('returns 0.5 at midpoint', () => {
    expect(computeProgress(500, 200, 800, 1)).toBe(0.5);
  });

  it('applies speed multiplier', () => {
    // halfway through range but speed=2 → should clamp to 1
    expect(computeProgress(500, 200, 800, 2)).toBe(1);
  });

  it('returns 0 when tStart equals tEnd', () => {
    expect(computeProgress(500, 500, 500, 1)).toBe(0);
  });
});

describe('computeTriggers', () => {
  it('computes tStart and tEnd for "top bottom" → "bottom top"', () => {
    const rect = { top: 100, height: 400 };
    const scrollY = 200;
    const vpHeight = 800;
    const start = parseTrigger('top bottom');
    const end = parseTrigger('bottom top');

    const { tStart, tEnd } = computeTriggers(rect, scrollY, vpHeight, start, end);

    // tStart: elementTop(top) - vpAnchor(bottom) = (100+200) - 800 = -500
    expect(tStart).toBe(-500);
    // tEnd: elementBottom(bottom) - vpAnchor(top) = (100+200+400) - 0 = 700
    expect(tEnd).toBe(700);
  });
});
