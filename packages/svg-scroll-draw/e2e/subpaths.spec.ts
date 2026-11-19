import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, call, settle } from './helpers';

/**
 * `svg-scroll-draw/subpaths` in a real browser (fixtures/subpaths.html): real
 * lengths and dashes, the pieces drawn by scrollDraw with `stagger: 1`, each
 * piece's geometry against the path left whole, a jump, joinSubpaths, the web
 * component, the data attribute, and React's and Vue's <ScrollDraw>.
 *
 * Every drawing has three subpaths of 360, 180 and 80 px. With stagger 1
 * piece i draws over window i: halfway through the second window the first
 * piece is whole, the second half drawn, the third not started.
 */

async function readAt(page: Page, sel: string, p: number): Promise<number[]> {
  await scrollToY(page, await call<number>(page, 'yAt', sel, p));
  let last = '';
  for (let k = 0; k < 10; k++) {
    await settle(page);
    const r = await call<number[]>(page, 'read', sel);
    if (JSON.stringify(r) === last) return r;
    last = JSON.stringify(r);
  }
  return JSON.parse(last) as number[];
}

function near(actual: number[], expected: number[], tol = 0.01): void {
  expect(actual, `${actual} vs ${expected}`).toHaveLength(expected.length);
  actual.forEach((a, i) => expect(Math.abs(a - expected[i]), `${actual} vs ${expected}`).toBeLessThanOrEqual(tol));
}

/** One piece a window, in document order. */
const STEPS: Array<[number, number[]]> = [
  [0, [0, 0, 0]],
  [0.5, [0.5, 0, 0]],
  [1.5, [1, 0.5, 0]],
  [2.5, [1, 1, 0.5]],
  [3, [1, 1, 1]],
];

test.describe('svg-scroll-draw/subpaths', () => {
  let errors: string[];
  test.beforeEach(async ({ page }) => {
    errors = collectErrors(page);
    await openFixture(page, 'subpaths.html');
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test('a path left whole draws every subpath at once', async ({ page }) => {
    expect(await call(page, 'count', '#together')).toEqual({ all: 1, pieces: 0, split: 0 });
    near(await readAt(page, '#together', 0.3), [0.3]);
  });

  test('split, the pieces draw one after another in document order under stagger: 1', async ({ page }) => {
    expect(await call(page, 'count', '#seq')).toEqual({ all: 3, pieces: 2, split: 1 });
    // In the order they were written: the path keeps the first.
    expect(await call(page, 'ds', '#seq')).toEqual(['M20 40 H380', 'M20 100 H200', 'M20 160 H100']);
    for (const [p, expected] of STEPS) near(await readAt(page, '#seq', p), expected);
  });

  test('each piece starts where its subpath does, relative movetos and arcs included', async ({ page }) => {
    const g = await call<{ total: number; sum: number; starts: number[][] }>(page, 'geometry');
    expect(g.starts).toHaveLength(4);
    expect(Math.abs(g.total - g.sum), JSON.stringify(g)).toBeLessThan(0.5);
    for (const [ax, ay, bx, by] of g.starts) {
      expect(Math.abs(ax - bx), JSON.stringify(g)).toBeLessThan(0.05);
      expect(Math.abs(ay - by), JSON.stringify(g)).toBeLessThan(0.05);
    }
  });

  test('a jump past every window ends drawn, and back above it, undrawn', async ({ page }) => {
    await scrollToY(page, await call<number>(page, 'maxScroll'));
    await expect.poll(() => call(page, 'read', '#seq')).toEqual([1, 1, 1]);
    expect(await call(page, 'completed')).toEqual({ seq: 1 });
    await scrollToY(page, 0);
    await expect.poll(() => call(page, 'read', '#seq')).toEqual([0, 0, 0]);
  });

  test('joinSubpaths() after destroy() puts every path back exactly as it was', async ({ page }) => {
    await scrollToY(page, await call<number>(page, 'yAt', '#seq', 1.5));
    expect(await call(page, 'join')).toEqual({ seq: true, geom: true });
    expect(await call(page, 'count', '#seq')).toEqual({ all: 1, pieces: 0, split: 0 });
  });

  test('the web component and the data attribute draw split paths as ordinary paths', async ({ page }) => {
    expect(await call(page, 'attrCount')).toBe(1);
    for (const sel of ['#wc', '#attr']) {
      expect(await call(page, 'count', sel)).toEqual({ all: 3, pieces: 2, split: 1 });
      near(await readAt(page, sel, 1.5), [1, 0.5, 0]);
    }
  });

  test("React's and Vue's <ScrollDraw> draw them, re-render and unmount cleanly", async ({ page }) => {
    for (const sel of ['#react', '#vue']) {
      expect(await call(page, 'count', sel), sel).toEqual({ all: 3, pieces: 2, split: 1 });
      near(await readAt(page, sel, 1.5), [1, 0.5, 0]);
    }
    // Each framework patches its own node, which still holds the first
    // subpath; nothing is split twice.
    await call(page, 'rerender');
    const after = await call<Record<string, Array<[string, boolean]>>>(page, 'frameworkPaths');
    for (const fw of ['react', 'vue']) {
      expect(after[fw], fw).toEqual([['p1', false], ['p0', true], ['p0', true]]);
    }
    await call(page, 'unmount');
    expect(await call(page, 'frameworkPaths')).toEqual({ react: [], vue: [] });
  });
});
