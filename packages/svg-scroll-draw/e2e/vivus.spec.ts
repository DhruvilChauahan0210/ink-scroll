import { test, expect, type Page } from '@playwright/test';
import { collectErrors, openFixture, call, table } from './helpers';

/**
 * svg-scroll-draw/vivus against vivus 0.4.6 itself.
 *
 * vivus renders by rewriting the SVG: shapes become <path>s, and each path gets
 * a stroke-dasharray and a stroke-dashoffset per frame. So the comparison is the
 * SVG markup itself — every `d` string and every dash style — byte for byte,
 * across nine configurations covering every animation type, scenario
 * attributes, reverseStack, dashGap, both timing functions and data-ignore,
 * plus vivus's own frame maths (frameLength, delayUnit, each path's length,
 * start and duration).
 *
 * vivus is MIT; it is still a devDependency copied into the gitignored
 * fixtures/build/ at test time, like the ScrollReveal reference, rather than
 * committed.
 */

type Markup = Record<string, string>;

async function open(page: Page, file: string, start = 'manual'): Promise<void> {
  await openFixture(page, `${file}?start=${start}`);
}

async function pair(browser: import('@playwright/test').Browser, other = 'vivus-ours.html', start = 'manual') {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 800 } });
  const real = await ctx.newPage();
  const ours = await ctx.newPage();
  const errors = [...collectErrors(real), ...collectErrors(ours)];
  await open(real, 'vivus-real.html', start);
  await open(ours, other, start);
  return { ctx, real, ours, errors };
}

function diff(a: Markup, b: Markup, label: string): Record<string, unknown>[] {
  return Object.keys(a)
    .filter((id) => a[id] !== b[id])
    .map((id) => ({ at: label, svg: id, vivus: a[id].slice(0, 160), ours: (b[id] ?? '').slice(0, 160) }));
}

test('same paths, dashes and frame maths as vivus 0.4.6 at every progress point', async ({ browser }) => {
  const { ctx, real, ours, errors } = await pair(browser);

  expect(await call(ours, 'model'), 'frameLength / delayUnit / per-path timing differ').toEqual(await call(real, 'model'));

  const mismatches: Record<string, unknown>[] = [];
  mismatches.push(...diff(await call<Markup>(real, 'read'), await call<Markup>(ours, 'read'), 'after init'));
  for (const p of [0, 0.05, 0.1, 0.25, 0.33, 0.5, 0.66, 0.8, 0.95, 0.999, 1]) {
    await Promise.all([real, ours].map((pg) => call(pg, 'seek', p)));
    mismatches.push(...diff(await call<Markup>(real, 'read'), await call<Markup>(ours, 'read'), `p=${p}`));
  }
  expect(mismatches, `SVG markup differs from vivus:\n${table(mismatches)}`).toEqual([]);
  expect(errors).toEqual([]);
  await ctx.close();
});

test('play() runs to the end and back like vivus, with the same callbacks', async ({ browser }) => {
  const { ctx, real, ours, errors } = await pair(browser);

  // Fast enough that the longest config (scenario-sync, ~920 frames) ends quickly.
  await Promise.all([real, ours].map((pg) => call(pg, 'play', 25)));
  for (const pg of [real, ours]) {
    await expect.poll(async () => (await call<{ all: string[] }>(pg, 'status')).all.every((s) => s === 'end')).toBe(true);
  }
  expect(await call<Markup>(ours, 'read')).toEqual(await call<Markup>(real, 'read'));
  expect(await call(ours, 'done')).toEqual(await call(real, 'done'));

  // Backwards to the start: vivus resets and fires the callback again.
  await Promise.all([real, ours].map((pg) => call(pg, 'play', -30)));
  for (const pg of [real, ours]) {
    await expect.poll(async () => (await call<{ all: string[] }>(pg, 'status')).all.every((s) => s === 'start')).toBe(true);
  }
  expect(await call<Markup>(ours, 'read')).toEqual(await call<Markup>(real, 'read'));
  expect(await call(ours, 'done')).toEqual(await call(real, 'done'));
  expect(errors).toEqual([]);
  await ctx.close();
});

test("start: 'inViewport' waits until the whole SVG is in view", async ({ browser }) => {
  const { ctx, real, ours } = await pair(browser);
  for (const pg of [real, ours]) expect((await call<{ late: string }>(pg, 'status')).late).toBe('start');

  // #late sits at y≈2800, 400 tall, in an 800px viewport. Partly in view at
  // 2200; vivus needs its full height (h = 1), so neither may start yet.
  await Promise.all([real, ours].map((pg) => pg.evaluate(() => window.scrollTo(0, 2200))));
  await real.waitForTimeout(300);
  for (const pg of [real, ours]) expect((await call<{ late: string }>(pg, 'status')).late).toBe('start');

  await Promise.all([real, ours].map((pg) => pg.evaluate(() => window.scrollTo(0, 2500))));
  for (const pg of [real, ours]) {
    await expect.poll(async () => (await call<{ late: string }>(pg, 'status')).late).toBe('end');
  }
  expect((await call<Markup>(ours, 'read')).late).toBe((await call<Markup>(real, 'read')).late);
  await ctx.close();
});

test('destroy() leaves the same markup as vivus', async ({ browser }) => {
  const { ctx, real, ours } = await pair(browser);
  await Promise.all([real, ours].map((pg) => call(pg, 'seek', 0.5)));
  await Promise.all([real, ours].map((pg) => call(pg, 'destroy')));
  expect(await call<Markup>(ours, 'read')).toEqual(await call<Markup>(real, 'read'));
  await ctx.close();
});

test('the script-tag build defines window.Vivus as the class', async ({ browser }) => {
  const { ctx, real, ours: cdn, errors } = await pair(browser, 'vivus-cdn.html');
  expect(await cdn.evaluate(() => typeof (window as unknown as { Vivus: unknown }).Vivus)).toBe('function');
  for (const p of [0.3, 0.7]) {
    await Promise.all([real, cdn].map((pg) => call(pg, 'seek', p)));
    expect(await call<Markup>(cdn, 'read')).toEqual(await call<Markup>(real, 'read'));
  }
  expect(errors).toEqual([]);
  await ctx.close();
});

test('reduced motion: play() jumps to the end and still calls back', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 'vivus-ours.html');
  await call(page, 'play');
  const status = await call<{ all: string[] }>(page, 'status');
  expect(status.all.every((s) => s === 'end'), status.all.join()).toBe(true);
  const done = await call<Record<string, number>>(page, 'done');
  expect(Object.values(done).every((n) => n === 1)).toBe(true);
});
