import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Capture the trigger window each element is given, without running the engine.
const engine = vi.hoisted(() => ({ calls: [] as { trigger: { start: string; end: string } }[] }));
vi.mock('../animate', () => ({
  createAnimateEngine: (_el: Element, opts: { trigger: { start: string; end: string } }) => {
    engine.calls.push({ trigger: opts.trigger });
    return { destroy: () => {} };
  },
}));

import { scrollReveal } from '../reveal';

/** An element whose box sits at `top` (viewport coordinates), 100px tall. */
function el(top: number): HTMLElement {
  const node = document.createElement('div');
  document.body.appendChild(node);
  Object.defineProperty(node, 'getBoundingClientRect', {
    value: () => ({ top, height: 100, left: 0, width: 200, bottom: top + 100, right: 200 }),
    configurable: true,
  });
  return node;
}
const row = (n: number, top = 1200) => Array.from({ length: n }, () => el(top));
const windows = () => engine.calls.map((c) => [c.trigger.start, c.trigger.end]);

beforeEach(() => { engine.calls = []; });
afterEach(() => { document.body.innerHTML = ''; });

describe('scrollReveal stagger', () => {
  it('cascades a row by default, 15% of the reveal window per element', () => {
    scrollReveal(row(4));
    // The default window is top 88% → top 53%: 35% of the viewport, so 5.25% a step.
    expect(windows()).toEqual([
      ['top 88%', 'top 53%'],
      ['top 82.75%', 'top 47.75%'],
      ['top 77.5%', 'top 42.5%'],
      ['top 72.25%', 'top 37.25%'],
    ]);
  });

  it('staggers a custom trigger instead of dropping the stagger', () => {
    scrollReveal(row(3), { stagger: 0.2, trigger: { start: 'top 80%', end: 'top 40%' } });
    expect(windows()).toEqual([
      ['top 80%', 'top 40%'],
      ['top 72%', 'top 32%'],
      ['top 64%', 'top 24%'],
    ]);
  });

  it('starts each row its own count, so a long list is not pushed down the page', () => {
    scrollReveal([...row(3, 1200), ...row(3, 1500)]);
    expect(windows().map(([start]) => start)).toEqual([
      'top 88%', 'top 82.75%', 'top 77.5%',
      'top 88%', 'top 82.75%', 'top 77.5%',
    ]);
  });

  it('never starts a row’s element more than one window late, and clamps stagger to 0–1', () => {
    scrollReveal(row(4), { stagger: 3 });
    expect(windows().map(([start]) => start)).toEqual(['top 88%', 'top 53%', 'top 53%', 'top 53%']);
    engine.calls = [];
    scrollReveal(row(3), { stagger: -1 });
    expect(windows().map(([start]) => start)).toEqual(['top 88%', 'top 88%', 'top 88%']);
  });

  it('reveals a row all at once at stagger 0', () => {
    scrollReveal(row(3), { stagger: 0 });
    expect(windows()).toEqual([['top 88%', 'top 53%'], ['top 88%', 'top 53%'], ['top 88%', 'top 53%']]);
  });

  it('shifts keyword anchors by their position in the viewport', () => {
    scrollReveal(row(2), { stagger: 0.1, trigger: { start: 'top bottom', end: 'center center' } });
    // bottom = 100%, center = 50%: a 50% window, so a 5% step.
    expect(windows()).toEqual([
      ['top bottom', 'center center'],
      ['top 95%', 'center 45%'],
    ]);
  });
});
