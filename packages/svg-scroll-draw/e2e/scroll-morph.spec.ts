import { test, expect, type Page } from '@playwright/test';
import { openFixture, collectErrors, scrollToY, call, settle } from './helpers';

/**
 * `svg-scroll-draw/morph` in a real browser (fixtures/scroll-morph.html): the
 * path data it writes, read back through the browser's own geometry
 * (getTotalLength, getPointAtLength, getBBox, isPointInFill) at 0, halfway
 * and 1; a sequence landing on each shape; a <circle> drawn by a stand-in
 * <path>; a jump past every window; scrolling back and `once`; destroy();
 * a page loaded under reduced motion.
 *
 * (e2e/morph.spec.ts is the main entry's `morphTo`, which needs both paths
 * written with the same commands.)
 */

type Geom = { tag: string; d: string; len: number; box: number[]; pts: number[][]; centreFilled: boolean };

const SQUARE = 'M0 0H100V100H0Z';
// Anticlockwise, where the square runs clockwise: the morph runs one of them backwards.
const CIRCLE = 'M100 50A50 50 0 0 0 0 50A50 50 0 0 0 100 50Z';
const STAR = 'M50 0L61 35L98 35L68 57L79 91L50 70L21 91L32 57L2 35L39 35Z';
const LETTER = 'M50 5L90 95H72L63 74H37L28 95H10ZM50 30L42 58H58Z';
const ZIGZAG = 'M0 50L25 20L50 80L75 20L100 50';

async function at(page: Page, sel: string, p: number): Promise<void> {
  await scrollToY(page, await call<number>(page, 'yAt', sel, p));
  await settle(page);
}

const radius = ([x, y]: number[]) => Math.hypot(x - 50, y - 50);

/**
 * Whether the outline goes round (50, 50) one way only, never doubling back:
 * a shape turned inside out, or two outlines matched from the wrong starts,
 * crosses itself on the way and fails this.
 */
function turnsOneWay(pts: number[][]): boolean {
  let sign = 0;
  for (let k = 0; k < pts.length; k++) {
    const [x0, y0] = pts[k];
    const [x1, y1] = pts[(k + 1) % pts.length];
    let turn = Math.atan2(y1 - 50, x1 - 50) - Math.atan2(y0 - 50, x0 - 50);
    if (turn > Math.PI) turn -= 2 * Math.PI;
    if (turn < -Math.PI) turn += 2 * Math.PI;
    if (Math.abs(turn) < 1e-6) continue;
    if (sign && Math.sign(turn) !== sign) return false;
    sign = Math.sign(turn);
  }
  return true;
}

