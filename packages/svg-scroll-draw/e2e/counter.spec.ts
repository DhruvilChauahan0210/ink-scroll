import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, sweep, table } from './helpers';

/**
 * `scrollCounter` in real browsers.
 *
 * Fixture geometry (viewport 900x800): the row sits at document top 1200 and the
 * default window is `top 80%` → `top 20%`, so the count runs from y=560 to y=1040.
 */

type Row = { scrollY: number; plain: string; decimals: string; formatted: string };

const START = 560;
const END = 1040;

test.describe('scrollCounter', () => {
  test('starts at the from-value with no placeholder flash', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'counter.html');
    expect(errors).toEqual([]);

    expect(await call<{ rowTop: number; viewport: number }>(page, 'geometry')).toEqual({
      rowTop: 1200,
      viewport: 800,
    });

    const row = await read<Row>(page);
    // The library replaces the markup's placeholder immediately on construction,
    // rather than leaving it visible until the first IntersectionObserver tick.
    expect(await call<string>(page, 'preInit')).toBe('–');
    expect(row.plain).toBe('0');
    expect(row.decimals).toBe('0.0');
    expect(row.formatted).toBe('$1,000');
  });

  test('counts to the target value and formats it correctly', async ({ page }) => {
    await openFixture(page, 'counter.html');

    const rows = await sweep<Row>(page, [START, 700, 850, 1000, END, 1200]);
    const shown = table(rows.map((r) => ({ y: r.scrollY, plain: r.plain, dec: r.decimals })));

    const final = rows[rows.length - 1];
    expect(final.plain, shown).toBe('1000');
    // toFixed(1) all the way to the end — not '99.5' by luck of rounding.
    expect(final.decimals, shown).toBe('99.5');
    // Custom format functions must survive to the final value too.
    expect(final.formatted, shown).toBe('$5,000');

    // Monotonic and genuinely partway through in the middle of the window.
    const numbers = rows.map((r) => Number(r.plain));
    for (let i = 1; i < numbers.length; i++) {
      expect(numbers[i], `count went backwards\n${shown}`).toBeGreaterThanOrEqual(numbers[i - 1]);
    }
    expect(numbers.filter((n) => n > 0 && n < 1000).length, `never mid-count\n${shown}`).toBeGreaterThanOrEqual(2);
  });

  test('every frame renders a well-formed value', async ({ page }) => {
    await openFixture(page, 'counter.html');
    // Park mid-count so the rAF loop is writing text every frame.
    await scrollToY(page, 800);

    const samples = await call<{ plain: string; decimals: string; formatted: string }[]>(
      page,
      'sampleFrames',
      30,
    );
    expect(samples.length).toBe(30);

    for (const [i, s] of samples.entries()) {
      // Exponential notation, NaN, undefined and negative zero are the classic
      // failures of interpolating a number into text; all are plain integers here.
      expect(s.plain, `frame ${i} rendered "${s.plain}"`).toMatch(/^\d+$/);
      expect(s.decimals, `frame ${i} rendered "${s.decimals}"`).toMatch(/^\d+\.\d$/);
      expect(s.formatted, `frame ${i} rendered "${s.formatted}"`).toMatch(/^\$[\d,]+$/);
    }

    // And the value must stay inside its declared range at every frame.
    const values = samples.map((s) => Number(s.plain));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThanOrEqual(1000);
  });

  test('holds the final value on the way back up (once: true)', async ({ page }) => {
    await openFixture(page, 'counter.html');

    await scrollToY(page, 1200);
    expect((await read<Row>(page)).plain).toBe('1000');

    await scrollToY(page, 800);
    const back = await read<Row>(page);
    expect(back.plain, 'once:true must not count back down').toBe('1000');
    expect(back.decimals).toBe('99.5');
  });

  test('reduced motion shows the final value without scrolling', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'counter.html');

    const row = await read<Row>(page);
    expect(row.scrollY).toBe(0);
    expect(row.plain).toBe('1000');
    expect(row.decimals).toBe('99.5');
    expect(row.formatted).toBe('$5,000');
  });

  test('destroy() stops updating the text', async ({ page }) => {
    await openFixture(page, 'counter.html');
    await scrollToY(page, 800);

    const before = await read<Row>(page);
    await call(page, 'destroyAll');
    await scrollToY(page, 1200);
    const after = await read<Row>(page);

    expect(after.plain, 'a destroyed counter kept counting').toBe(before.plain);
  });
});
