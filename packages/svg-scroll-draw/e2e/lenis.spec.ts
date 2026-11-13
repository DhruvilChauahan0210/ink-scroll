import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, read, call } from './helpers';

/**
 * `svg-scroll-draw/lenis` against the real built bundle.
 *
 * `scrollY` and `pageYOffset` are the browser's own accessors on the window
 * object (Window is a [Global] interface), so before 2.26.0 `destroy()`'s
 * `delete window.scrollY` deleted the browser's property along with the
 * override: `window.scrollY` was undefined for the rest of the page in all
 * three engines. jsdom models them as plain data properties, which is why this
 * belongs here as well as in the unit suite.
 */

type Row = {
  scrollY: number;
  pageYOffset: number;
  scrollYType: string;
  real: number;
  ownScrollY: boolean;
};

test.describe('createLenisAdapter', () => {
  test('destroy() gives back a window.scrollY that follows the real scroll', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'lenis.html');
    const before = await read<Row>(page);

    await call(page, 'create');
    await call(page, 'emit', 640);
    let row = await read<Row>(page);
    expect(row.scrollY).toBe(640);
    expect(row.pageYOffset).toBe(640);

    await call(page, 'destroy');
    row = await read<Row>(page);
    expect(row.scrollYType).toBe('number');
    expect(row.ownScrollY).toBe(before.ownScrollY);
    expect(row.scrollY).toBe(row.real);

    await call(page, 'scrollTo', 900);
    row = await read<Row>(page);
    expect(row.real).toBeGreaterThan(0);
    expect(row.scrollY).toBe(row.real);
    expect(row.pageYOffset).toBe(row.real);

    await call(page, 'scrollTo', 300);
    row = await read<Row>(page);
    expect(row.scrollY).toBe(row.real);
    expect(errors).toEqual([]);
  });
});
