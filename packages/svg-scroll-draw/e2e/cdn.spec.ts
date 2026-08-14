import { test, expect } from '@playwright/test';
import { settle } from './helpers';

/**
 * The two CDN builds, loaded the way the README says to load them: a plain
 * `<script src>` with no bundler anywhere.
 *
 * `IS_DEV` is derived from `process.env.NODE_ENV`, and `process` does not exist
 * in a browser without a bundler — so every warning this library has was
 * unreachable for exactly the users with the fewest other diagnostics. That is
 * how an API could be silently inert: `scrollHorizontal`'s zero-length trigger
 * window is reported as a dev warning, and a script-tag user could never see it.
 *
 * `svg-scroll-draw.dev.global.js` fixes that. This spec holds both halves: the
 * dev build warns, and the production build stays silent — including having the
 * warning strings dropped from the bundle rather than shipped and skipped.
 */

type Row = {
  globalPresent: boolean;
  exports: string[];
  customElementDefined: boolean;
  warnings: string[];
};

async function open(page: import('@playwright/test').Page, build: 'dev' | 'prod'): Promise<Row> {
  await page.goto(`/e2e/fixtures/cdn-dev.html?build=${build}`);
  await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true);
  await settle(page);
  return page.evaluate(() =>
    (window as unknown as { __probe: { read: () => Row } }).__probe.read(),
  );
}

test.describe('CDN builds', () => {
  test('the production build loads from a script tag and exposes the API', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const row = await open(page, 'prod');

    // Regression guard for `ReferenceError: process is not defined`, which is
    // what the guarded IS_DEV exists to prevent.
    expect(errors).toEqual([]);
    expect(row.globalPresent, 'window.SvgScrollDraw was not defined').toBe(true);
    // The CDN surface, pinned by name: a build that silently stopped exporting
    // one of these would still "load fine".
    expect(row.exports).toEqual(
      expect.arrayContaining(['scrollDraw', 'scrollAnimate', 'scrollParallax', 'scrollCounter', 'PRESETS']),
    );
    // The CDN entry also registers the web component as a side effect.
    expect(row.customElementDefined, '<scroll-draw> was not registered').toBe(true);
  });

  test('the production build says nothing', async ({ page }) => {
    const row = await open(page, 'prod');
    expect(
      row.warnings,
      'the production build warned; those strings should not even be in it',
    ).toEqual([]);
  });

  test('the dev build reports the problems the production build hides', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const row = await open(page, 'dev');
    expect(errors).toEqual([]);
    expect(row.globalPresent).toBe(true);

    // Two ordinary mistakes, each one a silent no-op in production.
    expect(row.warnings.join('\n')).toMatch(/no stroke/i);
    expect(row.warnings.join('\n')).toMatch(/not found/i);
    for (const w of row.warnings) expect(w).toContain('[svg-scroll-draw]');
  });

  test('the two builds are otherwise the same library', async ({ page }) => {
    const dev = await open(page, 'dev');
    const prod = await open(page, 'prod');
    expect(dev.exports, 'the dev build exports a different API surface').toEqual(prod.exports);
    expect(dev.customElementDefined).toBe(prod.customElementDefined);
  });
});
