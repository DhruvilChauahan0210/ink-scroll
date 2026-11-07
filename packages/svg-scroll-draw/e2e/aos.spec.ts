import { test, expect, type Page } from '@playwright/test';
import { collectErrors, openFixture, call, converge, table } from './helpers';

/**
 * svg-scroll-draw/aos against AOS 2.3.4 itself.
 *
 * "Drop-in" is a claim about someone else's library, so it is measured against
 * that library: the same markup runs under AOS (vendored in fixtures/vendor) and
 * under the drop-in, in two tabs, scrolled to the same offsets. At every stop the
 * set of animated elements has to match, and once transitions settle so do the
 * computed opacity, transform and visibility — what a reader actually sees.
 *
 * AOS throttles its scroll handler to 99 ms, so each stop waits past that before
 * reading either page.
 */

type Flags = Record<string, boolean>;
type Styles = Record<string, { opacity: string; transform: string; visibility: string }>;

const STEP = 300;
const AOS_THROTTLE_WAIT = 220;

async function open(page: Page, file: string, opts: object): Promise<void> {
  await openFixture(page, `${file}?opts=${encodeURIComponent(JSON.stringify(opts))}`);
}

async function scrollBoth(a: Page, b: Page, y: number, wait = AOS_THROTTLE_WAIT): Promise<void> {
  await Promise.all([a, b].map((p) => p.evaluate((to) => window.scrollTo(0, to), y)));
  await a.waitForTimeout(wait);
}

/** Down the page and back up, so removal on scroll-back is compared too. */
function route(max: number): number[] {
  const down: number[] = [];
  for (let y = 0; y <= max; y += STEP) down.push(y);
  down.push(max);
  return [...down, ...down.slice(0, -1).reverse()];
}

for (const opts of [{}, { offset: 50, once: true }, { offset: 200, duration: 800 }]) {
  test(`matches AOS 2.3.4 at every scroll stop — init(${JSON.stringify(opts)})`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 800 } });
    const real = await ctx.newPage();
    const ours = await ctx.newPage();
    const errors = [...collectErrors(real), ...collectErrors(ours)];
    await open(real, 'aos-real.html', opts);
    await open(ours, 'aos-ours.html', opts);

    const max = await call<number>(ours, 'max');
    expect(await call<number>(real, 'max'), 'the two layouts differ, so nothing below is comparable').toBe(max);

    const mismatches: Record<string, unknown>[] = [];
    for (const y of route(max)) {
      await scrollBoth(real, ours, y);
      const [r, o] = await converge<Flags>(real, ours, 'read');
      for (const id of Object.keys(r)) {
        if (r[id] !== o[id]) mismatches.push({ y, id, aos: r[id], ours: o[id] });
      }
    }
    expect(mismatches, `animated state differs from AOS:\n${table(mismatches)}`).toEqual([]);
    expect(errors).toEqual([]);
    await ctx.close();
  });
}

test('settled styles match AOS 2.3.4 — opacity, transform, visibility', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 800 } });
  const real = await ctx.newPage();
  const ours = await ctx.newPage();
  await open(real, 'aos-real.html', {});
  await open(ours, 'aos-ours.html', {});
  const max = await call<number>(ours, 'max');

  for (const y of [0, Math.round(max / 3), Math.round((2 * max) / 3), max]) {
    // Past the throttle and the default 400 ms transition.
    await scrollBoth(real, ours, y, 900);
    const [r, o] = await converge<Styles>(real, ours, 'styles');
    expect(o, `computed styles differ from AOS at y=${y}`).toEqual(r);
  }
  await ctx.close();
});

test('the script-tag build defines window.AOS and behaves like the module', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 900, height: 800 } });
  const cdn = await ctx.newPage();
  const ours = await ctx.newPage();
  const errors = collectErrors(cdn);
  await open(cdn, 'aos-cdn.html', {});
  await open(ours, 'aos-ours.html', {});

  const api = await cdn.evaluate(() => {
    const g = (window as unknown as { AOS: Record<string, unknown> }).AOS;
    return ['init', 'refresh', 'refreshHard', 'destroy'].map((k) => typeof g[k]);
  });
  expect(api).toEqual(['function', 'function', 'function', 'function']);

  const max = await call<number>(ours, 'max');
  for (const y of [0, Math.round(max / 2), max]) {
    await scrollBoth(cdn, ours, y);
    const [c, o] = await converge<Flags>(cdn, ours, 'read');
    expect(c).toEqual(o);
  }
  expect(errors).toEqual([]);
  await ctx.close();
});

test('reduced motion shows everything in its final state, with no transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 'aos-ours.html', {});
  const flags = await call<Flags>(page, 'read');
  expect(Object.values(flags).every(Boolean), table([flags])).toBe(true);
  const styles = await call<Styles>(page, 'styles');
  // No waiting: with transitions off the final state is immediate.
  expect(styles['fade-up'].opacity).toBe('1');
  expect(styles['zoom-offset'].opacity).toBe('1');
});

test('reduced motion turned on after load shows everything at once (2.23.0)', async ({ page }) => {
  await open(page, 'aos-ours.html', {});
  const before = await call<Flags>(page, 'read');
  expect(Object.values(before).some((v) => !v), `nothing was hidden below the fold: ${table([before])}`).toBe(true);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

  const after = await call<Flags>(page, 'read');
  expect(Object.values(after).every(Boolean), table([after])).toBe(true);
  const styles = await call<Styles>(page, 'styles');
  expect(styles['fade-up'].opacity).toBe('1');
});
