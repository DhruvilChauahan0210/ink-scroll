import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, call, settle } from './helpers';

/**
 * Every scroll-linked engine follows a layout change that is not a resize.
 *
 * Each engine measured its trigger window once and re-measured it only on a
 * window resize. Content that grows above the element afterwards — an image
 * loading, a font swapping in, an accordion opening — moves the element and
 * fires no resize. Measured on 2.18.1 with 480px arriving 800ms after init:
 * scrollReveal fully revealed where it should start, scrollAnimate's JS path
 * at 0.72 instead of 0, scrollCounter on its final value instead of its first.
 *
 * Fixture (viewport 900x800): one element per engine, each on the same linear
 * 'top bottom' -> 'top top' window, so its progress is 0.5 exactly when its
 * top is halfway up the screen. grow(480) inserts 480px above all of them.
 * With a stale window every one of them reads 1 at that point.
 */

const HALF = 400; // the element's top this far below the viewport top: progress 0.5

async function names(page: import('@playwright/test').Page): Promise<string[]> {
  return call<string[]>(page, 'names');
}

async function progressAtHalfway(page: import('@playwright/test').Page, name: string): Promise<number> {
  const top = await call<number>(page, 'top', name);
  await scrollToY(page, top - HALF);
  await page.waitForTimeout(120); // the video seeks; the others settle in two frames
  await settle(page);
  return call<number>(page, 'progress', name);
}

test.describe('engines follow layout changes that are not a resize', () => {
  test('the fixture: each engine reads 0.5 halfway, with nothing moved', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'late-layout.html');
    for (const name of await names(page)) {
      expect(await progressAtHalfway(page, name), name).toBeCloseTo(0.5, 1);
    }
    expect(errors).toEqual([]);
  });

  test('content growing above every engine moves their windows with it', async ({ page }) => {
    await openFixture(page, 'late-layout.html');
    await call(page, 'grow', 480);
    await page.waitForTimeout(300); // observers fire, then the 150ms re-measure

    const got: Record<string, number> = {};
    for (const name of await names(page)) got[name] = await progressAtHalfway(page, name);

    for (const [name, p] of Object.entries(got)) {
      expect(p, `${name} read ${p.toFixed(3)} halfway after the layout moved 480px; all: ${JSON.stringify(got)}`).toBeCloseTo(0.5, 1);
    }
  });

  /**
   * scrollReveal's fade-up starts 32px down. The first measurement ran before any
   * frame was written, so it saw the element where the page put it; a re-measure
   * that saw the engine's own translateY started the fade 32px late — 0.46 here
   * instead of 0.5 — and a resize had always done the same.
   */
  test('a re-measure leaves out the element’s own transform', async ({ page }) => {
    await openFixture(page, 'late-layout.html');
    expect(await progressAtHalfway(page, 'revealup'), 'before any re-measure').toBeCloseTo(0.5, 2);

    await scrollToY(page, 0);
    await call(page, 'grow', 480);
    await page.waitForTimeout(300);
    expect(await progressAtHalfway(page, 'revealup'), 'after the layout moved').toBeCloseTo(0.5, 2);
  });
});

/**
 * Growth that resizes neither body nor the element. Inside a custom scroll
 * container body keeps its size, and on a page with `html, body { height: 100% }`
 * body is one screen tall whatever its content does — so watching body and the
 * element alone heard nothing. The boxes above the element are watched too.
 */
for (const mode of ['container', 'full']) {
  test(`content growing above, with body unchanged (${mode})`, async ({ page }) => {
    await openFixture(page, `late-layout-boxes.html?mode=${mode}`);
    const body = await call<number>(page, 'bodyHeight');
    await call(page, 'grow', 480);
    await page.waitForTimeout(300);
    expect(await call<number>(page, 'bodyHeight'), 'body grew, so this proves nothing').toBe(body);

    await call(page, 'halfway');
    await settle(page);
    expect(await call<number>(page, 'progress')).toBeCloseTo(0.5, 1);
  });
}
