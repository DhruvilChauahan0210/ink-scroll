import { test, expect } from '@playwright/test';

/**
 * The library's headline claim, tested in real browsers:
 *
 *   "on Chrome/Edge/Firefox 115+ the draw runs as animation-timeline: view()
 *    with zero per-frame JavaScript; falls back to the JS engine automatically"
 *
 * For that substitution to be honest, the native CSS path and the JS engine must
 * produce the SAME drawn fraction at the same scroll offset. Nothing verified
 * that before this file existed, and it was not true: the engine attached
 * `animation-timeline: view()` to each path, making each path its own timeline
 * subject. A path's bounding box is almost never its container's box, so the two
 * engines diverged by up to 6 points in Chromium and 11 in WebKit mid-scroll.
 *
 * The fixture places both containers side by side so they share identical
 * vertical geometry — at any scroll offset the correct answer is the same for
 * both, which is what makes a value-for-value comparison meaningful.
 */

/** Scroll offsets spanning the whole trigger window, including both edges. */
const OFFSETS = [0, 600, 880, 1000, 1150, 1300, 1450, 1600, 1750, 1900, 2200, 3000];

/**
 * Tolerance in drawn-fraction units. A native scroll-driven animation is
 * compositor-committed while the JS engine writes on the next rAF, so a
 * sub-frame difference is expected and unavoidable. 0.02 is tight enough to
 * catch the geometry bug this file was written for, which was 3-6x larger.
 */
const TOLERANCE = 0.02;

type Probe = {
  supportsNative: boolean;
  nativeEngaged: () => boolean;
  read: () => { native: number; js: number; scrollY: number };
  totalLength: () => number;
  readEased: () => { native: number; js: number; scrollY: number };
  easedGeometry: () => {
    top: number;
    height: number;
    sameTop: boolean;
    easedProgress: { native: number; js: number };
  };
};

declare global {
  interface Window {
    __probe: Probe;
    __ready?: boolean;
  }
}

async function open(page: import('@playwright/test').Page) {
  await page.goto('/e2e/fixtures/parity.html');
  await page.waitForFunction(() => window.__ready === true);
}

/** Settle two frames so the JS rAF loop has written for the current offset. */
async function settle(page: import('@playwright/test').Page) {
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
}

