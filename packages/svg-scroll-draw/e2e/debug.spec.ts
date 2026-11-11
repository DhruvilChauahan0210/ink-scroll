import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, settle } from './helpers';

/**
 * `debug: true` draws the trigger window as two lines over the page
 * (debug.html: a drawing 1200px down, 200px tall, so the default window is
 * [400, 1400]). The JS engine draws them; the native CSS scroll-timeline path
 * does not. Up to 2.23.2 debug did not keep a drawing off that path, so with an
 * otherwise plain config it showed nothing in any browser with view timelines,
 * which is every engine here. Since 2.23.3 debug always runs on the JS engine.
 */

type Row = { scrollY: number; overlay: boolean; lines: number[]; labels: string; drawn: number; native: boolean };

test('debug: true draws the trigger lines, where the window is, as the page scrolls', async ({ page }) => {
  const errors = collectErrors(page);
  await openFixture(page, 'debug.html');

  let row = await read<Row>(page);
  expect(row.overlay, 'no overlay').toBe(true);
  expect(row.native).toBe(false);
  expect(row.labels).toContain('start');
  expect(row.labels).toContain('end');
  // A line sits at its trigger position minus the scroll: 400 and 1400 at 0.
  expect(row.lines).toEqual([400, 1400]);

  await scrollToY(page, 900);
  row = await read<Row>(page);
  expect(row.lines).toEqual([400 - 900, 1400 - 900]);
  // And the drawing follows the JS engine: half way through [400, 1400].
  expect(row.drawn).toBeCloseTo(0.5, 2);

  await call(page, 'destroy');
  await settle(page);
  expect(await call<number>(page, 'overlayCount')).toBe(0);
  expect(errors).toEqual([]);
});
