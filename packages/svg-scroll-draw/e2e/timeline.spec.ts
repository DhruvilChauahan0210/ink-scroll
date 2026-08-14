import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, table } from './helpers';

/**
 * `scrollDrawTimeline` in real browsers.
 *
 * The module's whole purpose is arithmetic on real path lengths: each track
 * takes a `from`/`to` slice of the container's 0–1 scroll range and writes
 * `strokeDashoffset = length x (1 - localAlpha)`. In jsdom `getTotalLength()` is
 * a stubbed constant and `getBoundingClientRect()` is zeros, so the unit tests
 * could only ever check that the code ran — not that a track fills across its
 * own window and no other.
 *
 * Fixture geometry (viewport 900x800):
 *   #diagram at top 1000, 400 tall → trigger window 200 → 1400
 *   tracks: .t1 0 → 0.5 (two paths) · .t2 0.3 → 0.8 with fade · .t3 0.7 → 1.0 ease-out
 *   #loopy at 2200, 300 tall, window 1400 → 1700 (ends `bottom bottom`)
 *   #hud   at 3300, 300 tall
 */

type Row = {
  scrollY: number;
  t1: number[];
  t2: number[];
  t3: number[];
  fade: number[];
  progress: number;
  cssVar: string;
  completions: number;
  loopDrawn: number;
  loopMotion: { dipsWithoutScroll: number; risesWithoutScroll: number };
  inlineStyles: string[];
  containerVar: string;
  debugPanels: number;
};

const T_START = 200;
const T_END = 1400;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const globalAt = (y: number) => clamp01((y - T_START) / (T_END - T_START));
const localOf = (g: number, from: number, to: number) => clamp01((g - from) / (to - from));
const easeOut = (t: number) => t * (2 - t);

/** What each track should read at a given scroll offset. */
function expected(y: number): { t1: number; t2: number; t3: number } {
  const g = globalAt(y);
  return {
    t1: localOf(g, 0, 0.5),
    t2: localOf(g, 0.3, 0.8),
    t3: easeOut(localOf(g, 0.7, 1)),
  };
}

const OFFSETS = [200, 400, 600, 800, 1000, 1200, 1400];

