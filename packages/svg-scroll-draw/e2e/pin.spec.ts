import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, sweep, table } from './helpers';

/**
 * `scrollPin` in real browsers.
 *
 * 89% line coverage in jsdom, and none of it could touch what pinning actually
 * is: `position: fixed` resolved by the browser, a wrapper that holds the pin
 * zone open without shifting the page, and boundaries computed from real
 * `getBoundingClientRect()` values rather than the zeros jsdom returns.
 *
 * Fixture geometry (viewport 900x800):
 *   #before 600  ·  #panel 400  ·  #after 2000
 *   pinDistance defaults to the viewport height, 800, so the wrapper is 1200 tall
 *
 * Therefore:
 *   before  y < 600          panel in flow
 *   pinned  600 <= y < 1400  panel fixed at viewport top
 *   after   y >= 1400        panel absolute at the wrapper's bottom
 *   progress = (y - 600) / 800
 */

type Row = {
  scrollY: number;
  progress: number;
  position: string;
  top: number;
  left: number;
  width: number;
  wrapperHeight: number | null;
  hasWrapper: boolean;
};

const PIN_START = 600;
const PIN_END = 1400;

test.describe('scrollPin', () => {
  test('injecting the wrapper does not shift the page', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'pin.html');
    expect(errors).toEqual([]);

    const { preInit, postInit } = await call<{
      preInit: { panelTop: number; markerTop: number; docHeight: number };
      postInit: { panelTop: number; markerTop: number; docHeight: number };
    }>(page, 'shift');

    // The pinned element and everything above it must not move.
    expect(postInit.panelTop, 'pinned element moved on init').toBe(preInit.panelTop);
    expect(postInit.markerTop, 'content above the pin moved on init').toBe(preInit.markerTop);

    // The document is *expected* to grow by exactly the pin distance — that is
    // the scroll room the pin consumes, not a bug. Asserting the amount keeps an
    // accidental double-count or a missing pin zone from slipping through.
    expect(postInit.docHeight - preInit.docHeight).toBe(800);
    expect((await read<Row>(page)).wrapperHeight).toBe(1200);
  });

  test('pins and unpins at the right boundaries', async ({ page }) => {
    await openFixture(page, 'pin.html');

    const offsets = [0, 300, 599, PIN_START + 5, 1000, PIN_END - 20, PIN_END + 40, 2000];
    const rows = await sweep<Row>(page, offsets);
    const shown = table(
      rows.map((r) => ({ y: r.scrollY, position: r.position, top: r.top, progress: r.progress })),
    );

    const at = (y: number) => rows[offsets.indexOf(y)];

    expect(at(0).position, `y=0\n${shown}`).toBe('static');
    expect(at(599).position, `y=599 is still before the pin zone\n${shown}`).toBe('static');
    expect(at(PIN_START + 5).position, `y=605 should be pinned\n${shown}`).toBe('fixed');
    expect(at(1000).position, `y=1000 should be pinned\n${shown}`).toBe('fixed');
    expect(at(PIN_END - 20).position, `y=1380 should still be pinned\n${shown}`).toBe('fixed');
    expect(at(PIN_END + 40).position, `y=1440 should have unpinned\n${shown}`).toBe('absolute');
    expect(at(2000).position, `y=2000\n${shown}`).toBe('absolute');
  });

  test('stays visually parked at the viewport top for the whole pin zone', async ({ page }) => {
    await openFixture(page, 'pin.html');

    // The point of pinning: the element does not move on screen while pinned.
    const rows = await sweep<Row>(page, [700, 850, 1000, 1150, 1300]);
    const shown = table(rows.map((r) => ({ y: r.scrollY, top: r.top, left: r.left, width: r.width })));

    for (const r of rows) {
      expect(r.top, `panel drifted at y=${r.scrollY}\n${shown}`).toBeCloseTo(0, 0);
    }
    // Fixed positioning takes the element out of flow, so the engine has to carry
    // the width across by hand or the panel collapses/expands the moment it pins.
    const widths = new Set(rows.map((r) => Math.round(r.width)));
    expect(widths.size, `width changed while pinned\n${shown}`).toBe(1);
    expect(rows[0].width).toBe(900);
  });

  test('progress runs 0 → 1 across the pin zone', async ({ page }) => {
    await openFixture(page, 'pin.html');

    const offsets = [0, PIN_START, 800, 1000, 1200, PIN_END, 1800];
    const rows = await sweep<Row>(page, offsets);
    const shown = table(rows.map((r) => ({ y: r.scrollY, progress: r.progress })));

    for (const r of rows) {
      const expected = Math.min(1, Math.max(0, (r.scrollY - PIN_START) / 800));
      expect(r.progress, `progress wrong at y=${r.scrollY}\n${shown}`).toBeCloseTo(expected, 2);
    }
    // Not vacuous: at least a few mid-zone readings.
    expect(rows.filter((r) => r.progress > 0.05 && r.progress < 0.95).length).toBeGreaterThanOrEqual(3);
  });

  test('fires the four lifecycle callbacks in order, both directions', async ({ page }) => {
    await openFixture(page, 'pin.html');
    await call(page, 'clearEvents');

    await scrollToY(page, 1000); // into the zone
    await scrollToY(page, 1600); // out the far end
    expect(await call<string[]>(page, 'events')).toEqual(['enter', 'leave']);

    await call(page, 'clearEvents');
    await scrollToY(page, 1000); // back into the zone from the end
    await scrollToY(page, 200); // out the near end
    expect(await call<string[]>(page, 'events')).toEqual(['enterBack', 'leaveBack']);
  });

  test('refresh() picks up a content height change immediately', async ({ page }) => {
    await openFixture(page, 'pin.html');

    const r = await call<{
      before: number;
      stale: number;
      after: number;
      panelHeight: number;
    }>(page, 'refreshAfterGrow', 700);

    expect(r.before).toBe(1200);
    expect(r.panelHeight).toBe(700);
    // Proves the measurement is meaningful: the wrapper really was stale before
    // refresh() ran, so `after` cannot be a value it already happened to hold.
    expect(r.stale, 'wrapper updated before refresh() was called').toBe(1200);
    expect(r.after, 'refresh() did not re-measure').toBe(700 + 800);
  });

  test('the ResizeObserver catches a height change without refresh()', async ({ page }) => {
    // Phase 1 added this observer and verified it only in Chromium, and only for
    // a document-level growth. Firefox and WebKit run it here too.
    await openFixture(page, 'pin.html');

    const immediate = await call<number>(page, 'growOnly', 700);
    expect(immediate, 'observer cannot have fired synchronously').toBe(1200);

    await expect
      .poll(() => call<number>(page, 'wrapperHeight'), { timeout: 2000 })
      .toBe(700 + 800);
  });

  test('destroy() unwraps and restores the element', async ({ page }) => {
    await openFixture(page, 'pin.html');
    await scrollToY(page, 1000); // destroy while actively pinned

    const before = await read<Row>(page);
    expect(before.position).toBe('fixed');

    const after = await call<{
      hasWrapper: boolean;
      inlinePosition: string;
      inlineTop: string;
      inlineWidth: string;
      parentId: string;
      docHeight: number;
    }>(page, 'destroyPin');

    expect(after.hasWrapper, 'wrapper left in the DOM').toBe(false);
    expect(after.inlinePosition, 'left pinned via inline position').toBe('');
    expect(after.inlineTop).toBe('');
    expect(after.inlineWidth).toBe('');
    // Back in its original parent, not orphaned into <body> at the wrong depth.
    expect(after.parentId).toBe('BODY');
    // And the pin zone's 800px of scroll room is handed back.
    expect(after.docHeight).toBe(3000);
  });
});
