import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, sweep, table } from './helpers';

/**
 * `scrollProgress` in real browsers.
 *
 * The unit tests assert that `setProperty` was called with the right string. That
 * is not the same claim as "dependent CSS can use it", which is the entire reason
 * this API writes custom properties instead of styles — so the fixture drives two
 * real `calc()`-based widths off the variables and this spec measures the
 * resulting layout.
 *
 * Fixture geometry (viewport 900x800): #hero is at document top 1200 and 400 tall.
 * The default window is `top bottom` → `bottom top`, so:
 *   tStart = 1200 - 800 = 400   (hero top reaches the viewport bottom)
 *   tEnd   = 1600 - 0    = 1600 (hero bottom reaches the viewport top)
 */

type Row = {
  scrollY: number;
  raw: string | null;
  eased: string | null;
  barWidth: number;
  easedBarWidth: number;
  named: string | null;
  namedEased: string | null;
  lastReported: [number, number] | null;
  reportCount: number;
};

const T_START = 400;
const T_END = 1600;
const expectedRaw = (y: number) => Math.min(1, Math.max(0, (y - T_START) / (T_END - T_START)));

test.describe('scrollProgress', () => {
  test('loads and the fixture geometry matches the assumed window', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'progress.html');
    expect(errors).toEqual([]);

    expect(
      await call<{ heroTop: number; heroHeight: number; viewport: number }>(page, 'geometry'),
    ).toEqual({ heroTop: 1200, heroHeight: 400, viewport: 800 });
  });

  test('writes the raw progress accurately across the window', async ({ page }) => {
    await openFixture(page, 'progress.html');

    const offsets = [T_START, 600, 800, 1000, 1200, 1400, T_END];
    const rows = await sweep<Row>(page, offsets);
    const shown = table(
      rows.map((r) => ({ y: r.scrollY, raw: Number(r.raw), want: expectedRaw(r.scrollY) })),
    );

    for (const r of rows) {
      expect(Number(r.raw), `raw wrong at y=${r.scrollY}\n${shown}`).toBeCloseTo(
        expectedRaw(r.scrollY),
        2,
      );
    }
    expect(rows.filter((r) => Number(r.raw) > 0.05 && Number(r.raw) < 0.95).length).toBeGreaterThanOrEqual(3);
  });

  test('dependent CSS resolves the variables through calc()', async ({ page }) => {
    await openFixture(page, 'progress.html');

    const rows = await sweep<Row>(page, [T_START, 700, 1000, 1300, T_END]);
    const shown = table(
      rows.map((r) => ({ y: r.scrollY, raw: Number(r.raw), barWidth: r.barWidth })),
    );

    for (const r of rows) {
      // The bar is `calc(var(--scroll-progress) * 800px)`, so its measured width
      // is the browser's own reading of the variable.
      expect(r.barWidth, `bar width does not track the variable at y=${r.scrollY}\n${shown}`).toBeCloseTo(
        Number(r.raw) * 800,
        0,
      );
    }
    // Not vacuous: the bar must actually have grown from nothing to full width.
    expect(rows[0].barWidth, shown).toBeLessThanOrEqual(1);
    expect(rows[rows.length - 1].barWidth, shown).toBeCloseTo(800, 0);
  });

  test('the eased variable differs from the raw one and is also usable', async ({ page }) => {
    await openFixture(page, 'progress.html');

    // At 25% through an ease-in-out window the eased value is well below linear,
    // so an engine that wrote the same number to both variables fails here.
    await scrollToY(page, T_START + 0.25 * (T_END - T_START));
    const row = await read<Row>(page);

    expect(Number(row.raw)).toBeCloseTo(0.25, 2);
    expect(Number(row.eased), 'eased value equals the raw value').not.toBeCloseTo(0.25, 2);
    expect(row.easedBarWidth).toBeCloseTo(Number(row.eased) * 800, 0);

    // ease-in-out is below linear in the first half.
    expect(Number(row.eased)).toBeLessThan(0.25);
  });

  test('onProgress receives both values every frame', async ({ page }) => {
    await openFixture(page, 'progress.html');
    await scrollToY(page, 1000);

    const row = await read<Row>(page);
    expect(row.reportCount, 'onProgress never fired').toBeGreaterThan(0);
    expect(row.lastReported).not.toBeNull();
    const [raw, eased] = row.lastReported!;
    expect(raw).toBeCloseTo(Number(row.raw), 3);
    expect(eased).toBeCloseTo(Number(row.eased), 3);
  });

  test('honours a renamed variable and skips the eased one when null', async ({ page }) => {
    await openFixture(page, 'progress.html');
    await scrollToY(page, 1000);

    const row = await read<Row>(page);
    expect(row.named, '--my-progress was not written').not.toBeNull();
    expect(Number(row.named)).toBeGreaterThan(0);
    // easedVariable: null means "do not write it at all".
    expect(row.namedEased, 'eased variable written despite easedVariable: null').toBeNull();
  });

  test('clamps at both ends instead of overshooting', async ({ page }) => {
    await openFixture(page, 'progress.html');

    await scrollToY(page, 0);
    expect(Number((await read<Row>(page)).raw)).toBe(0);

    await scrollToY(page, T_END);
    expect(Number((await read<Row>(page)).raw)).toBe(1);

    // Past the end of the window the value must never exceed 1. It also stops
    // updating once the element is fully off screen, which is the same asymmetry
    // parity.spec.ts documents for scrollDraw: the JS engine only writes while
    // the IntersectionObserver reports the element visible. Not user-visible —
    // the element is off screen whenever it applies — so this asserts the bound
    // rather than pinning a particular resting value.
    await scrollToY(page, 2400);
    const past = await read<Row>(page);
    expect(Number(past.raw)).toBeLessThanOrEqual(1);
    expect(Number(past.raw)).toBeGreaterThanOrEqual(0);
  });

  test('destroy() removes the variables and stops writing', async ({ page }) => {
    await openFixture(page, 'progress.html');
    await scrollToY(page, 1000);

    const before = await read<Row>(page);
    expect(before.raw).not.toBeNull();

    await call(page, 'destroyHero');

    // Teardown is a clean removal, not a freeze: the properties this instance
    // added are taken back off the element, so dependent CSS falls back to its
    // own declarations rather than inheriting a stale progress value forever.
    const after = await read<Row>(page);
    expect(after.raw, 'custom property left behind after destroy').toBeNull();
    expect(after.eased).toBeNull();

    // And no further scrolling brings them back.
    await scrollToY(page, 1400);
    expect((await read<Row>(page)).raw, 'a destroyed instance kept writing').toBeNull();
  });
});
