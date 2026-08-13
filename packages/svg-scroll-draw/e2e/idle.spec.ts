import { test, expect } from '@playwright/test';

/**
 * The JS engine's cost while the user is NOT scrolling.
 *
 * The rAF loop runs for as long as the container is in view, whether or not the
 * scroll position has moved. Before the idle short-circuit, eight instances
 * sitting in a viewport with zero scrolling cost 6.4 ms of JavaScript per second
 * in Chromium, recomputing identical values and rewriting identical styles.
 *
 * This is the path Firefox and every pre-115 browser always take, so it is not a
 * niche concern.
 *
 * Note on measurement: this counts frames and cumulative callback duration, not
 * style writes. `strokeDashoffset` has no own descriptor on
 * CSSStyleDeclaration.prototype, so patching the prototype setter silently
 * counts zero and reads as a pass — a trap worth recording.
 */

type IdleProbe = {
  setup: (n: number) => void;
  reset: () => void;
  read: () => { frames: number; cbMs: number; instances: number };
};

declare global {
  interface Window {
    __probe: IdleProbe;
    __ready?: boolean;
  }
}

const INSTANCES = 8;

/**
 * Absolute ceiling, deliberately loose. Per-frame rAF overhead differs a lot
 * between engines — measured idle figures after the fix were ~2.8 ms (Chromium),
 * ~3.0 ms (Firefox), ~2.0 ms (WebKit) — so a tight absolute number would just be
 * a Chromium number that fails elsewhere.
 */
const IDLE_MS_CEILING = 6;

/**
 * The load-bearing assertion: idle cost relative to actively-scrolling cost.
 * This is engine-independent. Measured after the fix:
 *   Chromium  2.8 idle vs  20 active  (7x)
 *   Firefox   3.0 idle vs  51 active  (17x)
 *   WebKit    2.0 idle vs  83 active  (41x)
 * Before the fix idle and active did the same work, so this ratio was ~1.
 */
const MAX_IDLE_SHARE_OF_ACTIVE = 0.25;

async function open(page: import('@playwright/test').Page, n: number) {
  await page.goto('/e2e/fixtures/idle.html');
  await page.waitForFunction(() => window.__ready === true);
  await page.evaluate((count) => window.__probe.setup(count), n);
}

test.describe('idle cost of the JS engine', () => {
  test('costs far less while parked than while scrolling', async ({ page }) => {
    await open(page, INSTANCES);

    // Park the containers in the viewport, then hold perfectly still.
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.__probe.reset());
    await page.waitForTimeout(1000);
    const idle = await page.evaluate(() => window.__probe.read());

    // Same instance count, same duration, but nudge the scroll every frame.
    await page.evaluate(() => window.__probe.reset());
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          let n = 0;
          const step = () => {
            window.scrollTo(0, 600 + (n % 2 ? 1 : 0));
            n++;
            if (n < 60) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        }),
    );
    const active = await page.evaluate(() => window.__probe.read());

    expect(idle.instances).toBe(INSTANCES);
    // The loop keeps running so the next real scroll is picked up immediately —
    // frames are expected, work is not.
    expect(idle.frames).toBeGreaterThan(0);

    const detail =
      `idle=${idle.cbMs}ms/${idle.frames}f  active=${active.cbMs}ms/${active.frames}f. ` +
      `The idle short-circuit in update() should skip the body when the scroll ` +
      `position has not moved since the last rendered frame.`;

    expect(idle.cbMs, detail).toBeLessThan(IDLE_MS_CEILING);
    expect(idle.cbMs, detail).toBeLessThan(active.cbMs * MAX_IDLE_SHARE_OF_ACTIVE);
  });

  test('stops entirely when scrolled out of view', async ({ page }) => {
    await open(page, INSTANCES);

    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(300);

    await page.evaluate(() => window.__probe.reset());
    await page.waitForTimeout(600);
    const gone = await page.evaluate(() => window.__probe.read());

    // IntersectionObserver reported not-intersecting, so the loop must be idle.
    expect(gone.frames).toBe(0);
    expect(gone.cbMs).toBe(0);
  });

  test('still animates correctly while actually scrolling', async ({ page }) => {
    await open(page, INSTANCES);

    // Sweep through the trigger range — the short-circuit must not skip real work.
    for (let y = 500; y <= 1500; y += 50) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await page.waitForTimeout(16);
    }

    const drawn = await page.evaluate(() => {
      const el = document.querySelector('[data-draw] path') as SVGPathElement;
      const len = el.getTotalLength();
      const offset = parseFloat(getComputedStyle(el).strokeDashoffset) || 0;
      return 1 - offset / len;
    });

    expect(drawn).toBeGreaterThan(0.99);
  });

  test('repaints after being scrolled away and back', async ({ page }) => {
    await open(page, INSTANCES);

    const drawnFraction = () =>
      page.evaluate(() => {
        const el = document.querySelector('[data-draw] path') as SVGPathElement;
        const len = el.getTotalLength();
        return 1 - (parseFloat(getComputedStyle(el).strokeDashoffset) || 0) / len;
      });

    // Mid-draw.
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(200);
    const mid = await drawnFraction();
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);

    // Away, then back to the same offset. The container re-enters the viewport at
    // an unchanged scroll position, so the loop must be marked dirty or the frame
    // would be stale.
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(200);
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(200);

    expect(await drawnFraction()).toBeCloseTo(mid, 1);
  });
});
