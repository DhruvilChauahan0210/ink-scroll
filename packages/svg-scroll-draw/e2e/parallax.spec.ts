import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, sweep, table } from './helpers';

/**
 * `scrollParallax` in real browsers.
 *
 * The only entry point in the library with no unit coverage at all, and the one
 * whose whole behaviour is derived from measured layout: travel distance is
 * `speed × element size`, taken from `getBoundingClientRect()` at construction.
 * In jsdom that measurement is 0, so the computed travel would be 0 and every
 * assertion about it would be trivially satisfied.
 *
 * Fixture geometry (viewport 900x800): targets are at document top 1200, 300 tall.
 * Default window `top bottom` → `bottom top`:
 *   tStart = 1200 - 800 = 400
 *   tEnd   = 1500 - 0   = 1500
 */

type T = { x: number; y: number; scaleX: number; scaleY: number };
type Row = { scrollY: number; half: T; negative: T; horizontal: T };

const T_START = 400;
const T_END = 1500;
const alphaAt = (y: number) => Math.min(1, Math.max(0, (y - T_START) / (T_END - T_START)));

/** speed 0.5 × 300px height. */
const TRAVEL_Y = 150;

test.describe('scrollParallax', () => {
  test('loads and the fixture geometry matches the assumed window', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'parallax.html');
    expect(errors).toEqual([]);

    const geo = await call<{ rowTop: number; height: number; width: number; viewport: number }>(
      page,
      'geometry',
    );
    expect(geo.rowTop).toBe(1200);
    expect(geo.height).toBe(300);
    expect(geo.viewport).toBe(800);
  });

  test('travel distance matches speed x height', async ({ page }) => {
    await openFixture(page, 'parallax.html');

    const offsets = [T_START, 600, 800, 1000, 1200, T_END];
    const rows = await sweep<Row>(page, offsets);
    const shown = table(
      rows.map((r) => ({
        y: r.scrollY,
        translateY: r.half.y,
        want: -TRAVEL_Y * alphaAt(r.scrollY),
      })),
    );

    for (const r of rows) {
      // Default easing is linear, so the expected value is exact rather than
      // merely monotonic — a wrong travel distance shows up immediately.
      expect(r.half.y, `travel wrong at y=${r.scrollY}\n${shown}`).toBeCloseTo(
        -TRAVEL_Y * alphaAt(r.scrollY),
        0,
      );
    }

    // Ends: undisplaced at the start of the window, full travel at the end.
    expect(rows[0].half.y, shown).toBeCloseTo(0, 0);
    expect(rows[rows.length - 1].half.y, shown).toBeCloseTo(-TRAVEL_Y, 0);
  });

  test('a negative speed reverses the direction', async ({ page }) => {
    await openFixture(page, 'parallax.html');
    await scrollToY(page, T_END);

    const row = await read<Row>(page);
    expect(row.half.y, 'positive speed should move the layer up').toBeCloseTo(-TRAVEL_Y, 0);
    expect(row.negative.y, 'negative speed should move the layer down').toBeCloseTo(TRAVEL_Y, 0);
    // Equal magnitude, opposite sign — not merely "some other number".
    expect(row.negative.y).toBeCloseTo(-row.half.y, 0);
  });

  test('axis: x translates horizontally by speed x width', async ({ page }) => {
    await openFixture(page, 'parallax.html');
    const geo = await call<{ width: number }>(page, 'geometry');

    await scrollToY(page, T_END);
    const row = await read<Row>(page);

    // The x-axis case must measure the element's width, not fall back to height.
    expect(row.horizontal.x, 'horizontal travel is not speed x width').toBeCloseTo(
      -0.5 * geo.width,
      0,
    );
    expect(row.horizontal.y, 'x-axis parallax should not move vertically').toBeCloseTo(0, 0);
    // And it must genuinely differ from the vertical case, since width != height.
    expect(Math.abs(row.horizontal.x)).not.toBeCloseTo(TRAVEL_Y, 0);
  });

  test('reverses on the way back up', async ({ page }) => {
    await openFixture(page, 'parallax.html');

    await scrollToY(page, T_END);
    expect((await read<Row>(page)).half.y).toBeCloseTo(-TRAVEL_Y, 0);

    // Parallax has no `once` latch — a background layer that froze on the way
    // back up would visibly detach from the content.
    await scrollToY(page, 800);
    const back = await read<Row>(page);
    expect(back.half.y).toBeCloseTo(-TRAVEL_Y * alphaAt(800), 0);
  });

  test('reduced motion leaves the layers at their final position', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'parallax.html');

    // Documenting the shared animate-engine behaviour: reduced motion applies the
    // final state and stops, rather than scrubbing with scroll.
    const row = await read<Row>(page);
    expect(row.scrollY).toBe(0);
    expect(row.half.y).toBeCloseTo(-TRAVEL_Y, 0);

    await scrollToY(page, 1000);
    const later = await read<Row>(page);
    expect(later.half.y, 'reduced motion still moved with scroll').toBeCloseTo(-TRAVEL_Y, 0);
  });

  test('destroy() restores the untransformed layer', async ({ page }) => {
    await openFixture(page, 'parallax.html');
    await scrollToY(page, 1000);

    expect((await read<Row>(page)).half.y).not.toBeCloseTo(0, 0);
    await call(page, 'destroyAll');

    const after = await read<Row>(page);
    expect(after.half.y, 'layer left displaced after destroy').toBeCloseTo(0, 0);
    expect(after.negative.y).toBeCloseTo(0, 0);
    expect(after.horizontal.x).toBeCloseTo(0, 0);
  });
});
