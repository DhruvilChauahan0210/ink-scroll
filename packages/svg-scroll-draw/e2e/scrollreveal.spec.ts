import { test, expect, type Page } from '@playwright/test';
import { collectErrors, openFixture, call, converge, table } from './helpers';

/**
 * svg-scroll-draw/scrollreveal against ScrollReveal 4.0.9 itself.
 *
 * ScrollReveal works by writing inline styles — visibility, opacity, a
 * matrix3d() transform and a transition — so the strictest comparison is the
 * one this makes: at every scroll stop, each element's `style` attribute must be
 * byte-for-byte what ScrollReveal wrote, along with its `data-sr-id` and the
 * history of before/after reveal/reset callbacks. The plan in sr-markup.js
 * covers px, em and % distances (including ScrollReveal's one-decimal parse),
 * every origin, opacity, scale (zero included), rotation, an author's own
 * inline style and transition, reset, a sequence, viewFactor / viewOffset,
 * useDelay 'once' and cleanup.
 *
 * ScrollReveal is GPL-3.0, so it is not committed: build-fixtures.mjs copies it
 * from the devDependency into the gitignored fixtures/build/.
 */

type Row = Record<string, { style: string | null; srId: string | null }>;
type Events = Record<string, string[]>;

const STEP = 350;
/** Past the longest chain in the plan: sequence steps, delay, duration, callback timers. */
const SETTLE = 900;

async function scrollBoth(a: Page, b: Page, y: number): Promise<void> {
  await Promise.all([a, b].map((p) => p.evaluate((to) => window.scrollTo(0, to), y)));
  await a.waitForTimeout(SETTLE);
}

function route(max: number): number[] {
  const down: number[] = [];
  for (let y = 0; y <= max; y += STEP) down.push(y);
  down.push(max);
  return [...down, ...down.slice(0, -1).reverse()];
}

async function pair(browser: import('@playwright/test').Browser, other = 'sr-ours.html') {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 800 } });
  const real = await ctx.newPage();
  const ours = await ctx.newPage();
  const errors = [...collectErrors(real), ...collectErrors(ours)];
  await openFixture(real, 'sr-real.html');
  await openFixture(ours, other);
  return { ctx, real, ours, errors };
}

test('writes exactly what ScrollReveal 4.0.9 writes, at every scroll stop', async ({ browser }) => {
  // ~27 stops down and back, each waiting out sequences and callback timers.
  test.setTimeout(120_000);
  const { ctx, real, ours, errors } = await pair(browser);
  const max = await call<number>(ours, 'max');
  expect(await call<number>(real, 'max'), 'the two layouts differ, so nothing below is comparable').toBe(max);

  const mismatches: Record<string, unknown>[] = [];
  for (const y of route(max)) {
    await scrollBoth(real, ours, y);
    const [r, o] = await converge<Row>(real, ours, 'read');
    for (const id of Object.keys(r)) {
      if (r[id].style !== o[id].style || r[id].srId !== o[id].srId) {
        mismatches.push({ y, id, scrollreveal: r[id].style, ours: o[id].style, ids: `${r[id].srId}/${o[id].srId}` });
      }
    }
  }
  expect(mismatches, `inline styles differ from ScrollReveal:\n${table(mismatches)}`).toEqual([]);
  expect(await call<Events>(ours, 'events'), 'callback history differs').toEqual(await call<Events>(real, 'events'));
  expect(await call(ours, 'root')).toEqual(await call(real, 'root'));
  expect(errors).toEqual([]);
  await ctx.close();
});

test('the script-tag build defines window.ScrollReveal as the function', async ({ browser }) => {
  const { ctx, real, ours: cdn, errors } = await pair(browser, 'sr-cdn.html');
  expect(await cdn.evaluate(() => typeof (window as unknown as { ScrollReveal: unknown }).ScrollReveal)).toBe('function');
  const max = await call<number>(cdn, 'max');
  for (const y of [0, Math.round(max / 2), max]) {
    await scrollBoth(real, cdn, y);
    const [r, c] = await converge<Row>(real, cdn, 'read');
    expect(c).toEqual(r);
  }
  expect(errors).toEqual([]);
  await ctx.close();
});

test('reduced motion shows every element in its final state, with no transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'sr-ours.html');
  await page.waitForTimeout(100);
  const rows = await call<Row>(page, 'read');
  for (const [id, row] of Object.entries(rows)) {
    expect(row.style, `${id} should be visible with no transition`).toContain('visibility: visible');
    expect(row.style, id).toContain('transition: none');
    expect(row.style, id).not.toContain('opacity: 0;');
  }
});
