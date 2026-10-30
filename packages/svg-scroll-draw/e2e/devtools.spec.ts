import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, read, call } from './helpers';

/**
 * `svg-scroll-draw/devtools` against the real built bundles.
 *
 * The defect this pins could not be seen from jsdom running src/: there, every
 * import shares one copy of core/registry.ts. In dist/, each entry point inlines
 * its own copy, so instances created through `/dist/index.mjs` or
 * `/dist/group/index.mjs` registered into Maps that `/dist/devtools/index.mjs`
 * never read — and `scrollDraw`, the flagship API, did not register at all. The
 * fixture loads all three bundles as separate modules, exactly as an app would.
 *
 * Chromium takes the native CSS path for both `scrollDraw` and `scrollAnimate`
 * here (default trigger, CSS-expressible easing); Firefox and WebKit take the JS
 * path. Both paths have to register, so all three browsers are meaningful.
 */

type Row = { mounted: boolean; rows: string[]; text: string };

const EXPECTED = ['draw #draw', 'animate #fade', 'counter #count', 'draw #g1', 'draw #g2'];

test.describe('devtools', () => {
  test('lists instances created through other bundles', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'devtools.html');

    // The shared registry, as every bundle sees it.
    expect((await call<string[] | null>(page, 'shared'))?.sort()).toEqual([...EXPECTED].sort());

    await call(page, 'enable');
    const panel = await read<Row>(page);
    expect(panel.mounted).toBe(true);
    expect(panel.text).not.toContain('No active instances');
    expect(panel.rows.sort()).toEqual([...EXPECTED].sort());
    expect(errors).toEqual([]);
  });

  test('destroy() takes every instance back out of devtools', async ({ page }) => {
    await openFixture(page, 'devtools.html');
    await call(page, 'enable');
    expect((await read<Row>(page)).rows).toHaveLength(EXPECTED.length);

    await call(page, 'destroyAll');
    expect(await call<string[]>(page, 'shared')).toEqual([]);
    const panel = await read<Row>(page);
    expect(panel.rows).toEqual(['No active instances.']);
  });
});
