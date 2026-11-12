import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, read, call, settle, table } from './helpers';

/**
 * The React pieces the shared framework contract does not reach.
 *
 * `useScrollDrawProgress` with a `scrollContainer`, in real browsers.
 *
 * Up to 2.23.3 the hook added the panel's viewport top to the container's
 * scrollTop, leaving out where the container sits on the page, and its border.
 * Measured in Chromium: a panel 400px down read 0, 0, 0.192, 0.442, 0.692 at the
 * points where scrollProgress read 0, 0.25, 0.5, 0.75, 1, and never reached 1.
 * It measures as the engines do now, and follows the layout as they do.
 *
 * Fixture geometry: the container is 400px tall inside a 20px border, 400px
 * down the page; the panel is 200px tall and 600px into its content. The
 * default window, in the container's scrollTop, is [200, 800].
 */

type Row = { scrollTop: number; progress: number };

async function at(page: import('@playwright/test').Page, y: number): Promise<Row> {
  await call(page, 'scrollBox', y);
  await settle(page);
  await settle(page); // the frame the hook sets state in, then React's render
  return read<Row>(page);
}

test.describe('useScrollDrawProgress in a scroll container', () => {
  test('the fixture geometry matches the assumed window', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'react-extras.html');
    expect(errors).toEqual([]);
    expect(await call(page, 'geometry')).toEqual({ boxTop: 400, clientHeight: 400, panelInContent: 600 });
  });

  test('reads 0 to 1 across its window, as the engines do', async ({ page }) => {
    await openFixture(page, 'react-extras.html');
    const rows: Row[] = [];
    for (const y of [200, 350, 500, 650, 800]) rows.push(await at(page, y));
    const shown = table(rows);
    rows.forEach((r, i) => expect(r.progress, shown).toBeCloseTo(i / 4, 2));
  });

  test('follows content that arrives above it', async ({ page }) => {
    await openFixture(page, 'react-extras.html');
    await call(page, 'growAbove', 800); // window [400, 1000]
    await page.waitForTimeout(300); // the re-measure is debounced
    expect((await at(page, 700)).progress).toBeCloseTo(0.5, 2);
  });
});

// <ScrollVideo> rendered preload="auto" whatever the options said, and
// scrollVideo leaves a preload attribute the page set alone, so the `preload`
// option never applied; and it had no way to pass a poster.
test.describe('<ScrollVideo> attributes', () => {
  test('preload follows the option, and poster reaches the video', async ({ page }) => {
    await openFixture(page, 'react-extras.html');
    expect(await call(page, 'video')).toEqual({ preload: 'metadata', poster: '/e2e/fixtures/poster.png' });
  });
});
