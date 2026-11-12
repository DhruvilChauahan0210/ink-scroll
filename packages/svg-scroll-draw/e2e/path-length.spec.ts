import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, read, call, settle } from './helpers';

/**
 * `scrollDraw` on a path with a `pathLength`.
 *
 * The browser reads stroke-dasharray and stroke-dashoffset in pathLength units
 * when the attribute is set, and the engine wrote user units: measured on
 * 2.23.3, a 280-unit line with pathLength="1" got a dash of 280, so it was
 * drawn whole by seek(0.004), and at seek(0.5) it was whole where the same line
 * without the attribute was half drawn.
 */

type Row = { plain: number; scaled: number; dash: number };

test.describe('scrollDraw with pathLength', () => {
  test('a line with pathLength="1" draws exactly as the same line without it', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'path-length.html');
    expect(errors).toEqual([]);

    for (const p of [0, 0.004, 0.25, 0.5, 0.75, 1]) {
      await call(page, 'seek', p);
      await settle(page);
      const row = await read<Row>(page);
      expect(row.plain, `plain at ${p}`).toBeCloseTo(p, 2);
      expect(row.scaled, `pathLength="1" at ${p}`).toBeCloseTo(p, 2);
      expect(row.dash, 'the dash is not in pathLength units').toBeCloseTo(1, 6);
    }
  });
});