test.describe('svg-scroll-draw/morph', () => {
  let errors: string[];
  test.beforeEach(async ({ page }) => {
    errors = collectErrors(page);
    await openFixture(page, 'scroll-morph.html');
  });
  test.afterEach(() => expect(errors).toEqual([]));

  test('before the window every shape is as authored, a <circle> drawn by a <path> along the same outline', async ({ page }) => {
    expect(await call(page, 'd', '#plain')).toBe(SQUARE);
    const seq = await call<Geom>(page, 'geom', '#seq');
    const ref = await call<Geom>(page, 'ref', '#ref-circle');
    expect(seq.tag).toBe('path');
    await expect(page.locator('#seq')).toHaveAttribute('class', 'blob');
    await expect(page.locator('#seq')).toHaveAttribute('fill', '#c33');
    // 2πr; Chromium's own length for a <circle> is an estimate (313.65).
    expect(seq.len).toBeCloseTo(2 * Math.PI * 50, 0);
    expect(seq.box).toEqual(ref.box);
    for (const p of seq.pts) expect(Math.abs(radius(p) - 50), String(p)).toBeLessThan(0.1);
  });

  test('halfway from a square to a circle, the outline lies between the two and turns one way round', async ({ page }) => {
    await at(page, '#plain', 0.5);
    const p = await call<number>(page, 'progress', 'plain');
    expect(p).toBeGreaterThan(0.45);
    expect(p).toBeLessThan(0.55);
    const g = await call<Geom>(page, 'geom', '#plain');
    expect(g.d).toBe(await call<string>(page, 'between', SQUARE, CIRCLE, p));
    // Between the circle (r 50, length 314) and the square (corners at 70.7, length 400).
    for (const q of g.pts) {
      expect(radius(q), String(q)).toBeGreaterThan(49.5);
      expect(radius(q), String(q)).toBeLessThan(70.8);
    }
    const mean = g.pts.reduce((s, q) => s + radius(q), 0) / g.pts.length;
    expect(mean).toBeGreaterThan(52);
    expect(mean).toBeLessThan(62);
    expect(g.len).toBeGreaterThan(314.2);
    expect(g.len).toBeLessThan(400);
    expect(g.centreFilled).toBe(true);
    expect(turnsOneWay(g.pts)).toBe(true);
  });

  test('a sequence lands on every shape exactly: circle, star, a letter with a hole', async ({ page }) => {
    await at(page, '#seq', 0.25);
    const quarter = await call<Geom>(page, 'geom', '#seq');
    expect(quarter.d).not.toBe(STAR);
    expect(turnsOneWay(quarter.pts), quarter.d).toBe(true);
    expect(quarter.centreFilled).toBe(true);

    await at(page, '#seq', 0.5);
    expect(await call<number>(page, 'progress', 'seq')).toBeCloseTo(0.5, 2);
    // At exactly 0.5 the star's own string: within a pixel of scroll either side, a hair off it.
    const half = await call<Geom>(page, 'geom', '#seq');
    const star = await call<Geom>(page, 'ref', '#star');
    expect(half.len).toBeCloseTo(star.len, 0);
    expect(half.box.map(Math.round)).toEqual(star.box.map(Math.round));

    await at(page, '#seq', 0.75);
    const toLetter = await call<Geom>(page, 'geom', '#seq');
    // The star has one outline, the A two: its hole grows from the hole's own middle.
    expect(toLetter.d.match(/M/g)).toHaveLength(2);

    await at(page, '#seq', 1.2);
    expect(await call(page, 'd', '#seq')).toBe(LETTER);
    const letter = await call<Geom>(page, 'geom', '#seq');
    expect(letter.box).toEqual((await call<Geom>(page, 'ref', '#letter')).box);
    // The middle of the A is its hole.
    expect(letter.centreFilled).toBe(false);
  });

  test('a jump past every window lands on the last shapes and fires onComplete once each', async ({ page }) => {
    await scrollToY(page, await call<number>(page, 'maxScroll'));
    await settle(page);
    expect(await call(page, 'd', '#plain')).toBe(CIRCLE);
    expect(await call(page, 'd', '#seq')).toBe(LETTER);
    expect(await call(page, 'd', '#once')).toBe(ZIGZAG);
    expect(await call(page, 'completed')).toEqual({ plain: 1, seq: 1 });
  });

  test('scrolling back morphs back; with once it stays; open paths stay open', async ({ page }) => {
    await at(page, '#once', 0.5);
    const mid = await call<string>(page, 'd', '#once');
    expect(mid).not.toContain('Z');
    await at(page, '#once', 1.2);
    await scrollToY(page, 0);
    await settle(page);
    expect(await call(page, 'd', '#plain')).toBe(SQUARE);
    expect(await call(page, 'd', '#once')).toBe(ZIGZAG);
  });

  test('destroy() puts the <circle> back as it was, and a path its d and style', async ({ page }) => {
    await at(page, '#seq', 0.6);
    await at(page, '#once', 0.6);
    const seq = await call<{ same: boolean; html: string; was: string }>(page, 'destroy', 'seq');
    expect(seq.same).toBe(true);
    expect(seq.html).toBe(seq.was);
    const once = await call<{ html: string; was: string }>(page, 'destroy', 'once');
    expect(once.html).toBe(once.was);
    await at(page, '#seq', 0.9);
    expect(await page.locator('#seq').evaluate((el) => el.localName)).toBe('circle');
  });
});

test('under reduced motion every shape is its last at once', async ({ page }) => {
  const errors = collectErrors(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFixture(page, 'scroll-morph.html');
  expect(await call(page, 'd', '#plain')).toBe(CIRCLE);
  expect(await call(page, 'd', '#seq')).toBe(LETTER);
  expect(await call(page, 'completed')).toEqual({ plain: 1, seq: 1 });
  expect(errors).toEqual([]);
});
