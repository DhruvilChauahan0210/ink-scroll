import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, call, settle } from './helpers';

/**
 * `svg-scroll-draw/write` in a real browser (fixtures/write.html): real stroke
 * lengths and dashes, the pen's order and pace against penTimes, a jump past
 * the window, scrolling back, `once`, a parent narrower than the line, what a
 * screen reader gets, destroy(), and a page loaded under reduced motion.
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

function near(actual: number[], expected: number[], tol = 0.02): void {
  expect(actual, `${actual} vs ${expected}`).toHaveLength(expected.length);
  actual.forEach((a, i) => expect(Math.abs(a - expected[i]), `${actual} vs ${expected}`).toBeLessThanOrEqual(tol));
}

/** Written strokes, then at most one part way, then strokes not started. */
function inWritingOrder(fractions: number[]): boolean {
  const first = fractions.findIndex((f) => f < 0.999);
  if (first < 0) return true;
  return fractions.slice(0, first).every((f) => f >= 0.999) && fractions.slice(first + 1).every((f) => f <= 0.001);
}

test.describe('svg-scroll-draw/write', () => {
  let errors: string[];
  test.beforeEach(async ({ page }) => {
    errors = collectErrors(page);
    await openFixture(page, 'write.html');
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test('writes the line one stroke at a time in writing order, at the pen speed penTimes gives', async ({ page }) => {
    // 1.5 × the heading's 40px.
    expect(await call(page, 'size', '#sig')).toBe(60);
    near(await call<number[]>(page, 'read', '#sig'), await call<number[]>(page, 'expected', '#sig', 0));
    for (const p of [0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
      const got = await readAt(page, '#sig', p);
      expect(inWritingOrder(got), `p ${p}: ${got}`).toBe(true);
      near(got, await call<number[]>(page, 'expected', '#sig', p));
    }
  });

  test('a jump past the window writes the whole line and fires onComplete once', async ({ page }) => {
    await scrollToY(page, await call<number>(page, 'maxScroll'));
    await settle(page);
    const got = await call<number[]>(page, 'read', '#sig');
    expect(got.every((f) => f >= 0.999), String(got)).toBe(true);
    expect(await call(page, 'completed')).toEqual({ sig: 1 });
  });

  test('scrolling back unwrites it; with once it stays written', async ({ page }) => {
    await readAt(page, '#once', 1.2);
    await readAt(page, '#sig', 1.2);
    const sig = await readAt(page, '#sig', -0.2);
    expect(sig.every((f) => f <= 0.001), String(sig)).toBe(true);
    const once = await call<number[]>(page, 'read', '#once');
    expect(once.every((f) => f >= 0.999), String(once)).toBe(true);
  });

  test('a parent narrower than the line scales it down, and it still writes whole', async ({ page }) => {
    const box = await call<{ w: number; h: number; parent: number }>(page, 'box', '#narrow');
    expect(box.w).toBeLessThanOrEqual(box.parent + 0.5);
    expect(box.h).toBeLessThan(60);
    const mid = await readAt(page, '#narrow', 0.5);
    expect(inWritingOrder(mid), String(mid)).toBe(true);
    const end = await readAt(page, '#narrow', 1.1);
    expect(end.every((f) => f >= 0.999), String(end)).toBe(true);
  });

  test('screen readers get the text, and destroy() puts the content back', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Ada Lovelace' })).toBeVisible();
    await expect(page.locator('#sig svg')).toHaveAttribute('aria-hidden', 'true');
    expect(await call(page, 'destroyKept')).toBe(true);
    await expect(page.locator('#kept b')).toHaveText('here');
  });
});

test('under reduced motion the line is written at once', async ({ page }) => {
  const errors = collectErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'write.html');
  const got = await call<number[]>(page, 'read', '#sig');
  expect(got.length).toBeGreaterThan(0);
  expect(got.every((f) => f >= 0.999), String(got)).toBe(true);
  expect(await call(page, 'completed')).toEqual({ sig: 1 });
  expect(errors).toEqual([]);
});
