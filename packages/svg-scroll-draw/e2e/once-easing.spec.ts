import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, sweep, scrollToY, read, table } from './helpers';

/**
 * `once: true` with an easing that overshoots (elastic) or dips (bounce), in
 * real browsers (once-easing.html: a drawing, a moving box and a counter side
 * by side, all with once).
 *
 * Up to 2.23.2 scrollDraw, scrollAnimate (so scrollReveal) and scrollCounter
 * held the EASED value with Math.max. Elastic peaks near 1.27 about a sixth of
 * the way in, and each stayed there for good: measured in Chromium on 2.23.2,
 * the drawing ended 1.274 drawn, the box 27px past its "to" and the counter on
 * 1273 of 1000. Bounce, which dips below 1 and comes back, never dipped.
 * scrollText always held the raw progress and eased after; since 2.23.3 they
 * all do.
 */

type Api = 'draw' | 'animate' | 'counter';
type Row = { scrollY: number } & Record<Api, number>;

const LABEL: Record<Api, string> = { draw: 'scrollDraw', animate: 'scrollAnimate', counter: 'scrollCounter' };

/** Forward through every window ([400, 1400] and the counter's [560, 1040]) in 10px steps. */
const FORWARD = Array.from({ length: 101 }, (_, i) => 400 + i * 10);

async function forward(page: Page, easing: string): Promise<Row[]> {
  await openFixture(page, `once-easing.html?easing=${easing}`);
  return sweep<Row>(page, FORWARD);
}

const shown = (rows: Row[], api: Api) => table(rows.map((r) => ({ y: r.scrollY, [api]: r[api] })));

for (const api of ['draw', 'animate', 'counter'] as const) {
  test.describe(LABEL[api], () => {
    test(`${LABEL[api]}: once with elastic overshoots on the way and ends exactly on its target`, async ({ page }) => {
      const errors = collectErrors(page);
      const rows = await forward(page, 'elastic');
      const values = rows.map((r) => r[api]);
      expect(Math.max(...values), `never overshot\n${shown(rows, api)}`).toBeGreaterThan(1.1);
      // Past the window, and back up: held exactly at the target.
      await scrollToY(page, 1500);
      expect((await read<Row>(page))[api], shown(rows, api)).toBeCloseTo(1, 3);
      await scrollToY(page, 600);
      expect((await read<Row>(page))[api]).toBeCloseTo(1, 3);
      expect(errors).toEqual([]);
    });

    test(`${LABEL[api]}: once with bounce keeps its dips while scrolling forward`, async ({ page }) => {
      const rows = await forward(page, 'bounce');
      const values = rows.map((r) => r[api]);
      const dips = values.filter((v, i) => i > 0 && v < values[i - 1] - 0.005).length;
      expect(dips, `never dipped\n${shown(rows, api)}`).toBeGreaterThan(0);
      expect(values[values.length - 1]).toBeCloseTo(1, 3);
    });
  });
}
