import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, settle } from './helpers';

/**
 * `scrollAnimate`'s own native CSS fast path, in real browsers.
 *
 * `parity.spec.ts` covers the same claim for `scrollDraw` — and only for its
 * default easing, which is `linear`. `scrollAnimate` has a second, independent
 * implementation of the fast path (`buildNative()` in src/animate), it defaults
 * to `ease-out` rather than `linear`, and nothing had ever compared it against
 * the JS engine it silently replaces.
 *
 * The substitution is only honest if both paths render the same value at the
 * same scroll offset. Anything else means a visitor on Chrome sees a different
 * animation from a visitor on Safari — which always takes the JS path, because
 * WebKit has no scroll-driven animation support.
 *
 * Fixture geometry (viewport 900x800): a 100px strip of eligibility probes, an
 * 1100px spacer, then five 300px rows separated by 400px gaps. Each row holds a
 * native cell and a JS-forced cell side by side, identical in every way that
 * matters, so at any offset the correct answer is the same for both.
 *
 * Per-row trigger window, from the default `top bottom` → `bottom top`:
 *   tStart = rowTop - 800   tEnd = rowTop + 300
 */

type Pair = { key: string; native: number; js: number };
type Row = { scrollY: number; pairs: Pair[]; reported: Pair[] };

const ROW_HEIGHT = 300;
const ROW_TOPS: Record<string, number> = {
  linear: 1200,
  'ease-in': 1900,
  'ease-out': 2600,
  'ease-in-out': 3300,
  color: 4000,
};

/**
 * The JS engine's easing table, restated. Written out rather than imported so a
 * change to EASINGS has to be made deliberately in two places instead of
 * silently redefining what this test is comparing against.
 */
const JS_EASINGS: Record<string, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  color: (t) => t,
};

/** Same tolerance as parity.spec.ts: a sub-frame difference is unavoidable. */
const TOLERANCE = 0.02;

function alphaAt(key: string, y: number): number {
  const tStart = ROW_TOPS[key] - 800;
  const tEnd = ROW_TOPS[key] + ROW_HEIGHT;
  return Math.min(1, Math.max(0, (y - tStart) / (tEnd - tStart)));
}

/** Every offset that puts at least one row mid-window, plus both edges of each. */
const OFFSETS = (() => {
  const out: number[] = [];
  for (let y = 400; y <= 4300; y += 150) out.push(y);
  return out;
})();

type Sample = { y: number; key: string; native: number; js: number; want: number };

function render(samples: Sample[]): string {
  return samples
    .map(
      (s) =>
        `  ${s.key.padEnd(12)} y=${String(s.y).padStart(4)}  native=${s.native.toFixed(4)}` +
        `  js=${s.js.toFixed(4)}  want=${s.want.toFixed(4)}`,
    )
    .join('\n');
}

