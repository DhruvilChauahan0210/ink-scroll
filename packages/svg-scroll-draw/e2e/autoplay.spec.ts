import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, call, settle } from './helpers';

/**
 * An autoplay drawing below the fold (autoplay.html, viewport 900x800, the
 * drawing 1200px down, three paths, linear easing).
 *
 * With a stagger, a run lasts duration × (1 + (n − 1) × stagger). Up to 2.23.1
 * seek() and getProgress() covered only `duration` and followed the first
 * path: seek(1) left the later paths part-drawn, and getProgress() said 1
 * while they were still drawing. Found building the site's SVG path viewer.
 *
 * The same page also checks a run with no stagger goes all the way once the
 * drawing scrolls in, with and without a loop reading getProgress() every
 * frame: the viewer saw a run stop part way under those conditions.
 */

/**
 * Wait for the run to complete (onComplete), or `timeout` ms, and return the
 * fractions. Waiting on the paths themselves read a frame just short of the
 * last one under a loaded CI runner (0.9993 drawn); completion is the signal
 * that the final frame, which draws every path whole, has run.
 */
async function drawn(page: Page, timeout: number): Promise<number[]> {
  const deadline = Date.now() + timeout;
  while ((await call<number>(page, 'completes')) < 1 && Date.now() < deadline) {
    await page.waitForTimeout(50);
  }
  return call<number[]>(page, 'fractions');
}

const into = (page: Page) => call(page, 'scrollTo', 900);

test.describe('autoplay with a stagger', () => {
  test('seek(1) draws every path and reports 1', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'autoplay.html?stagger=0.25&duration=600');
    await into(page);
    await settle(page);
    await call(page, 'seek', 1);
    await settle(page);
    const got = await call<number[]>(page, 'fractions');
    got.forEach((f, i) => expect(f, `path ${i}: ${got.map((v) => v.toFixed(3))}`).toBeCloseTo(1, 3));
    expect(await call<number>(page, 'progress')).toBe(1);
    expect(errors).toEqual([]);
  });

  test('seek(0.5) is half the whole run: first drawn, second half, third not started', async ({ page }) => {
    // Run = 600 × (1 + 2 × 0.5) = 1200ms; half is 600ms.
    await openFixture(page, 'autoplay.html?stagger=0.5&duration=600');
    await into(page);
    await settle(page);
    await call(page, 'seek', 0.5);
    await settle(page);
    const got = await call<number[]>(page, 'fractions');
    expect(got[0]).toBeCloseTo(1, 2);
    expect(got[1]).toBeCloseTo(0.5, 2);
    expect(got[2]).toBeCloseTo(0, 2);
    expect(await call<number>(page, 'progress')).toBe(0.5);
  });

  test('a played run finishes every path, and progress reaches 1 only then', async ({ page }) => {
    await openFixture(page, 'autoplay.html?stagger=0.5&duration=400');
    await into(page);
    // Part way: whatever the timing, progress is below 1 while a path is short.
    await page.waitForTimeout(300);
    const mid = await call<number[]>(page, 'fractions');
    if (mid.some((f) => f < 0.999)) expect(await call<number>(page, 'progress')).toBeLessThan(1);
    const end = await drawn(page, 3000);
    end.forEach((f, i) => expect(f, `path ${i}: ${end.map((v) => v.toFixed(3))}`).toBeCloseTo(1, 3));
    expect(await call<number>(page, 'progress')).toBe(1);
    expect(await call<number>(page, 'lastProgressEvent')).toBe(1);
    expect(await call<number>(page, 'scrollDrawProgress')).toBe(1);
    expect(await call<number>(page, 'completes')).toBe(1);
  });
});

test.describe('autoplay without a stagger', () => {
  for (const poll of [false, true]) {
    test(`runs to the end once scrolled into view${poll ? ', with getProgress() read every frame' : ''}`, async ({ page }) => {
      const errors = collectErrors(page);
      await openFixture(page, `autoplay.html?duration=600${poll ? '&poll=1' : ''}`);
      expect(await call<number[]>(page, 'fractions')).toEqual([0, 0, 0]);
      await into(page);
      const got = await drawn(page, 3000);
      got.forEach((f, i) => expect(f, `path ${i}: ${got.map((v) => v.toFixed(3))}`).toBeCloseTo(1, 3));
      expect(await call<number>(page, 'progress')).toBe(1);
      expect(await call<number>(page, 'completes')).toBe(1);
      expect(errors).toEqual([]);
    });
  }

  test('runs to the end when scrolled into view in steps', async ({ page }) => {
    await openFixture(page, 'autoplay.html?duration=600&poll=1');
    for (let y = 0; y <= 900; y += 60) {
      await call(page, 'scrollTo', y);
      await settle(page);
    }
    const got = await drawn(page, 3000);
    got.forEach((f) => expect(f).toBeCloseTo(1, 3));
  });
});
