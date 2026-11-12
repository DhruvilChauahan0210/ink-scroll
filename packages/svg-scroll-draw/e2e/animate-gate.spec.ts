import { test, expect } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, read, call, settle, table } from './helpers';

/**
 * What runs the animate engine's frames (scrollAnimate, and so scrollParallax,
 * scrollReveal and scrollHorizontal).
 *
 * Up to 2.23.3 an IntersectionObserver on the animated element started and
 * stopped the frame loop. That box includes the element's own transform and is
 * cut by any overflow-hidden parent, so the engine went quiet whenever its own
 * animation carried the element out of view:
 *  - a parallax layer whose travel took it out of its clip froze there, and
 *    stayed frozen on the way back, since nothing moved it back into view;
 *  - a fade-up started only when its offset box crossed the fold, then jumped
 *    to where the scroll already was;
 *  - a jump across the whole window, the element never on screen in between,
 *    painted nothing: it stayed at its first frame and onComplete never fired.
 * The trigger window, measured from layout without the engine's own props,
 * decides now.
 *
 * Fixture geometry (viewport 900x800), default window `top bottom` → `bottom top`:
 *   #px    a 900x300 layer in a 300px overflow-hidden clip at 1200: [400, 1500]
 *   #py    the same at 1500:                                         [700, 1800]
 *   #fade  200px tall at 2200:                                       [1400, 2400]
 *   #jump  200px tall at 2800:                                       [2000, 3000]
 */

type Row = {
  scrollY: number;
  px: number;
  py: number;
  fade: number;
  jump: number;
  jumpProgress: number;
  completed: number;
};

const alpha = (y: number, start: number, end: number) =>
  Math.min(1, Math.max(0, (y - start) / (end - start)));

test.describe('animate engine frames follow the trigger window', () => {
  test('the fixture geometry matches the assumed windows', async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, 'animate-gate.html');
    expect(errors).toEqual([]);
    const geo = await call<Record<string, number>>(page, 'geometry');
    expect(geo).toEqual({ px: 1200, py: 1500, fade: 2200, jump: 2800, width: 900 });
  });

  test('a parallax layer keeps moving after its travel carries it out of its clip, both ways', async ({ page }) => {
    await openFixture(page, 'animate-gate.html');

    const down = [400, 700, 1000, 1300, 1500, 1800, 2100];
    const up = [1800, 1500, 1300, 1000, 700, 400, 0];
    const rows: Row[] = [];
    for (const y of [...down, ...up]) {
      await scrollToY(page, y);
      rows.push(await read<Row>(page));
    }
    const want = (y: number) => ({
      px: -1.5 * 900 * alpha(y, 400, 1500),
      py: 1.05 * 300 * alpha(y, 700, 1800),
    });
    const shown = table(rows.map((r) => ({ y: r.scrollY, px: r.px, wantPx: want(r.scrollY).px, py: r.py, wantPy: want(r.scrollY).py })));

    for (const r of rows) {
      expect(r.px, `x layer at y=${r.scrollY}\n${shown}`).toBeCloseTo(want(r.scrollY).px, 0);
      expect(r.py, `y layer at y=${r.scrollY}\n${shown}`).toBeCloseTo(want(r.scrollY).py, 0);
    }
  });

  test('a fade-up starts at the start of its window, not when its offset box crosses the fold', async ({ page }) => {
    await openFixture(page, 'animate-gate.html');

    // The box is 120px below its layout position until the window is 12% in.
    for (const y of [1400, 1440, 1480, 1520, 1600]) {
      await scrollToY(page, y);
      const row = await read<Row>(page);
      expect(row.fade, `opacity at y=${y}`).toBeCloseTo(alpha(y, 1400, 2400), 2);
    }
  });

  test('a jump across the whole window paints its last frame and completes', async ({ page }) => {
    await openFixture(page, 'animate-gate.html');
    expect((await read<Row>(page)).jump).toBe(0);

    // From above the window to below it in one step: never on screen between.
    await scrollToY(page, 4000);
    const past = await read<Row>(page);
    expect(past.jump, 'the last frame was never painted').toBe(1);
    expect(past.jumpProgress).toBe(1);
    expect(past.completed, 'onComplete never fired').toBe(1);

    // And back, the same way.
    await scrollToY(page, 0);
    const back = await read<Row>(page);
    expect(back.jump).toBe(0);
    expect(back.jumpProgress).toBe(0);
  });
});

/**
 * replay() after pause() or seek() cleared `paused` and requested no frame, so
 * the element stopped following the scroll until it left the screen and came
 * back. #jump's window is [2000, 3000].
 */
test.describe('scrollAnimate replay() restarts the frames', () => {
  for (const stop of ['pause', 'seek'] as const) {
    test(`after ${stop}()`, async ({ page }) => {
      await openFixture(page, 'animate-gate.html');
      await scrollToY(page, 2500);
      expect((await read<Row>(page)).jump).toBeCloseTo(0.5, 2);

      await call(page, 'jumpCall', stop, 0.2);
      await call(page, 'jumpCall', 'replay');
      // replay() resets, and its next frame paints from the scroll again: no
      // scroll has to come first.
      await settle(page);
      expect((await read<Row>(page)).jump, 'replay() left the frames stopped').toBeCloseTo(0.5, 2);
      await scrollToY(page, 2750);
      expect((await read<Row>(page)).jump, 'replay() left the frames stopped').toBeCloseTo(0.75, 2);
    });
  }
});
