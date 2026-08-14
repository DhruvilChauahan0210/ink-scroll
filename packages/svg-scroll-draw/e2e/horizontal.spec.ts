import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, sweep, settle, table } from './helpers';

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

/**
 * The same API driven by a custom `scrollContainer` rather than the window.
 *
 * Fixture: a 700x600 `overflow: auto` container — deliberately narrower than the
 * 900px viewport — holding the documented sticky arrangement. Inside it the
 * trigger window is 600 → 2400 in container scroll units.
 */
type ContainerRow = { scrollTop: number; x: number; progress: number; centredPanel: number };
type ContainerGeometry = {
  trackScrollWidth: number;
  containerClientWidth: number;
  containerClientHeight: number;
  windowInnerWidth: number;
  expectedDistance: number;
  windowBasedDistance: number;
};

const C_START = 600;
const C_END = 2400;
const cAlphaAt = (top: number) => Math.min(1, Math.max(0, (top - C_START) / (C_END - C_START)));

/** Scroll the fixture's container (not the page) and settle two frames. */
async function scrollContainer(page: import('@playwright/test').Page, top: number): Promise<void> {
  await call(page, 'scrollContainerTo', top);
  await settle(page);
}

test.describe('scrollHorizontal inside a scroll container', () => {
  test('loads, and the container is genuinely narrower than the window', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'horizontal-container.html');
    expect(errors).toEqual([]);

    const geo = await call<ContainerGeometry>(page, 'geometry');
    expect(geo.trackScrollWidth).toBe(2800);
    expect(geo.containerClientHeight).toBe(600);
    expect(geo.windowInnerWidth).toBe(900);
    // Not asserted as a constant: scrollbar width differs per engine, which is
    // exactly why the expectation is computed in the page.
    expect(geo.containerClientWidth).toBeLessThanOrEqual(700);
    expect(
      geo.expectedDistance,
      'the two candidate distances are identical — this fixture proves nothing',
    ).not.toBe(geo.windowBasedDistance);
  });

  /**
   * The defect this fixture exists for: the default `distance` subtracted
   * `window.innerWidth` whatever the caller scrolled. Inside a container narrower
   * than the window that overshoots — the strip runs past the last panel and
   * parks on empty space — and every nested-container caller had to pass
   * `distance` by hand, which is not what the option's default claims.
   */
  test('default distance is measured against the container, not the window', async ({ page }) => {
    await openFixture(page, 'horizontal-container.html');
    const geo = await call<ContainerGeometry>(page, 'geometry');

    await scrollContainer(page, C_END);
    const end = await read<ContainerRow>(page);

    expect(
      end.x,
      `travelled ${(-end.x).toFixed(0)}px; container-based is ${geo.expectedDistance}, ` +
        `window-based is ${geo.windowBasedDistance}`,
    ).toBeCloseTo(-geo.expectedDistance, 0);

    // Ends flush: the last panel's right edge meets the container's, with no
    // empty space dragged in behind it.
    expect(end.centredPanel).toBe(3);
  });

  test('scrubs across the container’s own trigger window', async ({ page }) => {
    await openFixture(page, 'horizontal-container.html');
    const geo = await call<ContainerGeometry>(page, 'geometry');

    for (const top of [C_START, 1050, 1500, 1950, C_END]) {
      await scrollContainer(page, top);
      const row = await read<ContainerRow>(page);
      expect(row.scrollTop, 'the container did not scroll where it was told').toBe(top);
      expect(row.x, `at container scrollTop=${top}`).toBeCloseTo(
        -geo.expectedDistance * cAlphaAt(top),
        0,
      );
    }
  });

  test('every panel becomes reachable inside the container', async ({ page }) => {
    await openFixture(page, 'horizontal-container.html');

    const seen = new Set<number>();
    for (let top = C_START; top <= C_END; top += 100) {
      await scrollContainer(page, top);
      seen.add((await read<ContainerRow>(page)).centredPanel);
    }
    expect([...seen].sort(), `panels reached: ${[...seen].join(',')}`).toEqual([0, 1, 2, 3]);
  });

  /**
   * Re-measuring must not move the window. `cacheTriggers()` runs again on every
   * resize, and for a custom scroll container it composes the element's offset
   * inside the scroll content — which already includes the scroll position — with
   * the scroll position a second time. At scrollTop 0 the two agree, so this only
   * shows up after the user has scrolled and something re-measures.
   */
  test('re-measuring while scrolled does not shift the trigger window', async ({ page }) => {
    await openFixture(page, 'horizontal-container.html');
    const geo = await call<ContainerGeometry>(page, 'geometry');

    await scrollContainer(page, 1500);
    const before = await read<ContainerRow>(page);
    expect(before.x).toBeCloseTo(-geo.expectedDistance * cAlphaAt(1500), 0);

    // The listener the engine actually subscribes to, so no layout changes and
    // nothing else can explain a difference.
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(250); // the re-measure is debounced by 150ms
    await settle(page);

    const after = await read<ContainerRow>(page);
    expect(
      after.x,
      `re-measure moved the track from ${before.x.toFixed(1)} to ${after.x.toFixed(1)} ` +
        `without any scrolling`,
    ).toBeCloseTo(before.x, 0);
  });
});