test.describe('native CSS fast path vs JS engine', () => {
  test('the fixture loads the real built bundle without error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page);

    // Regression guard for `ReferenceError: process is not defined`, which the
    // published bundle threw in any browser without a bundler.
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => window.__probe.totalLength())).toBeGreaterThan(0);
  });

  test('native path engages only where the browser supports it', async ({ page }) => {
    await open(page);
    const { supportsNative, nativeEngaged } = await page.evaluate(() => ({
      supportsNative: window.__probe.supportsNative,
      nativeEngaged: window.__probe.nativeEngaged(),
    }));

    // The engine must not claim the fast path on an unsupporting browser, and
    // must not silently decline it on a supporting one.
    expect(nativeEngaged).toBe(supportsNative);
  });

  test('both engines report the same drawn fraction at every offset', async ({ page }) => {
    await open(page);

    const supportsNative = await page.evaluate(() => window.__probe.supportsNative);
    const rows: { y: number; native: number; js: number; delta: number }[] = [];

    for (const y of OFFSETS) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await settle(page);
      const { native, js, scrollY } = await page.evaluate(() => window.__probe.read());
      rows.push({ y: scrollY, native, js, delta: Math.abs(native - js) });
    }

    const table = rows
      .map(
        (r) =>
          `  y=${String(r.y).padStart(4)}  native=${r.native.toFixed(4)}  js=${r.js.toFixed(4)}  Δ=${r.delta.toFixed(4)}`,
      )
      .join('\n');

    const worst = rows.reduce((a, b) => (b.delta > a.delta ? b : a));

    expect(
      worst.delta,
      `native CSS and JS engines disagree.\n` +
        `supportsNative=${supportsNative}, worst Δ=${worst.delta.toFixed(4)} at y=${worst.y}\n${table}`,
    ).toBeLessThanOrEqual(TOLERANCE);

    // Sanity: the fixture must actually exercise a mid-draw range, otherwise a
    // pair of all-zero readings would pass this test vacuously.
    const midway = rows.filter((r) => r.js > 0.1 && r.js < 0.9);
    expect(midway.length, `no partially-drawn offsets sampled\n${table}`).toBeGreaterThanOrEqual(3);
  });

  test('both engines start undrawn and end fully drawn', async ({ page }) => {
    await open(page);

    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    const start = await page.evaluate(() => window.__probe.read());
    expect(start.native).toBeLessThanOrEqual(0.01);
    expect(start.js).toBeLessThanOrEqual(0.01);

    // Scroll through the range the way a user does. A single jump straight to the
    // bottom is deliberately NOT used here — see the asymmetry test below.
    let maxNative = 0;
    let maxJs = 0;
    for (let y = 900; y <= 1900; y += 100) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await settle(page);
      const v = await page.evaluate(() => window.__probe.read());
      maxNative = Math.max(maxNative, v.native);
      maxJs = Math.max(maxJs, v.js);
    }

    expect(maxNative).toBeGreaterThanOrEqual(0.99);
    expect(maxJs).toBeGreaterThanOrEqual(0.99);
  });

  /**
   * Documents a real, known difference rather than asserting it away.
   *
   * The JS engine only writes while the container is intersecting the viewport.
   * Jump straight past it — a deep link, restored scroll position, or
   * scrollTo(bottom) — and IntersectionObserver never reports it visible, so the
   * paths keep their initial undrawn state. The native CSS path uses
   * `animation-fill-mode: both`, so it holds the end state regardless.
   *
   * This is not user-visible: in every case the element is off-screen while the
   * values differ, and scrolling it back into view makes the JS engine catch up
   * on its first frame. The test pins the behaviour so a future change to it is
   * a deliberate decision rather than an accident.
   */
  test('known asymmetry: jump-scrolling past the element without ever seeing it', async ({
    page,
  }) => {
    await open(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await settle(page);

    const jumped = await page.evaluate(() => window.__probe.read());
    const supportsNative = await page.evaluate(() => window.__probe.supportsNative);

    if (supportsNative) {
      // CSS holds the filled end state even though the element was never seen.
      expect(jumped.native).toBeGreaterThanOrEqual(0.99);
      // The JS engine never ran, so it is still undrawn.
      expect(jumped.js).toBeLessThanOrEqual(0.01);
    }

    // Scrolling it back into view must make the JS engine catch up immediately,
    // which is what keeps the difference invisible to a real visitor.
    await page.evaluate(() => window.scrollTo(0, 1890));
    await settle(page);
    const recovered = await page.evaluate(() => window.__probe.read());
    expect(recovered.js).toBeGreaterThanOrEqual(0.95);
    expect(Math.abs(recovered.native - recovered.js)).toBeLessThanOrEqual(TOLERANCE);
  });

  /**
   * The same claim, with an easing curve involved.
   *
   * Everything above compares the two engines on `scrollDraw`'s default easing,
   * `linear` — where there is no curve to get wrong. That is how the fast path
   * shipped for three versions handing CSS the keyword of the same name as the
   * JS easing: `ease-out` became `animation-timing-function: ease-out`. The
   * keywords are fixed cubic-béziers and these easings are quadratics, so the
   * two engines rendered curves up to 0.069 apart — around 7 points of progress
   * mid-scroll, in the middle of the range where anyone would notice.
   *
   * Fixture: the eased pair sits below the linear one, 300 tall, so its window
   * is `top = 3500`, tStart = 2700, tEnd = 3800.
   */
  test('a non-linear easing renders the same curve on both engines', async ({ page }) => {
    await open(page);

    const geo = await page.evaluate(() => window.__probe.easedGeometry());
    expect(geo.top, 'eased pair is not where this test thinks').toBe(3500);
    expect(geo.height).toBe(300);
    expect(geo.sameTop, 'eased cells are not vertically aligned').toBe(true);

    /** The JS engine's `ease-out`: a quadratic, not the CSS keyword's bézier. */
    const easeOut = (t: number) => t * (2 - t);
    const alphaAt = (y: number) => Math.min(1, Math.max(0, (y - 2700) / (3800 - 2700)));

    const rows: { y: number; native: number; js: number; want: number }[] = [];
    for (let y = 2700; y <= 3800; y += 100) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await settle(page);
      const v = await page.evaluate(() => window.__probe.readEased());
      rows.push({ y, native: v.native, js: v.js, want: easeOut(alphaAt(y)) });
    }

    const shown = rows
      .map(
        (r) =>
          `  y=${String(r.y).padStart(4)}  native=${r.native.toFixed(4)}  js=${r.js.toFixed(4)}` +
          `  want=${r.want.toFixed(4)}`,
      )
      .join('\n');

    // Both are held to the same analytic expectation: two engines agreeing on
    // the wrong curve would otherwise pass.
    const worstJs = rows.reduce((a, b) => (Math.abs(b.js - b.want) > Math.abs(a.js - a.want) ? b : a));
    expect(
      Math.abs(worstJs.js - worstJs.want),
      `the JS engine does not match its own ease-out at y=${worstJs.y}\n${shown}`,
    ).toBeLessThanOrEqual(TOLERANCE);

    const worstNative = rows.reduce((a, b) =>
      Math.abs(b.native - b.want) > Math.abs(a.native - a.want) ? b : a,
    );
    expect(
      Math.abs(worstNative.native - worstNative.want),
      `the native CSS path renders a different easing curve from the JS engine ` +
        `at y=${worstNative.y}\n${shown}`,
    ).toBeLessThanOrEqual(TOLERANCE);

    // Not vacuous: the sweep has to include genuinely partial draws.
    expect(rows.filter((r) => r.want > 0.05 && r.want < 0.95).length, shown).toBeGreaterThanOrEqual(3);
  });

  test('scrolling back up reverses both engines together', async ({ page }) => {
    await open(page);

    await page.evaluate(() => window.scrollTo(0, 1900));
    await settle(page);
    await page.evaluate(() => window.scrollTo(0, 1150));
    await settle(page);

    const { native, js } = await page.evaluate(() => window.__probe.read());
    expect(Math.abs(native - js)).toBeLessThanOrEqual(TOLERANCE);
    // Must have genuinely reversed, not latched at 1.
    expect(js).toBeLessThan(0.9);
  });
});
