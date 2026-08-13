import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, sweep, table } from './helpers';

/**
 * `scrollHorizontal` in real browsers.
 *
 * 100% line coverage in jsdom and none of it meaningful: the travel distance
 * defaults to `track.scrollWidth - window.innerWidth`, and in jsdom `scrollWidth`
 * is 0, so the engine was only ever tested translating a track by nothing.
 *
 * Fixture geometry (viewport 900x800), the CSS contract from the API's own JSDoc:
 *   #lead 800 · #outer 3200 (400vh) with a 800-tall sticky stage · 4 x 900px panels
 * Default trigger `top top` → `bottom bottom`:
 *   tStart = 800  (outer top reaches the viewport top)
 *   tEnd   = 800 + 3200 - 800 = 3200
 * Default distance = 3600 - 900 = 2700.
 */

type Row = {
  scrollY: number;
  x: number;
  progress: number;
  centredPanel: number;
  lastReported: number | null;
};

const T_START = 800;
const T_END = 3200;
const DISTANCE = 2700;
const alphaAt = (y: number) => Math.min(1, Math.max(0, (y - T_START) / (T_END - T_START)));

test.describe('scrollHorizontal', () => {
  test('loads and the sticky track geometry is what the offsets assume', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'horizontal.html');
    expect(errors).toEqual([]);

    expect(
      await call<Record<string, number>>(page, 'geometry'),
    ).toEqual({
      outerTop: 800,
      outerHeight: 3200,
      trackScrollWidth: 3600,
      viewportWidth: 900,
      viewportHeight: 800,
      expectedDistance: DISTANCE,
    });
  });

  test('translateX distance matches the sticky container width', async ({ page }) => {
    await openFixture(page, 'horizontal.html');

    const offsets = [T_START, 1200, 1800, 2400, 3000, T_END];
    const rows = await sweep<Row>(page, offsets);
    const shown = table(
      rows.map((r) => ({ y: r.scrollY, x: r.x, want: -DISTANCE * alphaAt(r.scrollY) })),
    );

    for (const r of rows) {
      // Default easing is linear, so this is exact: the whole point is that the
      // track travels its full content width and no further.
      expect(r.x, `travel wrong at y=${r.scrollY}\n${shown}`).toBeCloseTo(
        -DISTANCE * alphaAt(r.scrollY),
        0,
      );
    }
    expect(rows[0].x, shown).toBeCloseTo(0, 0);
    // Ends exactly flush: the last panel's right edge meets the viewport's.
    expect(rows[rows.length - 1].x, shown).toBeCloseTo(-DISTANCE, 0);
  });

  test('every panel becomes reachable as you scroll', async ({ page }) => {
    await openFixture(page, 'horizontal.html');

    const seen = new Set<number>();
    for (let y = T_START; y <= T_END; y += 100) {
      await scrollToY(page, y);
      seen.add((await read<Row>(page)).centredPanel);
    }

    // Measured from real panel rects, so it fails if the transform moves a
    // plausible-looking but wrong distance.
    expect([...seen].sort(), `panels reached: ${[...seen].join(',')}`).toEqual([0, 1, 2, 3]);
  });

  test('onProgress tracks the same 0 → 1 range', async ({ page }) => {
    await openFixture(page, 'horizontal.html');

    await scrollToY(page, 2000);
    const row = await read<Row>(page);
    expect(row.lastReported).not.toBeNull();
    expect(row.lastReported!).toBeCloseTo(alphaAt(2000), 2);
    expect(row.progress).toBeCloseTo(alphaAt(2000), 2);
  });

  test('reverses on the way back up', async ({ page }) => {
    await openFixture(page, 'horizontal.html');

    await scrollToY(page, T_END);
    expect((await read<Row>(page)).x).toBeCloseTo(-DISTANCE, 0);

    await scrollToY(page, 1800);
    expect((await read<Row>(page)).x).toBeCloseTo(-DISTANCE * alphaAt(1800), 0);
  });

  /**
   * The product decision from PHASE-2-PLAN.md open question 1.
   *
   * This transform is scroll-linked scrubbing, not autonomous motion: it advances
   * only as the user scrolls, 1:1 with their input. Applying a final state under
   * reduced motion — which is what the shared animate engine does by default, and
   * what this API used to inherit — parks the strip on its LAST panel and leaves
   * every other panel unreachable inside the sticky `overflow: hidden` container.
   * Hiding the content from the users who asked for less motion is worse than the
   * scrubbing, so `scrollHorizontal` defaults `respectReducedMotion` to false.
   */
  test('reduced motion keeps scrubbing rather than hiding panels', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'horizontal.html');

    // Not parked at the end before the user has scrolled anywhere.
    const start = await read<Row>(page);
    expect(start.scrollY).toBe(0);
    expect(start.x, 'reduced motion jumped the track to its final panel').toBeCloseTo(0, 0);
    expect(start.centredPanel).toBe(0);

    // And it still tracks scroll, so every panel remains reachable.
    await scrollToY(page, 2000);
    const mid = await read<Row>(page);
    expect(mid.x).toBeCloseTo(-DISTANCE * alphaAt(2000), 0);

    await scrollToY(page, T_END);
    const end = await read<Row>(page);
    expect(end.x).toBeCloseTo(-DISTANCE, 0);
    expect(end.centredPanel).toBe(3);
  });

  test('refresh() picks up a widened track', async ({ page }) => {
    await openFixture(page, 'horizontal.html');

    const { before, grown } = await call<{ before: number; grown: number }>(
      page,
      'refreshAfterGrow',
    );
    expect(before).toBe(DISTANCE);
    expect(grown).toBe(DISTANCE + 900);

    // The rebuilt engine must animate to the NEW distance, not the captured one.
    await scrollToY(page, T_END);
    const row = await read<Row>(page);
    expect(row.x, 'refresh() did not pick up the new width').toBeCloseTo(-(DISTANCE + 900), 0);
  });

  test('destroy() restores the untransformed track', async ({ page }) => {
    await openFixture(page, 'horizontal.html');
    await scrollToY(page, 2000);
    expect((await read<Row>(page)).x).not.toBeCloseTo(0, 0);

    await call(page, 'destroyTrack');
    expect((await read<Row>(page)).x, 'track left displaced after destroy').toBeCloseTo(0, 0);
  });
});
