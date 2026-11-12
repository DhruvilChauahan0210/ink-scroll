import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, read, call } from './helpers';

/**
 * `scrollSnap` where 2.23.3 went wrong, in real browsers. See
 * fixtures/snap-edges.html for the four setups and their geometry.
 *
 *  - It started at section 0 whatever the scroll position: created on
 *    section 2, a nudge snapped to section 1.
 *  - Each frame of its glide was a plain scroll write, which a page with
 *    `scroll-behavior: smooth` turns into a smooth scroll of its own.
 *  - In a container it measured from the border box: a 4px border landed every
 *    snap 4px past its section.
 *  - Offsets were not clamped to the scroll range, so on a page that ends
 *    before its last sections start, a snap there never arrived and the next
 *    scroll event sent it back.
 */

type Row = { scroll: number; index: number; snaps: number[]; at: number[] };

/** The 300ms snap, the 100ms scroll debounce, and slack. */
const SETTLED = 900;

async function settled(page: import('@playwright/test').Page): Promise<Row> {
  await page.waitForTimeout(SETTLED);
  return read<Row>(page);
}

test.describe('scrollSnap edges', () => {
  test('the fixture setups are what the offsets assume', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'snap-edges.html?mode=smooth');
    expect(await call(page, 'geometry')).toEqual({ max: 2400, behavior: 'smooth' });
    await openFixture(page, 'snap-edges.html?mode=border');
    expect(await call(page, 'geometry')).toEqual({ max: 1200, behavior: 'auto' });
    await openFixture(page, 'snap-edges.html?mode=short');
    expect(await call(page, 'geometry')).toEqual({ max: 1200, behavior: 'auto' });
    expect(errors).toEqual([]);
  });

  test('created on section 2, a nudge snaps back to section 2', async ({ page }) => {
    await openFixture(page, 'snap-edges.html?mode=start');
    expect((await read<Row>(page)).index).toBe(2);

    await call(page, 'scrollTo', 1700); // under the 0.3 threshold
    const row = await settled(page);
    expect(row.scroll).toBe(1600);
    expect(row.index).toBe(2);
  });

  test('on a page with scroll-behavior: smooth, the snap is where it says when it reports itself done', async ({ page }) => {
    await openFixture(page, 'snap-edges.html?mode=smooth');
    await call(page, 'snapTo', 2);
    const row = await settled(page);
    expect(row.snaps).toEqual([2]);
    expect(row.at, 'the glide lagged behind its own curve').toEqual([1600]);
    expect(row.scroll).toBe(1600);
  });

  test('in a container with a border, snaps land on the section, not past it', async ({ page }) => {
    await openFixture(page, 'snap-edges.html?mode=border');
    await call(page, 'snapTo', 1);
    let row = await settled(page);
    expect(row.scroll).toBe(600);
    expect(row.index).toBe(1);

    await call(page, 'scrollTo', 900); // past the threshold: on to section 2
    row = await settled(page);
    expect(row.scroll).toBe(1200);
    expect(row.index).toBe(2);
    expect(row.snaps).toEqual([1, 2]);
  });

  test('on a page that ends sooner, the last section becomes current and stays', async ({ page }) => {
    await openFixture(page, 'snap-edges.html?mode=short');
    await call(page, 'snapTo', 4);
    let row = await settled(page);
    expect(row.scroll).toBe(1200);
    expect(row.index).toBe(4);

    // A nudge under the threshold returns to it: measured from 1600, a page
    // that cannot scroll past 1200, it read as a scroll back past section 3.
    await call(page, 'scrollTo', 1150);
    row = await settled(page);
    expect(row.scroll).toBe(1200);
    expect(row.index, 'sent back from the last section').toBe(4);
    expect(row.snaps).toEqual([4, 4]);
  });

  // Without a doctype body scrolls the page, and the root's clientHeight is the
  // whole page: a range measured from the root was 0, so every snap went to 0.
  test('on a page in quirks mode, snaps land on their sections', async ({ page }) => {
    await openFixture(page, 'snap-quirks.html');
    expect(await call(page, 'geometry')).toEqual({ mode: 'BackCompat', max: 2400 });

    await call(page, 'scrollTo', 1100); // past the threshold: on to section 1
    let row = await settled(page);
    expect(row.scroll).toBe(800);
    expect(row.index).toBe(1);

    await call(page, 'snapTo', 3);
    row = await settled(page);
    expect(row.scroll).toBe(2400);
    expect(row.snaps).toEqual([1, 3]);
  });
});