test.describe('scrollAnimate native CSS fast path', () => {
  test('the fixture loads the real built bundle without error', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'animate-parity.html');
    expect(errors).toEqual([]);
  });

  test('the fixture geometry is what the offsets assume', async ({ page }) => {
    await openFixture(page, 'animate-parity.html');
    const geo = await call<{
      viewportWidth: number;
      viewportHeight: number;
      rows: { key: string; top: number; height: number; sameTop: boolean }[];
    }>(page, 'geometry');

    expect(geo.viewportWidth).toBe(900);
    expect(geo.viewportHeight).toBe(800);
    for (const row of geo.rows) {
      expect(row.top, `row ${row.key} is not where the spec thinks`).toBe(ROW_TOPS[row.key]);
      expect(row.height).toBe(ROW_HEIGHT);
      // If the two cells were not at the same document top, the comparison
      // below would be measuring geometry rather than easing.
      expect(row.sameTop, `row ${row.key}: cells are not vertically aligned`).toBe(true);
    }
  });

  test('the fast path engages exactly where the browser supports it', async ({ page }) => {
    await openFixture(page, 'animate-parity.html');
    const e = await call<{
      supportsNative: boolean;
      engaged: Record<string, boolean>;
      jsForced: Record<string, boolean>;
      styleTags: number;
    }>(page, 'engagement');

    for (const [key, on] of Object.entries(e.engaged)) {
      expect(on, `${key}: fast path did not match browser support`).toBe(e.supportsNative);
    }
    // `native: false` must never take it, on any browser.
    for (const [key, on] of Object.entries(e.jsForced)) {
      expect(on, `${key}: native:false still took the fast path`).toBe(false);
    }
    expect(e.styleTags > 0).toBe(e.supportsNative);
  });

  test('declines every configuration CSS cannot express', async ({ page }) => {
    await openFixture(page, 'animate-parity.html');
    const got = await call<Record<string, boolean>>(page, 'eligibility');
    const supportsNative = (await call<{ supportsNative: boolean }>(page, 'engagement'))
      .supportsNative;

    const expected: Record<string, boolean> = {
      once: false,
      speed: false,
      springEasing: false,
      unsafeProp: false,
      velocityScale: false,
      callback: false,
      triggerElement: false,
      triggerWindow: false,
      axisX: false,
      scrollContainer: false,
      // The control. Without it a gate that rejected everything would pass.
      eligible: supportsNative,
    };
    expect(got).toEqual(expected);
  });

  /**
   * The core claim, and the test this file was written for.
   *
   * Both paths are asserted against the SAME analytic expectation rather than
   * only against each other: two engines that agree on the wrong value would
   * otherwise pass.
   */
  test('both engines render the same value at every offset', async ({ page }) => {
    await openFixture(page, 'animate-parity.html');

    const samples: Sample[] = [];
    for (const y of OFFSETS) {
      await scrollToY(page, y);
      const row = await read<Row>(page);
      for (const p of row.pairs) {
        samples.push({ y, key: p.key, native: p.native, js: p.js, want: JS_EASINGS[p.key](alphaAt(p.key, y)) });
      }
    }

    for (const key of Object.keys(ROW_TOPS)) {
      const mine = samples.filter((s) => s.key === key);
      const shown = render(mine);

      // Sanity: this row must actually be sampled mid-animation, or a pair of
      // all-zero readings would pass vacuously.
      const midway = mine.filter((s) => s.want > 0.05 && s.want < 0.95);
      expect(midway.length, `${key}: no partially-animated offsets sampled\n${shown}`).toBeGreaterThanOrEqual(3);

      const worstJs = mine.reduce((a, b) => (Math.abs(b.js - b.want) > Math.abs(a.js - a.want) ? b : a));
      expect(
        Math.abs(worstJs.js - worstJs.want),
        `${key}: the JS engine does not match its own easing at y=${worstJs.y}\n${shown}`,
      ).toBeLessThanOrEqual(TOLERANCE);

      const worstNative = mine.reduce((a, b) =>
        Math.abs(b.native - b.want) > Math.abs(a.native - a.want) ? b : a,
      );
      expect(
        Math.abs(worstNative.native - worstNative.want),
        `${key}: the native CSS fast path renders a different curve from the JS engine ` +
          `it replaces (worst at y=${worstNative.y})\n${shown}`,
      ).toBeLessThanOrEqual(TOLERANCE);
    }
  });

  /**
   * A fast path that renders one curve while reporting another is still wrong:
   * `getProgress()` is what callers build their own logic on.
   */
  test('getProgress() agrees with what is actually rendered', async ({ page }) => {
    await openFixture(page, 'animate-parity.html');

    for (const [key, top] of Object.entries(ROW_TOPS)) {
      const y = top - 400; // mid-window for this row
      await scrollToY(page, y);
      const row = await read<Row>(page);
      const rendered = row.pairs.find((p) => p.key === key)!;
      const reported = row.reported.find((p) => p.key === key)!;

      expect(
        Math.abs(reported.native - rendered.native),
        `${key}: native getProgress()=${reported.native.toFixed(4)} but rendered ` +
          `${rendered.native.toFixed(4)} at y=${y}`,
      ).toBeLessThanOrEqual(TOLERANCE);
      expect(
        Math.abs(reported.js - rendered.js),
        `${key}: JS getProgress()=${reported.js.toFixed(4)} but rendered ${rendered.js.toFixed(4)}`,
      ).toBeLessThanOrEqual(TOLERANCE);
    }
  });

  test('reduced motion applies the final state on both paths', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'animate-parity.html');

    // Never scrolled, so anything other than the final state means the
    // preference was ignored on one of the two paths.
    const row = await read<Row>(page);
    for (const p of row.pairs) {
      expect(p.native, `${p.key}: native path ignored prefers-reduced-motion`).toBeCloseTo(1, 2);
      expect(p.js, `${p.key}: JS path ignored prefers-reduced-motion`).toBeCloseTo(1, 2);
    }

    // And no scroll-driven stylesheet should have been generated at all.
    const e = await call<{ styleTags: number }>(page, 'engagement');
    expect(e.styleTags).toBe(0);
  });

  test('destroy() removes the generated class, stylesheet and inline styles', async ({ page }) => {
    await openFixture(page, 'animate-parity.html');
    await scrollToY(page, 1400);

    const before = await call<{ styleTags: number }>(page, 'engagement');
    const after = await call<{ inlineOpacity: string; classLeft: boolean; styleTags: number }>(
      page,
      'destroyPair',
      'linear',
    );
    await settle(page);

    expect(after.classLeft, 'destroy() left the generated class on the element').toBe(false);
    expect(after.inlineOpacity, 'destroy() left an inline opacity behind').toBe('');
    if (before.styleTags > 0) {
      expect(after.styleTags, 'destroy() left its <style> element in the head').toBe(
        before.styleTags - 1,
      );
    }
  });
});
