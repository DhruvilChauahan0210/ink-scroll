import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, call, settle } from './helpers';

/**
 * A staggered drawing finishes by the time the page cannot scroll any further.
 *
 * `stagger` starts path i's window i × stagger × range later, so the last path
 * ends past `trigger.end`. Near the bottom of a page that point can lie beyond
 * the furthest the page scrolls: measured on 2.19.0, with the page ending 200px
 * after `trigger.end`, the last two of four paths stopped at 0.5 and 0.75
 * drawn and `onComplete` never fired.
 *
 * Fixture (viewport 900x800): four paths, linear 'top bottom' -> 'top top' =
 * scroll 400 -> 1200, stagger 0.25, so path i's own window is
 * [400 + 200i, 1200 + 200i]. `?tail=` sets where the page ends.
 */

/** Path i's fraction drawn at scroll y with the stagger as written. */
const asWritten = (y: number, i: number, offset = 200) =>
  Math.min(1, Math.max(0, (y - 400 - offset * i) / 800));

/** Scroll to y in 50px steps, as a reader does, then read every path. */
async function at(page: Page, y: number): Promise<number[]> {
  let from = await call<number>(page, 'scrollY');
  while (from !== y) {
    from = from < y ? Math.min(y, from + 50) : Math.max(y, from - 50);
    await call(page, 'scrollTo', from);
    await settle(page);
  }
  return call<number[]>(page, 'fractions');
}

async function bottom(page: Page): Promise<number[]> {
  return at(page, await call<number>(page, 'maxScroll'));
}

test.describe('a staggered drawing near the end of the page', () => {
  test('with room to scroll, every path keeps the window it always had', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'stagger-end.html?tail=1400');
    expect(await call<number>(page, 'maxScroll')).toBe(2000);

    // In steps, as a reader scrolls: the drawing leaves the screen at 1400,
    // before the last two windows end.
    for (let y = 0; y <= 1800; y += 100) {
      const got = await at(page, y);
      got.forEach((f, i) => expect(f, `path ${i} at ${y}: ${got.map((v) => v.toFixed(3))}`).toBeCloseTo(asWritten(y, i), 2));
    }
    expect(await bottom(page)).toEqual([1, 1, 1, 1].map(() => expect.closeTo(1, 3)));
    expect(await call<number>(page, 'completes')).toBe(1);
    expect(errors).toEqual([]);
  });

  test('without room, the last path finishes where the page ends, still staggered', async ({ page }) => {
    await openFixture(page, 'stagger-end.html?tail=800');
    expect(await call<number>(page, 'maxScroll')).toBe(1400);

    // 200px of room after trigger.end, shared by three gaps: 66.7px apart.
    const got = await at(page, 1100);
    got.forEach((f, i) => expect(f, `path ${i}: ${got.map((v) => v.toFixed(3))}`).toBeCloseTo(asWritten(1100, i, 200 / 3), 2));
    expect(got[3]).toBeLessThan(got[0]);

    const end = await bottom(page);
    end.forEach((f, i) => expect(f, `path ${i} at the bottom: ${end.map((v) => v.toFixed(3))}`).toBeCloseTo(1, 2));
    expect(await call<number>(page, 'completes')).toBe(1);
  });

  test('the same inside a custom scroll container', async ({ page }) => {
    await openFixture(page, 'stagger-end.html?tail=800&container=1');
    expect(await call<number>(page, 'maxScroll')).toBe(1400);
    const end = await bottom(page);
    end.forEach((f, i) => expect(f, `path ${i}: ${end.map((v) => v.toFixed(3))}`).toBeCloseTo(1, 2));
    expect(await call<number>(page, 'completes')).toBe(1);
  });

  test('when the page grows, the stagger goes back to what was written', async ({ page }) => {
    await openFixture(page, 'stagger-end.html?tail=800');
    await call(page, 'growTail', 1400);
    await page.waitForTimeout(300); // the observer fires, then the 150ms re-measure
    const got = await at(page, 1500);
    got.forEach((f, i) => expect(f, `path ${i}: ${got.map((v) => v.toFixed(3))}`).toBeCloseTo(asWritten(1500, i), 2));
  });

  test('with the default trigger, the paths still drawing when it leaves the screen finish', async ({ page }) => {
    // 'top bottom' -> 'bottom top' is 400 -> 1400 and ends as the drawing leaves
    // the screen; with stagger 0.25 (offset 250px) the last window ends at 2150,
    // and tail=1800 lets the page scroll to 2400.
    // On 2.19.0 the engine stopped at the exit: paths 2 and 3 froze below 1 and
    // onComplete never fired, however far the page scrolled.
    await openFixture(page, 'stagger-end.html?tail=1800&trigger=default');
    const got = await at(page, 2000);
    got.forEach((f, i) => expect(f, `path ${i} at 2000: ${got.map((v) => v.toFixed(3))}`).toBeCloseTo(Math.min(1, (2000 - 400 - 250 * i) / 1000), 2));
    expect(await call<number>(page, 'completes')).toBe(0);
    await at(page, await call<number>(page, 'maxScroll'));
    expect(await call<number>(page, 'completes')).toBe(1);
  });

  test('a trigger whose own end is past the page is left as written', async ({ page }) => {
    // tail=400: the page scrolls to 1000, before trigger.end (1200). Nothing can
    // finish, with or without stagger, so the stagger is not the cause and stays.
    await openFixture(page, 'stagger-end.html?tail=400');
    const got = await bottom(page);
    got.forEach((f, i) => expect(f, `path ${i}: ${got.map((v) => v.toFixed(3))}`).toBeCloseTo(asWritten(1000, i), 2));
  });
});
