import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, read, call } from './helpers';

/**
 * `scrollSnap` in real browsers.
 *
 * The lowest unit coverage of the untested APIs at 79% lines / 70% branches, and
 * the one place the plan singled out: `respectReducedMotion` was added in Phase 1
 * but only ever exercised against a stubbed `matchMedia`, so nothing had
 * confirmed that a real `prefers-reduced-motion: reduce` actually reaches it.
 * Playwright emulates the media query at the browser level, which is the real
 * thing.
 *
 * Fixture geometry (viewport 900x800): four 800px sections, so section i is at
 * exactly y = i * 800, and max scroll is 2400.
 */

type Row = { scrollY: number; index: number; snaps: number[] };

const SECTION = 800;
/** Snap duration in the fixture, plus the 100ms scroll debounce, plus slack. */
const SNAP_SETTLED = 900;

/** Wait for the scroll position to stop changing, then return it. */
async function settled(page: import('@playwright/test').Page): Promise<Row> {
  await page.waitForTimeout(SNAP_SETTLED);
  return read<Row>(page);
}

test.describe('scrollSnap', () => {
  test('loads and the fixture geometry is what the offsets assume', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'snap.html');
    expect(errors).toEqual([]);

    expect(
      await call<{ tops: number[]; viewport: number; maxScroll: number }>(page, 'geometry'),
    ).toEqual({ tops: [0, 800, 1600, 2400], viewport: 800, maxScroll: 2400 });
  });

  test('snapTo() lands exactly on a section boundary', async ({ page }) => {
    await openFixture(page, 'snap.html');

    await call(page, 'snapTo', 2);
    const row = await settled(page);

    // Exact, not approximate: landing 12px short of a section boundary is the
    // failure mode this API exists to prevent.
    expect(row.scrollY).toBe(2 * SECTION);
    expect(row.index).toBe(2);
    expect(row.snaps).toEqual([2]);
  });

  test('snapTo() clamps out-of-range indices', async ({ page }) => {
    await openFixture(page, 'snap.html');

    await call(page, 'snapTo', 99);
    let row = await settled(page);
    expect(row.scrollY).toBe(3 * SECTION);
    expect(row.index).toBe(3);

    await call(page, 'snapTo', -5);
    row = await settled(page);
    expect(row.scrollY).toBe(0);
    expect(row.index).toBe(0);
  });

  test('a nudge below the threshold snaps back', async ({ page }) => {
    await openFixture(page, 'snap.html');
    await call(page, 'clearSnaps');

    // threshold defaults to 0.3, so 0.15 of a section must not advance.
    await page.evaluate((y) => window.scrollTo(0, y), 0.15 * SECTION);
    const row = await settled(page);

    expect(row.scrollY, 'a small nudge should have snapped back to section 0').toBe(0);
    expect(row.index).toBe(0);
  });

  test('a scroll past the threshold snaps forward one section', async ({ page }) => {
    await openFixture(page, 'snap.html');
    await call(page, 'clearSnaps');

    // 0.5 of a section is past the 0.3 threshold.
    await page.evaluate((y) => window.scrollTo(0, y), 0.5 * SECTION);
    const row = await settled(page);

    expect(row.scrollY).toBe(SECTION);
    expect(row.index).toBe(1);
    // One step only — a threshold pass must not skip ahead.
    expect(row.snaps).toEqual([1]);
  });

  test('a long drag still advances only one section at a time', async ({ page }) => {
    await openFixture(page, 'snap.html');
    await call(page, 'clearSnaps');

    // Deliberately overshooting to near section 3 from section 0.
    await page.evaluate((y) => window.scrollTo(0, y), 2.4 * SECTION);
    const row = await settled(page);

    expect(row.index, 'snap advances one section per gesture').toBe(1);
    expect(row.scrollY).toBe(SECTION);
  });

  test('animates the snap when motion is allowed', async ({ page }) => {
    await openFixture(page, 'snap.html');

    // Read back inside the same task: an animated snap has not moved yet.
    const immediate = await call<{ scrollY: number; index: number }>(page, 'snapToSync', 2);
    expect(immediate.scrollY, 'snap jumped instantly with motion allowed').toBe(0);

    const row = await settled(page);
    expect(row.scrollY).toBe(2 * SECTION);
  });

  test('reduced motion snaps instantly instead of animating', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'snap.html');

    const immediate = await call<{ scrollY: number; index: number }>(page, 'snapToSync', 2);

    // Same call, same task, opposite result — the section is reached with no
    // animated scroll at all. Snapping still happens; only the motion is dropped.
    expect(immediate.scrollY, 'reduced motion should land immediately').toBe(2 * SECTION);
    expect(immediate.index).toBe(2);

    const row = await settled(page);
    expect(row.scrollY).toBe(2 * SECTION);
    expect(row.snaps).toEqual([2]);
  });

  test('reduced motion still honours the threshold on a real scroll', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'snap.html');
    await call(page, 'clearSnaps');

    await page.evaluate((y) => window.scrollTo(0, y), 0.5 * SECTION);
    const row = await settled(page);
    expect(row.scrollY).toBe(SECTION);
    expect(row.index).toBe(1);
  });

  test('destroy() stops snapping and leaves the scroll position alone', async ({ page }) => {
    await openFixture(page, 'snap.html');
    await call(page, 'destroySnap');
    await call(page, 'clearSnaps');

    const parked = 0.5 * SECTION;
    await page.evaluate((y) => window.scrollTo(0, y), parked);
    const row = await settled(page);

    expect(row.scrollY, 'a destroyed instance still snapped').toBe(parked);
    expect(row.snaps).toEqual([]);
  });
});
