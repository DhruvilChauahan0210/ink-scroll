import { describe, it, expect } from 'vitest';
import {
  EASINGS,
  parseTrigger,
  elementAnchorY,
  viewportAnchorY,
  clamp,
  computeProgress,
  computeTriggers,
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