test.describe('scrollDrawTimeline', () => {
  test('the fixture loads and the paths have real, measured lengths', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'timeline.html');
    expect(errors).toEqual([]);

    const geo = await call<{
      viewportHeight: number;
      diagramTop: number;
      diagramHeight: number;
      lengths: { t1: number[]; t2: number[]; t3: number[] };
    }>(page, 'geometry');

    expect(geo.viewportHeight).toBe(800);
    expect(geo.diagramTop).toBe(1000);
    expect(geo.diagramHeight).toBe(400);
    expect(geo.lengths.t1.length, 'the first track must match two paths').toBe(2);
    for (const len of [...geo.lengths.t1, ...geo.lengths.t2, ...geo.lengths.t3]) {
      expect(len).toBeGreaterThan(10);
    }
    // The curved path is genuinely longer than the straight ones, so a track
    // writing one shared length for everything would be caught.
    expect(geo.lengths.t2[0]).toBeGreaterThan(geo.lengths.t1[0]);
  });

  test('each track fills across its own window and no other', async ({ page }) => {
    await openFixture(page, 'timeline.html');

    const rows: Row[] = [];
    for (const y of OFFSETS) {
      await scrollToY(page, y);
      rows.push(await read<Row>(page));
    }

    const shown = table(
      rows.map((r) => ({
        y: r.scrollY,
        g: globalAt(r.scrollY),
        t1: r.t1[0],
        t2: r.t2[0],
        t3: r.t3[0],
        want1: expected(r.scrollY).t1,
        want2: expected(r.scrollY).t2,
        want3: expected(r.scrollY).t3,
      })),
    );

    for (const r of rows) {
      const want = expected(r.scrollY);
      expect(r.t1[0], `t1 at y=${r.scrollY}\n${shown}`).toBeCloseTo(want.t1, 1);
      expect(r.t2[0], `t2 at y=${r.scrollY}\n${shown}`).toBeCloseTo(want.t2, 1);
      expect(r.t3[0], `t3 at y=${r.scrollY}\n${shown}`).toBeCloseTo(want.t3, 1);
    }

    // The point of per-track windows: at the half-way mark the first track is
    // finished, the second is part-way and the third has not started.
    const mid = rows.find((r) => r.scrollY === 800)!;
    expect(mid.t1[0], shown).toBeCloseTo(1, 1);
    expect(mid.t2[0], shown).toBeGreaterThan(0.2);
    expect(mid.t2[0], shown).toBeLessThan(0.7);
    expect(mid.t3[0], `the last track started before its window\n${shown}`).toBeCloseTo(0, 2);
  });

  test('a track drives every element it matches', async ({ page }) => {
    await openFixture(page, 'timeline.html');
    await scrollToY(page, 500);

    const row = await read<Row>(page);
    expect(row.t1.length).toBe(2);
    expect(
      Math.abs(row.t1[0] - row.t1[1]),
      `the two paths on one track disagree: ${row.t1.join(', ')}`,
    ).toBeLessThan(0.02);
    expect(row.t1[0], 'the track is not part-way through — the test proves nothing').toBeGreaterThan(0.1);
  });

  test('per-track easing is applied, not the global default', async ({ page }) => {
    await openFixture(page, 'timeline.html');

    // g = 0.8 → the ease-out track is at local 1/3, where a linear track would
    // read 0.333 and ease-out reads 0.556. Far enough apart to tell apart.
    await scrollToY(page, 1160);
    const row = await read<Row>(page);
    const local = localOf(globalAt(1160), 0.7, 1);

    expect(row.t3[0], `t3 read ${row.t3[0].toFixed(3)} (linear would be ${local.toFixed(3)})`).toBeCloseTo(
      easeOut(local),
      1,
    );
    expect(Math.abs(row.t3[0] - local), 'ease-out was not applied to this track').toBeGreaterThan(0.1);
  });

  test('fade tracks opacity to the same local progress', async ({ page }) => {
    await openFixture(page, 'timeline.html');

    await scrollToY(page, 200);
    expect((await read<Row>(page)).fade[0], 'faded track did not start hidden').toBeCloseTo(0, 2);

    await scrollToY(page, 900);
    const row = await read<Row>(page);
    expect(row.fade[0]).toBeCloseTo(expected(900).t2, 1);
    // Opacity and draw move together — that is what `fade` means here.
    expect(Math.abs(row.fade[0] - row.t2[0])).toBeLessThan(0.02);
  });

  test('the container publishes its progress as a CSS custom property', async ({ page }) => {
    await openFixture(page, 'timeline.html');
    await scrollToY(page, 800);

    const row = await read<Row>(page);
    // Unitless, so dependent CSS can use it in calc() — the same contract
    // scrollProgress holds.
    expect(row.cssVar).not.toBe('');
    expect(parseFloat(row.cssVar)).toBeCloseTo(globalAt(800), 1);
    expect(row.progress).toBeCloseTo(globalAt(800), 1);
  });

  test('onComplete fires once the last track has finished', async ({ page }) => {
    await openFixture(page, 'timeline.html');

    await scrollToY(page, 1000);
    expect((await read<Row>(page)).completions, 'completed before the end of the range').toBe(0);

    await scrollToY(page, 1400);
    expect((await read<Row>(page)).completions).toBeGreaterThan(0);
  });

  test('seek() pins a frame without scrolling, and replay() rewinds it', async ({ page }) => {
    await openFixture(page, 'timeline.html');

    await call(page, 'seek', 0.5);
    const sought = await read<Row>(page);
    expect(sought.scrollY, 'seek() should not move the page').toBe(0);
    expect(sought.t1[0]).toBeCloseTo(1, 1);
    expect(sought.t2[0]).toBeCloseTo(0.4, 1);
    expect(sought.t3[0]).toBeCloseTo(0, 2);
    expect(sought.progress).toBeCloseTo(0.5, 2);

    await call(page, 'replay');
    const rewound = await read<Row>(page);
    expect(rewound.t1[0], 'replay() left the first track drawn').toBeCloseTo(0, 2);
    expect(rewound.t2[0]).toBeCloseTo(0, 2);
  });

  test('destroy() stops the timeline tracking scroll', async ({ page }) => {
    await openFixture(page, 'timeline.html');

    await scrollToY(page, 500);
    expect((await read<Row>(page)).t1[0]).toBeGreaterThan(0.1);
    await call(page, 'destroy');

    // The third track's window (global 0.7 → 1.0) is genuinely mid-flight between
    // these two offsets, so a live engine would read differently at each.
    await scrollToY(page, 1100);
    const a = await read<Row>(page);
    await scrollToY(page, 1300);
    const b = await read<Row>(page);

    expect(
      Math.abs(b.t3[0] - a.t3[0]),
      `still tracking scroll after destroy: ${a.t3[0].toFixed(3)} → ${b.t3[0].toFixed(3)}`,
    ).toBeLessThan(0.02);
  });

  /**
   * Leaving the last frame behind is worse than never having animated: a diagram
   * destroyed mid-scroll stayed half-drawn — and with `fade`, half-transparent —
   * for the rest of the page's life. Every other module in the library restores
   * what it wrote.
   */
  test('destroy() restores the paths it wrote to', async ({ page }) => {
    await openFixture(page, 'timeline.html');

    await scrollToY(page, 700);
    const before = await read<Row>(page);
    expect(before.inlineStyles.every((s) => s !== ''), 'nothing was written to restore').toBe(true);
    expect(before.t1[0]).toBeGreaterThan(0.1);

    await call(page, 'destroy');
    const after = await read<Row>(page);

    expect(after.inlineStyles, 'destroy() left its inline styles on the paths').toEqual(['', '', '', '']);
    expect(after.containerVar, 'destroy() left the progress custom property behind').toBe('');
    // Nothing inline left means nothing dashed: the paths render as authored.
    for (const [i, v] of after.t1.entries()) {
      expect(v, `path ${i} left part-drawn after destroy`).toBeCloseTo(1, 2);
    }
  });

  /**
   * The engine re-measures on resize, on orientationchange, and through a
   * ResizeObserver on the document element. None of those fire when a path's own
   * geometry changes inside a fixed-height box — so without `refresh()` the
   * dasharray keeps the old length and the draw never reaches the end of the path.
   */
  test('refresh() picks up a path that changed length', async ({ page }) => {
    await openFixture(page, 'timeline.html');

    const { before, grown, dasharray } = await call<{
      before: number;
      grown: number;
      dasharray: number;
    }>(page, 'growPathThenRefresh');

    expect(grown, 'the fixture did not actually lengthen the path').toBeGreaterThan(before + 10);
    expect(dasharray, `dasharray still ${dasharray} for a path now ${grown} long`).toBeCloseTo(
      grown,
      0,
    );

    // And it still draws to completion against the new length.
    await scrollToY(page, 800);
    expect((await read<Row>(page)).t1[0]).toBeCloseTo(1, 1);
  });

  /**
   * The product decision recorded on the `respectReducedMotion` option: scrubbing
   * is the user's own input and keeps working, while the time-driven loop is
   * motion played at them and does not start.
   */
  test('reduced motion keeps scrubbing but does not run the loop', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openFixture(page, 'timeline.html');

    // Scrubbing is untouched.
    await scrollToY(page, 800);
    const mid = await read<Row>(page);
    expect(mid.t1[0], 'reduced motion froze the scroll-linked drawing').toBeCloseTo(
      expected(800).t1,
      1,
    );
    expect(mid.t2[0]).toBeCloseTo(expected(800).t2, 1);

    // The loop timeline completes on scroll, then must simply stay there.
    await scrollToY(page, 1800);
    expect((await read<Row>(page)).loopDrawn).toBeCloseTo(1, 1);

    await page.waitForTimeout(900); // three loop durations, and then some
    const after = await read<Row>(page);
    expect(after.loopDrawn, 'the loop replayed despite prefers-reduced-motion').toBeCloseTo(1, 1);
    expect(
      after.loopMotion.dipsWithoutScroll,
      'the timeline wound itself back with no scroll input',
    ).toBe(0);
  });

  /**
   * The one part of this module that is not scroll-linked: after the scroll pass
   * completes, `loop` replays the whole timeline on a timer.
   *
   * Asserted by waiting rather than sweeping, because it is time-driven by
   * definition. The fixture ends this timeline's window at `bottom bottom` so it
   * is still on screen — and still getting frames — when it completes.
   */
  test('loop replays on a timer after the scroll pass completes', async ({ page }) => {
    await openFixture(page, 'timeline.html');

    // Past the end of this timeline's window, which is where the loop takes over.
    await scrollToY(page, 1800);

    type Probe = { read: () => { loopMotion: { dipsWithoutScroll: number; risesWithoutScroll: number } } };
    await page.waitForFunction(
      () => {
        const m = (window as unknown as { __probe: Probe }).__probe.read().loopMotion;
        return m.dipsWithoutScroll > 0 && m.risesWithoutScroll > 0;
      },
      undefined,
      { timeout: 5000 },
    );

    // It settles drawn rather than mid-replay: `loop: 1` is one extra pass, not
    // an animation left running forever.
    await page.waitForFunction(
      () =>
        (window as unknown as { __probe: { read: () => { loopDrawn: number } } }).__probe.read()
          .loopDrawn > 0.95,
      undefined,
      { timeout: 5000 },
    );
    expect((await read<Row>(page)).scrollY, 'the page moved — the loop proved nothing').toBe(1800);
  });

  test('debug: true injects a panel and destroy() removes it', async ({ page }) => {
    await openFixture(page, 'timeline.html');

    expect((await read<Row>(page)).debugPanels, 'no debug panel was injected').toBe(1);

    await call(page, 'destroyDebug');
    expect((await read<Row>(page)).debugPanels, 'the debug panel outlived its timeline').toBe(0);
  });
});
