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
 * Note on measurement: the assertions count work, not time. `bodyRuns` is how
 * many times the update body actually ran (the fixture counts `onProgress`,
 * which fires once per body run and never on a short-circuited frame). This
 * suite used to assert on cumulative callback milliseconds against a 6 ms
 * ceiling; that is wall-clock time sampled while other browsers run the rest of
 * the suite, and it flaked in Firefox under load (6–8 ms, locally and in the
 * 2.11.0 release run) with nothing regressed. A count does not move with load.
 *
 * Style writes are not counted either: `strokeDashoffset` has no own descriptor
 * on CSSStyleDeclaration.prototype, so patching the prototype setter silently
 * counts zero and reads as a pass — a trap worth recording.
 */

type IdleProbe = {
  setup: (n: number) => void;
  reset: () => void;
  read: () => { frames: number; cbMs: number; bodyRuns: number; instances: number };
};

declare global {
  interface Window {
    __probe: IdleProbe;
    __ready?: boolean;
  }
}

const INSTANCES = 8;

/** Frames the active phase nudges the scroll on (alternating 600 / 601). */
const NUDGES = 60;

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
      (nudges) =>
        new Promise<void>((resolve) => {
          let n = 0;
          const step = () => {
            window.scrollTo(0, 600 + (n % 2 ? 1 : 0));
            n++;
            if (n < nudges) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        }),
      NUDGES,
    );
    const active = await page.evaluate(() => window.__probe.read());

    expect(idle.instances).toBe(INSTANCES);
    // The loop keeps running so the next real scroll is picked up immediately —
    // frames are expected, work is not.
    expect(idle.frames).toBeGreaterThan(0);

    const detail =
      `idle: ${idle.bodyRuns} body runs in ${idle.frames} frames (${idle.cbMs} ms)  ` +
      `active: ${active.bodyRuns} body runs in ${active.frames} frames (${active.cbMs} ms). ` +
      `The idle short-circuit in update() should skip the body when the scroll ` +
      `position has not moved since the last rendered frame.`;

    // Parked: at most one recompute per instance (a frame already in flight when
    // the counter was reset), then nothing. Without the short-circuit this is
    // every frame — hundreds.
    expect(idle.bodyRuns, detail).toBeLessThanOrEqual(INSTANCES);
    // Scrolling: the scroll changes every frame, so every instance works on most
    // of them. Half is the floor so a dropped frame under load cannot fail it,
    // and it proves the short-circuit is not also skipping real work.
    expect(active.bodyRuns, detail).toBeGreaterThanOrEqual(INSTANCES * (NUDGES / 2));
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
